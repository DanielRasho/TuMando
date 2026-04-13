import { Pool, PoolConfig } from "pg";

export async function newPGClient(dbConfig: string): Promise<Pool> {
  const poolConfig: PoolConfig = {
    connectionString: dbConfig,

    max: 5, // Max connections
    min: 0, // Min connections
    idleTimeoutMillis: 10_000, // 10 seconds
    connectionTimeoutMillis: 10_000, // Timeout for initial connection
  };

  let pool: Pool;

  try {
    pool = new Pool(poolConfig);

    // Test connection (similar to context timeout behavior)
    const client = await pool.connect();
    client.release();

    console.debug("Postgres Pool initialized.", {
      dbUri: dbConfig,
    });

    return pool;
  } catch (err) {
    console.error("Failed to create DB pool", err);
    throw err;
  }
}