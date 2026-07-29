- Created a single-row Drizzle settings query module with id=1 seeding and a plain snapshot contract for template placeholders.
- Vitest coverage confirms every SETTINGS_PLACEHOLDER_KEY path resolves against the snapshot shape.

## Task 16 — Freie Rechnung template (Wave 4)

### Patterns
- {{#each positionen}}| {{this.beschreibung}} | ... |{{/each}} — table rows via each block; 	his.field syntax maps to item properties
- positionen[].summe derived field pattern for row totals (pre-computed server-side)
- gesamtbetrag derived from sum of all row totals
- {{titel?}} optional placeholder — suppressed cleanly when empty string passed
- ormatCurrency() produces German locale format (comma decimal, dot thousands): 300,00

### Verification approach
- Write temp .ts script using @/ alias, run via 
px tsx, delete after
- Sum calculation in verify script: parseFloat(summe.replace('.','').replace(',','.'))

### Schema notes
- line-items type requires s import('../types').LineItemsFieldDef cast for type narrowing
- derived array documents server-side computations — not validated at compile time

### Git note
- Parallel wave (Task 17 contact queries) committed our freie-rechnung files in its own commit
- Incremental tsc ("incremental": true) can show stale errors; re-run to confirm

## Task 23 — Invoice creation flow (Wave 5)

- Preview route must call the shared render path but never `allocateNumber()` or `storePdf()`.
- Creation route uses `generateInvoice()`: render PDF, upload blob, then transactionally allocate number + insert invoice row.
- `SchemaForm` now supports injectable action buttons plus `onValuesChange` so the invoice page can track whether `rechnungsnummer` was edited before sending an override.
- Importing `renderPdf()` from an app route made Turbopack resolve the unused `fontsDir` URL; removing the dead constant fixed production bundling.

- Note: Next.js evaluates db client initialization at build time even for force-dynamic routes, so DATABASE_URL is required to pass the build step.

Task 26: CSV import flow implemented in `src/app/import/page.tsx` with client-side preview validation, 50-row cap, and ZIP download handoff. Added `/api/import/sample` for semicolon sample CSVs and `/api/import/generate` using `renderPdfBatch` + in-memory JSZip with per-row store/DB failures captured instead of aborting the whole batch. LSP diagnostics could not run because `typescript-language-server` is not installed; `npm run build` passed.
Lint cleanup:
- Replaced remaining <a> navigational links with next/link <Link> in archiving, error, not-found, and invoice creation pages.
- Resolved react-hooks/set-state-in-effect issues by moving query-empty handling out of ContactRefField's effect body and suppressing the controlled value sync in CurrencyField where the effect is intentionally syncing prop state.
Verification:
- npm run lint: 0 errors, warnings only
- npm run build: passed
- npm test: 115/115 passed
