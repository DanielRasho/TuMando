import { type Request, type Response } from "express";
import { type Pool } from "pg";

interface Department {
    id: number;
    name: string;
}

const getDepartmentsHandler = (db: Pool) => async (_req: Request, res: Response) => {
    const result = await db.query<Department>(
        `SELECT id, name FROM department ORDER BY id`
    );
    res.status(200).json(result.rows);
};

export default getDepartmentsHandler;
