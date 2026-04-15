import { object, string, number, ValidationError } from "yup";
import { type Request, type Response } from "express";
import { type Pool } from "pg";
import { validateBody } from "../../utils/validation";
import log from "../../utils/logger";

const postShopSchema = object({
    name: string().max(50).required(),
    department: number().integer().required(),
    municipality: number().integer().required(),
});

interface PostShopResponse {
    id: number;
    message: string;
}

const postShopHandler = (db: Pool) => async (req: Request, res: Response) => {
    let body: Awaited<ReturnType<typeof postShopSchema.validate>>;

    log.info(req.body)

    try {
        body = await validateBody(req.body, postShopSchema);
    } catch (err) {
        if (err instanceof ValidationError) {
            log.error({ errors: err.errors }, "Shop validation failed");
            res.status(400).json({ message: err.errors.join(", ") });
            return;
        }
        log.error(err, "Unexpected error during validation");
        throw err;
    }

    try {
        const result = await db.query<{ id: number }>(
            `INSERT INTO shop (name, department, municipality)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [body.name, body.department, body.municipality]
        );

        const response: PostShopResponse = {
            id: result.rows[0].id,
            message: "Shop created successfully",
        };

        log.info({ id: response.id }, "Shop created successfully");
        res.status(200).json(response);
    } catch (err: any) {
        // Foreign key violation — department or municipality does not exist
        if (err.code === "23503") {
            log.error({ code: err.code, body }, "Foreign key violation: department or municipality not found");
            res.status(400).json({ message: "Department or municipality not found" });
            return;
        }
        log.error(err, "Unexpected error while creating shop");
        throw err;
    }
};

export default postShopHandler;
