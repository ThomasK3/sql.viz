import {
  DB, tokenize, parseSQL, executeAST, getTable, evalExpr, valuesEqual,
  collectColumns, exprName, describeExpr, escapeHTML, hasAgg, AGG_FN,
  evalExprR, cmpVals
} from '../engine.js';

// ============================================================
// HELPERS FOR DATA FLOW
// ============================================================
export function extractClauses(sql) {
  const tokens = tokenize(sql);
  const clauses = {};
  const KW_ORDER = ['SELECT','FROM','JOIN','LEFT','RIGHT','FULL','INNER','CROSS','NATURAL','WHERE','GROUP','HAVING','ORDER'];
  let depth = 0;
  const boundaries = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'paren_open') depth++;
    if (t.type === 'paren_close') depth--;
    if (depth === 0 && t.type === 'word' && KW_ORDER.includes(t.value.toUpperCase())) {
      const kw = t.value.toUpperCase();
      // JOIN variants: combine LEFT/RIGHT/FULL/INNER/CROSS/NATURAL with JOIN
      if (['LEFT','RIGHT','FULL','INNER','CROSS','NATURAL'].includes(kw)) {
        boundaries.push({ kw: 'JOIN', pos: t.pos });
      } else if (kw === 'GROUP' || kw === 'ORDER') {
        // GROUP BY / ORDER BY — skip the BY
        boundaries.push({ kw: kw + ' BY', pos: t.pos });
      } else {
        boundaries.push({ kw, pos: t.pos });
      }
    }
  }
  // Extract text between boundaries
  for (let i = 0; i < boundaries.length; i++) {
    const start = boundaries[i].pos;
    const end = i + 1 < boundaries.length ? boundaries[i + 1].pos : sql.length;
    const text = sql.slice(start, end).trim().replace(/\s+/g, ' ');
    const kw = boundaries[i].kw;
    if (clauses[kw]) {
      if (!Array.isArray(clauses[kw])) clauses[kw] = [clauses[kw]];
      clauses[kw].push(text);
    } else {
      clauses[kw] = text;
    }
  }
  return clauses;
}

