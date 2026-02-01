import { eq } from "drizzle-orm";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "../../drizzle/schema";
import { reviews, users } from "../../drizzle/schema";

export class DatabaseHelper {
  private db: NodePgDatabase<typeof schema>;
  private pool: Pool;
  private transactionClient: NodePgDatabase<typeof schema> | null = null;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: Number.parseInt(process.env.DB_PORT || "5432"),
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "cinematik_test",
      ssl: process.env.DATABASE_SSL_CA
        ? { ca: process.env.DATABASE_SSL_CA }
        : false,
    });

    this.db = drizzle(this.pool, { schema });
  }

  async setupDatabase(): Promise<void> {
    // Test connection
    await this.pool.query("SELECT 1");
    console.log("✅ Database connected successfully");
  }

  async cleanupDatabase(): Promise<void> {
    // Clean up all test data
    await this.db.delete(reviews);
    await this.db.delete(users);
    console.log("✅ Database cleaned up");
  }

  async beginTransaction(): Promise<void> {
    // For PostgreSQL, we'll use a simpler approach with SAVEPOINT
    this.transactionClient = this.db;
    await this.pool.query("BEGIN");
  }

  async rollbackTransaction(): Promise<void> {
    if (this.transactionClient) {
      await this.pool.query("ROLLBACK");
      this.transactionClient = null;
    }
  }

  async commitTransaction(): Promise<void> {
    if (this.transactionClient) {
      await this.pool.query("COMMIT");
      this.transactionClient = null;
    }
  }

  getDatabase(): NodePgDatabase<typeof schema> {
    return this.transactionClient || this.db;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  // Helper methods for test data
  async cleanupUser(userId: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, userId));
  }

  async cleanupReview(reviewId: string): Promise<void> {
    await this.db.delete(reviews).where(eq(reviews.id, reviewId));
  }
}
