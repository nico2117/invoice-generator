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
