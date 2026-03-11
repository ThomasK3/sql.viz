// ============================================================
// Tasks module — task loading, parsing, comparison, rendering
// ============================================================

import { escapeHTML, executeSQLite } from './engine.js';
import { updateEditor } from './editor.js';
import { drawJoinLines } from './visualizer/index.js';

// --- State ---
var tasksData = [];       // [{id, chapterNum, chapterTitle, num, text, solutionSQL, solved, autoChecked}]
var tasksActiveId = null;
var tasksDocked = false;
let suppressOpen = false;

// --- Panel open/close ---

export function tasksOverlayClick() {
  if (!tasksDocked) toggleTasksPanel();
}

export function toggleTasksPanel() {
  if (suppressOpen) return;
  const panel = document.getElementById('tasksPanel');
  const overlay = document.getElementById('tasksOverlay');
  const btn = document.getElementById('btnTasks');
  const isOpen = panel.classList.contains('open');
  if (isOpen && !tasksDocked) {
    panel.classList.remove('open');
    overlay.classList.remove('show');
    btn.classList.remove('active');
  } else if (!isOpen) {
    panel.classList.add('open');
    if (!tasksDocked) overlay.classList.add('show');
    btn.classList.add('active');
  }
}

export function toggleTasksDocked() {
  tasksDocked = !tasksDocked;
  const pinBtn = document.getElementById('tasksPinBtn');
  pinBtn.classList.toggle('pinned', tasksDocked);
  pinBtn.title = tasksDocked ? 'Zrušit přichycení (panel překryje stránku)' : 'Přichytit panel vedle editoru (zúží stránku)';
  const panel = document.getElementById('tasksPanel');
  const appBody = document.getElementById('appBody');
  const app = document.querySelector('.app');

  if (tasksDocked) {
    // Move panel inside app-body so it pushes main-content
    app.classList.add('tasks-docked');
    appBody.appendChild(panel);
    document.getElementById('tasksOverlay').classList.remove('show');
    // Make sure panel is open
    if (!panel.classList.contains('open')) {
      panel.classList.add('open');
      document.getElementById('btnTasks').classList.add('active');
    }
  } else {
    // Move panel back to body as floating overlay
    app.classList.remove('tasks-docked');
    document.body.appendChild(panel);
    if (panel.classList.contains('open')) {
      document.getElementById('tasksOverlay').classList.add('show');
    }
  }
  setTimeout(() => { updateEditor(); if (window.__lastLinks) drawJoinLines(window.__lastLinks); }, 80);
}

// --- File upload ---

export function handleTasksFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => { parseAndLoadTasks(e.target.result); };
  reader.readAsText(file, 'UTF-8');
  event.target.value = '';
}

// --- Paste modal ---

export function showTasksPasteModal() {
  document.getElementById('pasteModalOverlay').style.display = 'flex';
  setTimeout(() => document.getElementById('pasteModalText').focus(), 50);
}

export function hideTasksPasteModal() {
  document.getElementById('pasteModalOverlay').style.display = 'none';
}

export function loadTasksFromPaste() {
  const text = document.getElementById('pasteModalText').value.trim();
  if (!text) return;
  parseAndLoadTasks(text);
  hideTasksPasteModal();
}

// --- Parsing ---

