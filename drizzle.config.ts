import { loadEnvConfig } from "@next/env";
import type { Config } from "drizzle-kit";

loadEnvConfig(process.cwd());

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // On ne synchronise que les tables que nous avons définies
  tablesFilter: ["albion_items", "albion_sync_metadata", "favorites", "price_alerts", "users", "craft_recipes", "craft_recipe_materials"],
} satisfies Config;
