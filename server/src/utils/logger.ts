import type { Bindings, Logger } from "pino";
import pino from "pino";
import { loadLoggingConfig } from "../config";

const config = loadLoggingConfig();
// biome-ignore lint: no type
let transport: any;

switch (config.LoggingMethod) {
    case "CONSOLE":
        transport = pino.transport({
            target: "pino/file", // Log to std output
        });
        break;
    case "FILE":
        transport = pino.transport({
            target: "pino/file",
            options: { destination: config.LoggingFilePath || "./app.log" },
        });
        break;
    default:
        transport = pino.transport({
            target: "pino/file",
        });
}

const log: Logger = pino(
    {
        level: config.LoggingLevel || "debug",
        formatters: {
            bindings: (_bindings: Bindings) => {
                return {};
            },
            level: (label: string) => {
                return { level: label.toUpperCase() };
            },
        },
    },
    transport,
);

export default log;