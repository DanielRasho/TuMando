import { type Request, type Response } from "express";
import { type Pool } from "pg";
import log from "../../utils/logger";

interface PopularItem {
    sku: number;
    name: string;
    cost: number;
    category: number;
    total_quantity: number;
}

const getPopularItemsHandler = (db: Pool) => async (req: Request, res: Response) => {
    const { shop_id, start, end } = req.query;

    if (!shop_id || !start || !end) {
        log.error({ shop_id, start, end }, "Missing required query parameters");
        res.status(400).json({
            msg: "shop_id, start and end are required",
            details: [
                ...(!shop_id ? ["shop_id is required"] : []),
                ...(!start   ? ["start is required"]   : []),
                ...(!end     ? ["end is required"]     : []),
            ],
        });
        return;
    }

    const shopId  = parseInt(shop_id as string, 10);
    const startTs = parseInt(start   as string, 10);
    const endTs   = parseInt(end     as string, 10);

    if (isNaN(shopId)) {
        res.status(400).json({ msg: "shop_id must be a number", details: [] });
        return;
    }
    if (isNaN(startTs) || isNaN(endTs)) {
        res.status(400).json({ msg: "start and end must be numbers (seconds from epoch)", details: [] });
        return;
    }
    if (endTs < startTs) {
        res.status(400).json({ msg: "end must be greater than or equal to start", details: [] });
        return;
    }

    try {
        // Raw SQL as required — no ORM
        const result = await db.query<PopularItem>(
            `SELECT
                i.sku,
                i.name,
                i.cost::FLOAT AS cost,
                i.category,
                SUM(ih.quantity)::INTEGER AS total_quantity
             FROM inventory_history ih
             JOIN item i  ON ih.sku  = i.sku
             JOIN bill b  ON ih.bill = b.id
             WHERE ih.action = 2
               AND b.shop   = $1
               AND ih.date >= to_timestamp($2)
               AND ih.date <= to_timestamp($3)
             GROUP BY i.sku, i.name, i.cost, i.category
             ORDER BY total_quantity DESC`,
            [shopId, startTs, endTs]
        );

        log.info({ shopId, startTs, endTs, rowCount: result.rows.length }, "Popular items report retrieved");
        res.status(200).json(result.rows);
    } catch (err: any) {
        log.error(err, "Unexpected error while computing popular items report");
        throw err;
    }
};

export default getPopularItemsHandler;
