# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-07-13T12:23:13.252Z
> Files: 100 tracked | Anatomy hits: 0 | Misses: 0

## ../../../Users/180655/AppData/Local/Temp/claude/c--Vino-FinSight-Source/9a861225-893c-4e78-9ebb-113290c5fed6/scratchpad/

- `probe.py` — override_get_db (~282 tok)

## ./

- `.gitignore` — Git ignore rules (~41 tok)
- `CLAUDE.md` — OpenWolf (~57 tok)

## .claude/

- `settings.json` (~441 tok)

## .claude/rules/

- `openwolf.md` (~313 tok)

## .superpowers/sdd/

- `task-1-report.md` — Task 1 Report: Backend Project Scaffold (~785 tok)
- `task-10-report.md` — Task 10 Report: Frontend Scaffold + Role Context (~1752 tok)
- `task-11-report.md` — Task 11 Report: Dashboard + Utilization Pages (~1038 tok)
- `task-12-report.md` — Task 12 Report: Scorecards + Insights Pages (~1200 tok)
- `task-13-report.md` — Task 13 Report: Ask FinSight (NL2SQL) + Uploads Pages (~831 tok)
- `task-14-report.md` — Task 14 Report: App Shell, Routing, and Smoke Test (~1566 tok)
- `task-15-report.md` — Task 15 Report: Scope-Options Router + Scope-Aware NL2SQL (~1777 tok)
- `task-2-report.md` — Task 2 Report: Database Models (~954 tok)
- `task-3-report.md` — Task 3 Report: Role Scoping Dependency (~1094 tok)
- `task-4-report.md` — Task 4 Report: Ingestion Service + Uploads Router (~1741 tok)
- `task-5-report.md` — Task 5 Report: Dashboard Aggregation Service + Router (~817 tok)
- `task-6-report.md` — Task 6 Report: Scorecards Service + Router (~879 tok)
- `task-7-report.md` — Task 7 Report: Pluggable LLM Client (~1369 tok)
- `task-8-report.md` — Task 8 Report: AI Narrative Insights Router (~1642 tok)
- `task-9-report.md` — Task 9 Report: NL2SQL Agent ("Ask FinSight") (~1445 tok)

## apps/api/

- `requirements.txt` — Python dependencies (~59 tok)

## apps/api/app/

- `__init__.py` (~0 tok)
- `deps.py` — Role-scoping dependency: RoleScope dataclass, get_role_scope (~148 tok)
- `main.py` — API: 1 endpoints (~173 tok)

## apps/api/app/core/

- `__init__.py` (~0 tok)
- `config.py` — Declares Settings (~108 tok)
- `db.py` — Base: get_db (~124 tok)

## apps/api/app/core/llm/

- `__init__.py` (~0 tok)
- `anthropic_client.py` — AnthropicClient: complete (~164 tok)
- `base.py` — LLMClient: complete (~47 tok)
- `factory.py` — get_llm_client (~110 tok)
- `openai_client.py` — OpenAIClient: complete (~174 tok)

## apps/api/app/models/

- `__init__.py` — Exports all 5 models (~90 tok)
- `account.py` — Account ORM model (~131 tok)
- `financial_record.py` — FinancialRecord ORM model with margin property (~198 tok)
- `program.py` — Program ORM model (~150 tok)
- `upload.py` — Upload ORM model (~155 tok)
- `utilization_record.py` — UtilizationRecord ORM model (~175 tok)

## apps/api/app/routers/

- `__init__.py` (~0 tok)
- `dashboard.py` — API: 2 endpoints (~183 tok)
- `insights.py` — API: 1 endpoints (~124 tok)
- `nlq.py` — API: 1 endpoints (~147 tok)
- `scope_options.py` — API: 2 endpoints (~235 tok)
- `scorecards.py` — API: 1 endpoints (~122 tok)
- `uploads.py` — API: 2 endpoints (~359 tok)

## apps/api/app/schemas/

- `__init__.py` (~0 tok)
- `upload.py` — Declares UploadOut (~72 tok)

## apps/api/app/services/

- `__init__.py` (~0 tok)
- `dashboard.py` — revenue_margin_summary, utilization_summary (~734 tok)
- `ingestion.py` — ingest_financial, ingest_utilization (~969 tok)
- `insights.py` — generate_narrative (~205 tok)
- `nl2sql.py` — UnsafeSQLError: validate_select_only, question_to_sql, run_query (~672 tok)
- `scorecards.py` — program_scorecards (~363 tok)

## apps/api/tests/

