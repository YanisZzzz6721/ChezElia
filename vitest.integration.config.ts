import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Tests d'intégration : exigent un Supabase local démarré (npx supabase start) et ses clés en variables d'environnement. */
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["tests/**/*.integration.test.ts"], testTimeout: 30_000, fileParallelism: false },
});
