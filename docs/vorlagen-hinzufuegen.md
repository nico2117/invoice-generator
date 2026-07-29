# Neue Vorlage hinzufügen

Eine neue Vorlage besteht aus **3 Schritten**: Markdown-Datei erstellen, Schema-Datei erstellen, in der Registry eintragen. Kein UI-Code nötig — das Formular wird automatisch aus dem Schema generiert.

---

## Schritt 1: Verzeichnis und Markdown-Datei anlegen

Erstelle `src/lib/templates/{meine-vorlage}/template.md`.

### Verfügbare Platzhalter-Syntax

```
{{feldname}}          Pflichtfeld (Fehler wenn leer)
{{feldname?}}         Optionales Feld (kein Fehler wenn leer)
{{#if bedingung}}...{{/if}}       Bedingter Block (erscheint nur wenn truthy)
{{#unless bedingung}}...{{/unless}}  Invertierter Block
{{#each liste}}{{this.feld}}{{/each}}  Schleife über ein Array
{{@index}}            0-basierter Index innerhalb einer Schleife
```

### Vereinsdaten-Platzhalter (kein Schema-Feld nötig)

Diese Werte kommen direkt aus den Vereinsdaten-Einstellungen (`/einstellungen`):

```
{{verein.name}}
{{verein.strasse}}
{{verein.plz}}
{{verein.ort}}
{{verein.zvrZahl}}
{{verein.kleinunternehmerHinweis}}
{{verein.sig1Name}}
{{verein.sig1Rolle}}
{{verein.sig2Name}}
{{verein.sig2Rolle}}
{{bank.name}}
{{bank.iban}}
{{bank.bic}}
```

### Beispiel-Template

```markdown
# Meine Vorlage

**{{firmenname}}**  
{{strasse}} {{hausnummer}}  
{{plz}} {{ort}}

<div class="meta-right">
<div>{{verein.ort}}, am {{datum}}</div>
</div>

---

Sehr geehrte{{anrede_gruss}} {{nachname}}!

Ihr Betrag: **{{betrag}} EUR**

*{{verein.kleinunternehmerHinweis}}*

Mit freundlichen Grüßen!

**{{verein.name}}**

<div class="signatures">
<div class="sig">
<span class="name">{{verein.sig1Name}}</span>
<span class="role">{{verein.sig1Rolle}}</span>
</div>
<div class="sig">
<span class="name">{{verein.sig2Name}}</span>
<span class="role">{{verein.sig2Rolle}}</span>
</div>
</div>
```

---

## Schritt 2: Schema-Datei anlegen

Erstelle `src/lib/templates/{meine-vorlage}/schema.ts`:

```ts
import type { TemplateSchema } from '../types'

export const meineVorlageSchema: TemplateSchema = {
  id: 'meine-vorlage',
  title: 'Meine Vorlage',
  description: 'Kurze Beschreibung',
  markdownFile: 'meine-vorlage/template.md',
  fields: [
    { name: 'firmenname', label: 'Firmenname', type: 'text', required: true },
    { name: 'anrede', label: 'Anrede', type: 'select', required: true,
      options: [{ value: 'Herrn', label: 'Herrn' }, { value: 'Frau', label: 'Frau' }] },
    { name: 'nachname', label: 'Nachname', type: 'text', required: true },
    { name: 'strasse', label: 'Straße', type: 'text', required: true },
    { name: 'hausnummer', label: 'Hausnummer', type: 'text', required: true },
    { name: 'plz', label: 'PLZ', type: 'text', required: true },
    { name: 'ort', label: 'Ort', type: 'text', required: true },
    { name: 'datum', label: 'Datum', type: 'date', required: true },
    { name: 'betrag', label: 'Betrag', type: 'currency', required: true },
  ],
  derived: [
    { name: 'anrede_gruss', from: 'anrede', description: 'Abgeleitet: Herrn → r Herr, sonst  Frau' },
  ],
}
```

### Verfügbare Feldtypen (`type`)

| Typ | Formular-Element | Hinweis |
|---|---|---|
| `'text'` | Einzeiliges Textfeld | — |
| `'textarea'` | Mehrzeiliges Textfeld | — |
| `'select'` | Dropdown | Erfordert `options: [{ value, label }]` |
| `'date'` | Datumseingabe (TT.MM.JJJJ) | — |
| `'currency'` | Betragsfeld (z. B. `1.234,50`) | Validiert via `parseGermanNumber` |
| `'number'` | Zahlenfeld | — |
| `'contact-ref'` | Kontaktauswahl aus dem Adressbuch | Füllt Empfängerfelder vor |
| `'line-items'` | Wiederholbare Positionen (Tabelle) | Erfordert `columns: FieldDef[]` und `min?: number` |

---

## Schritt 3: In der Registry eintragen

Öffne `src/lib/templates/registry.ts` und ergänze:

```ts
// Import hinzufügen
import { meineVorlageSchema } from './meine-vorlage/schema'

// Im TEMPLATES-Objekt eintragen
export const TEMPLATES: Record<string, TemplateSchema> = {
  [sponsoringSchema.id]: sponsoringSchema,
  [freieRechnungSchema.id]: freieRechnungSchema,
  [spendenbestaetigungSchema.id]: spendenbestaetigungSchema,
  [meineVorlageSchema.id]: meineVorlageSchema,  // ← hinzufügen
}
```

---

## Schritt 4: Konsistenz prüfen

```bash
npm test
```

Der Test `validateTemplateConsistency` prüft automatisch, ob alle Platzhalter im Markdown durch Schema-Felder, abgeleitete Werte oder Vereinsdaten-Schlüssel abgedeckt sind. Nicht übereinstimmende Platzhalter werden als Fehler gemeldet.

---

## Hinweise

- **Kein UI-Code nötig** — das Formular wird vollautomatisch aus `fields` generiert.
- **Keine Verein-Daten hardcoden** — immer `{{verein.name}}`, `{{bank.iban}}` usw. verwenden, damit die Einstellungen wirksam sind.
- **Referenz für einfache Dokumente**: `src/lib/templates/spendenbestaetigung/` (kein Tabellenteil).
- **Referenz für Positionen**: `src/lib/templates/freie-rechnung/` (zeigt `{{#each}}`-Schleife).
- **Abgeleitete Werte** (z. B. `anrede_gruss`, Zeilensummen) werden server-seitig berechnet und müssen in `derived` deklariert werden.
- Die Briefkopf-Struktur (Header, Absenderblock, Unterschriften) kann aus den bestehenden Templates kopiert werden.
