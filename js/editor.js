// ============================================================
// editor.js — SQL editor, syntax highlighting, challenges,
//             dictionary, examples, resize, fullscreen
// ============================================================

import { tokenize, escapeHTML, executeSQLite, isJoinCtx, AGG_FN, SCALAR_FN, WHERE_KW } from './engine.js';
import { updateDataFlow, stopAutoplay, updatePipeline, drawJoinLines, clearDfAnimTimers, timelineState } from './visualizer/index.js';
import { autoCheckTasksWithResult } from './tasks.js';

// ---- DOM refs (set in initEditor) ----
let textarea = null;
let highlight = null;
let lineNumbers = null;
let clauseWarningEl = null;

// ---- Animation state ----
let isAnimating = false;
let skipAnimation = false;
let animStartTime = 0;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// SYNTAX HIGHLIGHTING
// ============================================================

export function highlightSQL(sql) {
  const tokens = tokenize(sql);
  let html = '', clause = '', parenDepth = 0, subqueryStack = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i], esc = escapeHTML(t.value);
    if (t.type === 'comment_line' || t.type === 'comment_block') { html += `<span class="syn-comment">${esc}</span>`; continue; }
    if (t.type === 'string' || t.type === 'dqstring') { html += `<span class="syn-string">${esc}</span>`; continue; }
    if (t.type === 'number') { html += `<span class="syn-number">${esc}</span>`; continue; }
    if (t.type === 'ws') { html += esc; continue; }
    if (t.type === 'comma') { html += `<span class="syn-comma">${esc}</span>`; continue; }
    if (t.type === 'dot') { html += `<span class="syn-dot">${esc}</span>`; continue; }
    if (t.type === 'paren_open') {
      parenDepth++;
      let j = i + 1; while (j < tokens.length && tokens[j].type === 'ws') j++;
      if (j < tokens.length && tokens[j].type === 'word' && tokens[j].value.toUpperCase() === 'SELECT') subqueryStack.push(clause);
      html += `<span class="syn-paren">${esc}</span>`; continue;
    }
    if (t.type === 'paren_close') {
      parenDepth--;
      if (subqueryStack.length > 0 && parenDepth < subqueryStack.length) clause = subqueryStack.pop() || '';
      html += `<span class="syn-paren">${esc}</span>`; continue;
    }
    if (t.type === 'concat' || t.type === 'op') { html += `<span class="syn-operator">${esc}</span>`; continue; }
    if (t.type === 'star') { html += `<span class="syn-star">${esc}</span>`; continue; }
    if (t.type === 'word') {
      const w = t.value.toUpperCase();
      if (w === 'SELECT' || w === 'DISTINCT') { clause = 'select'; html += `<span class="syn-select">${esc}</span>`; continue; }
      if (w === 'FROM') { clause = 'from'; html += `<span class="syn-from">${esc}</span>`; continue; }
      if (w === 'WHERE') { clause = 'where'; html += `<span class="syn-where">${esc}</span>`; continue; }
      if ((w === 'JOIN' || w === 'INNER' || w === 'LEFT' || w === 'RIGHT' || w === 'FULL' || w === 'CROSS' || w === 'NATURAL') && isJoinCtx(tokens, i)) { clause = 'join'; html += `<span class="syn-join">${esc}</span>`; continue; }
      if (w === 'ON' || w === 'USING') { clause = 'join'; html += `<span class="syn-join">${esc}</span>`; continue; }
      if (w === 'GROUP') { clause = 'group'; html += `<span class="syn-group">${esc}</span>`; continue; }
      if (w === 'HAVING') { clause = 'having'; html += `<span class="syn-having">${esc}</span>`; continue; }
      if (w === 'ORDER') { clause = 'order'; html += `<span class="syn-order">${esc}</span>`; continue; }
      if (w === 'BY' && (clause === 'group' || clause === 'order')) { html += `<span class="${clause === 'group' ? 'syn-group' : 'syn-order'}">${esc}</span>`; continue; }
      if (AGG_FN.has(w)) { html += `<span class="syn-agg">${esc}</span>`; continue; }
      if (SCALAR_FN.has(w)) { html += `<span class="syn-agg">${esc}</span>`; continue; }
      if (WHERE_KW.has(w) && (clause === 'where' || clause === 'having')) { html += `<span class="${clause === 'having' ? 'syn-having' : 'syn-where'}">${esc}</span>`; continue; }
      if (w === 'ASC' || w === 'DESC') { html += `<span class="syn-order">${esc}</span>`; continue; }
      if (w === 'AS') { html += `<span class="syn-alias">${esc}</span>`; continue; }
      if (w === 'CASE' || w === 'WHEN' || w === 'THEN' || w === 'ELSE' || w === 'END') { html += `<span class="syn-agg">${esc}</span>`; continue; }
      if (w === 'UNION' || w === 'INTERSECT' || w === 'MINUS') { html += `<span class="syn-select">${esc}</span>`; continue; }
      if (w === 'ALL' && i > 0 && tokens[i-1].type === 'word' && tokens[i-1].value.toUpperCase() === 'UNION') { html += `<span class="syn-select">${esc}</span>`; continue; }
      if (w === 'ROWNUM') { html += `<span class="syn-agg">${esc}</span>`; continue; }
      html += esc; continue;
    }
    html += esc;
  }
  return html;
}

// ============================================================
// CLAUSE ORDER DETECTION
// ============================================================

const CLAUSE_ORDER = ['SELECT','FROM','JOIN','WHERE','GROUP BY','HAVING','ORDER BY'];

