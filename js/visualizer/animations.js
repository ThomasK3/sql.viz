// ============================================================
// animations.js – Step card animations, timeline, pipeline & flow
// ============================================================
import { executeASTStepped } from './steps.js';
import { renderStepCard } from './cards.js';
import { DB, tokenize, isJoinCtx, AGG_FN, escapeHTML } from '../engine.js';

// ============================================================
// TIMELINE STATE
// ============================================================
let timelineSteps = [];
let timelinePos = 0;
let lastTimelinePos = 0;
let playInterval = null;
let animatedSteps = new Set();
let dfAnimTimers = [];

// ============================================================
// EXECUTION FLOW STEPS
// ============================================================
const FLOW_STEPS = [
  { id: 'from', label: 'FROM', cls: 's-from', desc: 'Určuje zdrojovou tabulku (odkud bereme data)', regex: /\bFROM\b/i },
  { id: 'join', label: 'JOIN', cls: 's-join', desc: 'Spojí dvě tabulky dohromady podle společného sloupce', regex: /\bJOIN\b/i },
  { id: 'where', label: 'WHERE', cls: 's-where', desc: 'Filtruje řádky — zobrazí jen ty, co splňují podmínku', regex: /\bWHERE\b/i },
  { id: 'group', label: 'GROUP BY', cls: 's-group', desc: 'Seskupí řádky podle hodnot — umožní agregaci (COUNT, SUM…)', regex: /\bGROUP\s+BY\b/i },
  { id: 'having', label: 'HAVING', cls: 's-having', desc: 'Filtruje skupiny — funguje jako WHERE, ale až po seskupení', regex: /\bHAVING\b/i },
  { id: 'select', label: 'SELECT', cls: 's-select', desc: 'Vybere sloupce, které se zobrazí ve výsledku', regex: /\bSELECT\b/i },
  { id: 'order', label: 'ORDER BY', cls: 's-order', desc: 'Seřadí výsledné řádky (ASC = vzestupně, DESC = sestupně)', regex: /\bORDER\s+BY\b/i },
];

// ============================================================
// DOM REFS (lazily cached)
// ============================================================
let _timelineSlider, _timelineLabel, _timelineControls, _tlPrev, _tlPlay, _tlNext;

function ensureDOMRefs() {
  if (!_timelineSlider) _timelineSlider = document.getElementById('timelineSlider');
  if (!_timelineLabel) _timelineLabel = document.getElementById('timelineLabel');
  if (!_timelineControls) _timelineControls = document.getElementById('timelineControls');
  if (!_tlPrev) _tlPrev = document.getElementById('tlPrev');
  if (!_tlPlay) _tlPlay = document.getElementById('tlPlay');
  if (!_tlNext) _tlNext = document.getElementById('tlNext');
}

// ============================================================
// PIPELINE: SCHEMA + JOIN LINES
// ============================================================
export function initPipeline() {
  const container = document.getElementById('pipelineTables');
  // Keep svg
  const svg = document.getElementById('pipelineSvg');
  container.innerHTML = '';
  container.appendChild(svg);

  for (const [name, tbl] of Object.entries(DB)) {
    const div = document.createElement('div');
    div.className = 'p-table';
    div.dataset.table = name;
    div.id = 'ptable-' + name;
    let html = `<div class="p-table-name">${name}</div><div class="p-table-cols">`;
    for (const col of tbl.columns) {
      const pk = col === tbl.pk;
      html += `<div class="p-col${pk ? ' p-col-pk' : ''}" data-col="${col}" id="pcol-${name}-${col}">${pk ? '🔑 ' : ''}${col}</div>`;
    }
    html += '</div>';
    div.innerHTML = html;
    container.appendChild(div);
  }
}

