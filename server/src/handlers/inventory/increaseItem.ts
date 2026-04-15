import { object, number, ValidationError } from "yup";
import { type Request, type Response } from "express";
import { type Pool } from "pg";
import { validateBody } from "../../utils/validation";
import log from "../../utils/logger";

const increaseItemSchema = object({
    sku: number().integer().required(),
    shop: number().integer().required(),
    quantity: number().integer().positive().required(),
});

interface IncreaseItemResponse {
    message: string;
    new_quantity: number;
}

const increaseItemHandler = (db: Pool) => async (req: Request, res: Response) => {
    let body: Awaited<ReturnType<typeof increaseItemSchema.validate>>;

    log.info(req.body);

    try {
        body = await validateBody(req.body, increaseItemSchema);
    } catch (err) {
        if (err instanceof ValidationError) {
            log.error({ errors: err.errors }, "Increase item validation failed");
            res.status(400).json({ message: err.errors.join(", ") });
            return;
        }
        log.error(err, "Unexpected error during validation");
        throw err;
    }

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        // Update or insert inventory
        await client.query(
            `INSERT INTO inventory (sku, shop, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (sku, shop) DO UPDATE
             SET quantity = inventory.quantity + $3`,
            [body.sku, body.shop, body.quantity]
        );

        // Get the new quantity for response
        const inventoryResult = await client.query<{ quantity: number }>(
            `SELECT quantity FROM inventory WHERE sku = $1 AND shop = $2`,
            [body.sku, body.shop]
        );

        const newQuantity = inventoryResult.rows[0].quantity;

        // Get the item cost for inventory_history
        const itemResult = await client.query<{ cost: number }>(
            `SELECT cost FROM item WHERE sku = $1`,
            [body.sku]
        );

        const unitaryCost = Math.round(itemResult.rows[0].cost);

        // Add to inventory_history with action "buy" (id = 1)
        await client.query(
            `INSERT INTO inventory_history (sku, quantity, unitary_cost, action, bill)
             VALUES ($1, $2, $3, $4, NULL)`,
            [body.sku, body.quantity, unitaryCost, 1]
        );

        await client.query("COMMIT");

        const response: IncreaseItemResponse = {
            message: "Item quantity increased successfully",
            new_quantity: newQuantity,
        };

        log.info({ sku: body.sku, shop: body.shop, newQuantity }, "Item quantity increased successfully");
        res.status(200).json(response);
    } catch (err: any) {
        await client.query("ROLLBACK");

        // Foreign key violation
        if (err.code === "23503") {
            log.error({ code: err.code, sku: body.sku, shop: body.shop }, "Foreign key violation: item or shop not found");
            res.status(400).json({ message: "Item or shop not found" });
            return;
        }
        log.error(err, "Unexpected error while increasing item quantity");
        throw err;
    } finally {
        client.release();
    }
};

export default increaseItemHandler;