function parseAndLoadTasks(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const tasks = [];
  let currentChapter = null;
  let currentChapterNum = '';
  let taskId = 0;
  for (const line of lines) {
    const chapterMatch = line.match(/^(\d+\.\d+)[\s\t]+(.+)$/);
    if (chapterMatch) {
      currentChapterNum = chapterMatch[1];
      currentChapter = chapterMatch[2].trim();
      continue;
    }
    if (line.match(/^(\d+)[.\t]\s*(.+)$/) && !line.match(/^\d+\.\d+/)) {
      const m = line.match(/^(\d+)[.\t]\s*(.+)$/);
      const num = parseInt(m[1]);
      let taskText = m[2].trim();
      if (taskText.length < 3) continue;
      let solutionSQL = null;
      // Parse pipe delimiter: "Text | SELECT ..."
      const pipeIdx = taskText.indexOf(' | ');
      if (pipeIdx > 0) {
        const sqlPart = taskText.substring(pipeIdx + 3).trim();
        taskText = taskText.substring(0, pipeIdx).trim();
        if (sqlPart.toUpperCase().startsWith('SELECT')) {
          solutionSQL = sqlPart;
        }
      }
      tasks.push({
        id: ++taskId,
        chapterNum: currentChapterNum || '',
        chapterTitle: currentChapter || 'Úkoly',
        num,
        text: taskText,
        solutionSQL,
        solved: false,
        autoChecked: false
      });
    }
  }
  if (tasks.length === 0) { alert('Nepodařilo se načíst žádné úkoly. Zkontroluj formát textu.'); return; }
  tasksData = tasks;
  tasksActiveId = null;
  renderTasksPanel();
  if (!document.getElementById('tasksPanel').classList.contains('open')) toggleTasksPanel();
}

// --- Result comparison ---

// Normalize a single value for comparison: trim, uppercase, null → ''
function normVal(v) {
  return (v === null || v === undefined) ? '' : String(v).toUpperCase().trim();
}

// Convert result rows to positional array of normalized strings
function resultToPositional(result) {
  return result.rows.map(r => result.columns.map(c => normVal(r[c])));
}

// Compare user result against task's solutionSQL
function resultsMatchStored(task, userResult) {
  if (!task.solutionSQL) return false;
  let ref;
  try { ref = executeSQLite(task.solutionSQL); } catch(e) { return false; }
  // Column count must match (positional — ignore names)
  if (ref.columns.length !== userResult.columns.length) return false;
  if (ref.rows.length !== userResult.rows.length) return false;

  let refRows = resultToPositional(ref);
  let userRows = resultToPositional(userResult);

  // If reference SQL has ORDER BY → compare exact order; otherwise sort both
  const hasOrderBy = /\bORDER\s+BY\b/i.test(task.solutionSQL);
  if (!hasOrderBy) {
    const rowKey = r => r.join('\x00');
    refRows.sort((a, b) => rowKey(a).localeCompare(rowKey(b)));
    userRows.sort((a, b) => rowKey(a).localeCompare(rowKey(b)));
  }

  for (let i = 0; i < refRows.length; i++) {
    for (let j = 0; j < refRows[i].length; j++) {
      if (refRows[i][j] !== userRows[i][j]) return false;
    }
  }
  return true;
}

// --- Auto-check ---