- `__init__.py` (~0 tok)
- `conftest.py` — db_session, client, override_get_db (~237 tok)
- `test_dashboard.py` — test_revenue_margin_summary_aggregates_across_all_programs, test_revenue_margin_summary_scoped_to_si (~615 tok)
- `test_deps.py` — Tests for RoleScope: defaults, fallback, scoped pm (~150 tok)
- `test_health.py` — test_health_endpoint (~45 tok)
- `test_ingestion.py` — test_ingest_financial_creates_records, test_ingest_financial_missing_columns, test_ingest_utilizatio (~294 tok)
- `test_insights.py` — FakeClient: complete, test_generate_narrative_uses_llm_client (~131 tok)
- `test_llm_factory.py` — test_factory_returns_anthropic_by_default, test_factory_returns_openai_when_configured (~223 tok)
- `test_models.py` — test_account_program_financial_record_relationship (~215 tok)
- `test_nl2sql_guard.py` — test_validate_select_only_accepts_select, test_validate_select_only_rejects_delete, test_validate_se (~281 tok)
- `test_nl2sql_run_query.py` — FakeClient: complete, test_run_query_executes_generated_sql, test_run_query_includes_scoping_hint_in (~670 tok)
- `test_scope_options.py` — test_list_accounts_returns_seeded_accounts_ordered_by_name, test_list_programs_without_account_id_re (~470 tok)
- `test_scorecards.py` — test_program_scorecards_assigns_rag_status (~308 tok)
- `test_uploads_api.py` — test_upload_financial_endpoint, test_upload_unknown_dataset_returns_400 (~194 tok)

## apps/web/

- `package.json` — Node.js package manifest (~262 tok)
- `postcss.config.js` — PostCSS plugins: tailwindcss + autoprefixer (~15 tok)
- `tailwind.config.js` — Tailwind v3 config, content globs for index.html + src/**/*.{ts,tsx} (~30 tok)
- `tailwind.config.js` (~45 tok)
- `vite.config.ts` — Vite config via `vitest/config`'s defineConfig; includes `test: { environment: "jsdom", setupFiles: "./src/setupTests.ts" }` (~40 tok)
- `vite.config.ts` — https://vite.dev/config/ (~72 tok)

## apps/web/src/

- `App.test.tsx` (~122 tok)
- `App.tsx` — NAV_ITEMS (~591 tok)
- `index.css` — Tailwind base/components/utilities directives (~10 tok)
- `index.css` — Styles: 3 rules (~17 tok)
- `setupTests.ts` — Vitest setup: jest-dom/vitest matchers, jsdom pointer-capture/scrollIntoView polyfills for Radix, RTL cleanup afterEach (~90 tok)
- `setupTests.ts` — jsdom does not implement these APIs, but Radix UI's Select uses them (~202 tok)

## apps/web/src/components/

- `RoleSwitcher.test.tsx` — RTL tests: default label renders, selecting "Program Manager" persists "pm" to localStorage (~180 tok)
- `RoleSwitcher.test.tsx` (~258 tok)
- `RoleSwitcher.tsx` — Radix Select dropdown bound to useRole(); labels PM/Account Director/Area Director (~220 tok)
- `RoleSwitcher.tsx` — ROLE_LABELS (~330 tok)
- `ScopePicker.test.tsx` (~391 tok)
- `ScopePicker.tsx` — ScopePicker (~545 tok)

## apps/web/src/context/

- `RoleContext.tsx` — STORAGE_KEY (~311 tok)
- `RoleContext.tsx` — STORAGE_KEY (~270 tok)

## apps/web/src/lib/

- `api.ts` — Exports RequestOptions, RevenueMarginPoint, getRevenueMargin, UtilizationPoint + 11 more (~858 tok)
- `api.ts` — Exports RequestOptions, RevenueMarginPoint, getRevenueMargin, UtilizationPoint + 7 more (~648 tok)

## apps/web/src/pages/

- `AskFinSight.test.tsx` (~465 tok)
- `AskFinSight.tsx` — AskFinSight — renders table (~697 tok)
- `Dashboard.test.tsx` (~209 tok)
- `Dashboard.tsx` — Dashboard (~313 tok)
- `Insights.tsx` — Insights (~203 tok)
- `Scorecards.test.tsx` (~227 tok)
- `Scorecards.tsx` — RAG_COLORS (~331 tok)
- `Uploads.tsx` — Uploads (~430 tok)
- `Utilization.tsx` — Utilization (~307 tok)

## docs/superpowers/plans/

- `2026-07-13-finsight-mvp.md` — FinSight MVP Implementation Plan (~17979 tok)

## docs/superpowers/specs/

- `2026-07-13-finsight-mvp-design.md` — FinSight MVP — Design Spec (~1099 tok)
