import { type Request, type Response } from "express";
import { type Pool } from "pg";

interface Municipality {
    id: number;
    name: string;
    department: number;
}

const getMunicipalitiesHandler = (db: Pool) => async (_req: Request, res: Response) => {
    const result = await db.query<Municipality>(
        `SELECT id, name, department FROM municipality ORDER BY id`
    );
    res.status(200).json(result.rows);
};

export default getMunicipalitiesHandler;
