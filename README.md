# SQL Vizualizér

Interaktivní nástroj pro vizualizaci průběhu SQL dotazů. Vytvořeno jako studijní pomůcka pro předmět **4IT218** na VŠE FIS.

**[Spustit](https://thomask3.github.io/sql.viz/)**

![screenshot](https://img.shields.io/badge/stack-single_HTML_file-blue)

## Komunita a Feedback
- **Budu rád za každou zpětnou vazbu, pozitivní negativní, návrhy a různé nápady.
- **Napište, pokud najdete chybu. [Bude jich hodně a zatím je to opravdu pouze vizualize myšlenky, než funkční model.]
- [**LINK NA DISKUSI](https://github.com/ThomasK3/sql.viz/discussions/1)

## Co to umí

- **SQL Editor** se syntax highlightingem a příklady dotazů
- **Vizualizace tabulek** — schéma databáze s animovanými JOIN čárami mezi sloupci
- **Průběh zpracování** — krokový rozklad dotazu (FROM → JOIN → WHERE → GROUP BY → …)
- **Timeline** — interaktivní slider pro procházení kroků zpracování
- **Výsledky** — tabulka s výsledky dotazu

Podporované SQL: `SELECT`, `DISTINCT`, `FROM`, `JOIN` (INNER/LEFT/RIGHT/FULL/CROSS/USING/ON), `WHERE`, `GROUP BY`, `HAVING`, `ORDER BY`, vnořené dotazy, agregační funkce (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`), skalární funkce (`ROUND`, `UPPER`, `NVL`, `COALESCE`, …), `||` konkatenace, `LIKE`, `BETWEEN`, `IN`, `IS NULL`.

## Jak to funguje

Celá aplikace je **jeden HTML soubor** (~1800 řádků). Žádný framework, žádný backend — vše běží v prohlížeči.

1. Vlastní SQL tokenizer a recursive descent parser
2. In-memory executor nad hardcoded databází (tabulky `ZAM`, `ODDEL`, `UKOLY`)
3. Stepped executor — zachycuje mezistavy po každé klauzuli
4. SVG vizualizace JOIN propojení mezi tabulkami

## Spuštění lokálně

```
git clone https://github.com/ThomasK3/sql.viz.git
open sql.viz/index.html
```

Žádné závislosti. Žádný build. Stačí otevřít v prohlížeči.
