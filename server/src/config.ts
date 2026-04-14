export type AppConfig = {
    APIPort: string;
};

export type DatabaseConfig = {
    DBUri: string;
};

export type CorsConfig = {
    AllowedOrigins: string;
    AllowedContentTypes: string;
    AllowedMethods: string;
    AllowedHeaders: string;
};

export type LoggingConfig = {
    LoggingLevel: string;
    LoggingMethod: string;
    LoggingFilePath: string;
};

export type OAuthConfig = {
    OuthKey: string;
    OuthTokenExpiry: string;
    IDTokenExpiry: string;
};

export function loadAppConfig(): AppConfig {
    return {
        APIPort: mustGetEnv("API_PORT"),
    };
}

export function loadDatabaseConfig(): DatabaseConfig {
    return {
        DBUri: mustGetEnv("DB_URI"),
    };
}

export function loadCorsConfig(): CorsConfig {
    return {
        AllowedOrigins: mustGetEnv("ALLOWED_ORIGINS"),
        AllowedContentTypes: mustGetEnv("ALLOWED_CONTENT_TYPES"),
        AllowedMethods: mustGetEnv("ALLOWED_METHODS"),
        AllowedHeaders: mustGetEnv("ALLOWED_HEADERS"),
    };
}

export function loadLoggingConfig(): LoggingConfig {
    return {
        LoggingLevel: mustGetEnv("LOGGING_LEVEL"),
        LoggingMethod: mustGetEnv("LOGGING_METHOD"),
        LoggingFilePath: process.env["LOGGING_FILE_PATH"], // optional
    };
}

// Utility functions
function mustGetEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        console.error(`Environment variable ${key} is required but not set.`);
        process.exit(1);
    }
    return value;
}

// biome-ignore lint: could be useful in the future.
function mustGetEnvNumber(key: string): number {
    const value = process.env[key];
    if (!value) {
        console.error(`Environment variable ${key} is required but not set.`);
        process.exit(1);
    }

    const parsedValue = Number(value);
    if (Number.isNaN(parsedValue)) {
        console.error(
            `Environment variable ${key} must be a valid number. Received: "${value}"`,
        );
        process.exit(1);
    }

    return parsedValue;
}

// biome-ignore lint: could be useful in the future.
function mustGetEnvAsStringArray(key: string): string[] {
    const value = mustGetEnv(key);
    return value.split(",").map((item) => item.trim());
}