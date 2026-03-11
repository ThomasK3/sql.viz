4.2	Klauzule WHERE
10.	Popisy úkolů, které byly přiděleny pracovníkovi č. 1. | SELECT popis FROM ukoly WHERE os_cis = 1;
11.	V kterém oddělení a jako co pracuje pracovník se jménem STRNAD. | SELECT cis_odd, fce FROM zam WHERE jmeno = 'STRNAD';
12.	Jména a platy zaměstnanců, kteří mají titul. | SELECT jmeno, plat FROM zam WHERE titul IS NOT NULL;
13.	Jména a platy zaměstnanců, kteří nemají titul. | SELECT jmeno, plat FROM zam WHERE titul IS NULL;
14.	Jakou funkci zastávají zaměstnanci s příjmením končícím na OVA. | SELECT fce FROM zam WHERE jmeno LIKE '%OVA';
15.	Jména zaměstnanců z oddělení 2, 4, 6, 8, 10. | SELECT jmeno FROM zam WHERE cis_odd IN (2,4,6,8,10);
16.	Jména zaměstnanců ze 3. oddělení s platem nad 6000. | SELECT jmeno FROM zam WHERE cis_odd = 3 AND plat > 6000;
17.	Přehled všech zaměstnanců, kteří nezastávají funkci BOSS. | SELECT jmeno FROM zam WHERE fce <> 'BOSS';
18.	Jména zaměstnanců s titulem ING ze 2. nebo 6. oddělení. | SELECT jmeno FROM zam WHERE titul = 'ING' AND cis_odd IN (2,6);
19.	Jména a funkce zaměstnanců s platem v rozmezí 9000 až 12000 Kč. | SELECT jmeno, fce FROM zam WHERE plat BETWEEN 9000 AND 12000;
20.	Čísla pracovníků, kterým byl přidělen úkol související s programem. | SELECT os_cis FROM ukoly WHERE popis LIKE '%PROGRAM%';
21.	Jména zaměstnanců, jejichž roční plat po 10% valorizaci bude vyšší než 90000. | SELECT jmeno FROM zam WHERE plat * 12 * 1.1 > 90000;
