import { type Request, type Response } from "express";
import { type Pool } from "pg";
import log from "../../utils/logger";

interface Municipality {
    id: number;
    name: string;
    department: number;
}

const getMunicipalitiesHandler = (db: Pool) => async (_req: Request, res: Response) => {
    try {
        const result = await db.query<Municipality>(
            `SELECT id, name, department FROM municipality ORDER BY id`
        );
        log.info({ municipalityCount: result.rows.length }, "Municipalities retrieved successfully");
        res.status(200).json(result.rows);
    } catch (err: any) {
        log.error(err, "Unexpected error while fetching municipalities");
        throw err;
    }
};

export default getMunicipalitiesHandler;
