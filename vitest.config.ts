import { defineConfig } from "vitest/config";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${root}/` },
      { find: /^server-only$/, replacement: `${root}/node_modules/server-only/empty.js` },
    ],
  },
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    server: { deps: { inline: ["server-only"] } },
  },
});