function checkClauseOrder(sql) {
  if (!sql || !sql.trim()) { clauseWarningEl.classList.remove('visible'); clauseWarningEl.innerHTML = ''; return; }
  // Strip string literals and comments to avoid false positives
  const cleaned = sql.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""').replace(/--[^\n]*/g, '');
  // Find positions of each clause (top-level only — skip subqueries in parens)
  const found = [];
  let depth = 0;
  const upper = cleaned.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    if (upper[i] === '(') { depth++; continue; }
    if (upper[i] === ')') { depth--; continue; }
    if (depth > 0) continue;
    for (const clause of CLAUSE_ORDER) {
      if (upper.startsWith(clause, i)) {
        const before = i === 0 || /\s/.test(upper[i - 1]);
        const after = i + clause.length >= upper.length || /[\s(]/.test(upper[i + clause.length]);
        if (before && after) {
          // For JOIN variants (LEFT JOIN, INNER JOIN etc.) — treat as JOIN
          const label = clause === 'JOIN' ? 'JOIN' : clause;
          if (label === 'JOIN' && found.some(f => f.clause === 'JOIN')) continue; // skip duplicate JOINs
          found.push({ clause: label, pos: i });
        }
      }
    }
  }
  // Check order violations
  const warnings = [];
  const orderMap = {};
  CLAUSE_ORDER.forEach((c, idx) => orderMap[c] = idx);
  const hasGroupBy = found.some(f => f.clause === 'GROUP BY');

  for (let i = 1; i < found.length; i++) {
    const prev = found[i - 1], curr = found[i];
    if (orderMap[curr.clause] < orderMap[prev.clause]) {
      warnings.push(`\u26a0\ufe0f ${curr.clause} mus\u00ed b\u00fdt p\u0159ed ${prev.clause} \u2014 spr\u00e1vn\u00e9 po\u0159ad\u00ed: SELECT \u2192 FROM \u2192 JOIN \u2192 WHERE \u2192 GROUP BY \u2192 HAVING \u2192 ORDER BY`);
    }
  }
  // HAVING without GROUP BY
  if (found.some(f => f.clause === 'HAVING') && !hasGroupBy) {
    warnings.push('\u26a0\ufe0f HAVING vy\u017eaduje GROUP BY \u2014 nelze filtrovat skupiny bez seskupen\u00ed');
  }
  // SELECT not first
  if (found.length > 0 && found[0].clause !== 'SELECT') {
    warnings.push('\u26a0\ufe0f SELECT mus\u00ed b\u00fdt na za\u010d\u00e1tku dotazu');
  }

  if (warnings.length > 0) {
    clauseWarningEl.innerHTML = warnings.map(w => `<span>${w}</span>`).join('');
    clauseWarningEl.classList.add('visible');
  } else {
    clauseWarningEl.classList.remove('visible');
    clauseWarningEl.innerHTML = '';
  }
}

// ============================================================
// EDITOR UPDATE
// ============================================================

let clauseCheckTimer = null;

export function updateEditor() {
  const fullSql = textarea.value;
  highlight.innerHTML = highlightSQL(fullSql) + '\n';
  // Line numbers
  const lines = fullSql.split('\n').length;
  let ln = '';
  for (let i = 1; i <= lines; i++) ln += i + '\n';
  lineNumbers.textContent = ln;
  // Pipeline + data flow use only the current statement (not full textarea)
  const currentSql = getStatementAtCursor().sql;
  updatePipeline(currentSql);
  if (!isAnimating) updateDataFlow(currentSql);
  // Debounced clause order check
  clearTimeout(clauseCheckTimer);
  clauseCheckTimer = setTimeout(() => checkClauseOrder(currentSql), 500);
}

// ============================================================
// GET STATEMENT AT CURSOR
// ============================================================

export function getStatementAtCursor() {
  const text = textarea.value;
  const cursor = textarea.selectionStart;
  const statements = [];
  let start = 0, inStr = false, strChar = '';
  for (let i = 0; i <= text.length; i++) {
    const ch = text[i];
    if (inStr) { if (ch === strChar) inStr = false; continue; }
    if (ch === "'" || ch === '"') { inStr = true; strChar = ch; continue; }
    if (ch === ';' || i === text.length) {
      const stmt = text.substring(start, i).trim();
      // end includes ';' plus any trailing whitespace/newlines
      let endPos = (ch === ';') ? i + 1 : i;
      while (endPos < text.length && /[\s]/.test(text[endPos])) endPos++;
      if (stmt) statements.push({ sql: stmt, displaySql: stmt + (ch === ';' ? ';' : ''), start, end: endPos });
      start = endPos;
    }
  }
  for (const s of statements) {
    if (cursor >= s.start && cursor < s.end) return s;
    // Cursor exactly at end (after ';') — still belongs to this statement
    if (cursor === s.end) return s;
  }
  if (statements.length > 0) return statements[statements.length - 1];
  return { sql: text.trim(), displaySql: text.trim(), start: 0, end: text.length };
}

// ============================================================
// QUERY EXECUTION
// ============================================================

