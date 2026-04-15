import { type Request, type Response, type NextFunction } from "express";
import log from "../utils/logger";

const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    log.error(err);
    res.status(500).json({
        msg: err.message || "Internal server error",
        details: [],
    });
};

export { errorHandler };
