import "dotenv/config";
import log from "./utils/logger";
import express from "express";
import { loadAppConfig, loadDatabaseConfig, type AppConfig } from "./config";

import { newPGClient } from "./db/client";

import { loggingMiddleware } from "./middleware/logging";
import { corsMiddleware } from "./middleware/cors";

import postShopHandler from "./handlers/shop/postShop";
import getShopsHandler from "./handlers/shop/getShops";
import getDepartmentsHandler from "./handlers/catalogs/getDepartments";
import getMunicipalitiesHandler from "./handlers/catalogs/getMunicipalities";

(async () => {
    log.info("Logger set up");

    log.info("Load environment variables...");
    const config: AppConfig = loadAppConfig();

    log.info("Setting DB Client...");
    const DBClientConfig = loadDatabaseConfig();
    const client = await newPGClient(DBClientConfig.DBUri);

    const app = express();

    log.info("Setting up middlewares...");
    app.use([express.json(), corsMiddleware, loggingMiddleware]);

    log.info("Setting up routes...");

    app.get("/health", (_req, res) => {
        res.status(200);
        res.json({ msg: "API is up!" });
    });

    app.post("/shop", postShopHandler(client));
    app.get("/shops", getShopsHandler(client));
    app.get("/departments", getDepartmentsHandler(client));
    app.get("/municipalities", getMunicipalitiesHandler(client));

    app.listen(config.APIPort, () => {
        log.info(`Server running on port ${config.APIPort}`);
    });
})();