export async function executeQuery() {
  const stmt = getStatementAtCursor();
  const sql = stmt.sql;
  if (!sql) return;
  if (isAnimating) { skipAnimation = true; return; }
  const ts = timelineState();
  ts.animatedSteps = new Set(); clearDfAnimTimers();
  const wrap = document.getElementById('resultsWrap');
  const status = document.getElementById('resultsStatus');
  wrap.innerHTML = '<div class="results-empty" style="color:var(--text3)">Vykon\u00e1v\u00e1m dotaz\u2026</div>';
  status.innerHTML = '';

  // Keep text before and after the selected statement
  const fullText = textarea.value;
  const prefix = fullText.substring(0, stmt.start);
  const suffix = fullText.substring(stmt.end);
  const animText = stmt.displaySql;
  const sep = suffix.trim() ? '\n\n' : '';

  // Typing animation
  isAnimating = true; skipAnimation = false; animStartTime = Date.now();
  stopAutoplay(); ts.timelineSteps = [];
  textarea.value = prefix + sep + suffix; updateEditor();
  textarea.readOnly = true; textarea.style.caretColor = 'transparent';
  for (let i = 0; i < animText.length; i++) {
    if (skipAnimation) break;
    textarea.value = prefix + animText.substring(0, i + 1) + sep + suffix;
    updateEditor();
    await sleep(/\s/.test(animText[i]) ? 8 : 18);
  }
  textarea.value = prefix + animText + sep + suffix;
  // Place cursor inside the animated statement so getStatementAtCursor finds it
  const cursorPos = prefix.length + animText.length;
  textarea.selectionStart = textarea.selectionEnd = cursorPos;
  textarea.readOnly = false; textarea.style.caretColor = '';
  isAnimating = false; skipAnimation = false;
  updateEditor();

  // Execute
  const t0 = performance.now();
  try {
    const result = executeSQLite(sql);
    const ms = Math.round(performance.now() - t0);
    if (result.rows.length === 0) {
      let html = '<table class="results-table"><thead><tr>';
      for (const c of result.columns) html += `<th>${escapeHTML(c)}</th>`;
      html += '</tr></thead></table><div class="results-empty" style="border-top:none;padding-top:8px">Dotaz vr\u00e1til 0 \u0159\u00e1dk\u016f</div>';
      wrap.innerHTML = html;
      status.innerHTML = `<span>0 \u0159\u00e1dk\u016f</span><span>${result.columns.length} sl.</span><span>${ms} ms</span>`;
    } else {
      let html = '<table class="results-table"><thead><tr>';
      for (const c of result.columns) html += `<th>${escapeHTML(c)}</th>`;
      html += '</tr></thead><tbody>';
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows[i];
        html += `<tr class="row-animate" style="animation-delay:${i*25}ms">`;
        for (const c of result.columns) {
          const v = row[c];
          if (v === null || v === undefined) html += '<td class="cell-null">NULL</td>';
          else if (typeof v === 'number') html += `<td class="cell-number">${v}</td>`;
          else html += `<td class="cell-string">${escapeHTML(String(v))}</td>`;
        }
        html += '</tr>';
      }
      html += '</tbody></table>';
      wrap.innerHTML = html;
      status.innerHTML = `<span>${result.rows.length} \u0159\u00e1dk\u016f</span><span>${result.columns.length} sl.</span><span>${ms} ms</span>`;
    }
  } catch (err) {
    const ms = Math.round(performance.now() - t0);
    wrap.innerHTML = `<div class="results-error">Chyba: ${escapeHTML(err.message)}</div>`;
    status.innerHTML = `<span style="color:var(--red)">Chyba</span><span>${ms} ms</span>`;
  }
  checkChallenge();
  // Auto-check tasks if panel has solutions loaded
  try {
    const res2 = executeSQLite(sql);
    autoCheckTasksWithResult(res2);
  } catch(e) {}
}

export function executeInstant(sql) {
  if (isAnimating) { skipAnimation = true; }
  const ts = timelineState();
  stopAutoplay(); ts.timelineSteps = []; ts.animatedSteps = new Set(); clearDfAnimTimers();
  textarea.value = sql;
  updateEditor(); // pipeline + data flow (sets timelineSteps, slider to max)

  // Execute and show results
  const wrap = document.getElementById('resultsWrap');
  const status = document.getElementById('resultsStatus');
  const t0 = performance.now();
  try {
    const result = executeSQLite(sql);
    const ms = Math.round(performance.now() - t0);
    if (result.rows.length === 0) {
      let html = '<table class="results-table"><thead><tr>';
      for (const c of result.columns) html += `<th>${escapeHTML(c)}</th>`;
      html += '</tr></thead></table><div class="results-empty" style="border-top:none;padding-top:8px">Dotaz vr\u00e1til 0 \u0159\u00e1dk\u016f</div>';
      wrap.innerHTML = html;
      status.innerHTML = `<span>0 \u0159\u00e1dk\u016f</span><span>${result.columns.length} sl.</span><span>${ms} ms</span>`;
    }
    else {
      let html = '<table class="results-table"><thead><tr>';
      for (const c of result.columns) html += `<th>${escapeHTML(c)}</th>`;
      html += '</tr></thead><tbody>';
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows[i];
        html += '<tr>';
        for (const c of result.columns) {
          const v = row[c];
          if (v === null || v === undefined) html += '<td class="cell-null">NULL</td>';
          else if (typeof v === 'number') html += `<td class="cell-number">${v}</td>`;
          else html += `<td class="cell-string">${escapeHTML(String(v))}</td>`;
        }
        html += '</tr>';
      }
      html += '</tbody></table>';
      wrap.innerHTML = html;
      status.innerHTML = `<span>${result.rows.length} \u0159\u00e1dk\u016f</span><span>${result.columns.length} sl.</span><span>${ms} ms</span>`;
    }
  } catch (err) {
    wrap.innerHTML = `<div class="results-error">Chyba: ${escapeHTML(err.message)}</div>`;
    status.innerHTML = `<span style="color:var(--red)">Chyba</span>`;
    checkChallenge();
    return;
  }
  checkChallenge();
  // Auto-check tasks
  try { autoCheckTasksWithResult(executeSQLite(sql)); } catch(e) {}
}

