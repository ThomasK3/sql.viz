import { escapeHTML, describeExpr } from '../engine.js';

export function renderConditionBox(s) {
  if (!s.conditionText) return '';
  return `<div class="df-condition">${escapeHTML(s.conditionText)}</div>`;
}

export function renderWhereInputTable(columns, mixRows, total, activeCols, forAnimation) {
  // Add identifier column (JMENO or OS_CIS) if available
  const idCols = ['JMENO', 'OS_CIS', 'PRIJMENI', 'NAZEV'];
  const keep = new Set(activeCols || []);
  for (const ic of idCols) {
    if (columns.includes(ic)) { keep.add(ic); break; }
  }
  const cols = columns.filter(c => keep.size === 0 || keep.has(c)).slice(0, 5);
  if (cols.length === 0) return '';

  let h = '<table class="df-mini-table"><thead><tr>';
  for (const c of cols) h += `<th>${escapeHTML(c)}</th>`;
  h += '<th class="df-check-col"></th></tr></thead><tbody>';
  for (const m of mixRows) {
    const r = m.row;
    // If animating, start neutral; otherwise show final state
    if (forAnimation) {
      h += `<tr data-pass="${m.pass ? '1' : '0'}">`;
    } else {
      const style = m.pass ? 'color:var(--green)' : 'color:var(--red)';
      h += `<tr style="${style}" data-pass="${m.pass ? '1' : '0'}">`;
    }
    for (const c of cols) {
      const v = r[c];
      h += v === null || v === undefined ? '<td class="df-null">NULL</td>' : `<td>${escapeHTML(String(v))}</td>`;
    }
    if (forAnimation) {
      h += '<td class="df-check-col"></td></tr>';
    } else {
      h += `<td class="df-check-col">${m.pass ? '✓' : '✗'}</td></tr>`;
    }
  }
  if (total > mixRows.length) h += `<tr class="df-more-row"><td colspan="${cols.length + 1}" class="df-more">… a dalších ${total - mixRows.length}</td></tr>`;
  h += '</tbody></table>';
  return h;
}

export function renderGroupInputTable(groupData) {
  if (!groupData || groupData.length === 0) return '';
  const groupColors = ['rgba(76,175,80,0.12)', 'rgba(33,150,243,0.12)', 'rgba(156,39,176,0.12)', 'rgba(233,30,99,0.12)', 'rgba(0,188,212,0.12)', 'rgba(255,193,7,0.12)'];
  const cols = groupData[0].columns;
  if (!cols || cols.length === 0) return '';
  const showCols = cols.slice(0, 6);

  let h = '<table class="df-mini-table"><thead><tr>';
  for (const c of showCols) h += `<th>${escapeHTML(c)}</th>`;
  h += '</tr></thead><tbody>';
  for (let gi = 0; gi < groupData.length; gi++) {
    const g = groupData[gi];
    const bg = groupColors[gi % groupColors.length];
    for (const r of g.rows) {
      h += `<tr style="background:${bg}">`;
      for (const c of showCols) {
        const v = r[c];
        h += v === null || v === undefined ? '<td class="df-null">NULL</td>' : `<td>${escapeHTML(String(v))}</td>`;
      }
      h += '</tr>';
    }
    if (g.total > g.rows.length) {
      h += `<tr style="background:${bg}"><td colspan="${showCols.length}" class="df-more">… +${g.total - g.rows.length} dalších v této skupině</td></tr>`;
    }
  }
  h += '</tbody></table>';
  return h;
}

export function renderGroupOutputTable(groupData) {
  if (!groupData || groupData.length === 0) return '';
  const groupColors = ['var(--green)', 'var(--blue)', 'var(--purple)', 'var(--pink)', 'var(--cyan)', 'var(--yellow)'];

  let h = '<table class="df-mini-table"><thead><tr><th>Skupina</th><th>Řádků</th></tr></thead><tbody>';
  for (let gi = 0; gi < groupData.length; gi++) {
    const g = groupData[gi];
    const color = groupColors[gi % groupColors.length];
    h += `<tr><td style="color:${color};font-weight:600">${escapeHTML(g.key)}</td><td>${g.total}</td></tr>`;
  }
  h += '</tbody></table>';
  return h;
}

