import { type Request, type Response } from "express";
import { type Pool } from "pg";
import log from "../../utils/logger";

interface ShopInfo {
    id: number;
    name: string;
    department: number;
    municipality: number;
    date: string;
}

interface ShopInventoryItem {
    sku: number;
    name: string;
    quantity: number;
}

interface ShopDetailsResponse {
    shop: ShopInfo;
    items: ShopInventoryItem[];
}

const getShopByIdHandler = (db: Pool) => async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string, 10);

    if (isNaN(id)) {
        log.error({ id: req.params.id }, "Invalid shop id parameter: not a number");
        res.status(400).json({ message: "Invalid shop id" });
        return;
    }

    try {
        // Fetch shop details
        const shopResult = await db.query<ShopInfo>(
            `SELECT id, name, department, municipality, date FROM shop WHERE id = $1`,
            [id]
        );

        if (shopResult.rows.length === 0) {
            log.error({ id }, "Shop not found");
            res.status(404).json({ message: "Shop not found" });
            return;
        }

        const shop = shopResult.rows[0];

        // Fetch inventory items for this shop
        const itemsResult = await db.query<ShopInventoryItem>(
            `SELECT i.sku, i.name, inv.quantity
             FROM inventory inv
             JOIN item i ON inv.sku = i.sku
             WHERE inv.shop = $1
             ORDER BY i.sku`,
            [id]
        );

        const response: ShopDetailsResponse = {
            shop,
            items: itemsResult.rows
        };

        log.info({ id, itemCount: itemsResult.rows.length }, "Shop details retrieved successfully");
        res.status(200).json(response);
    } catch (err: any) {
        log.error(err, "Unexpected error while fetching shop details");
        throw err;
    }
};

export default getShopByIdHandler;