// ============================================================
// CHALLENGE MODE
// ============================================================

const CHALLENGES = [
  {
    id: 1, title: 'Z\u00e1kladn\u00ed filtr',
    from: 'Pavel K\u0159\u00ed\u017e, CFO',
    text: 'Pot\u0159ebuji seznam v\u0161ech zam\u011bstnanc\u016f s platem nad 10 000 K\u010d. V\u00fdstup: sloupce JMENO, FCE, PLAT. Se\u0159a\u010f od nejvy\u0161\u0161\u00edho platu.',
    hint: 'SELECT + WHERE + ORDER BY',
    solution: "SELECT jmeno, fce, plat FROM zam WHERE plat > 10000 ORDER BY plat DESC"
  },
  {
    id: 2, title: 'JOIN report',
    from: 'Martina Hor\u00e1kov\u00e1, HR',
    text: 'P\u0159iprav report zam\u011bstnanc\u016f z odd\u011blen\u00ed PROGRAMOVANI s titulem ING. Pot\u0159ebuji sloupce: JMENO, PLAT a NAZEV odd\u011blen\u00ed (tabulka ODDEL).',
    hint: 'JOIN + WHERE',
    solution: "SELECT jmeno, plat, nazev FROM zam JOIN oddel USING (cis_odd) WHERE nazev = 'PROGRAMOVANI' AND titul = 'ING'"
  },
  {
    id: 3, title: 'Agregace',
    from: 'Tom\u00e1\u0161 Bene\u0161, Operations',
    text: 'Kolik zam\u011bstnanc\u016f m\u00e1 ka\u017ed\u00e9 odd\u011blen\u00ed? Zobraz CIS_ODD a po\u010det. Se\u0159a\u010f sestupn\u011b podle po\u010dtu.',
    hint: 'GROUP BY + COUNT + ORDER BY',
    solution: "SELECT cis_odd, COUNT(*) AS pocet FROM zam GROUP BY cis_odd ORDER BY pocet DESC"
  },
  {
    id: 4, title: 'HAVING filtr',
    from: 'Lucie Dvo\u0159\u00e1kov\u00e1, CEO',
    text: 'Kter\u00e1 odd\u011blen\u00ed maj\u00ed pr\u016fm\u011brn\u00fd plat nad 9000 K\u010d? Zobraz NAZEV odd\u011blen\u00ed a pr\u016fm\u011brn\u00fd plat zaokrouhlen\u00fd na cel\u00e1 \u010d\u00edsla.',
    hint: 'JOIN + GROUP BY + HAVING + ROUND',
    solution: "SELECT nazev, ROUND(AVG(plat), 0) AS prumer FROM oddel JOIN zam USING (cis_odd) GROUP BY nazev HAVING AVG(plat) > 9000"
  },
  {
    id: 5, title: 'CASE kategorizace',
    from: 'Jana Nov\u00e1kov\u00e1, HR Manager',
    text: 'Veden\u00ed pot\u0159ebuje p\u0159ehled zam\u011bstnanc\u016f s kategorizac\u00ed plat\u016f: nad 12000 = \'vysoka\', nad 8000 = \'stredni\', zbytek = \'nizka\'. Zobraz JMENO, PLAT a kategorii.',
    hint: 'CASE WHEN + THEN + ELSE',
    solution: "SELECT jmeno, plat, CASE WHEN plat >= 12000 THEN 'vysoka' WHEN plat >= 8000 THEN 'stredni' ELSE 'nizka' END AS kategorie FROM zam"
  },
  {
    id: 6, title: 'Vno\u0159en\u00fd dotaz',
    from: 'Karel Svoboda, Analytik',
    text: 'Kte\u0159\u00ed zam\u011bstnanci maj\u00ed plat vy\u0161\u0161\u00ed ne\u017e pr\u016fm\u011br cel\u00e9 firmy? Zobraz JMENO a PLAT.',
    hint: 'SELECT + WHERE + vno\u0159en\u00fd SELECT',
    solution: "SELECT jmeno, plat FROM zam WHERE plat > (SELECT AVG(plat) FROM zam)"
  }
];

let activeChallengeIdx = -1;
const challengeSolved = new Set();

function toggleChallenge() {
  const panel = document.getElementById('challengePanel');
  const btn = document.getElementById('btnChallenge');
  if (!btn) return;
  if (panel.style.display === 'none') {
    if (activeChallengeIdx < 0) activeChallengeIdx = 0;
    loadChallenge(activeChallengeIdx);
    panel.style.display = '';
    btn.classList.add('active');
  } else {
    closeChallenge();
  }
}

function closeChallenge() {
  document.getElementById('challengePanel').style.display = 'none';
  const chBtn = document.getElementById('btnChallenge'); if (chBtn) chBtn.classList.remove('active');
  activeChallengeIdx = -1;
  document.getElementById('challengeResult').style.display = 'none';
}

