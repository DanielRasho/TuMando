import "dotenv/config";
import log from "./utils/logger";
import express from "express";
import { loadAppConfig, loadDatabaseConfig, type AppConfig } from "./config";

import { newPGClient } from "./db/client";

import { loggingMiddleware } from "./middleware/logging";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler } from "./middleware/errorHandler";

import postShopHandler from "./handlers/shop/postShop";
import getShopsHandler from "./handlers/shop/getShops";
import getShopByIdHandler from "./handlers/shop/getShopById";
import getDepartmentsHandler from "./handlers/catalogs/getDepartments";
import getMunicipalitiesHandler from "./handlers/catalogs/getMunicipalities";
import postInventoryHandler from "./handlers/inventory/postInventory";
import getInventoryHandler from "./handlers/inventory/getInventory";
import increaseItemHandler from "./handlers/inventory/increaseItem";
import getItemHistoryHandler from "./handlers/inventory/getItemHistory";
import getItemByIdHandler from "./handlers/inventory/getItemById";
import transferItemHandler from "./handlers/inventory/transferItem";
import getPopularItemsHandler from "./handlers/report/getPopularItems";
import postBillHandler from "./handlers/billing/postBill";
import getBillsHandler from "./handlers/billing/getBills";
import getBillByIdHandler from "./handlers/billing/getBillById";

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

    // SHOP
    app.post("/shop", postShopHandler(client));
    app.get("/shops", getShopsHandler(client));
    app.get("/shop/:id", getShopByIdHandler(client));

    // LOCATIONS
    app.get("/departments", getDepartmentsHandler(client));
    app.get("/municipalities", getMunicipalitiesHandler(client));

    // INVENTORY
    app.post("/inventory", postInventoryHandler(client));
    app.get("/inventory", getInventoryHandler(client));
    
    // ITEMS
    app.post("/inventory/increase", increaseItemHandler(client));
    app.get("/inventory/:id/history", getItemHistoryHandler(client));
    app.get("/inventory/:id/details", getItemByIdHandler(client));
    app.put("/inventory/:sku", transferItemHandler(client));

    // REPORT
    app.get("/report/popularity", getPopularItemsHandler(client));

    // BILLING
    app.post("/bill", postBillHandler(client));
    app.get("/bill", getBillsHandler(client));
    app.get("/bill/:id", getBillByIdHandler(client));

    // Must be registered last — catches errors thrown by any route handler
    app.use(errorHandler);

    app.listen(config.APIPort, () => {
        log.info(`Server running on port ${config.APIPort}`);
    });
})();
