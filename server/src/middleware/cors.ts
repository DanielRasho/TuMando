import cors from "cors";
import type { CorsOptions } from "cors";
import { type CorsConfig, loadCorsConfig } from "../config";

const config: CorsConfig = loadCorsConfig();

const corsOptions: CorsOptions = {
    origin: config.AllowedOrigins,
    allowedHeaders: config.AllowedHeaders,
    methods: config.AllowedMethods,
};

const corsMiddleware = cors(corsOptions);

export { corsMiddleware };