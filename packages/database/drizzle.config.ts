import { defineConfig } from 'drizzle-kit';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Load the repo-root .env so `pnpm --filter @cinderella/database db:push`
// (and `make db-push`) work without the caller having to export DATABASE_URL.
const repoRootEnv = resolve(dirname(fileURLToPath(import.meta.url)), '../../.env');
try { process.loadEnvFile(repoRootEnv); } catch {}

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
