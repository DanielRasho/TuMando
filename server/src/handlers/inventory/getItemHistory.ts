import { type Request, type Response } from "express";
import { type Pool } from "pg";
import log from "../../utils/logger";

interface InventoryHistoryRecord {
    sku: number;
    quantity: number;
    unitary_cost: number;
    action_name: string;
    date: string;
    bill: string | null;
}

const getItemHistoryHandler = (db: Pool) => async (req: Request, res: Response) => {
    const { id } = req.params;

    // Validate that id is a valid number
    const sku = parseInt(id as string, 10);
    if (isNaN(sku)) {
        log.error({ id }, "Invalid sku parameter: not a number");
        res.status(400).json({ message: "Invalid item id" });
        return;
    }

    try {
        const result = await db.query<InventoryHistoryRecord>(
            `SELECT
                ih.sku,
                ih.quantity,
                ih.unitary_cost,
                ia.name as action_name,
                ih.date,
                ih.bill
             FROM inventory_history ih
             JOIN inventory_action ia ON ih.action = ia.id
             WHERE ih.sku = $1
             ORDER BY ih.date DESC`,
            [sku]
        );

        log.info({ sku, recordCount: result.rows.length }, "Item history retrieved successfully");
        res.status(200).json(result.rows);
    } catch (err: any) {
        log.error(err, "Unexpected error while fetching item history");
        throw err;
    }
};

export default getItemHistoryHandler;
