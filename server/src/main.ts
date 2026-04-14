import "dotenv/config";
import log from "./utils/logger";
import express from "express";
import { loadAppConfig, type AppConfig } from "./config";

// import { connectDB } from "./database/client";

// import { loggingMiddleware } from "./api/middlewares/logging";
// import { corsMiddleware } from "./api/middlewares/cors";

log.info("Logger set up");

log.info("Load environment variables...");
const config: AppConfig = loadAppConfig();

log.info("Setting DB Client...");
// connectDB();

const app = express();

log.info("Setting up middlewares...");
// app.use([express.json(), corsMiddleware, loggingMiddleware]);

log.info("Setting up routes...");

app.get("/favicon.ico", (_req, res) => {
    res.status(204);
}); // Ignore favicon request from browsers.
app.get("/health", (_req, res) => {
    res.status(200);
    res.json({ msg: "API is up!" });
});
// app.get(
//     "/missions/statistics",
//     validateAccessTokenMiddleware,
//     getMissionsStatistics,
// );

app.listen(config.APIPort, () => {
    log.info(`Server running on port ${config.APIPort}`);
});