export function renderJoinVennBig(joinType, leftName, rightName) {
  const configs = {
    'INNER': { leftFill: 'rgba(188,140,255,0.15)', rightFill: 'rgba(188,140,255,0.15)', centerFill: 'rgba(188,140,255,0.55)', label: 'INNER JOIN' },
    'LEFT': { leftFill: 'rgba(188,140,255,0.55)', rightFill: 'rgba(188,140,255,0.15)', centerFill: 'rgba(188,140,255,0.55)', label: 'LEFT JOIN' },
    'RIGHT': { leftFill: 'rgba(188,140,255,0.15)', rightFill: 'rgba(188,140,255,0.55)', centerFill: 'rgba(188,140,255,0.55)', label: 'RIGHT JOIN' },
    'FULL': { leftFill: 'rgba(188,140,255,0.55)', rightFill: 'rgba(188,140,255,0.55)', centerFill: 'rgba(188,140,255,0.55)', label: 'FULL OUTER JOIN' },
    'CROSS': { leftFill: 'rgba(188,140,255,0.35)', rightFill: 'rgba(188,140,255,0.35)', centerFill: 'rgba(188,140,255,0.35)', label: 'CROSS JOIN' },
    'NATURAL': { leftFill: 'rgba(188,140,255,0.25)', rightFill: 'rgba(188,140,255,0.25)', centerFill: 'rgba(188,140,255,0.65)', label: 'NATURAL JOIN' }
  };
  const cfg = configs[joinType] || configs['INNER'];
  const r = 36, cx1 = 50, cx2 = 106, cy = 45, w = 156, ht = 90;
  const stroke = 'rgba(188,140,255,0.7)';
  let svg = `<svg class="df-join-venn-svg" viewBox="0 0 ${w} ${ht}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<circle cx="${cx1}" cy="${cy}" r="${r}" fill="${cfg.leftFill}" stroke="${stroke}" stroke-width="1.5"/>`;
  svg += `<circle cx="${cx2}" cy="${cy}" r="${r}" fill="${cfg.rightFill}" stroke="${stroke}" stroke-width="1.5"/>`;
  svg += `<text x="${cx1-12}" y="${cy+4}" font-size="10" fill="rgba(188,140,255,0.9)" font-family="JetBrains Mono" font-weight="700" text-anchor="middle">${escapeHTML(leftName)}</text>`;
  svg += `<text x="${cx2+12}" y="${cy+4}" font-size="10" fill="rgba(188,140,255,0.9)" font-family="JetBrains Mono" font-weight="700" text-anchor="middle">${escapeHTML(rightName)}</text>`;
  svg += '</svg>';
  return `<div class="df-join-venn-wrap">${svg}<span class="df-join-type-badge">${cfg.label}</span></div>`;
}

