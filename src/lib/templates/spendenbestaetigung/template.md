# Spendenbestätigung

**{{firmenname}}**  
{{#if ansprechperson}}z.H. {{anrede}} {{titel?}} {{ansprechperson}}  
{{/if}}{{strasse}} {{hausnummer}}  
{{plz}} {{ort}}

<div class="meta-right">
<div>{{verein.ort}}, am {{datum}}</div>
<div><strong>Dokumentnummer: R{{jahr}}-{{rechnungsnummer}}</strong></div>
</div>

---

Sehr geehrte{{anrede_gruss}} {{titel?}} {{nachname}}!

Im Namen der {{verein.name}} (ZVR-Zahl: {{verein.zvrZahl}}) bestätigen wir dankend den Erhalt Ihrer Spende in Höhe von **{{betrag}} EUR**, eingegangen am {{spendendatum}}.

{{#if verwendungszweck}}Die Spende wird für folgenden Zweck verwendet: {{verwendungszweck}}

{{/if}}Wir bedanken uns herzlich für Ihre großzügige Unterstützung und Ihr Vertrauen in unsere Arbeit.

*{{verein.kleinunternehmerHinweis}}*

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
