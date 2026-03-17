import { pgTable, text, timestamp, uuid, integer, boolean, real } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role").notNull().default("free"), // free, premium, admin
  patreonId: text("patreon_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull(),
  type: text("type").notNull(), // transport, flip, craft, black-market
  config: text("config"), // JSON config
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const priceAlerts = pgTable("price_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull(),
  city: text("city").notNull(),
  targetPrice: integer("target_price").notNull(),
  direction: text("direction").notNull(), // above, below
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─────────────────────────────────────────────
// ALBION ITEMS
// ─────────────────────────────────────────────

export const albionItems = pgTable("albion_items", {
  id: text("id").primaryKey(),                    // Ex: T4_MAIN_SWORD
  nameEN: text("name_en").notNull(),
  nameFR: text("name_fr").notNull(),
  nameDE: text("name_de"),
  nameES: text("name_es"),
  namePT: text("name_pt"),
  nameRU: text("name_ru"),
  namePL: text("name_pl"),
  nameZH: text("name_zh"),
  tier: integer("tier").notNull(),
  enchant: integer("enchant").notNull().default(0),
  category: text("category").notNull(),           // weapon, armor, resource_raw, etc.
  subcategory: text("subcategory").notNull(),     // sword, axe, ore, etc.
  isArtifact: boolean("is_artifact").default(false),
  iconUrl: text("icon_url"),                      // URL CDN pré-calculée
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const albionSyncMetadata = pgTable("albion_sync_metadata", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  source: text("source").notNull(),               // 'ao-data/ao-bin-dumps'
  version: text("version"),                       // commit SHA ou version
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
  itemsCount: integer("items_count"),
  status: text("status").notNull(),               // 'success', 'error', 'running'
  errorMessage: text("error_message"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
export type AlbionItem = typeof albionItems.$inferSelect;
export type NewAlbionItem = typeof albionItems.$inferInsert;
export type AlbionSyncMetadata = typeof albionSyncMetadata.$inferSelect;
export type NewAlbionSyncMetadata = typeof albionSyncMetadata.$inferInsert;