export function renderStepCard(s, idx, forAnimation) {
  let html = `<div class="df-card df-${s.step}" data-step-idx="${idx}">`;

  // HEADER
  html += `<div class="df-card-header"><span class="df-step-num">${idx + 1}</span><span>${escapeHTML(s.label)}</span>`;
  if (s.step === 'setop' && s.setopRight) html += `<span class="df-count">${s.before.total} + ${s.setopRight.total} → ${s.after.total} řádků</span>`;
  else if (s.before && s.after) html += `<span class="df-count">${s.before.total || '?'} → ${s.after.total} řádků</span>`;
  else if (s.after) html += `<span class="df-count">${s.after.total} řádků</span>`;
  html += '</div>';

  // CONDITION BOX
  html += renderConditionBox(s);

  // STEP-SPECIFIC BODY
  if (s.step === 'from') {
    // FROM: only output — rows animated on reveal
    html += '<div class="df-section df-section-output">';
    html += `<div class="df-section-label">Výstup (${s.after.total} řádků)</div>`;
    html += renderMiniTable(s.after.columns, s.after.rows, s.after.total);
    html += '</div>';

  } else if (s.step === 'join') {
    // JOIN: Venn + input tables → output
    html += '<div class="df-section df-section-input">';
    html += '<div class="df-join-input">';
    html += renderJoinVennBig(s.joinType || 'INNER', s.leftTableName || 'A', s.rightTableName || 'B');
    html += '</div>';
    html += `<div class="df-section-label">Vstup (${s.before.total} řádků)</div>`;
    html += renderMiniTable(s.before.columns, s.before.rows, s.before.total);
    html += '</div>';
    html += `<div class="df-divider"${forAnimation ? ' style="opacity:0"' : ''}>↓ Po spojení</div>`;
    html += `<div class="df-section df-section-output"${forAnimation ? ' style="opacity:0"' : ''}>`;
    html += `<div class="df-section-label">Výstup (${s.after.total} řádků)</div>`;
    html += renderMiniTable(s.after.columns, s.after.rows, s.after.total, s.newCols);
    html += '</div>';

  } else if (s.filter && s.before && s.after) {
    // WHERE / HAVING: colored rows input → filtered output
    const ac = s.activeCols || new Set();
    html += '<div class="df-section df-section-input">';
    html += `<div class="df-section-label">Vstup (${s.before.total} řádků)</div>`;
    html += renderWhereInputTable(s.before.columns, s.before.rows, s.before.total, ac, forAnimation);
    html += `<div class="df-counter">${s.after.total} z ${s.before.total} řádků prošlo filtrem</div>`;
    html += '</div>';
    html += `<div class="df-divider"${forAnimation ? ' style="opacity:0"' : ''}>↓ ${s.step === 'having' ? 'Po filtraci HAVING' : 'Po filtraci'}</div>`;
    html += `<div class="df-section df-section-output"${forAnimation ? ' style="opacity:0"' : ''}>`;
    html += `<div class="df-section-label">Výstup (${s.after.total} řádků)</div>`;
    html += renderMiniTable(s.after.columns, s.after.rows, s.after.total);
    html += '</div>';

  } else if (s.step === 'group' && s.groupData) {
    // GROUP BY: input with alternating groups → grouped output
    html += '<div class="df-section df-section-input">';
    html += `<div class="df-section-label">Vstup (${s.before.total} řádků)</div>`;
    html += renderGroupInputTable(s.groupData);
    html += '</div>';
    html += `<div class="df-divider"${forAnimation ? ' style="opacity:0"' : ''}>↓ Po seskupení</div>`;
    html += `<div class="df-section df-section-output"${forAnimation ? ' style="opacity:0"' : ''}>`;
    html += `<div class="df-section-label">Výstup (${s.after.total} skupin)</div>`;
    html += renderGroupOutputTable(s.groupData);
    html += '</div>';

  } else if (s.step === 'select' && s.removedCols) {
    // SELECT: all columns → selected columns only
    const removed = new Set(s.removedCols || []);
    html += '<div class="df-section df-section-input">';
    html += `<div class="df-section-label">Vstup (${s.before.columns.length} sloupců)</div>`;
    // Render input table with data-col on each th/td for animation targeting
    html += renderSelectInputTable(s.before.columns, s.before.rows, s.before.total, removed);
    html += '</div>';
    html += `<div class="df-divider"${forAnimation ? ' style="opacity:0"' : ''}>↓ Po projekci</div>`;
    html += `<div class="df-section df-section-output"${forAnimation ? ' style="opacity:0"' : ''}>`;
    html += `<div class="df-section-label">Výstup (${s.after.columns.length} sloupců)</div>`;
    html += renderMiniTable(s.after.columns, s.after.rows, s.after.total);
    html += '</div>';

  } else if (s.step === 'order' && s.sortCols) {
    // ORDER BY: before → after with sort col highlighted
    const sc = s.sortCols || new Set();
    html += '<div class="df-section df-section-input">';
    html += `<div class="df-section-label">Vstup (před řazením)</div>`;
    html += renderOrderInputTable(s.before.columns, s.before.rows, s.before.total, sc);
    html += '</div>';
    html += `<div class="df-divider"${forAnimation ? ' style="opacity:0"' : ''}>↓ Po seřazení</div>`;
    html += `<div class="df-section df-section-output"${forAnimation ? ' style="opacity:0"' : ''}>`;
    html += `<div class="df-section-label">Výstup (po řazení)</div>`;
    html += renderOrderOutputTable(s.after.columns, s.after.rows, s.after.total, sc);
    html += '</div>';

  } else if (s.step === 'case' && s.caseDetails) {
    // CASE WHEN
    html += '<div class="df-section">';
    html += renderCaseTable(s.caseDetails, s.caseExprs);
    html += '</div>';

  } else if (s.step === 'setop' && s.setopRight) {
    // Set operations (UNION, INTERSECT, MINUS)
    html += '<div class="df-section">';
    html += `<div class="df-section-label">Levá část (${s.before.total} řádků)</div>`;
    html += renderMiniTable(s.before.columns, s.before.rows, s.before.total);
    html += `<div class="df-section-label" style="margin-top:8px">Pravá část (${s.setopRight.total} řádků)</div>`;
    html += renderMiniTable(s.setopRight.columns, s.setopRight.rows, s.setopRight.total);
    html += '</div>';
    html += '<div class="df-divider">↓ Výsledek</div>';
    html += '<div class="df-section df-section-output">';
    html += `<div class="df-section-label">Výstup (${s.after.total} řádků)</div>`;
    html += renderMiniTable(s.after.columns, s.after.rows, s.after.total);
    html += '</div>';

  } else if (s.before && s.after) {
    // Generic before/after
    html += '<div class="df-section">';
    html += `<div class="df-section-label">Vstup (${s.before.total} řádků)</div>`;
    html += renderMiniTable(s.before.columns, s.before.rows, s.before.total);
    html += '</div>';
    html += '<div class="df-divider">↓</div>';
    html += '<div class="df-section df-section-output">';
    html += `<div class="df-section-label">Výstup (${s.after.total} řádků)</div>`;
    html += renderMiniTable(s.after.columns, s.after.rows, s.after.total);
    html += '</div>';

  } else if (s.after) {
    // Only output
    html += '<div class="df-section">';
    html += `<div class="df-section-label">Výstup (${s.after.total} řádků)</div>`;
    html += renderMiniTable(s.after.columns, s.after.rows, s.after.total);
    html += '</div>';
  }

  html += '</div>';
  return html;
}

