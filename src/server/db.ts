import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// For serverless environments (Vercel), we need to ensure proper connection handling
// The DATABASE_URL should use a connection pooler (e.g., ?pgbouncer=true or a pooled connection string)
// 
// IMPORTANT: In serverless, you MUST use a connection pooler. Direct connections will fail intermittently.
// - Vercel Postgres: Automatically pooled
// - Supabase: Use port 6543 (pooled) instead of 5432 (direct)
// - Neon: Use the pooled connection string
// - Other providers: Look for "transaction" or "pooled" connection strings
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

// Always cache the Prisma client instance to prevent connection pool exhaustion
// In serverless, each function invocation should reuse the same client instance
globalForPrisma.prisma = prisma

// Gracefully handle disconnections on process exit
if (typeof process !== "undefined") {
  const gracefulShutdown = async () => {
    await prisma.$disconnect()
  }
  
  process.on("beforeExit", gracefulShutdown)
  process.on("SIGINT", gracefulShutdown)
  process.on("SIGTERM", gracefulShutdown)
}