export function updatePipeline(sql) {
  const tokens = tokenize(sql).filter(t => t.type !== 'ws');
  const allTableNames = new Set(Object.keys(DB));
  const tablesFrom = new Set(), tablesJoin = new Set();
  const joinLinks = [];

  // Pass 1: Build alias map (alias/name → real table name)
  const aliasMap = {};
  let cl = '';
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type !== 'word') continue;
    const w = t.value.toUpperCase();
    if (w === 'FROM') { cl = 'from'; continue; }
    if (['JOIN','INNER','LEFT','RIGHT','FULL','CROSS','NATURAL'].includes(w) && isJoinCtx(tokens, i)) { cl = 'join'; continue; }
    if (['ON','USING','WHERE','GROUP','HAVING','ORDER','SELECT'].includes(w)) { cl = ''; continue; }
    if ((cl === 'from' || cl === 'join') && allTableNames.has(w)) {
      aliasMap[w] = w;
      if (cl === 'from') tablesFrom.add(w); else tablesJoin.add(w);
      if (i + 1 < tokens.length && tokens[i+1].type === 'word') {
        const nw = tokens[i+1].value.toUpperCase();
        if (nw === 'AS' && i + 2 < tokens.length && tokens[i+2].type === 'word') {
          aliasMap[tokens[i+2].value.toUpperCase()] = w;
        } else if (!['ON','USING','WHERE','GROUP','HAVING','ORDER','JOIN','INNER','LEFT','RIGHT','FULL','CROSS','NATURAL'].includes(nw)) {
          aliasMap[nw] = w;
        }
      }
    }
  }
  function res(name) { return aliasMap[name.toUpperCase()] || name.toUpperCase(); }

  // Table-specific column highlights: "TABLE\tCOL" → Set<cssClass>
  const colHL = new Map();
  function addHL(table, col, cls) {
    const key = table + '\t' + col;
    if (!colHL.has(key)) colHL.set(key, new Set());
    colHL.get(key).add(cls);
  }

  // Pass 2: detect clauses, columns (table-aware), and join links
  cl = '';
  let lastJoinTable = null;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type !== 'word') continue;
    const w = t.value.toUpperCase();

    if (w === 'SELECT' || w === 'DISTINCT') { cl = 'select'; continue; }
    if (w === 'FROM') { cl = 'from'; continue; }
    if (w === 'WHERE') { cl = 'where'; continue; }
    if (['JOIN','INNER','LEFT','RIGHT','FULL','CROSS','NATURAL'].includes(w) && isJoinCtx(tokens, i)) {
      cl = 'join';
      for (let j = i + 1; j < tokens.length; j++) {
        if (tokens[j].type !== 'word') continue;
        const jw = tokens[j].value.toUpperCase();
        if (jw === 'JOIN') continue;
        lastJoinTable = res(jw);
        break;
      }
      continue;
    }
    if (w === 'ON') { cl = 'join_cond'; continue; }
    if (w === 'USING') { cl = 'join_using'; continue; }
    if (w === 'GROUP') { cl = 'group'; continue; }
    if (w === 'HAVING') { cl = 'having'; continue; }
    if (w === 'ORDER') { cl = 'order'; continue; }
    if (['BY','AS','AND','OR','NOT','IN','BETWEEN','LIKE','IS','NULL','ASC','DESC'].includes(w)) continue;
    if (AGG_FN.has(w)) continue;

    // Skip table/alias names in FROM/JOIN context
    if ((cl === 'from' || cl === 'join') && (allTableNames.has(w) || aliasMap[w])) continue;

    // Map clause to CSS class
    const clsMap = { select:'hl-select', where:'hl-where', join_cond:'hl-join-col', join_using:'hl-join-col', group:'hl-group', having:'hl-having', order:'hl-order' };
    const hlCls = clsMap[cl];

    // Check for table.column pattern (table-specific highlighting)
    if (i + 2 < tokens.length && tokens[i+1].type === 'dot' && (tokens[i+2].type === 'word' || tokens[i+2].type === 'star')) {
      const tblName = res(w);
      const colName = tokens[i+2].value.toUpperCase();
      if (colName !== '*' && hlCls) addHL(tblName, colName, hlCls);

      // Detect JOIN ON condition: t1.col = t2.col
      if (cl === 'join_cond' && i + 6 < tokens.length) {
        let j = i + 3;
        if (j < tokens.length && tokens[j].type === 'op' && tokens[j].value === '=') {
          j++;
          if (j + 2 < tokens.length && tokens[j].type === 'word' && tokens[j+1].type === 'dot' && tokens[j+2].type === 'word') {
            const rt = res(tokens[j].value.toUpperCase());
            const rc = tokens[j+2].value.toUpperCase();
            joinLinks.push({ leftTable: tblName, leftCol: colName, rightTable: rt, rightCol: rc });
          }
        }
      }
      i += 2;
      continue;
    }

    // USING columns → join link + highlight in both tables
    if (cl === 'join_using') {
      let isCol = false;
      for (const tbl of Object.values(DB)) { if (tbl.columns.includes(w)) { isCol = true; break; } }
      if (isCol) {
        const fromTbls = [...tablesFrom];
        if (fromTbls.length > 0 && lastJoinTable) {
          joinLinks.push({ leftTable: fromTbls[0], leftCol: w, rightTable: lastJoinTable, rightCol: w });
          addHL(fromTbls[0], w, 'hl-join-col');
          addHL(lastJoinTable, w, 'hl-join-col');
        }
      }
      continue;
    }

    // Bare column name → highlight in all tables that have it
    if (hlCls) {
      for (const [tblName, tbl] of Object.entries(DB)) {
        if (tbl.columns.includes(w)) addHL(tblName, w, hlCls);
      }
    }
  }

  // When timeline is active, let it control highlights
  if (timelineSteps.length > 0) {
    updatePipelineForStep(timelinePos);
    updateFlowForStep(timelinePos);
    return;
  }

  // Update table highlights
  document.querySelectorAll('.p-table').forEach(el => {
    const n = el.dataset.table;
    el.classList.remove('hl-from', 'hl-join');
    if (tablesFrom.has(n)) el.classList.add('hl-from');
    if (tablesJoin.has(n)) el.classList.add('hl-join');
  });

  // Update column highlights (table-specific!)
  document.querySelectorAll('.p-col').forEach(el => {
    const col = el.dataset.col;
    const table = el.closest('.p-table')?.dataset.table;
    el.classList.remove('hl-select', 'hl-where', 'hl-join-col', 'hl-group', 'hl-having', 'hl-order');
    if (!table) return;
    const key = table + '\t' + col;
    const classes = colHL.get(key);
    if (classes) classes.forEach(c => el.classList.add(c));
  });

  drawJoinLines(joinLinks);
  updateFlow(sql);
}

