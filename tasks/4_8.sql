4.8	Self JOIN
69.	Jména zaměstnanců s názvem oddělení a jménem vedoucího oddělení. | SELECT z.jmeno, o.nazev, s.jmeno AS vedouci FROM zam z JOIN oddel o ON z.cis_odd = o.cis_odd JOIN zam s ON o.sef = s.os_cis;
70.	Jména zaměstnanců se jménem bezprostředně nadřízeného. | SELECT z.jmeno, n.jmeno AS nadrizeny FROM zam z JOIN zam n ON z.nadr = n.os_cis;
71.	Jména zaměstnanců se jménem bezprostředně nadřízeného a jménem vedoucího oddělení. | SELECT z.jmeno, n.jmeno AS nadrizeny, s.jmeno AS vedouci FROM zam z JOIN zam n ON z.nadr = n.os_cis JOIN oddel o ON z.cis_odd = o.cis_odd JOIN zam s ON o.sef = s.os_cis;
72.	Počty inženýrů v jednotlivých odděleních (název oddělení, jméno vedoucího). | SELECT o.nazev, s.jmeno AS vedouci, COUNT(*) AS pocet FROM zam z JOIN oddel o ON z.cis_odd = o.cis_odd JOIN zam s ON o.sef = s.os_cis WHERE z.titul = 'ING' GROUP BY o.nazev, s.jmeno;
73.	Jména zaměstnanců s platem vyšším než má jejich bezprostředně nadřízený. | SELECT z.jmeno FROM zam z JOIN zam n ON z.nadr = n.os_cis WHERE z.plat > n.plat;
74.	Jména zaměstnanců s platem stejným jako má zaměstnanec DLOUHY. | SELECT jmeno FROM zam WHERE plat = (SELECT plat FROM zam WHERE jmeno = 'DLOUHY');
75.	Jména vedoucích jednotlivých oddělení s názvem a počtem pracovníků v oddělení. | SELECT s.jmeno AS vedouci, o.nazev, COUNT(z.os_cis) AS pocet FROM oddel o JOIN zam s ON o.sef = s.os_cis JOIN zam z ON z.cis_odd = o.cis_odd GROUP BY s.jmeno, o.nazev;
76.	Přehled funkcí vykonávaných v jednotlivých odděleních s počtem zaměstnanců. | SELECT cis_odd, fce, COUNT(*) AS pocet FROM zam GROUP BY cis_odd, fce;
77.	Jména vedoucích jednotlivých oddělení s počty pracovníků vykonávajícími jednotlivé funkce. | SELECT s.jmeno AS vedouci, z.fce, COUNT(*) AS pocet FROM oddel o JOIN zam s ON o.sef = s.os_cis JOIN zam z ON z.cis_odd = o.cis_odd GROUP BY s.jmeno, z.fce;
78.	Počty zaměstnanců bezprostředně podřízených jednotlivým zaměstnancům. | SELECT n.jmeno, COUNT(*) AS pocet FROM zam z JOIN zam n ON z.nadr = n.os_cis GROUP BY n.jmeno;
79.	Kteří vedoucí (číslo, jméno) šéfují oddělení s alespoň 4 zaměstnanci. | SELECT s.os_cis, s.jmeno FROM oddel o JOIN zam s ON o.sef = s.os_cis JOIN zam z ON z.cis_odd = o.cis_odd GROUP BY s.os_cis, s.jmeno HAVING COUNT(*) >= 4;
