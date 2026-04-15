import { type Request, type Response } from "express";
import { type Pool } from "pg";
import log from "../../utils/logger";

const getBillsHandler = (db: Pool) => async (_req: Request, res: Response) => {
    try {
        const result = await db.query(
            `SELECT
                b.id,
                b.nit,
                b.date,
                b.cost AS total_amount,
                s.name AS shop,
                json_agg(
                    json_build_object(
                        'sku', ih.sku,
                        'name', i.name,
                        'quantity', ih.quantity,
                        'unitary_cost', ih.unitary_cost,
                        'total_cost', ih.quantity * ih.unitary_cost
                    )
                ) AS detail
             FROM bill b
             JOIN shop s ON b.shop = s.id
             JOIN inventory_history ih ON ih.bill = b.id AND ih.action = 2
             JOIN item i ON ih.sku = i.sku
             GROUP BY b.id, b.nit, b.date, b.cost, s.name
             ORDER BY b.date DESC`
        );

        log.info({ billCount: result.rows.length }, "Bills retrieved successfully");
        res.status(200).json(result.rows);
    } catch (err: any) {
        log.error(err, "Unexpected error while fetching bills");
        throw err;
    }
};

export default getBillsHandler;