// ============================================================
// STEPPED EXECUTOR (before/after for each SQL clause)
// ============================================================
function executeASTSteppedQuery(query, sqlText) {
  const steps = [];
  let rows = [];
  const aliasMap = {};
  const MAX_PREVIEW = 2;

  // Helper: get display columns from rows (skip internal keys)
  function displayCols(rs) {
    if (rs.length === 0) return [];
    const cols = [];
    for (const k of Object.keys(rs[0])) { if (k !== '__group__' && !k.includes('.')) cols.push(k); }
    return cols;
  }
  function snapshot(rs) { const c = displayCols(rs); return { columns: c, rows: rs.slice(0, MAX_PREVIEW), total: rs.length }; }
  function snapshotAnim(rs) { const c = displayCols(rs); const limit = Math.min(rs.length, 20); return { columns: c, rows: rs.slice(0, limit), total: rs.length }; }
  const clauses = sqlText ? extractClauses(sqlText) : {};
  let joinIdx = 0;

  // Helper: build colHL entries for a set of columns with a CSS class
  function buildColHL(activeCols, cssClass) {
    const m = new Map();
    for (const col of activeCols) {
      // Find which tables have this column
      for (const [tblName, tbl] of Object.entries(DB)) {
        if (tbl.columns.includes(col)) {
          const key = tblName + '\t' + col;
          if (!m.has(key)) m.set(key, new Set());
          m.get(key).add(cssClass);
        }
      }
    }
    return m;
  }
  // Helper: build colHL from expression with table-awareness via aliasMap
  function buildColHLFromExpr(expr, cssClass) {
    const m = new Map();
    const cols = [];
    (function walk(e) {
      if (!e) return;
      if (e.type === 'column') { cols.push({ table: e.table, name: e.name }); return; }
      if (e.type === 'binary') { walk(e.left); walk(e.right); return; }
      if (e.type === 'unary') { walk(e.operand); return; }
      if (e.type === 'agg') { walk(e.arg); return; }
      if (e.type === 'func') { e.args.forEach(walk); return; }
      if (e.type === 'case') { for(const w of e.whens){walk(w.when);walk(w.then);} if(e.else)walk(e.else); if(e.simple)walk(e.simple); return; }
      if (e.type === 'is_null') { walk(e.expr); return; }
      if (e.type === 'between') { walk(e.expr); walk(e.low); walk(e.high); return; }
      if (e.type === 'like') { walk(e.expr); return; }
      if (e.type === 'in') { walk(e.expr); if (e.values) e.values.forEach(walk); return; }
    })(expr);
    for (const c of cols) {
      if (c.table) {
        const realTbl = aliasMap[c.table] || c.table;
        const key = realTbl + '\t' + c.name;
        if (!m.has(key)) m.set(key, new Set());
        m.get(key).add(cssClass);
      } else {
        for (const [tblName, tbl] of Object.entries(DB)) {
          if (tbl.columns.includes(c.name)) {
            const key = tblName + '\t' + c.name;
            if (!m.has(key)) m.set(key, new Set());
            m.get(key).add(cssClass);
          }
        }
      }
    }
    return m;
  }

  // FROM
  if (query.from.length === 0) { rows = [{}]; }
  else if (query.from.length === 1) {
    const src = query.from[0];
    if (src.type === 'subquery') { const sr = executeAST(src.query); rows = sr.rows.map(r => { const row = {}; for (const [k,v] of Object.entries(r)) { if (src.alias) row[src.alias.toUpperCase()+'.'+k] = v; row[k] = v; } return row; }); if (src.alias) aliasMap[src.alias.toUpperCase()] = '__subquery__'; }
    else { const tbl = getTable(src.name); rows = tbl.rows.map(r => { const row = {}; for (const col of tbl.columns) { row[col]=r[col]; row[src.name+'.'+col]=r[col]; if(src.alias) row[src.alias+'.'+col]=r[col]; } return row; }); aliasMap[src.name]=src.name; if(src.alias) aliasMap[src.alias]=src.name; }
  } else {
    rows = [{}];
    for (const src of query.from) { const tbl=getTable(src.name); const nr=[]; for(const ex of rows){for(const r of tbl.rows){const row={...ex};for(const col of tbl.columns){row[col]=r[col];row[src.name+'.'+col]=r[col];if(src.alias)row[src.alias+'.'+col]=r[col];}nr.push(row);}} rows=nr; aliasMap[src.name]=src.name; if(src.alias) aliasMap[src.alias]=src.name; }
  }
  if (query.from.length > 0) {
    const fromTables = new Set(query.from.filter(f => f.type !== 'subquery').map(f => f.name.toUpperCase()));
    const fromNames = query.from.filter(f => f.type !== 'subquery').map(f => f.name).join(', ');
    steps.push({ step: 'from', label: clauses['FROM'] || 'FROM', before: null, after: snapshotAnim(rows),
      conditionText: clauses['FROM'] || 'FROM ' + fromNames,
      description: `Databáze načítá všech ${rows.length} řádků z tabulky ${fromNames}`,
      activeCols: new Set(),
      hlInfo: { tablesFrom: fromTables, tablesJoin: new Set(), colHL: new Map(), joinLinks: [] } });
  }

  // JOINs
  for (const join of query.joins) {
    const beforeRows = rows;
    const tbl=getTable(join.table); const ta=join.alias||join.table; aliasMap[join.table]=join.table; if(join.alias)aliasMap[join.alias]=join.table;
    function storeJC(c,rr,v){for(const col of tbl.columns){c[ta+'.'+col]=v===null?null:rr[col];if(!join.alias)c[join.table+'.'+col]=v===null?null:rr[col];if(!(col in c))c[col]=v===null?null:rr[col];}}
    if(join.using){const nr=[];for(const lr of rows){let m=false;for(const rr of tbl.rows){let ok=true;for(const col of join.using){if(!valuesEqual(lr[col],rr[col])){ok=false;break;}}if(ok){const c={...lr};storeJC(c,rr,1);nr.push(c);m=true;}}if(!m&&(join.type==='LEFT'||join.type==='FULL')){const c={...lr};storeJC(c,{},null);nr.push(c);}}rows=nr;}
    else if(join.on){const nr=[];for(const lr of rows){let m=false;for(const rr of tbl.rows){const c={...lr};storeJC(c,rr,1);if(evalExpr(join.on,c)){nr.push(c);m=true;}}if(!m&&(join.type==='LEFT'||join.type==='FULL')){const c={...lr};storeJC(c,{},null);nr.push(c);}}rows=nr;}
    else{const nr=[];for(const lr of rows){for(const rr of tbl.rows){const c={...lr};storeJC(c,rr,1);nr.push(c);}}rows=nr;}
    const jlabel = (join.alias ? join.table.toLowerCase() + ' ' + join.alias.toLowerCase() : join.table.toLowerCase());
    const joinActive = join.using ? new Set(join.using.map(c => c.toUpperCase())) : join.on ? collectColumns(join.on) : new Set();
    const joinClause = Array.isArray(clauses['JOIN']) ? clauses['JOIN'][joinIdx] : clauses['JOIN'];
    joinIdx++;
    // Build join highlight info
    const jColHL = join.on ? buildColHLFromExpr(join.on, 'hl-join-col') : new Map();
    const jLinks = [];
    if (join.using) {
      const prevTables = [...(steps.length > 0 && steps[0].hlInfo ? steps[0].hlInfo.tablesFrom : [])];
      for (const col of join.using) {
        const cu = col.toUpperCase();
        if (prevTables.length > 0) jLinks.push({ leftTable: prevTables[0], leftCol: cu, rightTable: join.table.toUpperCase(), rightCol: cu });
        const k1 = prevTables[0] + '\t' + cu, k2 = join.table.toUpperCase() + '\t' + cu;
        if (!jColHL.has(k1)) jColHL.set(k1, new Set()); jColHL.get(k1).add('hl-join-col');
        if (!jColHL.has(k2)) jColHL.set(k2, new Set()); jColHL.get(k2).add('hl-join-col');
      }
    } else if (join.on) {
      // Extract join links from ON: look for t1.col = t2.col patterns
      (function extractLinks(e) {
        if (!e) return;
        if (e.type === 'binary' && e.op === '=' && e.left.type === 'column' && e.right.type === 'column' && e.left.table && e.right.table) {
          jLinks.push({ leftTable: aliasMap[e.left.table] || e.left.table, leftCol: e.left.name, rightTable: aliasMap[e.right.table] || e.right.table, rightCol: e.right.name });
        }
        if (e.type === 'binary') { extractLinks(e.left); extractLinks(e.right); }
      })(join.on);
    }
    steps.push({ step: 'join', label: joinClause || 'JOIN ' + jlabel, joinType: join.type, before: snapshot(beforeRows), after: snapshot(rows), newCols: tbl.columns, activeCols: joinActive,
      conditionText: joinClause || (join.type + ' JOIN ' + jlabel),
      leftTableName: query.from[0] ? (query.from[0].alias || query.from[0].name) : '?',
      rightTableName: join.alias || join.table,
      hlInfo: { tablesFrom: new Set(), tablesJoin: new Set([join.table.toUpperCase()]), colHL: jColHL, joinLinks: jLinks } });
  }

  // WHERE
  if (query.where) {
    const beforeRows = rows;
    const passed = [], failed = [];
    // Všechny řádky s pass/fail statusem (max 20 pro animaci)
    const allMix = [];
    for (const r of beforeRows) {
      const ok = evalExpr(query.where, r) === true;
      if (ok) passed.push(r); else failed.push(r);
      if (allMix.length < 20) allMix.push({ row: r, pass: ok });
    }
    rows = passed;
    steps.push({ step: 'where', label: clauses['WHERE'] || 'WHERE',
      before: { columns: displayCols(beforeRows), rows: allMix, total: beforeRows.length },
      after: snapshotAnim(rows), filter: true,
      conditionText: describeExpr(query.where),
      description: `${passed.length} z ${beforeRows.length} řádků prošlo filtrem`,
      activeCols: collectColumns(query.where),
      hlInfo: { tablesFrom: new Set(), tablesJoin: new Set(), colHL: buildColHLFromExpr(query.where, 'hl-where'), joinLinks: [] } });
  }

  // GROUP BY
  if (query.groupBy.length > 0) {
    const beforeRows = rows;
    const g = new Map();
    for (const r of rows) { const k = query.groupBy.map(e => { const v = evalExpr(e, r); return v === null ? '__NULL__' : String(v); }).join('|||'); if (!g.has(k)) g.set(k, []); g.get(k).push(r); }
    const gr = []; for (const [, grs] of g) gr.push({ __group__: grs, ...grs[0] }); rows = gr;
    const groupActive = new Set(); for (const e of query.groupBy) collectColumns(e).forEach(c => groupActive.add(c));
    const groupColHL = new Map(); for (const e of query.groupBy) { const m = buildColHLFromExpr(e, 'hl-group'); for (const [k, v] of m) { if (!groupColHL.has(k)) groupColHL.set(k, new Set()); v.forEach(c => groupColHL.get(k).add(c)); } }
    const groupData = [];
    const groupCols = displayCols(beforeRows);
    for (const [key, members] of g) {
      groupData.push({ key: key.replace(/\|\|\|/g, ', '), rows: members.slice(0, 5), total: members.length, columns: groupCols });
    }
    steps.push({ step: 'group', label: clauses['GROUP BY'] || 'GROUP BY', before: snapshotAnim(beforeRows),
      after: { columns: displayCols(rows), rows: rows.slice(0, 20), total: rows.length, isGrouped: true, groups: [...g.values()].slice(0, 20).map(g => g.length) },
      groupData: groupData.slice(0, 10),
      conditionText: clauses['GROUP BY'] || 'GROUP BY ' + query.groupBy.map(e => exprName(e)).join(', '),
      description: `${g.size} skupin vytvořeno podle ${query.groupBy.map(e => exprName(e)).join(', ')}`,
      activeCols: groupActive,
      hlInfo: { tablesFrom: new Set(), tablesJoin: new Set(), colHL: groupColHL, joinLinks: [] } });
  } else if (hasAgg(query.columns) || query.having) {
    rows = [{ __group__: rows, ...(rows[0] || {}) }];
  }

  // HAVING
  if (query.having) {
    const beforeRows = rows;
    const passed = [], failed = [];
    const allMixH = [];
    for (const r of beforeRows) {
      const ok = evalExpr(query.having, r) === true;
      if (ok) passed.push(r); else failed.push(r);
      if (allMixH.length < 20) allMixH.push({ row: r, pass: ok });
    }
    rows = passed;
    steps.push({ step: 'having', label: clauses['HAVING'] || 'HAVING',
      before: { columns: displayCols(beforeRows), rows: allMixH, total: beforeRows.length },
      after: snapshotAnim(rows), filter: true,
      conditionText: describeExpr(query.having),
      description: `${passed.length} z ${beforeRows.length} skupin prošlo filtrem HAVING`,
      activeCols: collectColumns(query.having),
      hlInfo: { tablesFrom: new Set(), tablesJoin: new Set(), colHL: buildColHLFromExpr(query.having, 'hl-having'), joinLinks: [] } });
  }

  // CASE WHEN step — show evaluation of CASE expressions before SELECT
  const caseExprs = query.columns.filter(c => c.expr && c.expr.type === 'case');
  if (caseExprs.length > 0) {
    const caseDetails = [];
    const previewRows = rows.slice(0, 4);
    for (const col of caseExprs) {
      const ce = col.expr;
      const alias = (col.alias || 'CASE').toUpperCase();
      for (const row of previewRows) {
        const inputCol = collectColumns(ce).values().next().value;
        const inputVal = inputCol ? (row[inputCol] !== undefined ? row[inputCol] : null) : null;
        let matched = false;
        for (let wi = 0; wi < ce.whens.length; wi++) {
          const w = ce.whens[wi];
          let cond;
          if (ce.simple) {
            cond = valuesEqual(evalExpr(ce.simple, row), evalExpr(w.when, row));
          } else {
            cond = evalExpr(w.when, row) === true;
          }
          if (cond && !matched) {
            caseDetails.push({ inputVal, whenIdx: wi, when: w, result: evalExpr(w.then, row), match: true, alias });
            matched = true;
          }
        }
        if (!matched) {
          caseDetails.push({ inputVal, whenIdx: -1, when: null, result: ce.else ? evalExpr(ce.else, row) : null, match: false, alias, isElse: true });
        }
      }
    }
    steps.push({ step: 'case', label: 'CASE WHEN vyhodnocení', before: null, after: null, caseDetails, caseExprs: caseExprs.map(c => c.expr),
      hlInfo: { tablesFrom: new Set(), tablesJoin: new Set(), colHL: new Map(), joinLinks: [] } });
  }

  // SELECT
  const rc = [], rr = [];
  for (const col of query.columns) {
    if (col.type === 'star') { const ts = [...query.from, ...query.joins.map(j => ({ name: j.table, alias: j.alias }))]; for (const t of ts) { if (t.type === 'subquery') { if (rows.length > 0) for (const k of Object.keys(rows[0])) { if (k === '__group__') continue; if (!k.includes('.')) rc.push(k); } } else { const tb = getTable(t.name); for (const c of tb.columns) rc.push(c); } } }
    else { rc.push((col.alias || exprName(col.expr)).toUpperCase()); }
  }
  for (const row of rows) {
    const res = {}; let ci = 0;
    for (const col of query.columns) {
      if (col.type === 'star') { const ts = [...query.from, ...query.joins.map(j => ({ name: j.table, alias: j.alias }))]; for (const t of ts) { if (t.type === 'subquery') { for (const k of Object.keys(row)) { if (k === '__group__') continue; if (!k.includes('.')) { res[k] = row[k]; ci++; } } } else { const tb = getTable(t.name); for (const c of tb.columns) { const al = t.alias || t.name; res[rc[ci]] = row[al + '.' + c] !== undefined ? row[al + '.' + c] : row[c]; ci++; } } } }
      else { res[rc[ci]] = evalExpr(col.expr, row); ci++; }
    }
    rr.push(res);
  }
  const beforeSelect = snapshotAnim(rows);
  let fr = rr;
  if (query.distinct) { const seen = new Set(); fr = []; for (const r of rr) { const k = rc.map(c => r[c] === null ? '__NULL__' : String(r[c])).join('|||'); if (!seen.has(k)) { seen.add(k); fr.push(r); } } }
  const selectActive = new Set(); for (const c of query.columns) { if (c.expr) collectColumns(c.expr).forEach(x => selectActive.add(x)); }
  const selectColHL = new Map(); for (const c of query.columns) { if (c.expr) { const m = buildColHLFromExpr(c.expr, 'hl-select'); for (const [k, v] of m) { if (!selectColHL.has(k)) selectColHL.set(k, new Set()); v.forEach(x => selectColHL.get(k).add(x)); } } }
  const removedCols = beforeSelect.columns.filter(c => !rc.includes(c));
  steps.push({ step: 'select', label: clauses['SELECT'] || 'SELECT', before: beforeSelect,
    after: { columns: rc, rows: fr.slice(0, 20), total: fr.length },
    removedCols: removedCols, selectedCols: rc,
    conditionText: rc.join(', '),
    description: removedCols.length > 0 ? 'Projekce — vybrány sloupce: ' + rc.join(', ') : 'Všechny sloupce zachovány',
    activeCols: selectActive,
    hlInfo: { tablesFrom: new Set(), tablesJoin: new Set(), colHL: selectColHL, joinLinks: [] } });

  // ORDER BY
  if (query.orderBy.length > 0) {
    const beforeOrderRows = fr.slice(0, 20);
    fr.sort((a, b) => { for (const ob of query.orderBy) { const va = evalExprR(ob.expr, a, rc), vb = evalExprR(ob.expr, b, rc), c = cmpVals(va, vb); if (c !== 0) return ob.dir === 'DESC' ? -c : c; } return 0; });
    const afterOrderRows = fr.slice(0, 20);
    // Mapování: kde se každý řádek posunul (before index → after index)
    const orderMap = afterOrderRows.map(ar => beforeOrderRows.indexOf(ar));
    const orderActive = new Set(); for (const o of query.orderBy) collectColumns(o.expr).forEach(c => orderActive.add(c));
    const orderColHL = new Map(); for (const o of query.orderBy) { const m = buildColHLFromExpr(o.expr, 'hl-order'); for (const [k, v] of m) { if (!orderColHL.has(k)) orderColHL.set(k, new Set()); v.forEach(x => orderColHL.get(k).add(x)); } }
    const sortDesc = query.orderBy.map(o => exprName(o.expr) + (o.dir === 'DESC' ? ' DESC' : ' ASC')).join(', ');
    const sortCols = new Set(); for (const o of query.orderBy) { const n = exprName(o.expr); if (n !== '?') sortCols.add(n.toUpperCase()); }
    steps.push({ step: 'order', label: clauses['ORDER BY'] || 'ORDER BY',
      before: { columns: rc, rows: beforeOrderRows, total: fr.length },
      after: { columns: rc, rows: afterOrderRows, total: fr.length },
      orderMap: orderMap, sortCols: sortCols,
      conditionText: clauses['ORDER BY'] || 'ORDER BY ' + sortDesc,
      description: 'Řazení podle ' + sortDesc,
      activeCols: orderActive,
      hlInfo: { tablesFrom: new Set(), tablesJoin: new Set(), colHL: orderColHL, joinLinks: [] } });
  }

  return steps;
}

