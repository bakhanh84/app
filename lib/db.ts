import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { existsSync, copyFileSync } from 'fs';
import { join } from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDbFilePath(): string {
  // On Vercel / AWS Lambda environment, the working directory is read-only.
  // /tmp is the only writable directory for SQLite read-write operations.
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    const tmpDbPath = '/tmp/dev.db';
    if (!existsSync(tmpDbPath)) {
      const localDbPath = join(process.cwd(), 'prisma', 'dev.db');
      const rootDbPath = join(process.cwd(), 'dev.db');
      
      if (existsSync(localDbPath)) {
        try { copyFileSync(localDbPath, tmpDbPath); } catch {}
      } else if (existsSync(rootDbPath)) {
        try { copyFileSync(rootDbPath, tmpDbPath); } catch {}
      }
    }
    return tmpDbPath;
  }
  return './dev.db';
}

function createPrismaClient() {
  const dbPath = getDbFilePath();
  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