// SELECT input table: marks removed columns with data-removed for animation
export function renderSelectInputTable(columns, rows, total, removedSet) {
  if (!columns || columns.length === 0) return '';
  let h = '<table class="df-mini-table"><thead><tr>';
  for (const c of columns) {
    const rem = removedSet.has(c) ? ' data-removed="1"' : '';
    h += `<th${rem}>${escapeHTML(c)}</th>`;
  }
  h += '</tr></thead><tbody>';
  for (const r of rows) {
    h += '<tr>';
    for (const c of columns) {
      const v = r[c];
      const rem = removedSet.has(c) ? ' data-removed="1"' : '';
      h += v === null || v === undefined ? `<td${rem} class="df-null">NULL</td>` : `<td${rem}>${escapeHTML(String(v))}</td>`;
    }
    h += '</tr>';
  }
  if (total > rows.length) h += `<tr class="df-more-row"><td colspan="${columns.length}" class="df-more">… a dalších ${total - rows.length}</td></tr>`;
  h += '</tbody></table>';
  return h;
}

// ORDER BY input table: sort columns get background highlight
export function renderOrderInputTable(columns, rows, total, sortCols) {
  if (!columns || columns.length === 0) return '';
  let h = '<table class="df-mini-table"><thead><tr>';
  for (const c of columns) h += `<th${sortCols.has(c) ? ' class="df-order-sort-bg"' : ''}>${escapeHTML(c)}</th>`;
  h += '</tr></thead><tbody>';
  for (const r of rows) {
    h += '<tr>';
    for (const c of columns) {
      const v = r[c];
      const cls = sortCols.has(c) ? ' class="df-order-sort-bg"' : '';
      h += v === null || v === undefined ? `<td${cls}><span class="df-null">NULL</span></td>` : `<td${cls}>${escapeHTML(String(v))}</td>`;
    }
    h += '</tr>';
  }
  if (total > rows.length) h += `<tr class="df-more-row"><td colspan="${columns.length}" class="df-more">… a dalších ${total - rows.length}</td></tr>`;
  h += '</tbody></table>';
  return h;
}

