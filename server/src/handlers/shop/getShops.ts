import { type Request, type Response } from "express";
import { type Pool } from "pg";

interface Shop {
    id: number;
    name: string;
    department: number;
    municipality: number;
}

const getShopsHandler = (db: Pool) => async (_req: Request, res: Response) => {
    const result = await db.query<Shop>(
        `SELECT id, name, department, municipality FROM shop ORDER BY id`
    );
    res.status(200).json(result.rows);
};

export default getShopsHandler;
