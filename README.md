# RuleForge

**Live demo:** https://ruleforge-coral.vercel.app

A no-code fraud/risk rule builder for e-commerce orders. Describe a rule in plain English, or build one by hand — either way it compiles to a real MongoDB aggregation expression, previewed live against seeded order data, with a dashboard showing the impact of whichever rule is active.

It's modeled on a cascading IF/THEN/ELSE field-compare builder built at a past job (compiling non-technical business logic into database query expressions), rebuilt here for a fraud-triage domain with a multi-agent AI layer added on top.

## Try it

- **`/tutorial`** — a 4-step guided walkthrough if you want to build a first rule with your hand held
- **`/builder`** — describe a rule in plain English (try *"Flag orders over $500 shipping to a different country than billing, from accounts under 7 days old"*), or build one manually branch by branch, with a live-updating triage table alongside
- **`/rules`** — save, edit, activate, or delete rules
- **`/dashboard`** — the payoff: stat tiles, a weekly trend chart, and a breakdown of which branch is doing the work for whichever rule is currently active

No login — this is a single-tenant demo over synthetic order data (400 seeded orders, ~90 days, with independently-varying fraud signals: large-order-plus-new-account, billing/shipping/IP country mismatches, and chargeback history).

## Architecture

**Stack:** Nuxt 4 · TypeScript · Tailwind CSS · Pinia · MongoDB Atlas · Groq (multi-agent pipeline)

**The rule model** (`shared/types/rule.ts`): a rule is an ordered list of *branches* — the first one whose conditions match an order wins; nothing matches, it falls through to a default tier/action. Each branch is a flat AND/OR group of conditions, each either:
- a **value** comparison (`amountCents > 30000`)
- a **field** comparison (`shippingCountry != billingCountry`) — the cross-field check a flat field/op/value model alone can't express

Every field reference is checked against `ORDER_FIELDS` (`shared/types/order.ts`) — a single whitelist registry shared by the rule schema, the AI prompt, and the Mongo compiler, so nothing downstream can ever reference a field that isn't real.

**Two evaluators, one model:**
- `shared/utils/evaluateRule.ts` — a pure JS evaluator used for instant client-side preview (the builder's live triage table, the tutorial's live match count) with zero network round trips
- `server/utils/compileRule.ts` — compiles the identical rule tree into a real MongoDB `$switch`/`$addFields` aggregation expression, run server-side against the live orders collection

**The agent pipeline** (`server/utils/agents/`), streamed to the client over SSE (`POST /api/rules/generate`):
1. **Intent** — turns a plain-English description into a structured rule tree, guided by a schema description generated from `ORDER_FIELDS` (so it can never drift out of sync with the real whitelist), validated with Zod before anything trusts it
2. **Validator** — reviews the rule for things Zod's schema can't catch (contradictory conditions, an unreachable branch, a mismatch with what was actually asked for) and can send it back for one revision
3. **Explainer** — writes a plain-English walkthrough once the rule has run against real data, for a non-technical stakeholder to read before signing off

**Persistence:** saved rules live in a `saved_rules` MongoDB collection (`server/api/saved-rules/`). Exactly one rule can be "active" at a time — activating one deactivates the rest — standing in for "the rule currently applied to production orders," which is what the dashboard reports on.

**Accessibility:** every page renders a single `<main id="main-content">` landmark (the skip link in `app.vue` targets it); every input/select has a real label; the branch/condition reorder and resize controls are keyboard-operable buttons, not drag-only; every chart (the dashboard's weekly trend) ships with an accessible data-table fallback via `<details>`.

## Local setup

```bash
npm install
cp .env.example .env   # fill in the values below
npm run db:seed        # seed 400 synthetic orders into your MongoDB Atlas cluster
npm run dev
```

### Environment variables (`.env`)

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | Atlas dashboard → Connect → Drivers → Node.js connection string |
| `MONGODB_DB` | Defaults to `ruleforge` — any database name on your cluster |
| `GROQ_API_KEY` | [console.groq.com/keys](https://console.groq.com/keys) (free tier) |

Atlas's Network Access list needs an entry for your IP locally, and for `0.0.0.0/0` ("allow from anywhere") if you deploy somewhere with dynamic egress IPs like Vercel — serverless functions don't have a stable IP to allowlist individually.

### Other scripts

```bash
npm run typecheck   # nuxt typecheck (vue-tsc)
npm run build        # production build
```

## Deployment

Deployed on Vercel with auto-deploy on push to `main`. The three environment variables above are set as Production env vars in the Vercel project.

## Design notes / known simplifications

- **Single-tenant, no auth** — this is a demo over one shared synthetic dataset, not a multi-user product; there's no login or per-user rule ownership.
- **One active rule at a time** — real fraud-ops setups often run several rules together (a priority-ordered rule *set*); this demo keeps it to one active rule for the dashboard to report on, which is enough to tell the story without the added complexity of combining multiple rules' outcomes.
- **`priorChargebacks`/account-age/etc. are seeded, static signals** — there's no real order pipeline behind this; the "impact" the dashboard shows is a rule evaluated against a fixed snapshot of synthetic data, not live production traffic.