export function executeASTStepped(sql) {
  let query;
  try { query = parseSQL(sql); } catch(e) { return []; }

  // Handle set operations (UNION / INTERSECT / MINUS)
  if (query.type === 'set_op') {
    return executeASTSteppedSetOp(query, sql);
  }

  return executeASTSteppedQuery(query, sql);
}

function executeASTSteppedSetOp(query, sql) {
  const steps = [];
  const MAX_PREVIEW = 2;

  // Collect all parts of the set operation
  function collectParts(q) {
    if (q.type === 'set_op') {
      const left = collectParts(q.left);
      const right = collectParts(q.right);
      return [...left, { op: q.op, query: right[0].query }];
    }
    return [{ op: null, query: q }];
  }
  const parts = collectParts(query);

  // Split SQL text into sub-query texts
  const sqlParts = [];
  if (sql) {
    const upper = sql.toUpperCase();
    const splits = [];
    let depth = 0;
    for (let i = 0; i < sql.length; i++) {
      if (sql[i] === '(') depth++;
      else if (sql[i] === ')') depth--;
      else if (depth === 0) {
        for (const kw of ['UNION ALL', 'UNION', 'INTERSECT', 'MINUS']) {
          if (upper.substring(i, i + kw.length) === kw && (i === 0 || /\s/.test(sql[i-1])) && (i + kw.length >= sql.length || /\s/.test(sql[i + kw.length]))) {
            splits.push({ pos: i, len: kw.length });
            break;
          }
        }
      }
    }
    if (splits.length === 0) { sqlParts.push(sql); }
    else {
      let prev = 0;
      for (const sp of splits) { sqlParts.push(sql.substring(prev, sp.pos).trim()); prev = sp.pos + sp.len; }
      sqlParts.push(sql.substring(prev).trim());
    }
  }

  // Step through each SELECT sub-query
  const partResults = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const partSql = i < sqlParts.length ? sqlParts[i] : null;
    const partSteps = executeASTSteppedQuery(part.query, partSql);
    // Add sub-query label prefix
    const prefix = parts.length === 2 ? (i === 0 ? '① ' : '② ') : `${String.fromCodePoint(0x2460 + i)} `;
    for (const s of partSteps) {
      s.label = prefix + s.label;
      steps.push(s);
    }
    // Execute to get result
    const result = executeAST(part.query);
    partResults.push(result);

    // Add separator arrow between sub-queries
    if (i < parts.length - 1 && parts[i + 1].op) {
      // The op label step will be added as the merge step
    }
  }

  // Now add the merge step
  if (partResults.length >= 2) {
    let merged = partResults[0];
    let opLabel = '';
    let partIdx = 1;
    // Re-walk the tree to get ops in order
    function getOps(q) {
      if (q.type === 'set_op') { const left = getOps(q.left); return [...left, q.op]; }
      return [];
    }
    const ops = getOps(query);

    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      const right = partResults[i + 1];
      const cols = merged.columns;
      const key = r => cols.map(c => { const v = r[c]; return v === null ? '__NULL__' : String(v); }).join('|||');

      let resultRows;
      if (op === 'UNION ALL') {
        resultRows = [...merged.rows, ...right.rows];
      } else if (op === 'UNION') {
        const seen = new Set();
        resultRows = [];
        for (const r of [...merged.rows, ...right.rows]) { const k = key(r); if (!seen.has(k)) { seen.add(k); resultRows.push(r); } }
      } else if (op === 'INTERSECT') {
        const leftKeys = new Set(merged.rows.map(key));
        resultRows = right.rows.filter(r => leftKeys.has(key(r)));
      } else if (op === 'MINUS') {
        const rightKeys = new Set(right.rows.map(key));
        resultRows = merged.rows.filter(r => !rightKeys.has(key(r)));
      }

      const beforeLeft = { columns: cols, rows: merged.rows.slice(0, MAX_PREVIEW), total: merged.rows.length };
      const beforeRight = { columns: right.columns, rows: right.rows.slice(0, MAX_PREVIEW), total: right.rows.length };

      steps.push({
        step: 'setop', label: op,
        before: beforeLeft, after: { columns: cols, rows: resultRows.slice(0, MAX_PREVIEW), total: resultRows.length },
        setopRight: beforeRight,
        hlInfo: { tablesFrom: new Set(), tablesJoin: new Set(), colHL: new Map(), joinLinks: [] }
      });

      merged = { columns: cols, rows: resultRows };
    }
  }

  return steps;
}
