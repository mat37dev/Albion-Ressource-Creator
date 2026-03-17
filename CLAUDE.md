# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint

npm run db:generate  # Generate Drizzle migrations from schema
npm run db:migrate   # Apply migrations
npm run db:push      # Push schema directly (dev only)
```

No test suite is configured yet.

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project credentials
- `DATABASE_URL` — PostgreSQL connection string (Supabase Postgres)
- `NEXT_PUBLIC_DEFAULT_LOCALE` — default locale (e.g. `fr`)

## Architecture

**Next.js 15 App Router** with all pages under `app/[locale]/` for i18n support via **next-intl**. Supported locales: `fr` (default) and `en`. Translations are in `messages/fr.json` and `messages/en.json`.

### Pages & Features
| Route | Component | Purpose |
|---|---|---|
| `/[locale]/` | `page.tsx` + `TopOpportunities` | Homepage with feature cards and live opportunity scanner |
| `/[locale]/transport` | `TransportClient` | Buy low in one city, sell high in another |
| `/[locale]/craft` | `CraftCalculatorClient` | Craft profit calculator with RRR and city bonuses |
| `/[locale]/flipper` | `FlipperClient` | Buy order / sell order arbitrage within one city |
| `/[locale]/black-market` | `BlackMarketClient` | Buy in cities, sell to Black Market in Caerleon |

### Data Flow
Client components call the internal API proxy at `/api/prices` (route: `app/api/prices/route.ts`), which forwards requests to the **Albion Online Data Project (AODP)** at `https://europe.albion-online-data.com/api/v2/stats/prices`. Prices are cached 30 minutes (`revalidate = 1800`). Requests are batched in groups of 50 items to respect API limits.

### Calculation Logic (`lib/albion/calculations/`)
- **`transport.ts`** — `Profit = Sell × (1 − tax) − Buy × (1 + tax)`
- **`flip.ts`** — `Margin = SellOrder − BuyOrder − SellOrder × 4.5%`; also handles Black Market: `Profit = BM_BuyOrder × (1 − 4.5%) − LocalSell × (1 + 2.5%)`
- **`craft.ts`** — Calculates profit using Resource Return Rate (RRR). Base RRR = 18%; city refine bonus = +40%; focus bonus scales with specialization up to +59%.

### Constants (`lib/constants/`)
- **`cities.ts`** — The 7 cities (`CITIES` array), Black Market city = Caerleon
- **`bonuses.ts`** — Per-city refine and craft bonuses (`CITY_BONUSES`), tax rates (`DEFAULT_TAX=8%`, `MARKET_TAX=4.5%`, `SETUP_FEE=2.5%`)

### Item Data (`lib/albion/`)
- **`items.ts`** — `COMMON_ITEMS` list with `UniqueName` + localized names
- **`itemsList.ts`** — Extended item definitions; `getPopularScanItems()` returns ~200 T4–T6 items for scanning
- **`recipes.ts`** — `COMMON_RECIPES` for T4–T6 refined materials and weapons

### Database (`lib/db/`)
Drizzle ORM over Supabase Postgres. Schema has three tables: `users` (role: free/premium/admin), `favorites` (saved item configs by type), `priceAlerts` (price threshold alerts). DB is not yet wired into the live UI components.

### UI Components
Shadcn/ui pattern: primitive Radix UI components wrapped in `components/ui/`. Feature-level client components are directly in `components/` (e.g. `TransportClient.tsx`). Custom Tailwind tokens: `albion-gold`, `albion-dark`, `albion-blue`.