import { object, string, number, ValidationError } from "yup";
import { type Request, type Response } from "express";
import { type Pool } from "pg";
import { validateBody } from "../../utils/validation";
import log from "../../utils/logger";

const postInventorySchema = object({
    name: string().max(50).required(),
    cost: number().positive().required(),
    category: number().integer().required(),
});

interface PostInventoryResponse {
    sku: number;
    message: string;
}

const postInventoryHandler = (db: Pool) => async (req: Request, res: Response) => {
    let body: Awaited<ReturnType<typeof postInventorySchema.validate>>;

    log.info(req.body);

    try {
        body = await validateBody(req.body, postInventorySchema);
    } catch (err) {
        if (err instanceof ValidationError) {
            log.error({ errors: err.errors }, "Item validation failed");
            res.status(400).json({ message: err.errors.join(", ") });
            return;
        }
        log.error(err, "Unexpected error during validation");
        throw err;
    }

    try {
        const result = await db.query<{ sku: number }>(
            `INSERT INTO item (name, cost, category)
             VALUES ($1, $2, $3)
             RETURNING sku`,
            [body.name, body.cost, body.category]
        );

        const response: PostInventoryResponse = {
            sku: result.rows[0].sku,
            message: "Item created successfully",
        };

        log.info({ sku: response.sku }, "Item created successfully");
        res.status(200).json(response);
    } catch (err: any) {
        // Foreign key violation — category does not exist
        if (err.code === "23503") {
            log.error({ code: err.code, category: body.category }, "Foreign key violation: category not found");
            res.status(400).json({ message: "Category not found" });
            return;
        }
        log.error(err, "Unexpected error while creating item");
        throw err;
    }
};

export default postInventoryHandler;
