import { object, string, number, array, ValidationError } from "yup";
import { type Request, type Response } from "express";
import { type Pool } from "pg";
import { validateBody } from "../../utils/validation";
import log from "../../utils/logger";

const postBillSchema = object({
    nit: string().max(10).required(),
    shop_id: number().integer().required(),
    detail: array(
        object({
            sku: number().integer().required(),
            quantity: number().integer().positive().required(),
        })
    ).min(1).required(),
});

interface PostBillResponse {
    message: string;
    id: string;
}

const postBillHandler = (db: Pool) => async (req: Request, res: Response) => {
    let body: Awaited<ReturnType<typeof postBillSchema.validate>>;

    log.info({ body: req.body }, "Post bill request");

    try {
        body = await validateBody(req.body, postBillSchema);
    } catch (err) {
        if (err instanceof ValidationError) {
            log.error({ errors: err.errors }, "Bill validation failed");
            res.status(400).json({ message: err.errors.join(", ") });
            return;
        }
        log.error(err, "Unexpected error during bill validation");
        throw err;
    }

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        // Check inventory for all items at the given shop
        for (const lineItem of body.detail) {
            const inventoryResult = await client.query<{ quantity: number }>(
                `SELECT quantity FROM inventory WHERE sku = $1 AND shop = $2`,
                [lineItem.sku, body.shop_id]
            );

            const available = inventoryResult.rows[0]?.quantity ?? 0;

            if (available < lineItem.quantity) {
                log.error(
                    { sku: lineItem.sku, shop: body.shop_id, required: lineItem.quantity, available },
                    "Insufficient inventory for bill item"
                );
                res.status(400).json({
                    message: `Insufficient inventory for sku ${lineItem.sku}. Available: ${available}, Required: ${lineItem.quantity}`
                });
                return;
            }
        }

        // Get item costs for each line item
        const skus = body.detail.map(d => d.sku);
        const itemsResult = await client.query<{ sku: number; cost: number }>(
            `SELECT sku, cost FROM item WHERE sku = ANY($1)`,
            [skus]
        );

        const costBySku = new Map(itemsResult.rows.map(r => [r.sku, r.cost]));

        // Compute total bill cost
        const totalCost = body.detail.reduce((sum, lineItem) => {
            const unitaryCost = Math.round(costBySku.get(lineItem.sku) ?? 0);
            return sum + unitaryCost * lineItem.quantity;
        }, 0);

        // Create the bill record
        const billResult = await client.query<{ id: string }>(
            `INSERT INTO bill (id, nit, cost, shop)
             VALUES (uuid_generate_v4(), $1, $2, $3)
             RETURNING id`,
            [body.nit, totalCost, body.shop_id]
        );

        const billId = billResult.rows[0].id;

        // For each item: decrease inventory and register in inventory_history
        for (const lineItem of body.detail) {
            const unitaryCost = Math.round(costBySku.get(lineItem.sku) ?? 0);

            await client.query(
                `UPDATE inventory SET quantity = quantity - $1 WHERE sku = $2 AND shop = $3`,
                [lineItem.quantity, lineItem.sku, body.shop_id]
            );

            await client.query(
                `INSERT INTO inventory_history (sku, quantity, unitary_cost, action, bill)
                 VALUES ($1, $2, $3, $4, $5)`,
                [lineItem.sku, lineItem.quantity, unitaryCost, 2, billId]
            );
        }

        await client.query("COMMIT");

        log.info({ billId, shop: body.shop_id, totalCost }, "Bill created successfully");

        const response: PostBillResponse = {
            message: "Bill created successfully",
            id: billId,
        };

        res.status(200).json(response);
    } catch (err: any) {
        await client.query("ROLLBACK");

        if (err.code === "23503") {
            log.error({ code: err.code }, "Foreign key violation while creating bill");
            res.status(400).json({ message: "Shop or item not found" });
            return;
        }

        log.error(err, "Unexpected error while creating bill");
        throw err;
    } finally {
        client.release();
    }
};

export default postBillHandler;
