import { type Request, type Response } from "express";
import { type Pool } from "pg";
import log from "../../utils/logger";

interface Shop {
    id: number;
    name: string;
    department: number;
    municipality: number;
}

const getShopsHandler = (db: Pool) => async (req: Request, res: Response) => {
    const { name, department_id, municipality_id } = req.query;

    if (municipality_id && !department_id) {
        log.error("municipality_id provided without department_id");
        res.status(400).json({ msg: "municipality_id requires department_id to be specified", details: [] });
        return;
    }

    const filters: string[] = [];
    const params: (string | number)[] = [];

    if (name) {
        filters.push(`name ILIKE $${params.length + 1}`);
        params.push(`%${name as string}%`);
    }

    if (department_id) {
        const deptId = parseInt(department_id as string, 10);
        if (isNaN(deptId)) {
            res.status(400).json({ msg: "department_id must be a number", details: [] });
            return;
        }
        filters.push(`department = $${params.length + 1}`);
        params.push(deptId);
    }

    if (municipality_id) {
        const munId = parseInt(municipality_id as string, 10);
        if (isNaN(munId)) {
            res.status(400).json({ msg: "municipality_id must be a number", details: [] });
            return;
        }
        filters.push(`municipality = $${params.length + 1}`);
        params.push(munId);
    }

    const where = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    try {
        const result = await db.query<Shop>(
            `SELECT id, name, department, municipality FROM shop ${where} ORDER BY id`,
            params
        );
        log.info({ shopCount: result.rows.length }, "Shops retrieved successfully");
        res.status(200).json(result.rows);
    } catch (err: any) {
        log.error(err, "Unexpected error while fetching shops");
        throw err;
    }
};

export default getShopsHandler;
