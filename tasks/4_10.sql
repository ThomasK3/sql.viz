4.10	Testovací dotazy
90.	Čísla oddělení, ve kterých pracují nějací zaměstnanci. | SELECT DISTINCT cis_odd FROM zam;
91.	Čísla oddělení, ve kterých pracují inženýři. | SELECT DISTINCT cis_odd FROM zam WHERE titul = 'ING';
92.	Čísla a názvy oddělení, ve kterých pracují inženýři. | SELECT DISTINCT o.cis_odd, o.nazev FROM oddel o JOIN zam z ON o.cis_odd = z.cis_odd WHERE z.titul = 'ING';
93.	Čísla a názvy oddělení, ve kterých nepracuje žádný inženýr. | SELECT o.cis_odd, o.nazev FROM oddel o WHERE o.cis_odd NOT IN (SELECT cis_odd FROM zam WHERE titul = 'ING');
94.	Čísla zaměstnanců, kteří mají podřízené. | SELECT DISTINCT nadr FROM zam WHERE nadr IS NOT NULL;
95.	Čísla a jména zaměstnanců, kteří mají podřízené. | SELECT DISTINCT n.os_cis, n.jmeno FROM zam z JOIN zam n ON z.nadr = n.os_cis;
96.	Průměrný plat za všechny zaměstnance. | SELECT AVG(plat) FROM zam;
97.	Čísla a jména zaměstnanců s platem větším než průměrný plat. | SELECT os_cis, jmeno FROM zam WHERE plat > (SELECT AVG(plat) FROM zam);
98.	Čísla a jména zaměstnanců s platem větším než průměrný plat v jejich oddělení. | SELECT z.os_cis, z.jmeno FROM zam z WHERE z.plat > (SELECT AVG(plat) FROM zam WHERE cis_odd = z.cis_odd);
99.	Čísla a jména zaměstnanců, kteří mají přidělený úkol. | SELECT DISTINCT z.os_cis, z.jmeno FROM zam z JOIN ukoly u ON z.os_cis = u.os_cis;
100.	Čísla a jména zaměstnanců, kteří nemají přidělený žádný úkol. | SELECT os_cis, jmeno FROM zam WHERE os_cis NOT IN (SELECT os_cis FROM ukoly);
101.	Čísla a popisy úkolů, které neřeší vedoucí oddělení. | SELECT cis_uk, popis FROM ukoly WHERE os_cis NOT IN (SELECT sef FROM oddel WHERE sef IS NOT NULL);
102.	Pro každé oddělení počet zaměstnanců bez titulu a počet těch, kteří neřeší žádný úkol. | SELECT z.cis_odd, SUM(CASE WHEN z.titul IS NULL THEN 1 ELSE 0 END) AS bez_titulu, SUM(CASE WHEN z.os_cis NOT IN (SELECT os_cis FROM ukoly) THEN 1 ELSE 0 END) AS bez_ukolu FROM zam z GROUP BY z.cis_odd;
103.	Pro všechna oddělení počty zaměstnanců a počty těch, kteří mají přidělený úkol. | SELECT z.cis_odd, COUNT(DISTINCT z.os_cis) AS zamestnanci, COUNT(DISTINCT u.os_cis) AS s_ukolem FROM zam z LEFT JOIN ukoly u ON z.os_cis = u.os_cis GROUP BY z.cis_odd;
104.	Pro všechna oddělení počty zaměstnanců a počty řešených úkolů. | SELECT z.cis_odd, COUNT(DISTINCT z.os_cis) AS zamestnanci, COUNT(u.cis_uk) AS ukoly FROM zam z LEFT JOIN ukoly u ON z.os_cis = u.os_cis GROUP BY z.cis_odd;
