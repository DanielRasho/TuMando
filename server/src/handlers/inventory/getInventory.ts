import { type Request, type Response } from "express";
import { type Pool } from "pg";
import log from "../../utils/logger";

interface InventoryItem {
    sku: number;
    name: string;
    cost: number;
    category: number;
    total_quantity: number;
}

const getInventoryHandler = (db: Pool) => async (req: Request, res: Response) => {
    const { name } = req.query;

    const params: string[] = [];
    const where = name ? `WHERE i.name ILIKE $${params.push(`%${name as string}%`)}` : "";

    try {
        const result = await db.query<InventoryItem>(
            `SELECT
                i.sku,
                i.name,
                i.cost,
                i.category,
                COALESCE(SUM(inv.quantity), 0)::INTEGER as total_quantity
             FROM item i
             LEFT JOIN inventory inv ON i.sku = inv.sku
             ${where}
             GROUP BY i.sku, i.name, i.cost, i.category
             ORDER BY i.sku`,
            params
        );

        log.info({ itemCount: result.rows.length }, "Inventory retrieved successfully");
        res.status(200).json(result.rows);
    } catch (err: any) {
        log.error(err, "Unexpected error while fetching inventory");
        throw err;
    }
};

export default getInventoryHandler;