// Called after every successful query execution
export function autoCheckTasksWithResult(userResult) {
  if (tasksData.length === 0) return;

  let anyChanged = false;
  let lastSolvedId = null;
  for (const task of tasksData) {
    if (!task.solutionSQL) continue;
    if (task.solved) continue;
    if (resultsMatchStored(task, userResult)) {
      task.solved = true;
      task.autoChecked = true;
      anyChanged = true;
      lastSolvedId = task.id;
    }
  }
  if (anyChanged) {
    tasksActiveId = lastSolvedId;
    renderTasksPanel();
    setTimeout(() => {
      const el = document.querySelector(`.tasks-task[data-taskid="${lastSolvedId}"]`);
      if (el) {
        el.style.transition = 'background 0.5s';
        el.style.background = 'rgba(63,185,80,0.3)';
        setTimeout(() => { if (el) el.style.background = ''; }, 1000);
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 60);
  }
}

// --- Rendering ---

function renderTasksPanel() {
  const body = document.getElementById('tasksBody');
  const footer = document.getElementById('tasksFooter');
  if (tasksData.length === 0) {
    body.innerHTML = '<div class="tasks-empty-state"><div style="font-size:32px;margin-bottom:12px">📄</div><div style="font-weight:600;margin-bottom:6px;color:var(--text2)">Žádná cvičení</div><div style="font-size:11px;color:var(--text3);line-height:1.6">Nahraj textový soubor nebo vlož text se cvičeními.<br>Formát: číslo + tečka + text úkolu.</div></div>';
    footer.style.display = 'none';
    return;
  }

  // Group by chapter
  const chapters = [];
  const chapterMap = new Map();
  for (const task of tasksData) {
    const key = task.chapterNum + '|' + task.chapterTitle;
    if (!chapterMap.has(key)) {
      chapterMap.set(key, { key, num: task.chapterNum, title: task.chapterTitle, tasks: [] });
      chapters.push(chapterMap.get(key));
    }
    chapterMap.get(key).tasks.push(task);
  }

  // Active task info for record bar
  const activeTask = tasksData.find(t => t.id === tasksActiveId);
  const hasSolution = activeTask && activeTask.solutionSQL !== null;

  let html = '';

  // Info bar pro vybraný úkol
  if (activeTask) {
    html += `<div class="tasks-record-bar" id="tasksRecordBar">`;
    html += `<span class="tasks-record-task-label">Vybraný: <b>${activeTask.num}.</b> ${escapeHTML(activeTask.text.substring(0, 60))}${activeTask.text.length > 60 ? '…' : ''}</span>`;
    if (activeTask.solutionSQL) {
      html += `<div style="margin-top:4px"><span class="tasks-solution-badge">Auto-check aktivní — spusť správný SQL a úkol se automaticky splní</span></div>`;
    }
    html += `</div>`;
  }

  // Chapter list
  for (const ch of chapters) {
    const solvedCount = ch.tasks.filter(t => t.solved).length;
    html += '<div class="tasks-chapter">';
    html += `<div class="tasks-chapter-header" onclick="toggleTasksChapter(this)">
      <span class="tasks-chapter-toggle">▾</span>
      <span>${ch.num ? escapeHTML(ch.num) + ' — ' : ''}${escapeHTML(ch.title)}</span>
      <span class="tasks-chapter-count">${solvedCount}/${ch.tasks.length}</span>
    </div>`;
    html += '<div class="tasks-task-list">';
    for (const task of ch.tasks) {
      const isActive = task.id === tasksActiveId;
      const isSolved = task.solved;
      const hasRef = task.solutionSQL !== null;
      html += `<div class="tasks-task${isActive ? ' active' : ''}${isSolved ? ' solved' : ''}" data-taskid="${task.id}" onclick="selectTask(${task.id})">`;
      html += `<span class="tasks-task-num">${task.num}.</span>`;
      html += `<span class="tasks-task-text">${escapeHTML(task.text)}${hasRef ? ' <span style="color:var(--yellow);font-size:9px" title="Má vzorový výsledek — auto-check aktivní">⚡</span>' : ''}</span>`;
      html += `<span class="tasks-task-check" onclick="event.stopPropagation();toggleTaskSolved(${task.id})">${isSolved ? '✓' : ''}</span>`;
      html += '</div>';
    }
    html += '</div></div>';
  }

  body.innerHTML = html;

  // Footer progress
  const solved = tasksData.filter(t => t.solved).length;
  const total = tasksData.length;
  document.getElementById('tasksProgressLabel').textContent = `${solved} / ${total} splněno`;
  document.getElementById('tasksProgressFill').style.width = (total > 0 ? solved / total * 100 : 0) + '%';
  footer.style.display = '';
}

export function toggleTasksChapter(headerEl) {
  headerEl.closest('.tasks-chapter').classList.toggle('collapsed');
}

export function selectTask(id) {
  tasksActiveId = id;
  renderTasksPanel();
  // Scroll selected into view
  setTimeout(() => {
    const el = document.querySelector(`.tasks-task[data-taskid="${id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 30);
}

export function toggleTaskSolved(id) {
  const task = tasksData.find(t => t.id === id);
  if (!task) return;
  task.solved = !task.solved;
  if (!task.solved) task.autoChecked = false;
  renderTasksPanel();
}

function clearTaskSolution(id) {
  const task = tasksData.find(t => t.id === id);
  if (!task) return;
  task.solutionSQL = null;
  task.solved = false;
  task.autoChecked = false;
  renderTasksPanel();
}

// --- Default tasks ---

// Default tasks — automaticky načtené při startu
const DEFAULT_TASKS_TEXT = `4.2\tKlauzule WHERE
10.\tPopisy úkolů, které byly přiděleny pracovníkovi č. 1. | SELECT popis FROM ukoly WHERE os_cis = 1;
11.\tV kterém oddělení a jako co pracuje pracovník se jménem STRNAD. | SELECT cis_odd, fce FROM zam WHERE jmeno = 'STRNAD';
12.\tJména a platy zaměstnanců, kteří mají titul. | SELECT jmeno, plat FROM zam WHERE titul IS NOT NULL;
13.\tJména a platy zaměstnanců, kteří nemají titul. | SELECT jmeno, plat FROM zam WHERE titul IS NULL;
14.\tJakou funkci zastávají zaměstnanci s příjmením končícím na OVA. | SELECT fce FROM zam WHERE jmeno LIKE '%OVA';
15.\tJména zaměstnanců z oddělení 2, 4, 6, 8, 10. | SELECT jmeno FROM zam WHERE cis_odd IN (2,4,6,8,10);
16.\tJména zaměstnanců ze 3. oddělení s platem nad 6000. | SELECT jmeno FROM zam WHERE cis_odd = 3 AND plat > 6000;
17.\tPřehled všech zaměstnanců, kteří nezastávají funkci BOSS. | SELECT jmeno FROM zam WHERE fce <> 'BOSS';
18.\tJména zaměstnanců s titulem ING ze 2. nebo 6. oddělení. | SELECT jmeno FROM zam WHERE titul = 'ING' AND cis_odd IN (2,6);
19.\tJména a funkce zaměstnanců s platem v rozmezí 9000 až 12000 Kč. | SELECT jmeno, fce FROM zam WHERE plat BETWEEN 9000 AND 12000;
20.\tČísla pracovníků, kterým byl přidělen úkol související s programem. | SELECT os_cis FROM ukoly WHERE popis LIKE '%PROGRAM%';
21.\tJména zaměstnanců, jejichž roční plat po 10% valorizaci bude vyšší než 90000. | SELECT jmeno FROM zam WHERE plat * 12 * 1.1 > 90000;
4.8\tSelf JOIN
69.\tJména zaměstnanců s názvem oddělení a jménem vedoucího oddělení. | SELECT z.jmeno, o.nazev, s.jmeno AS vedouci FROM zam z JOIN oddel o ON z.cis_odd = o.cis_odd JOIN zam s ON o.sef = s.os_cis;
70.\tJména zaměstnanců se jménem bezprostředně nadřízeného. | SELECT z.jmeno, n.jmeno AS nadrizeny FROM zam z JOIN zam n ON z.nadr = n.os_cis;
71.\tJména zaměstnanců se jménem bezprostředně nadřízeného a jménem vedoucího oddělení. | SELECT z.jmeno, n.jmeno AS nadrizeny, s.jmeno AS vedouci FROM zam z JOIN zam n ON z.nadr = n.os_cis JOIN oddel o ON z.cis_odd = o.cis_odd JOIN zam s ON o.sef = s.os_cis;
72.\tPočty inženýrů v jednotlivých odděleních (název oddělení, jméno vedoucího). | SELECT o.nazev, s.jmeno AS vedouci, COUNT(*) AS pocet FROM zam z JOIN oddel o ON z.cis_odd = o.cis_odd JOIN zam s ON o.sef = s.os_cis WHERE z.titul = 'ING' GROUP BY o.nazev, s.jmeno;
73.\tJména zaměstnanců s platem vyšším než má jejich bezprostředně nadřízený. | SELECT z.jmeno FROM zam z JOIN zam n ON z.nadr = n.os_cis WHERE z.plat > n.plat;
74.\tJména zaměstnanců s platem stejným jako má zaměstnanec DLOUHY. | SELECT jmeno FROM zam WHERE plat = (SELECT plat FROM zam WHERE jmeno = 'DLOUHY');
75.\tJména vedoucích jednotlivých oddělení s názvem a počtem pracovníků v oddělení. | SELECT s.jmeno AS vedouci, o.nazev, COUNT(z.os_cis) AS pocet FROM oddel o JOIN zam s ON o.sef = s.os_cis JOIN zam z ON z.cis_odd = o.cis_odd GROUP BY s.jmeno, o.nazev;
76.\tPřehled funkcí vykonávaných v jednotlivých odděleních s počtem zaměstnanců. | SELECT cis_odd, fce, COUNT(*) AS pocet FROM zam GROUP BY cis_odd, fce;
77.\tJména vedoucích jednotlivých oddělení s počty pracovníků vykonávajícími jednotlivé funkce. | SELECT s.jmeno AS vedouci, z.fce, COUNT(*) AS pocet FROM oddel o JOIN zam s ON o.sef = s.os_cis JOIN zam z ON z.cis_odd = o.cis_odd GROUP BY s.jmeno, z.fce;
78.\tPočty zaměstnanců bezprostředně podřízených jednotlivým zaměstnancům. | SELECT n.jmeno, COUNT(*) AS pocet FROM zam z JOIN zam n ON z.nadr = n.os_cis GROUP BY n.jmeno;
79.\tKteří vedoucí (číslo, jméno) šéfují oddělení s alespoň 4 zaměstnanci. | SELECT s.os_cis, s.jmeno FROM oddel o JOIN zam s ON o.sef = s.os_cis JOIN zam z ON z.cis_odd = o.cis_odd GROUP BY s.os_cis, s.jmeno HAVING COUNT(*) >= 4;
4.9\tVnořené dotazy
80.\tOddělení se stejným počtem zaměstnanců jako oddělení PROJEKCE. | SELECT cis_odd FROM zam GROUP BY cis_odd HAVING COUNT(*) = (SELECT COUNT(*) FROM zam z JOIN oddel o ON z.cis_odd = o.cis_odd WHERE o.nazev = 'PROJEKCE');
81.\tJména zaměstnanců s platem menším než průměrný plat. | SELECT jmeno FROM zam WHERE plat < (SELECT AVG(plat) FROM zam);
82.\tČíslo a jméno zaměstnance s nejmenším platem. | SELECT os_cis, jmeno FROM zam WHERE plat = (SELECT MIN(plat) FROM zam);
83.\tPočet zaměstnanců s platem menším než průměrný plat. | SELECT COUNT(*) FROM zam WHERE plat < (SELECT AVG(plat) FROM zam);
84.\tPočet inženýrů s platem menším než průměrný plat všech inženýrů. | SELECT COUNT(*) FROM zam WHERE titul = 'ING' AND plat < (SELECT AVG(plat) FROM zam WHERE titul = 'ING');
85.\tVe kterém oddělení nepracuje žádný inženýr. | SELECT cis_odd FROM oddel WHERE cis_odd NOT IN (SELECT cis_odd FROM zam WHERE titul = 'ING');
86.\tSeznam všech oddělení (číslo a název) s počty zaměstnanců včetně nulových. | SELECT o.cis_odd, o.nazev, COUNT(z.os_cis) AS pocet FROM oddel o LEFT JOIN zam z ON o.cis_odd = z.cis_odd GROUP BY o.cis_odd, o.nazev;
87.\tOddělení (číslo a název), ve kterých nepracuje nikdo bez titulu. | SELECT o.cis_odd, o.nazev FROM oddel o JOIN zam z ON o.cis_odd = z.cis_odd GROUP BY o.cis_odd, o.nazev HAVING SUM(CASE WHEN z.titul IS NULL THEN 1 ELSE 0 END) = 0;
88.\tOddělení (číslo a název), ve kterých pracuje více inženýrů než zaměstnanců bez titulu. | SELECT o.cis_odd, o.nazev FROM oddel o JOIN zam z ON o.cis_odd = z.cis_odd GROUP BY o.cis_odd, o.nazev HAVING SUM(CASE WHEN z.titul = 'ING' THEN 1 ELSE 0 END) > SUM(CASE WHEN z.titul IS NULL THEN 1 ELSE 0 END);
89.\tSeznam všech zaměstnanců (osobní číslo a jméno) s počtem přidělených úkolů. | SELECT z.os_cis, z.jmeno, COUNT(u.cis_uk) AS pocet FROM zam z LEFT JOIN ukoly u ON z.os_cis = u.os_cis GROUP BY z.os_cis, z.jmeno;
4.10\tTestovací dotazy
90.\tČísla oddělení, ve kterých pracují nějací zaměstnanci. | SELECT DISTINCT cis_odd FROM zam;
91.\tČísla oddělení, ve kterých pracují inženýři. | SELECT DISTINCT cis_odd FROM zam WHERE titul = 'ING';
92.\tČísla a názvy oddělení, ve kterých pracují inženýři. | SELECT DISTINCT o.cis_odd, o.nazev FROM oddel o JOIN zam z ON o.cis_odd = z.cis_odd WHERE z.titul = 'ING';
93.\tČísla a názvy oddělení, ve kterých nepracuje žádný inženýr. | SELECT o.cis_odd, o.nazev FROM oddel o WHERE o.cis_odd NOT IN (SELECT cis_odd FROM zam WHERE titul = 'ING');
94.\tČísla zaměstnanců, kteří mají podřízené. | SELECT DISTINCT nadr FROM zam WHERE nadr IS NOT NULL;
95.\tČísla a jména zaměstnanců, kteří mají podřízené. | SELECT DISTINCT n.os_cis, n.jmeno FROM zam z JOIN zam n ON z.nadr = n.os_cis;
96.\tPrůměrný plat za všechny zaměstnance. | SELECT AVG(plat) FROM zam;
97.\tČísla a jména zaměstnanců s platem větším než průměrný plat. | SELECT os_cis, jmeno FROM zam WHERE plat > (SELECT AVG(plat) FROM zam);
98.\tČísla a jména zaměstnanců s platem větším než průměrný plat v jejich oddělení. | SELECT z.os_cis, z.jmeno FROM zam z WHERE z.plat > (SELECT AVG(plat) FROM zam WHERE cis_odd = z.cis_odd);
99.\tČísla a jména zaměstnanců, kteří mají přidělený úkol. | SELECT DISTINCT z.os_cis, z.jmeno FROM zam z JOIN ukoly u ON z.os_cis = u.os_cis;
100.\tČísla a jména zaměstnanců, kteří nemají přidělený žádný úkol. | SELECT os_cis, jmeno FROM zam WHERE os_cis NOT IN (SELECT os_cis FROM ukoly);
101.\tČísla a popisy úkolů, které neřeší vedoucí oddělení. | SELECT cis_uk, popis FROM ukoly WHERE os_cis NOT IN (SELECT sef FROM oddel WHERE sef IS NOT NULL);
102.\tPro každé oddělení počet zaměstnanců bez titulu a počet těch, kteří neřeší žádný úkol. | SELECT z.cis_odd, SUM(CASE WHEN z.titul IS NULL THEN 1 ELSE 0 END) AS bez_titulu, SUM(CASE WHEN z.os_cis NOT IN (SELECT os_cis FROM ukoly) THEN 1 ELSE 0 END) AS bez_ukolu FROM zam z GROUP BY z.cis_odd;
103.\tPro všechna oddělení počty zaměstnanců a počty těch, kteří mají přidělený úkol. | SELECT z.cis_odd, COUNT(DISTINCT z.os_cis) AS zamestnanci, COUNT(DISTINCT u.os_cis) AS s_ukolem FROM zam z LEFT JOIN ukoly u ON z.os_cis = u.os_cis GROUP BY z.cis_odd;
104.\tPro všechna oddělení počty zaměstnanců a počty řešených úkolů. | SELECT z.cis_odd, COUNT(DISTINCT z.os_cis) AS zamestnanci, COUNT(u.cis_uk) AS ukoly FROM zam z LEFT JOIN ukoly u ON z.os_cis = u.os_cis GROUP BY z.cis_odd;`;

// --- Init / load defaults ---

export function loadDefaultTasks() {
  suppressOpen = true;
  parseAndLoadTasks(DEFAULT_TASKS_TEXT);
  suppressOpen = false;
  // Close panel if it opened
  const panel = document.getElementById('tasksPanel');
  if (panel.classList.contains('open')) {
    panel.classList.remove('open');
    document.getElementById('tasksOverlay').classList.remove('show');
    document.getElementById('btnTasks').classList.remove('active');
  }
}

export function initTasks() {
  loadDefaultTasks();
}
