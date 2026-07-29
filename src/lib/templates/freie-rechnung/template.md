# Rechnung

**{{firmenname}}**  
{{#if ansprechperson}}z.H. {{anrede}} {{titel?}} {{ansprechperson}}  
{{/if}}{{strasse}} {{hausnummer}}  
{{plz}} {{ort}}

<div class="meta-right">
<div>{{verein.ort}}, am {{datum}}</div>
<div><strong>Rechnungsnummer: R{{jahr}}-{{rechnungsnummer}}</strong></div>
</div>

---

## {{betreff}}

{{#if einleitung}}{{einleitung}}

{{/if}}---

Sehr geehrte{{anrede_gruss}} {{titel?}} {{nachname}}!

| Beschreibung | Menge | Einzelpreis | Summe |
|--------------|-------|-------------|-------|
{{#each positionen}}| {{this.beschreibung}} | {{this.menge}} | {{this.einzelpreis}} EUR | {{this.summe}} EUR |
{{/each}}| **Gesamtbetrag** | | | **{{gesamtbetrag}} EUR** |

*{{verein.kleinunternehmerHinweis}}*

---

Bitte den oben genannten Betrag nach Erhalt der Rechnung auf folgende Bankverbindung überweisen:

**Bankverbindung {{verein.name}}:**  
{{bank.name}}  
**IBAN:** {{bank.iban}}  
**BIC:** {{bank.bic}}

---

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
