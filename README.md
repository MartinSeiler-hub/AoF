# AoF

Kompakte Browser-App für **vier Spieler**, mit Buy-in-Auswahl ab **$1**.

| Buy-in | Blinds (USD) | Stack vor Blinds | Small Blind in BB | Tabellenmodell |
|---|---|---|---|---|
| $1 | $0,05 / $0,10 | 10 BB | 0,5 | `10bb` |
| $2 | $0,10 / $0,25 | 8 BB | 0,4 | `8bb_sb04` |
| $4 | $0,25 / $0,50 | 8 BB | 0,5 | `8bb` |
| $8 | $0,50 / $1 | 8 BB | 0,5 | `8bb` |
| $16 | $1 / $2 | 8 BB | 0,5 | `8bb` |
| $32 | $2 / $4 | 8 BB | 0,5 | `8bb` |
| $80 | $5 / $10 | 8 BB | 0,5 | `8bb` |
| $160 | $10 / $20 | 8 BB | 0,5 | `8bb` |

Die beim Laden vorausgewählte Stufe ist $1. Beim Wechsel des Buy-ins werden bestehende Eingaben sofort mit der passenden Tabelle neu ausgewertet. Die Stufen stammen aus der [deutschen AoF-Übersicht](https://ggpoker.de/cashgames/all-in-or-fold/), geprüft am 10.11.2026; sie garantieren keine aktuell besetzten Tische.

1. Eigene Position wählen: BB, SB, BTN oder CO.
2. Zwei Kartenränge nacheinander anklicken. Bei verschiedenen Rängen `s` (suited) oder `o` (offsuit) wählen; Paare brauchen keine Farbangabe.
3. Die Zeile mit den tatsächlich beobachteten Gegneraktionen ablesen. Die letzte Spalte „Du“ enthält deine Empfehlung. Es ist keine Gegner-Eingabe erforderlich.

Für CO erscheint eine Zeile, für BTN zwei, für SB vier und für BB acht. Die Spalten folgen der Reihenfolge CO → BTN → SB und zeigen nur Positionen vor deinem Zug. „All-in“ bezeichnet die erste Eröffnung, „Call“ ein nachfolgendes Mitgehen all-in. Jede Kombination wird separat mit der unveränderten Strategietabelle ausgewertet; es gibt keine Annahme über die tatsächlich gewählte Gegneraktion.

Solange die Hand unvollständig ist, bleiben die Empfehlungen leer. Nur „Blinds“ beim BB mit drei vorherigen Folds ist bereits unabhängig von der Hand bestimmt. Die Zeilen aktualisieren sich bei jeder Änderung von Hand, Position oder Buy-in. **Neue Hand** behält Buy-in und Position und löscht die Karten. Keine Speicherung, Anmeldung, Telemetrie oder Verbindung zum Pokerclient.

## Starten

[App auf GitHub Pages öffnen](https://martinseiler-hub.github.io/AoF/)

Alternativ `index.html` lokal im Browser öffnen. Die App selbst benötigt weder Installation noch externe Bibliotheken.

Lokale Vorschau mit Node.js 20 oder neuer:

```sh
npm start
```

Die lokale Vorschau läuft unter `http://127.0.0.1:4173`.

## Tests

```sh
npm test
```

Die Tests prüfen sämtliche 14 Aktionspfade und 169 Handklassen in allen drei Modellen (7.098 Kombinationen), die Zuordnung der acht Buy-ins, fehlende/ungültige Angaben, Kartenreihenfolge, getrennte BTN-/SB-Tabellen und den BB-Walk. Zusätzlich prüfen sie die vollständige Zeilenübersicht mit allen 15 Situationen einschließlich Walk für alle 169 Handklassen und drei Modelle (7.605 Fälle), ohne fehlende, doppelte oder falsch zugeordnete Kombinationen.

## Strategiegrundlage

Stand **10.11.2026**. Die App übernimmt unverändert die geprüften `balanced`-Kandidaten der drei Modelle: jeweils 14 Tabellen, BTN und SB getrennt. Die SHA-256-Fingerabdrücke der eingefrorenen Quellen und Metadaten stehen in `strategy-data.js`. Für $4 bis $160 ist die Blind-/Stackstruktur identisch; diese Stufen verwenden denselben Standardtabellensatz.

Die Bereiche wurden gegen acht künstliche Gegnerprofile optimiert und mit fünf Millionen neuen gemeinsamen Deals je Modell geprüft. Die App führt ausschließlich eine Tabellenabfrage aus. Sie schätzt keine Gegnerbereiche, berechnet keinen individuellen Geldgewinn und verändert die Strategie nicht anhand einer Teilnahmequote.

- Grün: All-in eröffnen oder All-in callen.
- Fold: Hand außerhalb des Spielbereichs.
- „Knapper Modellfall“: in der PDF gelb markierter Fold; die Basisaktion bleibt Fold.
- Jeder Gegner muss den eigenen modellierten Stack decken. Andere Stackgrößen, Antes, Raises mit Reststack oder abweichende Blindstrukturen sind nicht abgebildet.
- Tabellenmodell, kein GTO- oder Gewinnnachweis. Individuelle Gebühren und Bonuszahlungen werden nicht als bekannte Handgewinne eingerechnet.

## Bereitstellung

Die fünf Dateien `index.html`, `styles.css`, `strategy-data.js`, `engine.js` und `app.js` werden statisch ausgeliefert. GitHub Pages veröffentlicht den Branch `main` aus dem Repository-Stammverzeichnis. `.nojekyll` bleibt erhalten.
