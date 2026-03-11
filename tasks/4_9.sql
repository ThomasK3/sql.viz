4.9	Vnořené dotazy
80.	Oddělení se stejným počtem zaměstnanců jako oddělení PROJEKCE. | SELECT cis_odd FROM zam GROUP BY cis_odd HAVING COUNT(*) = (SELECT COUNT(*) FROM zam z JOIN oddel o ON z.cis_odd = o.cis_odd WHERE o.nazev = 'PROJEKCE');
81.	Jména zaměstnanců s platem menším než průměrný plat. | SELECT jmeno FROM zam WHERE plat < (SELECT AVG(plat) FROM zam);
82.	Číslo a jméno zaměstnance s nejmenším platem. | SELECT os_cis, jmeno FROM zam WHERE plat = (SELECT MIN(plat) FROM zam);
83.	Počet zaměstnanců s platem menším než průměrný plat. | SELECT COUNT(*) FROM zam WHERE plat < (SELECT AVG(plat) FROM zam);
84.	Počet inženýrů s platem menším než průměrný plat všech inženýrů. | SELECT COUNT(*) FROM zam WHERE titul = 'ING' AND plat < (SELECT AVG(plat) FROM zam WHERE titul = 'ING');
85.	Ve kterém oddělení nepracuje žádný inženýr. | SELECT cis_odd FROM oddel WHERE cis_odd NOT IN (SELECT cis_odd FROM zam WHERE titul = 'ING');
86.	Seznam všech oddělení (číslo a název) s počty zaměstnanců včetně nulových. | SELECT o.cis_odd, o.nazev, COUNT(z.os_cis) AS pocet FROM oddel o LEFT JOIN zam z ON o.cis_odd = z.cis_odd GROUP BY o.cis_odd, o.nazev;
87.	Oddělení (číslo a název), ve kterých nepracuje nikdo bez titulu. | SELECT o.cis_odd, o.nazev FROM oddel o JOIN zam z ON o.cis_odd = z.cis_odd GROUP BY o.cis_odd, o.nazev HAVING SUM(CASE WHEN z.titul IS NULL THEN 1 ELSE 0 END) = 0;
88.	Oddělení (číslo a název), ve kterých pracuje více inženýrů než zaměstnanců bez titulu. | SELECT o.cis_odd, o.nazev FROM oddel o JOIN zam z ON o.cis_odd = z.cis_odd GROUP BY o.cis_odd, o.nazev HAVING SUM(CASE WHEN z.titul = 'ING' THEN 1 ELSE 0 END) > SUM(CASE WHEN z.titul IS NULL THEN 1 ELSE 0 END);
89.	Seznam všech zaměstnanců (osobní číslo a jméno) s počtem přidělených úkolů. | SELECT z.os_cis, z.jmeno, COUNT(u.cis_uk) AS pocet FROM zam z LEFT JOIN ukoly u ON z.os_cis = u.os_cis GROUP BY z.os_cis, z.jmeno;
