import { type Request, type Response } from "express";
import { type Pool } from "pg";
import log from "../../utils/logger";

const getBillByIdHandler = (db: Pool) => async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const result = await db.query(
            `SELECT
                b.id,
                b.nit,
                b.date,
                b.cost AS total_amount,
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
             JOIN inventory_history ih ON ih.bill = b.id AND ih.action = 2
             JOIN item i ON ih.sku = i.sku
             WHERE b.id = $1
             GROUP BY b.id, b.nit, b.date, b.cost`,
            [id]
        );

        if (result.rows.length === 0) {
            log.error({ id }, "Bill not found");
            res.status(404).json({ message: "Bill not found" });
            return;
        }

        log.info({ id }, "Bill retrieved successfully");
        res.status(200).json(result.rows[0]);
    } catch (err: any) {
        log.error(err, "Unexpected error while fetching bill");
        throw err;
    }
};

export default getBillByIdHandler;
