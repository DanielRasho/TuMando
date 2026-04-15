import { type Request, type Response } from "express";
import { type Pool } from "pg";
import log from "../../utils/logger";

interface ItemDetails {
    sku: number;
    name: string;
    cost: number;
    category: number;
}

interface ShopInventory {
    shop_id: number;
    shop_name: string;
    quantity: number;
}

interface ItemDetailsResponse {
    item: ItemDetails;
    shops: ShopInventory[];
}

const getItemByIdHandler = (db: Pool) => async (req: Request, res: Response) => {
    const id = req.params.id as string;

    // Validate that id is a valid number
    const sku = parseInt(id, 10);
    if (isNaN(sku)) {
        res.status(400).json({ message: "Invalid item id" });
        return;
    }

    try {
        // Fetch item details
        const itemResult = await db.query<ItemDetails>(
            `SELECT sku, name, cost, category FROM item WHERE sku = $1`,
            [sku]
        );

        if (itemResult.rows.length === 0) {
            log.error({ sku }, "Item not found");
            res.status(404).json({ message: "Item not found" });
            return;
        }

        const item = itemResult.rows[0];

        // Fetch shops with inventory
        const shopsResult = await db.query<ShopInventory>(
            `SELECT s.id as shop_id, s.name as shop_name, COALESCE(i.quantity, 0) as quantity
             FROM shop s
             LEFT JOIN inventory i ON s.id = i.shop AND i.sku = $1
             ORDER BY s.id`,
            [sku]
        );

        const response: ItemDetailsResponse = {
            item,
            shops: shopsResult.rows
        };

        log.info({ sku }, "Item details retrieved successfully");
        res.status(200).json(response);
    } catch (err: any) {
        log.error(err, "Unexpected error while fetching item details");
        throw err;
    }
};

export default getItemByIdHandler;
