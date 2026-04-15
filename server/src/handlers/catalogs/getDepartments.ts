import { type Request, type Response } from "express";
import { type Pool } from "pg";
import log from "../../utils/logger";

interface Department {
    id: number;
    name: string;
}

const getDepartmentsHandler = (db: Pool) => async (_req: Request, res: Response) => {
    try {
        const result = await db.query<Department>(
            `SELECT id, name FROM department ORDER BY id`
        );
        log.info({ departmentCount: result.rows.length }, "Departments retrieved successfully");
        res.status(200).json(result.rows);
    } catch (err: any) {
        log.error(err, "Unexpected error while fetching departments");
        throw err;
    }
};

export default getDepartmentsHandler;
