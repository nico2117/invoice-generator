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

## Sponsoring {{verein.name}}

**Kirchbacher Kirchtag (12.-14. September {{jahr}})**  
{{leistung}}

---

Sehr geehrte{{anrede_gruss}} {{titel?}} {{nachname}}!

Im Namen der {{verein.name}} möchte ich mich herzlich für die Unterstützung bedanken.

In Bezug auf Ihre Zusage erlaube ich mir folgenden Betrag in Rechnung zu stellen:

| Beschreibung | Betrag |
|--------------|--------|
| {{leistung}} | {{betrag}} EUR |

*{{verein.kleinunternehmerHinweis}}*

---

Bitte den oben genannten Betrag nach Erhalt der Rechnung auf folgende Bankverbindung überweisen:

**Bankverbindung {{verein.name}}:**  
{{bank.name}}  
**IBAN:** {{bank.iban}}  
**BIC:** {{bank.bic}}

---

Mit freundlichen Grüßen und vielen Dank für Ihre Unterstützung!

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