function loadChallenge(idx) {
  const ch = CHALLENGES[idx];
  activeChallengeIdx = idx;
  document.getElementById('challengeTag').textContent = 'CHALLENGE #' + ch.id;
  document.getElementById('challengeFrom').textContent = 'Od: ' + ch.from;
  document.getElementById('challengeBody').textContent = ch.text;
  document.getElementById('challengeHint').textContent = 'N\u00e1pov\u011bda: ' + ch.hint;
  document.getElementById('challengeCounter').innerHTML =
    (idx + 1) + ' / ' + CHALLENGES.length + (challengeSolved.has(idx) ? '<span class="challenge-done"> \u2713</span>' : '');
  document.getElementById('chPrev').disabled = idx === 0;
  document.getElementById('chNext').disabled = idx === CHALLENGES.length - 1;
  document.getElementById('challengeResult').style.display = 'none';
}

function prevChallenge() { if (activeChallengeIdx > 0) loadChallenge(activeChallengeIdx - 1); }
function nextChallenge() { if (activeChallengeIdx < CHALLENGES.length - 1) loadChallenge(activeChallengeIdx + 1); }

export function compareResults(exp, act) {
  // exp can be either a result object {rows, columns} or precomputed {data: [[...],...]
  // Positional comparison — ignores column names, only values matter
  // This means JOIN and subquery solutions both pass if they return same data
  if (exp.rows.length !== act.rows.length) return false;
  if (exp.columns.length !== act.columns.length) return false;
  // Normalize: sort rows, uppercase strings, null->''
  const normRow = (row, cols) =>
    cols.map(c => { const v = row[c]; return v === null || v === undefined ? '' : String(v).toUpperCase().trim(); });
  const normData = (rows, cols) =>
    rows.map(r => normRow(r, cols)).sort((a, b) => a.join('\x00').localeCompare(b.join('\x00')));
  const eNorm = normData(exp.rows, exp.columns);
  const aNorm = normData(act.rows, act.columns);
  for (let i = 0; i < eNorm.length; i++) {
    for (let j = 0; j < eNorm[i].length; j++) {
      if (eNorm[i][j] !== aNorm[i][j]) return false;
    }
  }
  return true;
}

// Compare student result against precomputed expected data (array of value arrays)
export function compareResultsWithData(expectedData, act) {
  // expectedData: [[val, val, ...], ...] — rows of values, order-independent
  if (expectedData.length !== act.rows.length) return false;
  if (expectedData.length === 0) return true;
  if (expectedData[0].length !== act.columns.length) return false;
  const norm = v => v === null || v === undefined ? '' : String(v).toUpperCase().trim();
  const sortKey = row => row.map(norm).join('\x00');
  const expSorted = expectedData.map(row => row.map(norm)).sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  const actSorted = act.rows.map(r => act.columns.map(c => norm(r[c]))).sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  for (let i = 0; i < expSorted.length; i++) {
    for (let j = 0; j < expSorted[i].length; j++) {
      if (expSorted[i][j] !== actSorted[i][j]) return false;
    }
  }
  return true;
}

function checkChallenge() {
  if (activeChallengeIdx < 0 || !document.getElementById('btnChallenge')) return;
  const ch = CHALLENGES[activeChallengeIdx];
  const userSQL = getStatementAtCursor().sql;
  if (!userSQL) return;

  // Hide previous result before re-checking
  document.getElementById('challengeResult').style.display = 'none';

  let actual;
  try {
    actual = executeSQLite(userSQL);
  } catch (e) {
    // User's SQL has a syntax/execution error — don't show challenge fail,
    // the error is already visible in the results panel
    return;
  }

  try {
    const expected = executeSQLite(ch.solution);
    if (compareResults(expected, actual)) {
      showChallengeSuccess();
    } else {
      showChallengeFail();
    }
  } catch (e) {
    // Solution itself failed — shouldn't happen
  }
}

function showChallengeSuccess() {
  challengeSolved.add(activeChallengeIdx);
  const res = document.getElementById('challengeResult');
  res.className = 'challenge-result success';
  res.textContent = 'Challenge spln\u011bna! \u2713';
  res.style.display = '';
  // Update counter to show checkmark
  const idx = activeChallengeIdx;
  document.getElementById('challengeCounter').innerHTML =
    (idx + 1) + ' / ' + CHALLENGES.length + '<span class="challenge-done"> \u2713</span>';

  // Green flash
  const flash = document.createElement('div');
  flash.className = 'challenge-flash';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 700);

  // Confetti
  const colors = ['#3fb950', '#58a6ff', '#bc8cff', '#f778ba', '#d29922', '#ff7b72', '#79c0ff'];
  const count = document.documentElement.clientWidth <= 768 ? 15 : 30;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = (Math.random() * 0.5) + 's';
    piece.style.animationDuration = (1.2 + Math.random() * 1) + 's';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 2500);
  }
}

function showChallengeFail() {
  const res = document.getElementById('challengeResult');
  res.className = 'challenge-result fail';
  res.textContent = 'V\u00fdsledek nesed\u00ed, zkus to znovu';
  res.style.display = '';
}

// ============================================================
// SQL DICTIONARY
// ============================================================

