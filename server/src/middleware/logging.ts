import type { Request, Response, NextFunction, RequestHandler } from "express";
import log from "../utils/logger";

const loggingMiddleware: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    if (req.method === "OPTIONS") {
        return next();
    }

    const startTime = Date.now();

    res.on("finish", () => {
        const logEntry = {
            hostName: req.hostname,
            reqIp: req.ip,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            millisecondsTaken: Date.now() - startTime,
        };

        log.debug(logEntry);
    });

    next();
};

const logErrorRequest = () => {};

export { loggingMiddleware, logErrorRequest };