export function drawJoinLines(links) {
  window.__lastLinks = links;
  const svg = document.getElementById('pipelineSvg');
  svg.innerHTML = '';
  const container = document.getElementById('pipelineTables');
  const cRect = container.getBoundingClientRect();
  const isMobile = window.innerWidth <= 768;

  for (const link of links) {
    const leftEl = document.getElementById('pcol-' + link.leftTable + '-' + link.leftCol);
    const rightEl = document.getElementById('pcol-' + link.rightTable + '-' + link.rightCol);
    if (!leftEl || !rightEl) continue;

    const lRect = leftEl.getBoundingClientRect();
    const rRect = rightEl.getBoundingClientRect();

    // Self-join: curved line on the right side
    if (link.leftTable === link.rightTable) {
      const tEl = document.getElementById('ptable-' + link.leftTable);
      if (!tEl) continue;
      const tRect = tEl.getBoundingClientRect();
      const tx = tRect.right - cRect.left + 8;
      const ty1 = lRect.top + lRect.height/2 - cRect.top;
      const ty2 = rRect.top + rRect.height/2 - cRect.top;
      const cx = tx + 30;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${tx-8},${ty1} C${cx},${ty1} ${cx},${ty2} ${tx-8},${ty2}`);
      path.setAttribute('class', 'join-line join-line-anim');
      svg.appendChild(path);
      continue;
    }

    if (isMobile) {
      // Vertical layout: draw line from right edge of top column to right edge of bottom column
      const topEl = lRect.top <= rRect.top ? lRect : rRect;
      const botEl = lRect.top <= rRect.top ? rRect : lRect;
      const x1 = topEl.right - cRect.left - 12;
      const y1 = topEl.top + topEl.height/2 - cRect.top;
      const x2 = botEl.right - cRect.left - 12;
      const y2 = botEl.top + botEl.height/2 - cRect.top;
      const midY = (y1 + y2) / 2;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`);
      path.setAttribute('class', 'join-line join-line-anim');
      svg.appendChild(path);
      for (const [x, y] of [[x1, y1], [x2, y2]]) {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', x); dot.setAttribute('cy', y);
        dot.setAttribute('class', 'join-dot'); dot.setAttribute('r', '4');
        svg.appendChild(dot);
      }
      continue;
    }

    // Desktop: horizontal layout
    const lCenter = lRect.left + lRect.width / 2;
    const rCenter = rRect.left + rRect.width / 2;
    let x1, y1, x2, y2;
    if (lCenter <= rCenter) {
      x1 = lRect.right - cRect.left;
      y1 = lRect.top + lRect.height/2 - cRect.top;
      x2 = rRect.left - cRect.left;
      y2 = rRect.top + rRect.height/2 - cRect.top;
    } else {
      x1 = rRect.right - cRect.left;
      y1 = rRect.top + rRect.height/2 - cRect.top;
      x2 = lRect.left - cRect.left;
      y2 = lRect.top + lRect.height/2 - cRect.top;
    }

    const midX = (x1 + x2) / 2;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`);
    path.setAttribute('class', 'join-line join-line-anim');
    svg.appendChild(path);

    // Dots at endpoints
    for (const [x, y] of [[x1, y1], [x2, y2]]) {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', x); dot.setAttribute('cy', y);
      dot.setAttribute('class', 'join-dot');
      dot.setAttribute('r', '4');
      svg.appendChild(dot);
    }
  }
}

// ============================================================
// FLOW BAR (full update from SQL)
// ============================================================
export function updateFlow(sql) {
  const bar = document.getElementById('flowBar');
  bar.innerHTML = '<span class="flow-label">Pořadí vykonání:</span>';
  let first = true;
  for (const step of FLOW_STEPS) {
    const active = step.regex.test(sql);
    if (!active) continue;
    if (!first) { const arrow = document.createElement('span'); arrow.className = 'flow-arrow'; arrow.textContent = '→'; bar.appendChild(arrow); }
    first = false;
    const el = document.createElement('span');
    el.className = `flow-step ${step.cls} active`;
    el.textContent = step.label;
    el.onclick = (e) => { e.stopPropagation(); el.classList.toggle('show-tip'); };
    const tip = document.createElement('div');
    tip.className = 'flow-tooltip';
    tip.textContent = step.desc;
    el.appendChild(tip);
    bar.appendChild(el);
  }
}

// ============================================================
// AUTOPLAY
// ============================================================
export function stopAutoplay() {
  ensureDOMRefs();
  if (playInterval) { clearInterval(playInterval); playInterval = null; }
  _tlPlay.textContent = '▶'; _tlPlay.classList.remove('playing');
}

function startTimelineAutoplay() {
  ensureDOMRefs();
  stopAutoplay();
  timelinePos = 0; _timelineSlider.value = 0; renderTimeline(0);
  _tlPlay.textContent = '⏸'; _tlPlay.classList.add('playing');
  playInterval = setInterval(() => {
    if (timelinePos >= timelineSteps.length) { stopAutoplay(); return; }
    timelinePos++;
    _timelineSlider.value = timelinePos;
    renderTimeline(timelinePos);
  }, 1500);
}

function hideTimeline() {
  ensureDOMRefs();
  _timelineControls.style.display = 'none'; _timelineLabel.textContent = '';
}

// ============================================================
// DATA FLOW
// ============================================================
export function updateDataFlow(sql) {
  ensureDOMRefs();
  const container = document.getElementById('dataFlow');
  animatedSteps = new Set();
  clearDfAnimTimers();
  if (!sql || !/\bFROM\b/i.test(sql)) {
    container.innerHTML = ''; timelineSteps = []; stopAutoplay(); hideTimeline();
    return;
  }

  let steps;
  try { steps = executeASTStepped(sql); } catch(e) { container.innerHTML = ''; timelineSteps = []; stopAutoplay(); hideTimeline(); return; }
  if (steps.length === 0) { container.innerHTML = ''; timelineSteps = []; stopAutoplay(); hideTimeline(); return; }

  timelineSteps = steps;
  _timelineSlider.max = steps.length;
  _timelineControls.style.display = '';
  timelinePos = 0;
  lastTimelinePos = 0;
  _timelineSlider.value = 0;
  container.innerHTML = '';
  renderTimeline(timelinePos);
}

export function clearDfAnimTimers() {
  for (const t of dfAnimTimers) clearTimeout(t);
  dfAnimTimers = [];
}

// ============================================================
// RENDER TIMELINE
// ============================================================
function renderTimeline(pos) {
  ensureDOMRefs();
  const container = document.getElementById('dataFlow');
  const steps = timelineSteps;
  if (steps.length === 0) { container.innerHTML = ''; _timelineLabel.textContent = ''; lastTimelinePos = 0; return; }

  const prevPos = lastTimelinePos;
  clearDfAnimTimers();
  _timelineLabel.textContent = 'Krok ' + pos + '/' + steps.length;
  pos = Math.max(0, Math.min(pos, steps.length));

  if (pos === 0) {
    container.innerHTML = '';
    updatePipelineForStep(0);
    updateFlowForStep(0);
    lastTimelinePos = 0;
    return;
  }

  // Backward: remove cards/arrows for steps that are no longer visible
  if (pos < prevPos) {
    for (let i = prevPos - 1; i >= pos; i--) {
      const card = container.querySelector(`.df-card[data-step-idx="${i}"]`);
      if (card) {
        const prevSibling = card.previousElementSibling;
        if (prevSibling && prevSibling.classList.contains('df-arrow')) {
          prevSibling.remove();
        }
        card.remove();
      }
      animatedSteps.delete(i);
    }
  }

  // Forward: append newly revealed cards
  let lastNewIdx = null;
  let lastNewCard = null;
  if (pos > prevPos) {
    const start = Math.max(prevPos, 0);
    for (let i = start; i < pos && i < steps.length; i++) {
      let html = '';
      if (i > 0) html += '<div class="df-arrow">↓</div>';
      html += renderStepCard(steps[i], i, true);
      container.insertAdjacentHTML('beforeend', html);
      const card = container.querySelector(`.df-card[data-step-idx="${i}"]`);
      if (card) {
        card.classList.add('df-card-enter');
        lastNewIdx = i;
        lastNewCard = card;
      }
    }
  }

  // Trigger clause-specific animation only for the last newly revealed step
  if (lastNewCard != null && lastNewIdx != null) {
    const stepIdx = lastNewIdx;
    const cardRef = lastNewCard;
    dfAnimTimers.push(setTimeout(() => {
      if (!cardRef.isConnected) return;
      animateStepCard(cardRef, steps[stepIdx]);
      animatedSteps.add(stepIdx);
      cardRef.classList.remove('df-card-enter');
    }, 150));
  }

  // Scroll to bottom to show latest step
  container.scrollTop = container.scrollHeight;

  updatePipelineForStep(pos);
  updateFlowForStep(pos);
  lastTimelinePos = pos;
}

// ============================================================
// STEP CARD ANIMATIONS
// ============================================================
function animateStepCard(card, s) {
  switch (s.step) {
    case 'from': animateFrom(card); break;
    case 'join': animateJoin(card); break;
    case 'where': case 'having': animateWhereHaving(card, s); break;
    case 'group': animateGroup(card, s); break;
    case 'select': animateSelect(card, s); break;
    case 'order': animateOrder(card, s); break;
    default: animateGenericRows(card); break;
  }
}

function animateFrom(card) {
  const section = card.querySelector('.df-section-output') || card.querySelector('.df-section');
  if (!section) return;
  const rows = section.querySelectorAll('.df-mini-table tbody tr');
  rows.forEach((tr, i) => {
    tr.style.opacity = '0';
    tr.style.transform = 'translateY(6px)';
    dfAnimTimers.push(setTimeout(() => {
      tr.style.transition = 'none';
      tr.classList.add('df-anim-row-in');
      tr.style.animationDelay = '0ms';
    }, i * 30));
  });
  // Also animate header
  const thead = section.querySelector('.df-mini-table thead tr');
  if (thead) {
    thead.style.opacity = '0';
    thead.classList.add('df-anim-row-in');
  }
}

function animateJoin(card) {
  const inputSection = card.querySelector('.df-section-input');
  const divider = card.querySelector('.df-divider');
  const outputSection = card.querySelector('.df-section-output');
  const vennWrap = card.querySelector('.df-join-venn-wrap');
  const vennSvg = card.querySelector('.df-join-venn-svg');
  const inputTable = inputSection ? inputSection.querySelector('.df-mini-table') : null;

  // Phase 1: Input table slides in from left (0-600ms)
  if (inputTable) {
    inputTable.style.opacity = '0';
    inputTable.style.transform = 'translateX(-20px)';
    dfAnimTimers.push(setTimeout(() => {
      inputTable.style.transition = 'opacity 400ms ease-out, transform 400ms ease-out';
      inputTable.style.opacity = '1';
      inputTable.style.transform = 'translateX(0)';
    }, 0));
  }

  // Phase 2: Venn diagram scales in (600-1000ms)
  if (vennSvg) {
    vennSvg.style.transform = 'scale(0)';
    vennSvg.style.opacity = '0';
    dfAnimTimers.push(setTimeout(() => {
      vennSvg.style.transition = 'transform 400ms ease-out, opacity 300ms ease-out';
      vennSvg.style.transform = 'scale(1)';
      vennSvg.style.opacity = '1';
    }, 600));
  }

  // Phase 3: Venn highlight pulse + condition flash (1000-1400ms)
  if (vennSvg) {
    const circles = vennSvg.querySelectorAll('circle');
    dfAnimTimers.push(setTimeout(() => {
      circles.forEach(c => {
        const origOpacity = c.style.opacity || '1';
        c.style.transition = 'opacity 200ms ease';
        c.style.opacity = '0.9';
        dfAnimTimers.push(setTimeout(() => { c.style.opacity = origOpacity; c.style.transition = ''; }, 200));
      });
    }, 1000));
  }
  const condBox = card.querySelector('.df-condition');
  if (condBox) {
    dfAnimTimers.push(setTimeout(() => {
      condBox.style.transition = 'background 300ms ease';
      condBox.style.background = 'rgba(188,140,255,0.15)';
      dfAnimTimers.push(setTimeout(() => {
        condBox.style.background = '';
        dfAnimTimers.push(setTimeout(() => { condBox.style.transition = ''; }, 300));
      }, 300));
    }, 1000));
  }

  // Phase 4: Output section fades in with row-by-row (1400ms+)
  if (divider) {
    dfAnimTimers.push(setTimeout(() => {
      divider.style.transition = 'opacity 300ms ease';
      divider.style.opacity = '1';
    }, 1400));
  }
  if (outputSection) {
    dfAnimTimers.push(setTimeout(() => {
      outputSection.style.transition = 'opacity 300ms ease';
      outputSection.style.opacity = '1';
      // Row-by-row fade
      const rows = outputSection.querySelectorAll('.df-mini-table tbody tr');
      rows.forEach((tr, i) => {
        tr.style.opacity = '0';
        dfAnimTimers.push(setTimeout(() => {
          tr.style.transition = 'none';
          tr.classList.add('df-anim-row-in');
        }, i * 30));
      });
    }, 1400));
  }
}

function animateWhereHaving(card, s) {
  const inputSection = card.querySelector('.df-section-input');
  const divider = card.querySelector('.df-divider');
  const outputSection = card.querySelector('.df-section-output');

  // Phase 1: Input table rows appear instantly (already visible)
  // Phase 2: Rows evaluate one by one
  if (inputSection) {
    const rows = inputSection.querySelectorAll('.df-mini-table tbody tr[data-pass]');
    rows.forEach((tr, i) => {
      // Start neutral
      tr.style.color = 'var(--text2)';
      const checkCell = tr.querySelector('.df-check-col');
      if (checkCell) checkCell.textContent = '';

      dfAnimTimers.push(setTimeout(() => {
        const pass = tr.dataset.pass === '1';
        tr.style.transition = 'color 250ms ease';
        tr.style.color = pass ? 'var(--green)' : 'var(--red)';
        // Apply color to all tds
        tr.querySelectorAll('td:not(.df-check-col)').forEach(td => {
          td.style.transition = 'color 250ms ease';
          td.style.color = 'inherit';
        });
        if (checkCell) {
          checkCell.style.transition = 'opacity 200ms ease';
          checkCell.style.opacity = '0';
          checkCell.textContent = pass ? '✓' : '✗';
          dfAnimTimers.push(setTimeout(() => { checkCell.style.opacity = '1'; }, 50));
        }
      }, i * 80));
    });

    // Phase 3: After all rows evaluated, show divider + output
    const afterAllMs = rows.length * 80 + 400;
    if (divider) {
      dfAnimTimers.push(setTimeout(() => {
        divider.style.transition = 'opacity 300ms ease';
        divider.style.opacity = '1';
      }, afterAllMs));
    }
    if (outputSection) {
      dfAnimTimers.push(setTimeout(() => {
        outputSection.style.transition = 'opacity 300ms ease';
        outputSection.style.opacity = '1';
        const oRows = outputSection.querySelectorAll('.df-mini-table tbody tr');
        oRows.forEach((tr, i) => {
          tr.style.opacity = '0';
          dfAnimTimers.push(setTimeout(() => {
            tr.style.transition = 'none';
            tr.classList.add('df-anim-row-in');
          }, i * 30));
        });
      }, afterAllMs));
    }
  }
}

function animateGroup(card, s) {
  const inputSection = card.querySelector('.df-section-input');
  const divider = card.querySelector('.df-divider');
  const outputSection = card.querySelector('.df-section-output');

  // Phase 1 (0-400ms): Input rows appear, GROUP BY columns highlight
  if (inputSection) {
    const inputTable = inputSection.querySelector('.df-mini-table');
    if (inputTable) {
      // Find group column indices from activeCols
      const headers = inputTable.querySelectorAll('thead th');
      const groupColIdxs = new Set();
      const ac = s.activeCols || new Set();
      headers.forEach((th, ci) => {
        if (ac.has(th.textContent.trim().toUpperCase())) groupColIdxs.add(ci);
      });

      dfAnimTimers.push(setTimeout(() => {
        // Highlight group column cells
        inputTable.querySelectorAll('tbody tr').forEach(tr => {
          const cells = tr.querySelectorAll('td');
          cells.forEach((td, ci) => {
            if (groupColIdxs.has(ci)) {
              td.style.transition = 'background 300ms ease';
              td.classList.add('df-group-col-hl');
            }
          });
        });
        headers.forEach((th, ci) => {
          if (groupColIdxs.has(ci)) {
            th.style.transition = 'background 300ms ease';
            th.classList.add('df-group-col-hl');
          }
        });
      }, 0));
    }

    // Phase 2 (400-1200ms): Rows "shuffle" — brief translateY per group
    const tbody = inputSection.querySelector('.df-mini-table tbody');
    if (tbody) {
      const allTr = [...tbody.querySelectorAll('tr:not(.df-more-row)')];
      dfAnimTimers.push(setTimeout(() => {
        allTr.forEach((tr, i) => {
          tr.style.transition = 'transform 300ms ease';
          const offset = (i % 2 === 0) ? -6 : 6;
          tr.style.transform = `translateY(${offset}px)`;
          dfAnimTimers.push(setTimeout(() => {
            tr.style.transform = 'translateY(0)';
          }, 300));
        });
      }, 400));
    }
  }

  // Phase 3 (1200ms+): Output section fades in
  if (divider) {
    dfAnimTimers.push(setTimeout(() => {
      divider.style.transition = 'opacity 300ms ease';
      divider.style.opacity = '1';
    }, 1200));
  }
  if (outputSection) {
    dfAnimTimers.push(setTimeout(() => {
      outputSection.style.transition = 'opacity 300ms ease';
      outputSection.style.opacity = '1';
      const oRows = outputSection.querySelectorAll('.df-mini-table tbody tr');
      oRows.forEach((tr, i) => {
        tr.style.opacity = '0';
        dfAnimTimers.push(setTimeout(() => {
          tr.style.transition = 'none';
          tr.classList.add('df-anim-row-in');
        }, i * 30));
      });
    }, 1200));
  }
}

function animateSelect(card, s) {
  const inputSection = card.querySelector('.df-section-input');
  const divider = card.querySelector('.df-divider');
  const outputSection = card.querySelector('.df-section-output');

  // Phase 1 (0-400ms): Non-selected columns fade to 0.3
  if (inputSection) {
    const removedCells = inputSection.querySelectorAll('[data-removed="1"]');
    dfAnimTimers.push(setTimeout(() => {
      removedCells.forEach(el => {
        el.style.transition = 'opacity 400ms ease';
        el.style.opacity = '0.3';
      });
    }, 0));

    // Phase 2 (400-700ms): Selected columns pop
    const keptCells = inputSection.querySelectorAll('th:not([data-removed]), td:not([data-removed]):not(.df-null):not(.df-more)');
    dfAnimTimers.push(setTimeout(() => {
      keptCells.forEach(el => {
        el.classList.add('df-anim-scale-pop');
      });
    }, 400));
  }

  // Phase 3 (700ms+): Output table fades in
  if (divider) {
    dfAnimTimers.push(setTimeout(() => {
      divider.style.transition = 'opacity 300ms ease';
      divider.style.opacity = '1';
    }, 700));
  }
  if (outputSection) {
    dfAnimTimers.push(setTimeout(() => {
      outputSection.style.transition = 'opacity 300ms ease';
      outputSection.style.opacity = '1';
    }, 700));
  }
}

function animateOrder(card, s) {
  const inputSection = card.querySelector('.df-section-input');
  const divider = card.querySelector('.df-divider');
  const outputSection = card.querySelector('.df-section-output');

  // Phase 1: Input table appears with sort column already highlighted (via CSS class)
  // Phase 2 (200-800ms): Rows shuffle — staggered translateY
  if (inputSection) {
    const tbody = inputSection.querySelector('.df-mini-table tbody');
    if (tbody) {
      const allTr = [...tbody.querySelectorAll('tr:not(.df-more-row)')];
      allTr.forEach((tr, i) => {
        dfAnimTimers.push(setTimeout(() => {
          tr.style.transition = 'transform 200ms ease';
          const offset = ((i % 3) - 1) * 10;
          tr.style.transform = `translateY(${offset}px)`;
          dfAnimTimers.push(setTimeout(() => {
            tr.style.transform = 'translateY(0)';
          }, 200));
        }, 200 + i * 100));
      });
    }
  }

  // Phase 3: Output table appears in sorted order
  const afterMs = 200 + 20 * 100 + 400; // generous estimate
  const actualDelay = inputSection ? Math.min(200 + (inputSection.querySelectorAll('.df-mini-table tbody tr:not(.df-more-row)').length) * 100 + 400, 2500) : 800;
  if (divider) {
    dfAnimTimers.push(setTimeout(() => {
      divider.style.transition = 'opacity 300ms ease';
      divider.style.opacity = '1';
    }, actualDelay));
  }
  if (outputSection) {
    dfAnimTimers.push(setTimeout(() => {
      outputSection.style.transition = 'opacity 300ms ease';
      outputSection.style.opacity = '1';
      // Badge fade
      const badges = outputSection.querySelectorAll('.df-order-badge');
      badges.forEach(b => {
        b.style.opacity = '0';
        b.style.transition = 'opacity 300ms ease';
        dfAnimTimers.push(setTimeout(() => { b.style.opacity = '1'; }, 200));
      });
    }, actualDelay));
  }
}

function animateGenericRows(card) {
  const sections = card.querySelectorAll('.df-section');
  sections.forEach(section => {
    const rows = section.querySelectorAll('.df-mini-table tbody tr, .df-case-table tbody tr');
    rows.forEach((tr, i) => {
      tr.style.opacity = '0';
      dfAnimTimers.push(setTimeout(() => {
        tr.style.transition = 'none';
        tr.classList.add('df-anim-row-in');
      }, i * 30));
    });
  });
}

// ============================================================
// PIPELINE / FLOW FOR STEP (timeline-driven)
// ============================================================
export function updatePipelineForStep(pos) {
  const steps = timelineSteps;
  // Reset all highlights
  document.querySelectorAll('.p-table').forEach(el => el.classList.remove('hl-from', 'hl-join'));
  document.querySelectorAll('.p-col').forEach(el => el.classList.remove('hl-select', 'hl-where', 'hl-join-col', 'hl-group', 'hl-having', 'hl-order'));

  // Accumulate highlights from steps 0..pos-1
  const allTablesFrom = new Set(), allTablesJoin = new Set();
  const allColHL = new Map();
  const allJoinLinks = [];

  for (let i = 0; i < pos && i < steps.length; i++) {
    const hl = steps[i].hlInfo;
    if (!hl) continue;
    hl.tablesFrom.forEach(t => allTablesFrom.add(t));
    hl.tablesJoin.forEach(t => allTablesJoin.add(t));
    for (const [key, classes] of hl.colHL) {
      if (!allColHL.has(key)) allColHL.set(key, new Set());
      classes.forEach(c => allColHL.get(key).add(c));
    }
    for (const link of hl.joinLinks) allJoinLinks.push(link);
  }

  // Apply table highlights
  document.querySelectorAll('.p-table').forEach(el => {
    const n = el.dataset.table;
    if (allTablesFrom.has(n)) el.classList.add('hl-from');
    if (allTablesJoin.has(n)) el.classList.add('hl-join');
  });

  // Apply column highlights
  document.querySelectorAll('.p-col').forEach(el => {
    const col = el.dataset.col;
    const table = el.closest('.p-table')?.dataset.table;
    if (!table) return;
    const key = table + '\t' + col;
    const classes = allColHL.get(key);
    if (classes) classes.forEach(c => el.classList.add(c));
  });

  // Draw join lines
  drawJoinLines(allJoinLinks);
}

export function updateFlowForStep(pos) {
  const steps = timelineSteps;
  const bar = document.getElementById('flowBar');
  bar.innerHTML = '<span class="flow-label">Pořadí vykonání:</span>';
  // Collect unique step types up to pos
  const activeIds = [];
  for (let i = 0; i < pos && i < steps.length; i++) {
    const id = steps[i].step;
    if (!activeIds.includes(id)) activeIds.push(id);
  }
  let first = true;
  for (const step of FLOW_STEPS) {
    if (!activeIds.includes(step.id)) continue;
    if (!first) { const arrow = document.createElement('span'); arrow.className = 'flow-arrow'; arrow.textContent = '→'; bar.appendChild(arrow); }
    first = false;
    const el = document.createElement('span');
    el.className = `flow-step ${step.cls} active`;
    el.textContent = step.label;
    el.onclick = (e) => { e.stopPropagation(); el.classList.toggle('show-tip'); };
    const tip = document.createElement('div');
    tip.className = 'flow-tooltip';
    tip.textContent = step.desc;
    el.appendChild(tip);
    bar.appendChild(el);
  }
}

// ============================================================
// TIMELINE STATE ACCESSORS
// ============================================================
export function resetTimeline() {
  timelineSteps = [];
  timelinePos = 0;
  lastTimelinePos = 0;
  animatedSteps = new Set();
}

export function getTimelineSteps() {
  return timelineSteps;
}

export function getTimelinePos() {
  return timelinePos;
}

export function setTimelinePos(pos) {
  timelinePos = pos;
}

export function getAnimatedSteps() {
  return animatedSteps;
}

// ============================================================
// INIT: timeline event listeners
// ============================================================
export function initTimeline() {
  ensureDOMRefs();

  // Slider event
  _timelineSlider.addEventListener('input', () => {
    stopAutoplay();
    timelinePos = parseInt(_timelineSlider.value);
    renderTimeline(timelinePos);
  });

  // Prev / Next / Play buttons
  _tlPrev.addEventListener('click', () => {
    stopAutoplay();
    if (timelinePos > 0) { timelinePos--; _timelineSlider.value = timelinePos; renderTimeline(timelinePos); }
  });
  _tlNext.addEventListener('click', () => {
    stopAutoplay();
    if (timelinePos < timelineSteps.length) { timelinePos++; _timelineSlider.value = timelinePos; renderTimeline(timelinePos); }
  });
  _tlPlay.addEventListener('click', () => {
    if (playInterval) { stopAutoplay(); return; }
    if (timelinePos >= timelineSteps.length) { timelinePos = 0; _timelineSlider.value = 0; renderTimeline(0); }
    _tlPlay.textContent = '⏸'; _tlPlay.classList.add('playing');
    playInterval = setInterval(() => {
      if (timelinePos >= timelineSteps.length) { stopAutoplay(); return; }
      timelinePos++;
      _timelineSlider.value = timelinePos;
      renderTimeline(timelinePos);
    }, 1500);
  });

  // Scroll wheel on timeline controls = timeline step
  _timelineControls.addEventListener('wheel', (e) => {
    if (timelineSteps.length === 0) return;
    e.preventDefault();
    stopAutoplay();
    if (e.deltaY > 0 && timelinePos < timelineSteps.length) timelinePos++;
    else if (e.deltaY < 0 && timelinePos > 0) timelinePos--;
    _timelineSlider.value = timelinePos;
    renderTimeline(timelinePos);
  }, { passive: false });

  // Close tooltips on outside click
  document.addEventListener('click', () => { document.querySelectorAll('.flow-step').forEach(s => s.classList.remove('show-tip')); });
}

// Expose mutable state object for editor module
export function timelineState() {
  return {
    get timelineSteps() { return timelineSteps; },
    set timelineSteps(v) { timelineSteps = v; },
    get animatedSteps() { return animatedSteps; },
    set animatedSteps(v) { animatedSteps = v; },
    get timelinePos() { return timelinePos; },
    set timelinePos(v) { timelinePos = v; },
  };
}