const DICT_ENTRIES = [
  { kw: 'SELECT', tag: 'blue', desc: 'Vyb\u00edr\u00e1 sloupce k zobrazen\u00ed.', ex: 'SELECT jmeno, plat FROM zam;' },
  { kw: 'DISTINCT', tag: 'blue', desc: 'Odstran\u00ed duplicitn\u00ed \u0159\u00e1dky z v\u00fdsledku.', ex: 'SELECT DISTINCT cis_odd FROM zam;' },
  { kw: 'FROM', tag: 'green', desc: 'Ur\u010duje zdrojovou tabulku (nebo tabulky).', ex: 'SELECT * FROM zam;' },
  { kw: 'WHERE', tag: 'yellow', desc: 'Filtruje \u0159\u00e1dky podle podm\u00ednky. Vyhodnocuje se p\u0159ed agregac\u00ed.', ex: 'WHERE plat > 10000' },
  { kw: 'JOIN', tag: 'purple', desc: 'Propojuje dv\u011b tabulky p\u0159es spole\u010dn\u00fd kl\u00ed\u010d. Typy: INNER, LEFT, RIGHT, FULL, CROSS.', ex: 'JOIN oddel ON zam.cis_odd = oddel.cis_odd' },
  { kw: 'ON / USING', tag: 'purple', desc: 'Definuje podm\u00ednku propojen\u00ed tabulek. USING pro stejnojmenn\u00e9 sloupce.', ex: 'JOIN oddel USING (cis_odd)' },
  { kw: 'GROUP BY', tag: 'pink', desc: 'Seskupuje \u0159\u00e1dky se stejn\u00fdmi hodnotami pro pou\u017eit\u00ed agrega\u010dn\u00edch funkc\u00ed.', ex: 'GROUP BY cis_odd' },
  { kw: 'HAVING', tag: 'red', desc: 'Filtruje skupiny po agregaci. Pou\u017e\u00edv\u00e1 se s GROUP BY.', ex: 'HAVING COUNT(*) >= 2' },
  { kw: 'ORDER BY', tag: 'cyan', desc: '\u0158ad\u00ed v\u00fdsledek vzestupn\u011b (ASC) nebo sestupn\u011b (DESC).', ex: 'ORDER BY plat DESC' },
  { kw: 'AS', tag: 'blue', desc: 'P\u0159ejmenuje sloupec nebo tabulku (alias). Nepovinn\u00e9 slovo.', ex: 'SELECT jmeno AS zamestnanec' },
  { kw: 'COUNT()', tag: 'orange', desc: 'Po\u010d\u00edt\u00e1 \u0159\u00e1dky nebo nepr\u00e1zdn\u00e9 hodnoty ve skupin\u011b.', ex: 'SELECT COUNT(*) FROM zam;' },
  { kw: 'SUM() / AVG()', tag: 'orange', desc: 'SUM se\u010dte hodnoty, AVG vypo\u010d\u00edt\u00e1 pr\u016fm\u011br.', ex: 'SELECT AVG(plat) FROM zam;' },
  { kw: 'MIN() / MAX()', tag: 'orange', desc: 'Najde nejmen\u0161\u00ed / nejv\u011bt\u0161\u00ed hodnotu ve skupin\u011b.', ex: 'SELECT MAX(plat) FROM zam;' },
  { kw: 'IS NULL', tag: 'yellow', desc: 'Kontroluje, zda je hodnota pr\u00e1zdn\u00e1 (NULL). IS NOT NULL = nen\u00ed pr\u00e1zdn\u00e1.', ex: 'WHERE titul IS NOT NULL' },
  { kw: 'LIKE', tag: 'yellow', desc: 'Hled\u00e1 vzor v textu. % = libovoln\u00fd \u0159et\u011bzec, _ = jeden znak.', ex: "WHERE jmeno LIKE '%OVA'" },
  { kw: 'BETWEEN', tag: 'yellow', desc: 'Testuje, zda hodnota le\u017e\u00ed v rozsahu (v\u010detn\u011b krajn\u00edch hodnot).', ex: 'WHERE plat BETWEEN 8000 AND 12000' },
  { kw: 'IN', tag: 'yellow', desc: 'Testuje, zda hodnota odpov\u00edd\u00e1 n\u011bkter\u00e9 z vyjmenovan\u00fdch.', ex: "WHERE fce IN ('ANALYTIK', 'PROGRAMATOR')" },
  { kw: 'CASE WHEN', tag: 'orange', desc: 'Podm\u00edn\u011bn\u00fd v\u00fdraz \u2014 obdoba IF/ELSE v SQL.', ex: "CASE WHEN plat > 10000 THEN 'vysoky' ELSE 'nizky' END" },
  { kw: 'NVL()', tag: 'orange', desc: 'Nahrad\u00ed NULL zadanou hodnotou (Oracle funkce).', ex: "NVL(titul, 'bez titulu')" },
  { kw: 'ROUND()', tag: 'orange', desc: 'Zaokrouhl\u00ed \u010d\u00edslo na dan\u00fd po\u010det desetinn\u00fdch m\u00edst.', ex: 'ROUND(AVG(plat), 2)' },
  { kw: 'UNION', tag: 'blue', desc: 'Spoj\u00ed v\u00fdsledky dvou SELECTu. UNION ALL zachov\u00e1 duplicity.', ex: 'SELECT ... UNION SELECT ...' },
  { kw: 'EXISTS', tag: 'yellow', desc: 'Vrac\u00ed TRUE pokud vno\u0159en\u00fd dotaz vr\u00e1t\u00ed alespo\u0148 jeden \u0159\u00e1dek.', ex: 'WHERE EXISTS (SELECT 1 FROM ...)' },
  { kw: 'ROWNUM', tag: 'orange', desc: 'Pseudo-sloupec \u2014 po\u0159adov\u00e9 \u010d\u00edslo \u0159\u00e1dku (Oracle).', ex: 'WHERE ROWNUM <= 5' },
];

export function initDict() {
  const list = document.getElementById('dictList');
  let html = '';
  for (const e of DICT_ENTRIES) {
    html += `<div class="dict-item">`;
    html += `<div class="dict-kw"><span class="dict-tag dict-tag-${e.tag}">${escapeHTML(e.kw)}</span></div>`;
    html += `<div class="dict-desc">${escapeHTML(e.desc)}</div>`;
    html += `<div class="dict-example">${escapeHTML(e.ex)}</div>`;
    html += `</div>`;
  }
  list.innerHTML = html;
}

