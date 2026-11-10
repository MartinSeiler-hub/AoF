# AoF

Kompakte Browser-App für **vier Spieler, 8 BB vor den Blinds und SB = 0,5 BB**.

1. Eigene Position wählen: BB, SB, BTN oder CO.
2. Zwei Kartenränge nacheinander anklicken. Bei verschiedenen Rängen `s` (suited) oder `o` (offsuit) wählen; Paare brauchen keine Farbangabe.
3. Für jeden Gegner vor dem eigenen Zug Fold oder All-in auswählen. Nach einem vorherigen All-in heißt die Aktion Call.

Die passende Tabellenempfehlung erscheint automatisch. Es werden nur vorherige Positionen abgefragt. Fehlende Angaben führen zu keiner Spielentscheidung. Folden CO, BTN und SB, gewinnt der BB die Blinds ohne weitere Entscheidung.

**Neue Hand** behält die Position und löscht Karten und Aktionen. Ein Positionswechsel löscht alle Gegneraktionen. Eine geänderte frühere Gegneraktion löscht die folgenden Aktionen, weil sich deren Entscheidungssituation ändert. Keine Speicherung, Anmeldung, Telemetrie oder Verbindung zum Pokerclient.

## Starten

`index.html` direkt im Browser öffnen. Die App benötigt weder Installation noch Netzwerkzugriff.

Optional mit Node.js 20 oder neuer:

```sh
npm start
```

Die lokale Vorschau läuft unter `http://127.0.0.1:4173`.

## Tests

```sh
npm test
```

Die Tests prüfen sämtliche 14 Aktionspfade und 169 Handklassen, fehlende/ungültige Angaben, Kartenreihenfolge, getrennte BTN-/SB-Tabellen und den BB-Walk.

## Strategiegrundlage

Stand **10.11.2026**. Die App übernimmt unverändert den zuletzt geprüften `balanced`-Kandidaten des Standard-8-BB-Modells: 14 Tabellen, BTN und SB getrennt. Der SHA-256-Fingerabdruck der eingefrorenen Quelle und Metadaten stehen in `strategy-data.js`.

Die Bereiche wurden gegen acht künstliche Gegnerprofile optimiert und mit fünf Millionen neuen gemeinsamen Deals geprüft. Die App führt ausschließlich eine Tabellenabfrage aus. Sie schätzt keine Gegnerbereiche, berechnet keinen individuellen Geldgewinn und verändert die Strategie nicht anhand einer Teilnahmequote.

- Grün: All-in eröffnen oder All-in callen.
- Fold: Hand außerhalb des Spielbereichs.
- „Knapper Modellfall“: in der PDF gelb markierter Fold; die Basisaktion bleibt Fold.
- Jeder Gegner muss den eigenen 8-BB-Stack decken. Andere Stackgrößen, Antes, Raises mit Reststack oder veränderte Blindstrukturen sind nicht abgebildet.
- Diese Version gilt **nicht** für den $1-Tisch mit 10 BB oder den $2-Tisch mit SB = 0,4 BB.
- Tabellenmodell, kein GTO- oder Gewinnnachweis. Individuelle Gebühren und Bonuszahlungen werden nicht als bekannte Handgewinne eingerechnet.

## Bereitstellung

Die fünf Dateien `index.html`, `styles.css`, `strategy-data.js`, `engine.js` und `app.js` können unverändert von einem statischen Webserver ausgeliefert werden. Es wurde keine automatische Veröffentlichung oder GitHub-Pages-Aktivierung eingerichtet.
