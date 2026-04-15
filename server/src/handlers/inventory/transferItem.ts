import { object, number, ValidationError } from "yup";
import { type Request, type Response } from "express";
import { type Pool } from "pg";
import { validateBody } from "../../utils/validation";
import log from "../../utils/logger";

const transferItemSchema = object({
    from_shop: number().integer().required(),
    to_shop: number().integer().required(),
    quantity: number().integer().positive().required(),
});

interface TransferItemResponse {
    message: string;
    from_shop_new_quantity: number;
    to_shop_new_quantity: number;
}

const transferItemHandler = (db: Pool) => async (req: Request, res: Response) => {
    const sku = parseInt(req.params.sku as string, 10);

    if (isNaN(sku)) {
        log.error("Invalid sku parameter: not a number");
        res.status(400).json({ message: "Invalid item id" });
        return;
    }

    let body: Awaited<ReturnType<typeof transferItemSchema.validate>>;

    log.info({ sku, body: req.body }, "Transfer item request");

    try {
        body = await validateBody(req.body, transferItemSchema);
    } catch (err) {
        if (err instanceof ValidationError) {
            log.error({ errors: err.errors }, "Transfer validation failed");
            res.status(400).json({ message: err.errors.join(", ") });
            return;
        }
        log.error(err, "Unexpected error during validation");
        throw err;
    }

    if (body.from_shop === body.to_shop) {
        log.error({ from_shop: body.from_shop, to_shop: body.to_shop }, "Source and destination shops are the same");
        res.status(400).json({ message: "Cannot transfer to the same shop" });
        return;
    }

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        // Check if from_shop has enough quantity
        const inventoryResult = await client.query<{ quantity: number }>(
            `SELECT quantity FROM inventory WHERE sku = $1 AND shop = $2`,
            [sku, body.from_shop]
        );

        const currentQuantity = inventoryResult.rows[0]?.quantity || 0;

        if (currentQuantity < body.quantity) {
            log.error(
                { sku, from_shop: body.from_shop, required: body.quantity, available: currentQuantity },
                "Insufficient inventory for transfer"
            );
            res.status(400).json({
                message: `Insufficient inventory. Available: ${currentQuantity}, Required: ${body.quantity}`
            });
            return;
        }

        // Decrease quantity from source shop
        await client.query(
            `UPDATE inventory SET quantity = quantity - $1 WHERE sku = $2 AND shop = $3`,
            [body.quantity, sku, body.from_shop]
        );

        // Increase quantity to destination shop
        await client.query(
            `INSERT INTO inventory (sku, shop, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (sku, shop) DO UPDATE
             SET quantity = inventory.quantity + $3`,
            [sku, body.to_shop, body.quantity]
        );

        // Get the new quantities for response
        const fromResult = await client.query<{ quantity: number }>(
            `SELECT quantity FROM inventory WHERE sku = $1 AND shop = $2`,
            [sku, body.from_shop]
        );

        const toResult = await client.query<{ quantity: number }>(
            `SELECT quantity FROM inventory WHERE sku = $1 AND shop = $2`,
            [sku, body.to_shop]
        );

        const fromNewQuantity = fromResult.rows[0].quantity;
        const toNewQuantity = toResult.rows[0].quantity;

        // Get the item cost for inventory_history
        const itemResult = await client.query<{ cost: number }>(
            `SELECT cost FROM item WHERE sku = $1`,
            [sku]
        );

        const unitaryCost = Math.round(itemResult.rows[0].cost);

        // Add to inventory_history with action "transfer" (id = 3)
        await client.query(
            `INSERT INTO inventory_history (sku, quantity, unitary_cost, action, bill)
             VALUES ($1, $2, $3, $4, NULL)`,
            [sku, body.quantity, unitaryCost, 3]
        );

        await client.query("COMMIT");

        log.info(
            { sku, from_shop: body.from_shop, to_shop: body.to_shop, quantity: body.quantity },
            "Item transfer completed successfully"
        );

        const response: TransferItemResponse = {
            message: "Item transferred successfully",
            from_shop_new_quantity: fromNewQuantity,
            to_shop_new_quantity: toNewQuantity,
        };

        res.status(200).json(response);
    } catch (err: any) {
        await client.query("ROLLBACK");

        // Foreign key violation
        if (err.code === "23503") {
            log.error({ code: err.code, sku, shops: [body.from_shop, body.to_shop] }, "Foreign key violation in transfer");
            res.status(400).json({ message: "Item or shop not found" });
            return;
        }

        log.error(err, "Unexpected error during transfer");
        throw err;
    } finally {
        client.release();
    }
};

export default transferItemHandler;
