- TypeScript LSP diagnostics could not run because `typescript-language-server` is not installed in the environment.
Issue notes:
- ESLint in this repo reports a non-fatal warning for next/no-img-element in src/app/einstellungen/page.tsx and an unused eslint-disable directive warning in settings.test.ts; these were intentionally left untouched because the task only required errors to be fixed.
- The typescript-language-server is not installed in the environment, so lsp_diagnostics could not be used for final verification.