// ORDER BY output table: sort columns highlighted + badge on header
export function renderOrderOutputTable(columns, rows, total, sortCols) {
  if (!columns || columns.length === 0) return '';
  let h = '<table class="df-mini-table"><thead><tr>';
  for (const c of columns) {
    const isSorted = sortCols.has(c);
    h += `<th${isSorted ? ' class="df-order-sort-bg"' : ''}>${escapeHTML(c)}${isSorted ? '<span class="df-order-badge">↕</span>' : ''}</th>`;
  }
  h += '</tr></thead><tbody>';
  for (const r of rows) {
    h += '<tr>';
    for (const c of columns) {
      const v = r[c];
      const cls = sortCols.has(c) ? ' class="df-order-sort-bg"' : '';
      h += v === null || v === undefined ? `<td${cls}><span class="df-null">NULL</span></td>` : `<td${cls}>${escapeHTML(String(v))}</td>`;
    }
    h += '</tr>';
  }
  if (total > rows.length) h += `<tr class="df-more-row"><td colspan="${columns.length}" class="df-more">… a dalších ${total - rows.length}</td></tr>`;
  h += '</tbody></table>';
  return h;
}

export function filterCols(columns, activeCols, newCols) {
  if (!activeCols || activeCols.size === 0) return columns;
  const keep = new Set(activeCols);
  if (newCols) for (const c of newCols) keep.add(c);
  return columns.filter(c => keep.has(c));
}

export function renderMiniTable(columns, rows, total, newCols, activeCols) {
  const cols = filterCols(columns, activeCols, newCols);
  if (!cols || cols.length === 0) return '';
  const nc = new Set(newCols || []);
  let h = '<table class="df-mini-table"><thead><tr>';
  for (const c of cols) h += `<th${nc.has(c) ? ' class="df-new-col"' : ''}>${escapeHTML(c)}</th>`;
  h += '</tr></thead><tbody>';
  for (const r of rows) {
    h += '<tr>';
    for (const c of cols) { const v = r[c]; h += v === null || v === undefined ? '<td class="df-null">NULL</td>' : `<td>${escapeHTML(String(v))}</td>`; }
    h += '</tr>';
  }
  if (total > rows.length) h += `<tr class="df-more-row"><td colspan="${cols.length}" class="df-more">… a dalších ${total - rows.length}</td></tr>`;
  h += '</tbody></table>';
  return h;
}

export function renderCaseTable(details, caseExprs) {
  if (!details || details.length === 0) return '';
  let h = '<table class="df-case-table"><thead><tr>';
  h += '<th>Hodnota</th><th>Splněná podmínka</th><th>→ Výsledek</th>';
  h += '</tr></thead><tbody>';
  for (const d of details) {
    const cls = d.match ? 'df-case-match' : 'df-case-skip';
    const inputStr = d.inputVal === null ? 'NULL' : String(d.inputVal);
    let condStr;
    if (d.isElse) {
      condStr = 'ELSE (žádný WHEN nesplněn)';
    } else if (d.when && d.when.when) {
      condStr = 'WHEN ' + describeExpr(d.when.when);
    } else {
      condStr = 'WHEN #' + (d.whenIdx + 1);
    }
    const resStr = d.result === null ? 'NULL' : String(d.result);
    h += `<tr class="${cls}">`;
    h += `<td>${escapeHTML(inputStr)}</td>`;
    h += `<td>${escapeHTML(condStr)}</td>`;
    h += `<td class="df-case-result">${escapeHTML(resStr)}</td>`;
    h += '</tr>';
  }
  h += '</tbody></table>';
  return h;
}