export function toggleDict() {
  const panel = document.getElementById('dictPanel');
  const btn = document.getElementById('btnDict');
  if (panel.style.display === 'none') {
    panel.style.display = '';
    btn.classList.add('active');
  } else {
    panel.style.display = 'none';
    btn.classList.remove('active');
  }
}

// ============================================================
// EXAMPLES
// ============================================================

export const EXAMPLES = [
  { name: 'Z\u00e1kladn\u00ed SELECT', sql: "SELECT jmeno, fce\nFROM zam;" },
  { name: 'WHERE IS NOT NULL', sql: "SELECT jmeno, fce, titul\nFROM zam\nWHERE titul IS NOT NULL;" },
  { name: 'WHERE LIKE', sql: "SELECT jmeno, fce\nFROM zam\nWHERE jmeno LIKE '%OVA';" },
  { name: 'Concatenace', sql: "SELECT 'Pan ' || jmeno || ' pracuje v odd. \u010d. ' || cis_odd AS info\nFROM zam;" },
  { name: 'JOIN ON', sql: "SELECT z.jmeno, z.fce, o.nazev\nFROM zam z\nJOIN oddel o ON z.cis_odd = o.cis_odd;" },
  { name: 'JOIN USING', sql: "SELECT z.jmeno, u.popis, u.datum\nFROM zam z\nJOIN ukoly u USING (os_cis);" },
  { name: 'GROUP BY + COUNT', sql: "SELECT cis_odd, COUNT(*) AS pocet\nFROM zam\nWHERE titul IS NULL\nGROUP BY cis_odd;" },
  { name: 'HAVING', sql: "SELECT os_cis, COUNT(*) AS pocet_ukolu\nFROM ukoly\nGROUP BY os_cis\nHAVING COUNT(*) >= 2;" },
  { name: 'ORDER BY', sql: "SELECT jmeno, cis_odd, plat\nFROM zam\nORDER BY cis_odd ASC, plat DESC;" },
  { name: 'Self JOIN', sql: "SELECT z.jmeno AS zamestnanec, n.jmeno AS nadrizeny\nFROM zam z\nJOIN zam n ON z.nadr = n.os_cis;" },
  { name: 'Agregace', sql: "SELECT cis_odd,\n  AVG(plat) AS prumerny_plat,\n  MAX(plat) AS max_plat,\n  MIN(plat) AS min_plat\nFROM zam\nGROUP BY cis_odd;" },
  { name: 'Vno\u0159en\u00fd dotaz', sql: "SELECT jmeno, plat\nFROM zam\nWHERE plat > (SELECT AVG(plat) FROM zam);" },
  { name: 'ROUND + AVG', sql: "SELECT cis_odd,\n  ROUND(AVG(plat), 2) AS prumer,\n  ROUND(AVG(plat) * 12, 2) AS rocni_plat\nFROM zam\nGROUP BY cis_odd;" },
  { name: 'RIGHT JOIN', sql: "SELECT oddel.nazev, jmeno\nFROM zam\nRIGHT JOIN oddel ON oddel.sef = zam.os_cis;" },
  { name: 'JOIN + GROUP BY + HAVING', sql: "SELECT oddel.nazev\nFROM oddel\nJOIN zam USING (cis_odd)\nGROUP BY oddel.nazev\nHAVING COUNT(zam.titul) >= 2;" },
  { name: 'CASE WHEN', sql: "SELECT jmeno, plat,\n  CASE\n    WHEN plat >= 12000 THEN 'vysoka'\n    WHEN plat >= 8000 THEN 'stredni'\n    ELSE 'nizka'\n  END AS kategorie\nFROM zam;" },
  { name: 'UNION', sql: "SELECT jmeno, fce FROM zam WHERE cis_odd = 1\nUNION\nSELECT jmeno, fce FROM zam WHERE plat > 10000;" },
  { name: 'EXISTS', sql: "SELECT jmeno, fce\nFROM zam z\nWHERE EXISTS (\n  SELECT 1 FROM ukoly u\n  WHERE u.os_cis = z.os_cis\n);" },
  { name: 'ROWNUM', sql: "SELECT jmeno, plat, ROWNUM\nFROM zam\nWHERE ROWNUM <= 5;" },
  { name: 'NVL + NVL2', sql: "SELECT jmeno,\n  NVL(titul, 'bez titulu') AS titul,\n  NVL2(titul, 'ma titul', 'nema') AS stav\nFROM zam;" },
];

export function initExamples() {
  const menu = document.getElementById('examplesMenu');
  EXAMPLES.forEach((ex, i) => {
    const item = document.createElement('div');
    item.className = 'example-item';
    item.innerHTML = `<span class="example-num">${i+1}.</span><div class="example-info"><div class="example-name">${escapeHTML(ex.name)}</div><div class="example-sql">${escapeHTML(ex.sql.replace(/\n/g,' '))}</div></div>`;
    item.addEventListener('click', () => { textarea.value = ex.sql; toggleExamples(); executeInstant(ex.sql); });
    menu.appendChild(item);
  });
}

export function toggleExamples() { document.getElementById('examplesMenu').classList.toggle('show'); }

// ============================================================
// RESIZE HANDLES (generic)
// ============================================================

function initResizeHandle(handleEl, topEl, bottomEl, minTop, minBottom) {
  let active = false;
  handleEl.addEventListener('mousedown', () => { active = true; handleEl.classList.add('dragging'); document.body.style.cursor = 'row-resize'; document.body.style.userSelect = 'none'; });
  document.addEventListener('mousemove', (e) => {
    if (!active) return;
    const appRect = document.querySelector('.app').getBoundingClientRect();
    const topOffset = topEl.getBoundingClientRect().top - appRect.top;
    const bottomEnd = bottomEl.getBoundingClientRect().bottom - appRect.top;
    const y = e.clientY - appRect.top;
    const newTopH = Math.max(minTop, y - topOffset - 2);
    const newBottomH = Math.max(minBottom, bottomEnd - y - 2);
    topEl.style.flex = 'none'; topEl.style.height = newTopH + 'px';
    bottomEl.style.flex = 'none'; bottomEl.style.height = newBottomH + 'px';
    updateEditor();
    drawJoinLines();
  });
  document.addEventListener('mouseup', () => { if (active) { active = false; handleEl.classList.remove('dragging'); document.body.style.cursor = ''; document.body.style.userSelect = ''; } });
}

function initResize() {
  // Vertical resize handles
  initResizeHandle(
    document.getElementById('resizeEditorFlow'),
    document.getElementById('editorSection'),
    document.getElementById('dataflowSection'),
    60, 80
  );
  initResizeHandle(
    document.getElementById('resizePipelineResults'),
    document.getElementById('pipelineSection'),
    document.getElementById('resultsSection'),
    100, 80
  );

  // Column resize (horizontal)
  const handle = document.getElementById('resizeColumns');
  const left = document.getElementById('colLeft');
  const right = document.getElementById('colRight');
  let active = false;
  handle.addEventListener('mousedown', () => { active = true; handle.classList.add('dragging'); document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; });
  document.addEventListener('mousemove', (e) => {
    if (!active) return;
    const parent = left.parentElement.getBoundingClientRect();
    const x = e.clientX - parent.left;
    const newLeftW = Math.max(280, Math.min(x - 2, parent.width - 284));
    left.style.width = newLeftW + 'px';
    right.style.flex = '1';
    updateEditor();
    drawJoinLines();
  });
  document.addEventListener('mouseup', () => { if (active) { active = false; handle.classList.remove('dragging'); document.body.style.cursor = ''; document.body.style.userSelect = ''; } });

  // Window resize
  document.addEventListener('resize', () => { updateEditor(); drawJoinLines(); });
}

// ============================================================
// FULLSCREEN TOGGLE
// ============================================================

export function toggleFullscreen(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  const btn = section.querySelector('.section-fullscreen-btn');
  const isFullscreen = section.classList.contains('section-fullscreen');

  if (isFullscreen) {
    section.classList.remove('section-fullscreen');
    if (btn) btn.textContent = '\u26f6';
    section.style.cssText = section.dataset.savedStyle || '';
    delete section.dataset.savedStyle;
  } else {
    section.dataset.savedStyle = section.style.cssText;
    section.classList.add('section-fullscreen');
    if (btn) btn.textContent = '\u2715';
  }
  updateEditor();
}

// ============================================================
// INIT EDITOR — sets up all event listeners
// ============================================================

export function initEditor() {
  // Grab DOM refs
  textarea = document.getElementById('editorTextarea');
  highlight = document.getElementById('editorHighlight');
  lineNumbers = document.getElementById('lineNumbers');
  clauseWarningEl = document.getElementById('clauseWarning');

  // Input: update highlight, pipeline, data flow
  textarea.addEventListener('input', () => {
    const ts = timelineState();
    stopAutoplay(); ts.timelineSteps = []; ts.animatedSteps = new Set();
    updateEditor();
  });

  // Scroll sync between textarea and highlight overlay
  textarea.addEventListener('scroll', () => {
    highlight.scrollTop = textarea.scrollTop;
    highlight.scrollLeft = textarea.scrollLeft;
    lineNumbers.style.transform = `translateY(-${textarea.scrollTop}px)`;
  });

  // Animation skip on keydown / click
  document.addEventListener('keydown', (e) => {
    if (isAnimating && (Date.now() - animStartTime > 200) && !['Control','Shift','Alt','Meta'].includes(e.key)) skipAnimation = true;
  });
  document.addEventListener('click', () => { if (isAnimating && (Date.now() - animStartTime > 200)) skipAnimation = true; });

  // Tab key and Ctrl+Enter
  textarea.addEventListener('keydown', (e) => {
    if (isAnimating) { e.preventDefault(); return; }
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = textarea.selectionStart, end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, s) + '  ' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = s + 2;
      updateEditor();
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); executeQuery(); }
  });

  // Escape to exit fullscreen
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const fs = document.querySelector('.section-fullscreen');
      if (fs) toggleFullscreen(fs.id);
    }
  });

  // Close examples dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.examples-dropdown')) document.getElementById('examplesMenu').classList.remove('show');
  });

  // Challenge button wiring
  const btnChallenge = document.getElementById('btnChallenge');
  if (btnChallenge) btnChallenge.addEventListener('click', toggleChallenge);
  const chPrev = document.getElementById('chPrev');
  if (chPrev) chPrev.addEventListener('click', prevChallenge);
  const chNext = document.getElementById('chNext');
  if (chNext) chNext.addEventListener('click', nextChallenge);
  const chClose = document.getElementById('challengePanel')?.querySelector('.close-btn, [onclick*="closeChallenge"]');
  if (chClose) chClose.addEventListener('click', closeChallenge);

  // Resize handles
  initResize();
}