export function renderMixTable(columns, mixRows, activeCols) {
  const cols = filterCols(columns, activeCols);
  if (!cols || cols.length === 0) return '';
  let h = '<table class="df-mini-table"><thead><tr>';
  for (const c of cols) h += `<th>${escapeHTML(c)}</th>`;
  h += '<th></th></tr></thead><tbody>';
  for (const m of mixRows) {
    const r = m.row;
    h += `<tr class="${m.pass ? 'df-pass' : 'df-fail'}">`;
    for (const c of cols) { const v = r[c]; h += v === null || v === undefined ? '<td class="df-null">NULL</td>' : `<td>${escapeHTML(String(v))}</td>`; }
    h += `<td>${m.pass ? '✓' : '✗'}</td></tr>`;
  }
  h += '</tbody></table>';
  return h;
}

// ============================================================
// JOIN VENN DIAGRAM (legacy, kept for compatibility)
// ============================================================
export function renderJoinVenn(joinType) {
  const configs = {
    'INNER': {
      leftFill: 'rgba(188,140,255,0.15)', rightFill: 'rgba(188,140,255,0.15)', centerFill: 'rgba(188,140,255,0.55)',
      desc: 'Pouze shody z obou tabulek', label: 'INNER JOIN'
    },
    'LEFT': {
      leftFill: 'rgba(188,140,255,0.55)', rightFill: 'rgba(188,140,255,0.15)', centerFill: 'rgba(188,140,255,0.55)',
      desc: 'Vše z levé + shody z pravé (NULL kde není shoda)', label: 'LEFT JOIN'
    },
    'RIGHT': {
      leftFill: 'rgba(188,140,255,0.15)', rightFill: 'rgba(188,140,255,0.55)', centerFill: 'rgba(188,140,255,0.55)',
      desc: 'Vše z pravé + shody z levé (NULL kde není shoda)', label: 'RIGHT JOIN'
    },
    'FULL': {
      leftFill: 'rgba(188,140,255,0.55)', rightFill: 'rgba(188,140,255,0.55)', centerFill: 'rgba(188,140,255,0.55)',
      desc: 'Vše z obou tabulek (NULL kde není shoda)', label: 'FULL OUTER JOIN'
    },
    'CROSS': {
      leftFill: 'rgba(188,140,255,0.35)', rightFill: 'rgba(188,140,255,0.35)', centerFill: 'rgba(188,140,255,0.35)',
      desc: 'Kartézský součin — každý řádek s každým', label: 'CROSS JOIN'
    },
    'NATURAL': {
      leftFill: 'rgba(188,140,255,0.25)', rightFill: 'rgba(188,140,255,0.25)', centerFill: 'rgba(188,140,255,0.65)',
      desc: 'Auto-join podle shodných názvů sloupců', label: 'NATURAL JOIN'
    }
  };
  const cfg = configs[joinType] || configs['INNER'];
  // SVG Venn: two overlapping circles
  const r = 26, cx1 = 38, cx2 = 78, cy = 35, w = 116, h = 70;
  const stroke = 'rgba(188,140,255,0.7)';
  let svg = `<svg class="df-join-venn-svg" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
  // Left circle
  svg += `<circle cx="${cx1}" cy="${cy}" r="${r}" fill="${cfg.leftFill}" stroke="${stroke}" stroke-width="1.5"/>`;
  // Right circle
  svg += `<circle cx="${cx2}" cy="${cy}" r="${r}" fill="${cfg.rightFill}" stroke="${stroke}" stroke-width="1.5"/>`;
  // Center overlap highlight (clip path approach via a simple overlay circle if needed)
  // Labels
  svg += `<text x="${cx1-8}" y="${cy+4}" font-size="9" fill="rgba(188,140,255,0.9)" font-family="JetBrains Mono" font-weight="700" text-anchor="middle">A</text>`;
  svg += `<text x="${cx2+8}" y="${cy+4}" font-size="9" fill="rgba(188,140,255,0.9)" font-family="JetBrains Mono" font-weight="700" text-anchor="middle">B</text>`;
  svg += '</svg>';

  return `<div class="df-join-venn">${svg}<span class="df-join-type-badge">${cfg.label}</span><div class="df-join-desc">${cfg.desc}</div></div>`;
}
