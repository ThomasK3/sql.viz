// ============================================================
// DATABASE DATA
// ============================================================
export const DB = {
  ODDEL: {
    columns: ['CIS_ODD','NAZEV','SEF'],
    pk: 'CIS_ODD',
    rows: [
      {CIS_ODD:1, NAZEV:'PROJEKCE', SEF:6},
      {CIS_ODD:2, NAZEV:'KNIHOVNA', SEF:12},
      {CIS_ODD:3, NAZEV:'PROGRAMOVANI', SEF:20},
      {CIS_ODD:4, NAZEV:'BUFET', SEF:31},
      {CIS_ODD:6, NAZEV:'SKLAD', SEF:41},
      {CIS_ODD:7, NAZEV:'STB', SEF:null},
      {CIS_ODD:8, NAZEV:'PROVOZ POCITACE', SEF:51},
      {CIS_ODD:10, NAZEV:'REDITELSTVI', SEF:77},
    ]
  },
  ZAM: {
    columns: ['OS_CIS','JMENO','FCE','PLAT','TITUL','CIS_ODD','NADR'],
    pk: 'OS_CIS',
    rows: [
      {OS_CIS:1, JMENO:'KONADRA', FCE:'POSLICEK', PLAT:5400, TITUL:null, CIS_ODD:1, NADR:6},
      {OS_CIS:2, JMENO:'SYKORA', FCE:'BESTBOY', PLAT:6000, TITUL:null, CIS_ODD:1, NADR:6},
      {OS_CIS:3, JMENO:'STRNAD', FCE:'SVACINAR', PLAT:7500, TITUL:null, CIS_ODD:1, NADR:6},
      {OS_CIS:4, JMENO:'KOS', FCE:'PROJEKTANT', PLAT:10500, TITUL:'ING', CIS_ODD:1, NADR:6},
      {OS_CIS:5, JMENO:'KOS', FCE:'PROJEKTANT', PLAT:10800, TITUL:'ING', CIS_ODD:1, NADR:6},
      {OS_CIS:6, JMENO:'VOREL', FCE:'BOSS', PLAT:12000, TITUL:'ING', CIS_ODD:1, NADR:7},
      {OS_CIS:7, JMENO:'DATEL', FCE:'BOSS', PLAT:12600, TITUL:'RNDR', CIS_ODD:1, NADR:77},
      {OS_CIS:8, JMENO:'MALY', FCE:'POSLICEK', PLAT:6000, TITUL:null, CIS_ODD:2, NADR:11},
      {OS_CIS:9, JMENO:'DLOUHY', FCE:'KNIHOVNIK', PLAT:9000, TITUL:null, CIS_ODD:2, NADR:11},
      {OS_CIS:10, JMENO:'VYSOKY', FCE:'KNIHOVNIK', PLAT:10500, TITUL:null, CIS_ODD:2, NADR:11},
      {OS_CIS:11, JMENO:'TLUSTY', FCE:'KNIHOVNIK', PLAT:11100, TITUL:'ING', CIS_ODD:2, NADR:13},
      {OS_CIS:12, JMENO:'TLUSTY', FCE:'SVACINAR', PLAT:6000, TITUL:null, CIS_ODD:2, NADR:13},
      {OS_CIS:13, JMENO:'OTYLY', FCE:'BOSS', PLAT:12000, TITUL:'ING', CIS_ODD:2, NADR:14},
      {OS_CIS:14, JMENO:'OBROVSKY', FCE:'BOSS', PLAT:13500, TITUL:'RNDR', CIS_ODD:2, NADR:77},
      {OS_CIS:15, JMENO:'CERNY', FCE:'PROGRAMATOR', PLAT:7500, TITUL:null, CIS_ODD:3, NADR:21},
      {OS_CIS:16, JMENO:'CERVENY', FCE:'PROGRAMATOR', PLAT:9000, TITUL:null, CIS_ODD:3, NADR:21},
      {OS_CIS:17, JMENO:'ZELENY', FCE:'PROGRAMATOR', PLAT:10500, TITUL:'ING', CIS_ODD:3, NADR:21},
      {OS_CIS:18, JMENO:'ZELENY', FCE:'PROGRAMATOR', PLAT:10500, TITUL:'ING', CIS_ODD:3, NADR:21},
      {OS_CIS:19, JMENO:'FIALKA', FCE:'PROGRAMATOR', PLAT:10500, TITUL:'ING', CIS_ODD:3, NADR:21},
      {OS_CIS:20, JMENO:'FIALOVA', FCE:'PROGRAMATOR', PLAT:10200, TITUL:'RNDR', CIS_ODD:3, NADR:21},
      {OS_CIS:21, JMENO:'ZLATUSKA', FCE:'BOSS', PLAT:13500, TITUL:'RNDR', CIS_ODD:3, NADR:77},
      {OS_CIS:31, JMENO:'SEBESTOVA', FCE:'BOSS', PLAT:8400, TITUL:null, CIS_ODD:4, NADR:77},
      {OS_CIS:32, JMENO:'MACHOVA', FCE:'BUFETACKA', PLAT:7500, TITUL:null, CIS_ODD:4, NADR:31},
      {OS_CIS:33, JMENO:'HORACKOVA', FCE:'UKLIZECKA', PLAT:7500, TITUL:null, CIS_ODD:4, NADR:31},
      {OS_CIS:34, JMENO:'HORACKOVA', FCE:'BUFETACKA', PLAT:7800, TITUL:null, CIS_ODD:4, NADR:31},
      {OS_CIS:35, JMENO:'PAZOUTOVA', FCE:'MYCKA NADOBI', PLAT:6600, TITUL:null, CIS_ODD:4, NADR:31},
      {OS_CIS:36, JMENO:'KADRNOZKOVA', FCE:'MYCKA NADOBI', PLAT:6600, TITUL:null, CIS_ODD:4, NADR:31},
      {OS_CIS:37, JMENO:'JONATANOVA', FCE:'UKLIZECKA', PLAT:6600, TITUL:null, CIS_ODD:4, NADR:31},
      {OS_CIS:41, JMENO:'CECH', FCE:'BOSS', PLAT:9000, TITUL:'ING', CIS_ODD:6, NADR:77},
      {OS_CIS:42, JMENO:'SLOVAK', FCE:'SKLADNIK', PLAT:6600, TITUL:null, CIS_ODD:6, NADR:41},
      {OS_CIS:43, JMENO:'NEMEC', FCE:'SKLADNIK', PLAT:7200, TITUL:null, CIS_ODD:6, NADR:41},
      {OS_CIS:44, JMENO:'CECH', FCE:'SKLADNIK', PLAT:7500, TITUL:null, CIS_ODD:6, NADR:41},
      {OS_CIS:51, JMENO:'KOCOUR', FCE:'BOSS', PLAT:12900, TITUL:'DOC', CIS_ODD:8, NADR:77},
      {OS_CIS:52, JMENO:'KOCOUR', FCE:'SEF TECHNIK', PLAT:11400, TITUL:'ING', CIS_ODD:8, NADR:51},
      {OS_CIS:53, JMENO:'KOBYLKA', FCE:'TECHNIK', PLAT:10500, TITUL:'ING', CIS_ODD:8, NADR:52},
      {OS_CIS:54, JMENO:'KOCICKA', FCE:'TECHNIK', PLAT:10200, TITUL:null, CIS_ODD:8, NADR:52},
      {OS_CIS:55, JMENO:'PAPOUSEK', FCE:'TECHNIK', PLAT:10200, TITUL:null, CIS_ODD:8, NADR:52},
      {OS_CIS:77, JMENO:'SEFICEK', FCE:'REDITEL', PLAT:15000, TITUL:'DOC', CIS_ODD:10, NADR:null},
    ]
  },
  UKOLY: {
    columns: ['CIS_UK','POPIS','OS_CIS','DATUM'],
    pk: 'CIS_UK',
    rows: [
      {CIS_UK:101, POPIS:'PRINEST POSTU', OS_CIS:1, DATUM:'10/02/15'},
      {CIS_UK:102, POPIS:'ZAPLATIT SLOZENKY', OS_CIS:1, DATUM:'02/10/15'},
      {CIS_UK:105, POPIS:'POSTAVIT PODRIZENE DO LATE', OS_CIS:21, DATUM:'10/02/15'},
      {CIS_UK:106, POPIS:'ROZDELIT PRACI NA PROJEKTU FIS', OS_CIS:21, DATUM:'02/10/15'},
      {CIS_UK:107, POPIS:'ROZDELIT PRACI NA PROJEKTU KIS', OS_CIS:7, DATUM:'02/09/15'},
      {CIS_UK:108, POPIS:'DOJIT PRO SALAM A PIVKO', OS_CIS:3, DATUM:'02/11/15'},
      {CIS_UK:109, POPIS:'SEHNAT NECO NA ZUB', OS_CIS:12, DATUM:'15/10/15'},
      {CIS_UK:110, POPIS:'ZARADIT NOVE TITULY', OS_CIS:10, DATUM:'22/12/15'},
      {CIS_UK:111, POPIS:'DOKONCIT PROGRAM X57', OS_CIS:19, DATUM:'02/01/15'},
      {CIS_UK:112, POPIS:'ODLADIT ROZDELANE PROGRAMY', OS_CIS:20, DATUM:'02/12/15'},
      {CIS_UK:113, POPIS:'ZDOKUMENTOVAT PROGRAMY', OS_CIS:19, DATUM:'02/12/15'},
      {CIS_UK:114, POPIS:'PROVEST INVENTURU SKLADU C.13', OS_CIS:42, DATUM:'02/06/15'},
      {CIS_UK:115, POPIS:'KONECNE UKLIDIT', OS_CIS:37, DATUM:'10/07/15'},
      {CIS_UK:120, POPIS:'SEHNAT NOVE LIDI DO TYMU', OS_CIS:7, DATUM:'30/10/15'},
    ]
  },
  DUAL: {
    columns: ['DUMMY'],
    pk: null,
    rows: [{DUMMY: 'X'}]
  }
};

// ============================================================
// SQL.JS (SQLite via WASM) ENGINE
// ============================================================
let sqliteDB = null;

export async function initSQLite() {
  const SQL = await initSqlJs({
    locateFile: f => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.11.0/${f}`
  });
  sqliteDB = new SQL.Database();

  for (const [name, table] of Object.entries(DB)) {
    const colDefs = table.columns.map(c => {
      const sample = table.rows[0]?.[c];
      return `${c} ${typeof sample === 'number' ? 'NUMERIC' : 'TEXT'}`;
    }).join(', ');
    sqliteDB.run(`CREATE TABLE ${name} (${colDefs})`);

    if (table.rows.length > 0) {
      const placeholders = table.columns.map(() => '?').join(',');
      const stmt = sqliteDB.prepare(`INSERT INTO ${name} VALUES (${placeholders})`);
      for (const row of table.rows) {
        stmt.bind(table.columns.map(c => row[c]));
        stmt.step();
        stmt.reset();
      }
      stmt.free();
    }
  }

  registerOracleFunctions(sqliteDB);
}

function registerOracleFunctions(db) {
  db.create_function("NVL", (a, b) => a === null ? b : a);
  db.create_function("NVL2", (a, b, c) => a !== null ? b : c);
  db.create_function("DECODE", function() {
    const args = Array.from(arguments);
    const expr = args[0];
    for (let i = 1; i < args.length - 1; i += 2) {
      if (expr === args[i] || (expr === null && args[i] === null)) return args[i + 1];
    }
    return args.length % 2 === 0 ? args[args.length - 1] : null;
  });
  db.create_function("INITCAP", s =>
    s === null ? null : s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  );
  db.create_function("LPAD", (s, len, pad) => {
    if (s === null) return null;
    s = String(s); pad = pad || ' ';
    return s.length >= len ? s.substring(0, len) : (pad.repeat(len) + s).slice(-len);
  });
  db.create_function("RPAD", (s, len, pad) => {
    if (s === null) return null;
    s = String(s); pad = pad || ' ';
    return s.length >= len ? s.substring(0, len) : (s + pad.repeat(len)).substring(0, len);
  });
  db.create_function("GREATEST", function() {
    const vals = Array.from(arguments).filter(x => x !== null);
    return vals.length === 0 ? null : Math.max(...vals);
  });
  db.create_function("LEAST", function() {
    const vals = Array.from(arguments).filter(x => x !== null);
    return vals.length === 0 ? null : Math.min(...vals);
  });
}

function rewriteSQL(sql) {
  let s = sql;
  s = s.replace(/\bSYSDATE\b/gi, "date('now')");
  s = s.replace(/\bMINUS\b/gi, 'EXCEPT');
  s = s.replace(/\bWHERE\s+ROWNUM\s*<=\s*(\d+)/gi, 'LIMIT $1');
  s = s.replace(/\bAND\s+ROWNUM\s*<=\s*(\d+)/gi, 'LIMIT $1');
  return s;
}

export function executeSQLite(sql) {
  if (!sqliteDB) throw new Error('SQLite engine se načítá...');
  const rewritten = rewriteSQL(sql);
  const results = sqliteDB.exec(rewritten);

  if (results.length === 0) {
    try {
      const colResult = sqliteDB.exec(rewritten.replace(/;?\s*$/, ' LIMIT 0'));
      if (colResult.length > 0) {
        return { columns: colResult[0].columns.map(c => c.toUpperCase()), rows: [] };
      }
    } catch(e) {}
    return { columns: [], rows: [] };
  }

  const res = results[0];
  const columns = res.columns.map(c => c.toUpperCase());
  const rows = res.values.map(vals => {
    const obj = {};
    columns.forEach((c, i) => { obj[c] = vals[i]; });
    return obj;
  });

  return { columns, rows };
}

// ============================================================
// SQL TOKENIZER
// ============================================================
export const TOKEN_PATTERNS = [
  { type: 'comment_line', regex: /--[^\n]*/ },
  { type: 'comment_block', regex: /\/\*[\s\S]*?\*\// },
  { type: 'string', regex: /'(?:[^']|'')*'/ },
  { type: 'dqstring', regex: /"(?:[^"]|"")*"/ },
  { type: 'number', regex: /\b\d+(?:\.\d+)?\b/ },
  { type: 'concat', regex: /\|\|/ },
  { type: 'op', regex: /[<>!=]=?|[+\-\/]/ },
  { type: 'paren_open', regex: /\(/ },
  { type: 'paren_close', regex: /\)/ },
  { type: 'comma', regex: /,/ },
  { type: 'dot', regex: /\./ },
  { type: 'star', regex: /\*/ },
  { type: 'word', regex: /[A-Za-z_ČŠŽÁÉÍÓÚŮÝŘŤĎŇčšžáéíóúůýřťďň][A-Za-z0-9_ČŠŽÁÉÍÓÚŮÝŘŤĎŇčšžáéíóúůýřťďň]*/ },
  { type: 'ws', regex: /\s+/ },
];

export function tokenize(sql) {
  const tokens = [];
  let pos = 0;
  while (pos < sql.length) {
    let matched = false;
    for (const pat of TOKEN_PATTERNS) {
      const m = sql.slice(pos).match(new RegExp('^(' + pat.regex.source + ')'));
      if (m) { tokens.push({ type: pat.type, value: m[1], pos }); pos += m[1].length; matched = true; break; }
    }
    if (!matched) { tokens.push({ type: 'unknown', value: sql[pos], pos }); pos++; }
  }
  return tokens;
}

// ============================================================
// KEYWORD SETS
// ============================================================
export const SELECT_KW = new Set(['SELECT','DISTINCT']);
export const FROM_KW = new Set(['FROM']);
export const WHERE_KW = new Set(['WHERE','AND','OR','NOT','IN','BETWEEN','LIKE','IS','NULL','EXISTS']);
export const JOIN_KW = new Set(['JOIN','INNER','LEFT','RIGHT','FULL','OUTER','CROSS','ON','USING','NATURAL']);
export const AGG_FN = new Set(['COUNT','SUM','AVG','MAX','MIN']);
export const SCALAR_FN = new Set(['ROUND','UPPER','LOWER','LENGTH','SUBSTR','TRIM','ABS','NVL','NVL2','NULLIF','COALESCE','MOD','CEIL','FLOOR','TRUNC','REPLACE','LPAD','RPAD','INSTR','INITCAP','TO_CHAR','TO_NUMBER','DECODE','GREATEST','LEAST','SIGN','POWER','SQRT']);

export function isJoinCtx(tokens, idx) {
  const w = tokens[idx].value.toUpperCase();
  if (w === 'JOIN') return true;
  for (let i = idx + 1; i < tokens.length && i < idx + 4; i++) {
    if (tokens[i].type === 'ws') continue;
    if (tokens[i].type === 'word' && tokens[i].value.toUpperCase() === 'JOIN') return true;
    break;
  }
  return false;
}

export function escapeHTML(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ============================================================
// SQL PARSER
// ============================================================
export function parseSQL(sql) {
  sql = sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const trimmed = sql.trim().replace(/;+\s*$/, '');
  if (!trimmed) throw new Error('Prázdný dotaz');
  const tokens = tokenize(trimmed).filter(t => t.type !== 'ws');
  if (tokens.length === 0) throw new Error('Prázdný dotaz');
  if (tokens[0].type !== 'word' || tokens[0].value.toUpperCase() !== 'SELECT') throw new Error('Dotaz musí začínat slovem SELECT');
  let q = parseSelect(tokens, 0);
  let pos = q.__endPos || tokens.length;
  while (pos < tokens.length && tokens[pos].type === 'word') {
    const kw = tokens[pos].value.toUpperCase();
    let op = null;
    if (kw === 'UNION') { pos++; if (pos < tokens.length && tokens[pos].type === 'word' && tokens[pos].value.toUpperCase() === 'ALL') { op = 'UNION ALL'; pos++; } else op = 'UNION'; }
    else if (kw === 'INTERSECT') { op = 'INTERSECT'; pos++; }
    else if (kw === 'MINUS') { op = 'MINUS'; pos++; }
    else break;
    if (pos < tokens.length && tokens[pos].type === 'word' && tokens[pos].value.toUpperCase() === 'SELECT') {
      const right = parseSelect(tokens, pos);
      q = { type: 'set_op', op, left: q, right };
      pos = right.__endPos || tokens.length;
    } else break;
  }
  return q;
}

function parseSelect(tokens, start) {
  let pos = start;
  const q = { type:'select', distinct:false, columns:[], from:[], joins:[], where:null, groupBy:[], having:null, orderBy:[] };
  pos++;
  if (pos < tokens.length && tokens[pos].type === 'word' && tokens[pos].value.toUpperCase() === 'DISTINCT') { q.distinct = true; pos++; }
  const cr = parseColumnList(tokens, pos); q.columns = cr.columns; pos = cr.pos;
  if (pos < tokens.length && tokens[pos].type === 'word' && tokens[pos].value.toUpperCase() === 'FROM') { pos++; const fr = parseFromClause(tokens, pos); q.from = fr.tables; pos = fr.pos; }
  while (pos < tokens.length) { const w = tokens[pos].type === 'word' ? tokens[pos].value.toUpperCase() : ''; if (['JOIN','INNER','LEFT','RIGHT','FULL','CROSS','NATURAL'].includes(w)) { const jr = parseJoin(tokens, pos); q.joins.push(jr.join); pos = jr.pos; } else break; }
  if (pos < tokens.length && tokens[pos].type === 'word' && tokens[pos].value.toUpperCase() === 'WHERE') { pos++; const wr = parseExpression(tokens, pos, ['GROUP','HAVING','ORDER','UNION','INTERSECT','MINUS']); q.where = wr.expr; pos = wr.pos; }
  if (pos < tokens.length && tokens[pos].type === 'word' && tokens[pos].value.toUpperCase() === 'GROUP') { pos++; if (pos < tokens.length && tokens[pos].type === 'word' && tokens[pos].value.toUpperCase() === 'BY') pos++; const gr = parseExpressionList(tokens, pos, ['HAVING','ORDER','UNION','INTERSECT','MINUS']); q.groupBy = gr.exprs; pos = gr.pos; }
  if (pos < tokens.length && tokens[pos].type === 'word' && tokens[pos].value.toUpperCase() === 'HAVING') { pos++; const hr = parseExpression(tokens, pos, ['ORDER','UNION','INTERSECT','MINUS']); q.having = hr.expr; pos = hr.pos; }
  if (pos < tokens.length && tokens[pos].type === 'word' && tokens[pos].value.toUpperCase() === 'ORDER') { pos++; if (pos < tokens.length && tokens[pos].type === 'word' && tokens[pos].value.toUpperCase() === 'BY') pos++; const or = parseOrderByList(tokens, pos); q.orderBy = or.items; pos = or.pos; }
  q.__endPos = pos;
  return q;
}
function parseColumnList(tokens, pos) { const cols=[]; while(pos<tokens.length){const w=tokens[pos].type==='word'?tokens[pos].value.toUpperCase():'';if(['FROM','WHERE','GROUP','HAVING','ORDER'].includes(w))break;if(tokens[pos].type==='star'){cols.push({type:'star'});pos++;}else{const er=parseExpr(tokens,pos);const col={type:'expr',expr:er.expr,alias:null};pos=er.pos;if(pos<tokens.length&&tokens[pos].type==='word'&&tokens[pos].value.toUpperCase()==='AS'){pos++;if(pos<tokens.length){col.alias=tokens[pos].type==='dqstring'?tokens[pos].value.slice(1,-1):tokens[pos].value;pos++;}}else if(pos<tokens.length&&tokens[pos].type==='word'){const nw=tokens[pos].value.toUpperCase();if(!['FROM','WHERE','GROUP','HAVING','ORDER','JOIN','INNER','LEFT','RIGHT','FULL','CROSS','NATURAL','ON','USING'].includes(nw)){col.alias=tokens[pos].value;pos++;}}cols.push(col);}if(pos<tokens.length&&tokens[pos].type==='comma'){pos++;continue;}break;}return{columns:cols,pos};}
function parseFromClause(tokens, pos) { const tables=[]; while(pos<tokens.length){const w=tokens[pos].type==='word'?tokens[pos].value.toUpperCase():'';if(['WHERE','GROUP','HAVING','ORDER','JOIN','INNER','LEFT','RIGHT','FULL','CROSS','NATURAL'].includes(w))break;if(tokens[pos].type==='paren_open'){pos++;const sq=parseSelect(tokens,pos);let d=1;while(pos<tokens.length&&d>0){if(tokens[pos].type==='paren_open')d++;else if(tokens[pos].type==='paren_close'){d--;if(d===0){pos++;break;}}pos++;}let al=null;if(pos<tokens.length&&tokens[pos].type==='word'&&tokens[pos].value.toUpperCase()==='AS')pos++;if(pos<tokens.length&&tokens[pos].type==='word'){const nw=tokens[pos].value.toUpperCase();if(!['WHERE','GROUP','HAVING','ORDER','JOIN','INNER','LEFT','RIGHT','FULL','CROSS','NATURAL'].includes(nw)){al=tokens[pos].value;pos++;}}tables.push({type:'subquery',query:sq,alias:al});}else if(tokens[pos].type==='word'){const t={type:'table',name:tokens[pos].value.toUpperCase(),alias:null};pos++;if(pos<tokens.length&&tokens[pos].type==='word'){const nw=tokens[pos].value.toUpperCase();if(nw==='AS'){pos++;if(pos<tokens.length&&tokens[pos].type==='word'){t.alias=tokens[pos].value.toUpperCase();pos++;}}else if(!['WHERE','GROUP','HAVING','ORDER','JOIN','INNER','LEFT','RIGHT','FULL','CROSS','NATURAL','ON','USING'].includes(nw)){t.alias=tokens[pos].value.toUpperCase();pos++;}}tables.push(t);}else break;if(pos<tokens.length&&tokens[pos].type==='comma'){pos++;continue;}break;}return{tables,pos};}
function parseJoin(tokens, pos) { let jt='INNER';const w=tokens[pos].value.toUpperCase();if(w==='LEFT'){jt='LEFT';pos++;if(pos<tokens.length&&tokens[pos].type==='word'&&tokens[pos].value.toUpperCase()==='OUTER')pos++;}else if(w==='RIGHT'){jt='RIGHT';pos++;if(pos<tokens.length&&tokens[pos].type==='word'&&tokens[pos].value.toUpperCase()==='OUTER')pos++;}else if(w==='FULL'){jt='FULL';pos++;if(pos<tokens.length&&tokens[pos].type==='word'&&tokens[pos].value.toUpperCase()==='OUTER')pos++;}else if(w==='CROSS'){jt='CROSS';pos++;}else if(w==='INNER')pos++;else if(w==='NATURAL'){jt='NATURAL';pos++;}if(pos<tokens.length&&tokens[pos].type==='word'&&tokens[pos].value.toUpperCase()==='JOIN')pos++;const tn=tokens[pos].value.toUpperCase();pos++;let al=null;if(pos<tokens.length&&tokens[pos].type==='word'){const nw=tokens[pos].value.toUpperCase();if(nw==='AS'){pos++;if(pos<tokens.length){al=tokens[pos].value.toUpperCase();pos++;}}else if(!['ON','USING','WHERE','GROUP','HAVING','ORDER','JOIN','INNER','LEFT','RIGHT','FULL','CROSS','NATURAL'].includes(nw)){al=tokens[pos].value.toUpperCase();pos++;}}const j={type:jt,table:tn,alias:al,on:null,using:null};if(pos<tokens.length&&tokens[pos].type==='word'&&tokens[pos].value.toUpperCase()==='ON'){pos++;const r=parseExpression(tokens,pos,['WHERE','GROUP','HAVING','ORDER','JOIN','INNER','LEFT','RIGHT','FULL','CROSS','NATURAL']);j.on=r.expr;pos=r.pos;}else if(pos<tokens.length&&tokens[pos].type==='word'&&tokens[pos].value.toUpperCase()==='USING'){pos++;if(pos<tokens.length&&tokens[pos].type==='paren_open'){pos++;j.using=[];while(pos<tokens.length&&tokens[pos].type!=='paren_close'){if(tokens[pos].type==='word')j.using.push(tokens[pos].value.toUpperCase());pos++;}if(pos<tokens.length)pos++;}}return{join:j,pos};}
function parseExpression(tokens, pos, sw) { const r=parseExpr(tokens,pos,sw); return{expr:r.expr,pos:r.pos}; }
function parseExpr(tokens, pos, sw) { return parseOr(tokens,pos,sw); }
function parseOr(t,p,s){let l=parseAnd(t,p,s);p=l.pos;while(p<t.length&&t[p].type==='word'&&t[p].value.toUpperCase()==='OR'){p++;const r=parseAnd(t,p,s);l={expr:{type:'binary',op:'OR',left:l.expr,right:r.expr},pos:r.pos};p=r.pos;}return l;}
function parseAnd(t,p,s){let l=parseNot(t,p,s);p=l.pos;while(p<t.length&&t[p].type==='word'&&t[p].value.toUpperCase()==='AND'){p++;const r=parseNot(t,p,s);l={expr:{type:'binary',op:'AND',left:l.expr,right:r.expr},pos:r.pos};p=r.pos;}return l;}
function parseNot(t,p,s){if(p<t.length&&t[p].type==='word'&&t[p].value.toUpperCase()==='NOT'){p++;const i=parseNot(t,p,s);return{expr:{type:'unary',op:'NOT',operand:i.expr},pos:i.pos};}return parseComparison(t,p,s);}
function parseComparison(t,p,s){let l=parseConcat(t,p,s);p=l.pos;if(p>=t.length)return l;if(t[p].type==='word'&&t[p].value.toUpperCase()==='IS'){p++;let n=false;if(p<t.length&&t[p].type==='word'&&t[p].value.toUpperCase()==='NOT'){n=true;p++;}if(p<t.length&&t[p].type==='word'&&t[p].value.toUpperCase()==='NULL'){p++;return{expr:{type:'is_null',expr:l.expr,not:n},pos:p};}}if(t[p].type==='word'&&t[p].value.toUpperCase()==='IN'){p++;if(p<t.length&&t[p].type==='paren_open'){const p2=p+1+(t[p+1]&&t[p+1].type==='ws'?1:0);const isSubq=p+1<t.length&&t[p+1].type==='word'&&t[p+1].value.toUpperCase()==='SELECT';if(isSubq){p++;const sq=parseSelect(t,p);let d=1;while(p<t.length&&d>0){if(t[p].type==='paren_open')d++;else if(t[p].type==='paren_close'){d--;if(d===0){p++;break;}}p++;}return{expr:{type:'in',expr:l.expr,values:[{type:'subquery',query:sq}]},pos:p};}else{p++;const v=[];while(p<t.length&&t[p].type!=='paren_close'){if(t[p].type==='comma'){p++;continue;}const x=parseExpr(t,p,s);v.push(x.expr);p=x.pos;}if(p<t.length)p++;return{expr:{type:'in',expr:l.expr,values:v},pos:p};}}}if(t[p].type==='word'&&t[p].value.toUpperCase()==='NOT'&&p+1<t.length&&t[p+1].type==='word'&&t[p+1].value.toUpperCase()==='IN'){p+=2;if(p<t.length&&t[p].type==='paren_open'){const isSubq=p+1<t.length&&t[p+1].type==='word'&&t[p+1].value.toUpperCase()==='SELECT';if(isSubq){p++;const sq=parseSelect(t,p);let d=1;while(p<t.length&&d>0){if(t[p].type==='paren_open')d++;else if(t[p].type==='paren_close'){d--;if(d===0){p++;break;}}p++;}return{expr:{type:'unary',op:'NOT',operand:{type:'in',expr:l.expr,values:[{type:'subquery',query:sq}]}},pos:p};}else{p++;const v=[];while(p<t.length&&t[p].type!=='paren_close'){if(t[p].type==='comma'){p++;continue;}const x=parseExpr(t,p,s);v.push(x.expr);p=x.pos;}if(p<t.length)p++;return{expr:{type:'unary',op:'NOT',operand:{type:'in',expr:l.expr,values:v}},pos:p};}}}if(t[p].type==='word'&&t[p].value.toUpperCase()==='BETWEEN'){p++;const lo=parseConcat(t,p,s);p=lo.pos;if(p<t.length&&t[p].type==='word'&&t[p].value.toUpperCase()==='AND')p++;const hi=parseConcat(t,p,s);p=hi.pos;return{expr:{type:'between',expr:l.expr,low:lo.expr,high:hi.expr},pos:p};}if(t[p].type==='word'&&t[p].value.toUpperCase()==='LIKE'){p++;const pa=parseConcat(t,p,s);return{expr:{type:'like',expr:l.expr,pattern:pa.expr},pos:pa.pos};}if(t[p].type==='word'&&t[p].value.toUpperCase()==='NOT'&&p+1<t.length&&t[p+1].type==='word'&&t[p+1].value.toUpperCase()==='LIKE'){p+=2;const pa=parseConcat(t,p,s);return{expr:{type:'unary',op:'NOT',operand:{type:'like',expr:l.expr,pattern:pa.expr}},pos:pa.pos};}if(t[p].type==='op'){const op=t[p].value;if(['=','!=','<>','<','>','<=','>='].includes(op)){p++;const r=parseConcat(t,p,s);return{expr:{type:'binary',op:op==='<>'?'!=':op,left:l.expr,right:r.expr},pos:r.pos};}}return l;}
function parseConcat(t,p,s){let l=parseAddSub(t,p,s);p=l.pos;while(p<t.length&&t[p].type==='concat'){p++;const r=parseAddSub(t,p,s);l={expr:{type:'binary',op:'||',left:l.expr,right:r.expr},pos:r.pos};p=r.pos;}return l;}
function parseAddSub(t,p,s){let l=parseMulDiv(t,p,s);p=l.pos;while(p<t.length&&t[p].type==='op'&&(t[p].value==='+'||t[p].value==='-')){const op=t[p].value;p++;const r=parseMulDiv(t,p,s);l={expr:{type:'binary',op,left:l.expr,right:r.expr},pos:r.pos};p=r.pos;}return l;}
function parseMulDiv(t,p,s){let l=parseAtom(t,p,s);p=l.pos;while(p<t.length&&((t[p].type==='op'&&t[p].value==='/')||t[p].type==='star')){const op=t[p].type==='star'?'*':t[p].value;p++;const r=parseAtom(t,p,s);l={expr:{type:'binary',op,left:l.expr,right:r.expr},pos:r.pos};p=r.pos;}return l;}
function parseAtom(t,p,s){if(p>=t.length)return{expr:{type:'literal',value:null},pos:p};const tk=t[p];if(s&&tk.type==='word'&&s.includes(tk.value.toUpperCase()))return{expr:{type:'literal',value:null},pos:p};if(tk.type==='word'&&tk.value.toUpperCase()==='NULL')return{expr:{type:'literal',value:null},pos:p+1};if(tk.type==='number'){const n=tk.value.includes('.')?parseFloat(tk.value):parseInt(tk.value,10);return{expr:{type:'literal',value:n},pos:p+1};}if(tk.type==='string'){const v=tk.value.slice(1,-1).replace(/''/g,"'");return{expr:{type:'literal',value:v},pos:p+1};}if(tk.type==='star')return{expr:{type:'star'},pos:p+1};if(tk.type==='paren_open'){p++;if(p<t.length&&t[p].type==='word'&&t[p].value.toUpperCase()==='SELECT'){const sq=parseSelect(t,p);let d=1;while(p<t.length&&d>0){if(t[p].type==='paren_open')d++;else if(t[p].type==='paren_close'){d--;if(d===0){p++;break;}}p++;}return{expr:{type:'subquery',query:sq},pos:p};}const inner=parseExpr(t,p,s);p=inner.pos;if(p<t.length&&t[p].type==='paren_close')p++;return{expr:inner.expr,pos:p};}if(tk.type==='word'&&AGG_FN.has(tk.value.toUpperCase())){const fn=tk.value.toUpperCase();p++;if(p<t.length&&t[p].type==='paren_open'){p++;let dist=false;if(p<t.length&&t[p].type==='word'&&t[p].value.toUpperCase()==='DISTINCT'){dist=true;p++;}if(p<t.length&&t[p].type==='star'){p++;if(p<t.length&&t[p].type==='paren_close')p++;return{expr:{type:'agg',fn,arg:{type:'star'},distinct:dist},pos:p};}const a=parseExpr(t,p,s);p=a.pos;if(p<t.length&&t[p].type==='paren_close')p++;return{expr:{type:'agg',fn,arg:a.expr,distinct:dist},pos:p};}}if(tk.type==='word'&&tk.value.toUpperCase()==='CASE'){p++;const whens=[];let elseExpr=null;let simple=null;if(p<t.length&&t[p].type==='word'&&t[p].value.toUpperCase()!=='WHEN'){const sr=parseExpr(t,p,s);simple=sr.expr;p=sr.pos;}while(p<t.length&&t[p].type==='word'&&t[p].value.toUpperCase()==='WHEN'){p++;const wr=parseExpr(t,p,s);p=wr.pos;if(p<t.length&&t[p].type==='word'&&t[p].value.toUpperCase()==='THEN')p++;const tr=parseExpr(t,p,s);p=tr.pos;whens.push({when:wr.expr,then:tr.expr});}if(p<t.length&&t[p].type==='word'&&t[p].value.toUpperCase()==='ELSE'){p++;const er=parseExpr(t,p,s);elseExpr=er.expr;p=er.pos;}if(p<t.length&&t[p].type==='word'&&t[p].value.toUpperCase()==='END')p++;return{expr:{type:'case',simple,whens,else:elseExpr},pos:p};}if(tk.type==='word'&&tk.value.toUpperCase()==='EXISTS'&&p+1<t.length&&t[p+1].type==='paren_open'){p+=2;const sq=parseSelect(t,p);let d=1;while(p<t.length&&d>0){if(t[p].type==='paren_open')d++;else if(t[p].type==='paren_close'){d--;if(d===0){p++;break;}}p++;}return{expr:{type:'exists',query:sq,not:false},pos:p};}if(tk.type==='word'&&SCALAR_FN.has(tk.value.toUpperCase())&&p+1<t.length&&t[p+1].type==='paren_open'){const fn=tk.value.toUpperCase();p+=2;const args=[];while(p<t.length&&t[p].type!=='paren_close'){if(t[p].type==='comma'){p++;continue;}const a=parseExpr(t,p,s);args.push(a.expr);p=a.pos;}if(p<t.length)p++;return{expr:{type:'func',fn,args},pos:p};}if(tk.type==='word'){p++;if(p<t.length&&t[p].type==='dot'){p++;if(p<t.length&&(t[p].type==='word'||t[p].type==='star')){const c=t[p].type==='star'?'*':t[p].value.toUpperCase();p++;return{expr:{type:'column',table:tk.value.toUpperCase(),name:c},pos:p};}}return{expr:{type:'column',table:null,name:tk.value.toUpperCase()},pos:p};}if(tk.type==='op'&&tk.value==='-'){p++;const inner=parseAtom(t,p,s);return{expr:{type:'unary',op:'-',operand:inner.expr},pos:inner.pos};}p++;return{expr:{type:'literal',value:null},pos:p};}
function parseExpressionList(t,p,s){const e=[];while(p<t.length){if(t[p].type==='word'&&s&&s.includes(t[p].value.toUpperCase()))break;const r=parseExpr(t,p,s);e.push(r.expr);p=r.pos;if(p<t.length&&t[p].type==='comma'){p++;continue;}break;}return{exprs:e,pos:p};}
function parseOrderByList(t,p){const items=[];while(p<t.length){const r=parseExpr(t,p,[]);let d='ASC';p=r.pos;if(p<t.length&&t[p].type==='word'){const v=t[p].value.toUpperCase();if(v==='ASC'||v==='DESC'){d=v;p++;}}items.push({expr:r.expr,dir:d});if(p<t.length&&t[p].type==='comma'){p++;continue;}break;}return{items,pos:p};}

// ============================================================
// SQL EXECUTOR
// ============================================================
export function executeAST(query) {
  // Handle set operations (UNION, INTERSECT, MINUS)
  if (query.type === 'set_op') {
    const left = executeAST(query.left), right = executeAST(query.right);
    const cols = left.columns;
    const key = r => cols.map(c => { const v = r[c]; return v === null ? '__NULL__' : String(v); }).join('|||');
    if (query.op === 'UNION ALL') return { columns: cols, rows: [...left.rows, ...right.rows] };
    if (query.op === 'UNION') { const seen = new Set(); const res = []; for (const r of [...left.rows, ...right.rows]) { const k = key(r); if (!seen.has(k)) { seen.add(k); res.push(r); } } return { columns: cols, rows: res }; }
    if (query.op === 'INTERSECT') { const rKeys = new Set(right.rows.map(key)); const seen = new Set(); const res = []; for (const r of left.rows) { const k = key(r); if (rKeys.has(k) && !seen.has(k)) { seen.add(k); res.push(r); } } return { columns: cols, rows: res }; }
    if (query.op === 'MINUS') { const rKeys = new Set(right.rows.map(key)); const res = []; for (const r of left.rows) { if (!rKeys.has(key(r))) res.push(r); } return { columns: cols, rows: res }; }
  }
  let rows = [];
  const aliasMap = {};
  if (query.from.length === 0) { rows = [{}]; }
  else if (query.from.length === 1) {
    const src = query.from[0];
    if (src.type === 'subquery') { const sr = executeAST(src.query); rows = sr.rows.map(r => { const row = {}; for (const [k,v] of Object.entries(r)) { if (src.alias) row[src.alias.toUpperCase()+'.'+k] = v; row[k] = v; } return row; }); if (src.alias) aliasMap[src.alias.toUpperCase()] = '__subquery__'; }
    else { const tbl = getTable(src.name); rows = tbl.rows.map(r => { const row = {}; for (const col of tbl.columns) { row[col]=r[col]; row[src.name+'.'+col]=r[col]; if(src.alias) row[src.alias+'.'+col]=r[col]; } return row; }); aliasMap[src.name]=src.name; if(src.alias) aliasMap[src.alias]=src.name; }
  } else {
    rows = [{}];
    for (const src of query.from) { const tbl=getTable(src.name); const nr=[]; for(const ex of rows){for(const r of tbl.rows){const row={...ex};for(const col of tbl.columns){row[col]=r[col];row[src.name+'.'+col]=r[col];if(src.alias)row[src.alias+'.'+col]=r[col];}nr.push(row);}} rows=nr; aliasMap[src.name]=src.name; if(src.alias) aliasMap[src.alias]=src.name; }
  }
  for (const join of query.joins) {
    const tbl=getTable(join.table); const ta=join.alias||join.table; aliasMap[join.table]=join.table; if(join.alias)aliasMap[join.alias]=join.table;
    function storeJC(c,rr,v){for(const col of tbl.columns){c[ta+'.'+col]=v===null?null:rr[col];if(!join.alias)c[join.table+'.'+col]=v===null?null:rr[col];if(!(col in c))c[col]=v===null?null:rr[col];}}
    if(join.using){const nr=[];for(const lr of rows){let m=false;for(const rr of tbl.rows){let ok=true;for(const col of join.using){if(!valuesEqual(lr[col],rr[col])){ok=false;break;}}if(ok){const c={...lr};storeJC(c,rr,1);nr.push(c);m=true;}}if(!m&&(join.type==='LEFT'||join.type==='FULL')){const c={...lr};storeJC(c,{},null);nr.push(c);}}rows=nr;}
    else if(join.on){const nr=[];for(const lr of rows){let m=false;for(const rr of tbl.rows){const c={...lr};storeJC(c,rr,1);if(evalExpr(join.on,c)){nr.push(c);m=true;}}if(!m&&(join.type==='LEFT'||join.type==='FULL')){const c={...lr};storeJC(c,{},null);nr.push(c);}}rows=nr;}
    else{const nr=[];for(const lr of rows){for(const rr of tbl.rows){const c={...lr};storeJC(c,rr,1);nr.push(c);}}rows=nr;}
  }
  for(let i=0;i<rows.length;i++)rows[i].ROWNUM=i+1;
  if(query.where){rows=rows.filter(r=>evalExpr(query.where,r)===true);}
  if(query.groupBy.length>0){const g=new Map();for(const r of rows){const k=query.groupBy.map(e=>{const v=evalExpr(e,r);return v===null?'__NULL__':String(v);}).join('|||');if(!g.has(k))g.set(k,[]);g.get(k).push(r);}const gr=[];for(const[,grs]of g)gr.push({__group__:grs,...grs[0]});rows=gr;}
  else if(hasAgg(query.columns)||query.having){rows=[{__group__:rows,...(rows[0]||{})}];}
  if(query.having){rows=rows.filter(r=>evalExpr(query.having,r)===true);}
  const rc=[], rr=[];
  for(const col of query.columns){if(col.type==='star'){const ts=[...query.from,...query.joins.map(j=>({name:j.table,alias:j.alias}))];for(const t of ts){if(t.type==='subquery'){if(rows.length>0)for(const k of Object.keys(rows[0])){if(k==='__group__')continue;if(!k.includes('.'))rc.push(k);}}else{const tb=getTable(t.name);for(const c of tb.columns)rc.push(c);}}}else{let cn=(col.alias||exprName(col.expr)).toUpperCase();if(rc.includes(cn)){let s=2;while(rc.includes(cn+'_'+s))s++;cn=cn+'_'+s;}rc.push(cn);}}
  for(const row of rows){const res={};let ci=0;for(const col of query.columns){if(col.type==='star'){const ts=[...query.from,...query.joins.map(j=>({name:j.table,alias:j.alias}))];for(const t of ts){if(t.type==='subquery'){for(const k of Object.keys(row)){if(k==='__group__')continue;if(!k.includes('.')){res[k]=row[k];ci++;}}}else{const tb=getTable(t.name);for(const c of tb.columns){const al=t.alias||t.name;res[rc[ci]]=row[al+'.'+c]!==undefined?row[al+'.'+c]:row[c];ci++;}}}}else{res[rc[ci]]=evalExpr(col.expr,row);ci++;}}rr.push(res);}
  let fr=rr;if(query.distinct){const seen=new Set();fr=[];for(const r of rr){const k=rc.map(c=>r[c]===null?'__NULL__':String(r[c])).join('|||');if(!seen.has(k)){seen.add(k);fr.push(r);}}}
  if(query.orderBy.length>0){fr.sort((a,b)=>{for(const ob of query.orderBy){const va=evalExprR(ob.expr,a,rc),vb=evalExprR(ob.expr,b,rc),c=cmpVals(va,vb);if(c!==0)return ob.dir==='DESC'?-c:c;}return 0;});}
  return{columns:rc,rows:fr};
}
export function getTable(n){const u=n.toUpperCase();if(DB[u])return DB[u];throw new Error(`Tabulka "${n}" neexistuje. Dostupné: ${Object.keys(DB).join(', ')}`);}
export function valuesEqual(a,b){if(a===null||b===null)return false;return String(a).toUpperCase()===String(b).toUpperCase();}
export function evalExpr(e,r){if(!e)return null;switch(e.type){case'literal':return e.value;case'star':return null;case'column':{const n=e.name;if(n==='SYSDATE'){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}if(n==='ROWNUM')return r.ROWNUM||null;if(e.table){const q=e.table+'.'+n;if(q in r)return r[q];for(const k of Object.keys(r))if(k.toUpperCase()===q)return r[k];/* Qualified column not found — validate against DB */const realTbl=Object.keys(DB).find(t=>t===e.table)||(function(){for(const k of Object.keys(r)){const dot=k.indexOf('.');if(dot>0&&k.substring(0,dot)===e.table)return null;}return undefined;})();if(realTbl&&DB[realTbl]&&!DB[realTbl].columns.includes(n))throw new Error(`Sloupec "${e.table}.${n}" neexistuje. Tabulka ${realTbl} má sloupce: ${DB[realTbl].columns.join(', ')}`);return null;}if(n in r)return r[n];for(const k of Object.keys(r))if(k.toUpperCase()===n)return r[k];/* Bare column not found — check if it exists in any DB table */const knownCols=new Set();for(const tbl of Object.values(DB))for(const c of tbl.columns)knownCols.add(c);const internalKeys=new Set(['__group__','ROWNUM']);if(!knownCols.has(n)&&!internalKeys.has(n)){/* Check if it's an alias from SELECT (present in row keys) */let foundInRow=false;for(const k of Object.keys(r))if(k.toUpperCase()===n||k===n){foundInRow=true;break;}if(!foundInRow)throw new Error(`Sloupec "${n}" neexistuje v žádné tabulce. Dostupné: ${[...knownCols].join(', ')}`);}return null;}case'binary':{if(e.op==='AND')return evalExpr(e.left,r)===true&&evalExpr(e.right,r)===true;if(e.op==='OR')return evalExpr(e.left,r)===true||evalExpr(e.right,r)===true;const lv=evalExpr(e.left,r),rv=evalExpr(e.right,r);if(e.op==='||'){return (lv===null?'':String(lv))+(rv===null?'':String(rv));}if(e.op==='+'){if(lv===null||rv===null)return null;return Number(lv)+Number(rv);}if(e.op==='-'){if(lv===null||rv===null)return null;return Number(lv)-Number(rv);}if(e.op==='*'){if(lv===null||rv===null)return null;return Number(lv)*Number(rv);}if(e.op==='/'){if(lv===null||rv===null)return null;if(Number(rv)===0)throw new Error('Dělení nulou');return Number(lv)/Number(rv);}if(lv===null||rv===null)return null;if(e.op==='=')return valuesEqual(lv,rv);if(e.op==='!=')return!valuesEqual(lv,rv);if(e.op==='<')return Number(lv)<Number(rv);if(e.op==='>')return Number(lv)>Number(rv);if(e.op==='<=')return Number(lv)<=Number(rv);if(e.op==='>=')return Number(lv)>=Number(rv);return null;}case'unary':{if(e.op==='NOT'){const v=evalExpr(e.operand,r);return v===null?null:!v;}if(e.op==='-'){const v=evalExpr(e.operand,r);return v===null?null:-Number(v);}return null;}case'is_null':{const v=evalExpr(e.expr,r);return e.not?v!==null:v===null;}case'like':{const v=evalExpr(e.expr,r),p=evalExpr(e.pattern,r);if(v===null||p===null)return null;const ps=String(p).toUpperCase(),vs=String(v).toUpperCase();let ri=0,pi=0;function ml(ri,pi){if(pi>=ps.length)return ri>=vs.length;if(ps[pi]==='%'){while(pi<ps.length&&ps[pi]==='%')pi++;if(pi>=ps.length)return true;for(let i=ri;i<=vs.length;i++)if(ml(i,pi))return true;return false;}if(ri>=vs.length)return false;if(ps[pi]==='_'||ps[pi]===vs[ri])return ml(ri+1,pi+1);return false;}return ml(0,0);}case'in':{const v=evalExpr(e.expr,r);if(v===null)return null;for(const val of e.values){if(val.type==='subquery'){const res=executeAST(val.query);const col=res.columns[0];for(const row of res.rows){if(valuesEqual(v,row[col]))return true;}}else{if(valuesEqual(v,evalExpr(val,r)))return true;}}return false;}case'between':{const v=evalExpr(e.expr,r),lo=evalExpr(e.low,r),hi=evalExpr(e.high,r);if(v===null||lo===null||hi===null)return null;return Number(v)>=Number(lo)&&Number(v)<=Number(hi);}case'agg':{const g=r.__group__||[r],fn=e.fn;if(fn==='COUNT'){if(e.arg.type==='star')return g.length;let c=0;const sn=e.distinct?new Set():null;for(const x of g){const v=evalExpr(e.arg,x);if(v!==null){if(sn){const sv=String(v).toUpperCase();if(!sn.has(sv)){sn.add(sv);c++;}}else c++;}}return c;}const vs=[];const sn=e.distinct?new Set():null;for(const x of g){const v=evalExpr(e.arg,x);if(v!==null){if(sn){const sv=String(v).toUpperCase();if(!sn.has(sv)){sn.add(sv);vs.push(Number(v));}}else vs.push(Number(v));}}if(vs.length===0)return null;if(fn==='SUM')return vs.reduce((a,b)=>a+b,0);if(fn==='AVG')return vs.reduce((a,b)=>a+b,0)/vs.length;if(fn==='MAX')return Math.max(...vs);if(fn==='MIN')return Math.min(...vs);return null;}case'func':{const args=e.args.map(a=>evalExpr(a,r));const fn=e.fn;if(fn==='ROUND'){const v=args[0],n=args[1]??0;if(v===null)return null;const f=Math.pow(10,Number(n));return Math.round(Number(v)*f)/f;}if(fn==='TRUNC'){const v=args[0],n=args[1]??0;if(v===null)return null;const f=Math.pow(10,Number(n));return Math.trunc(Number(v)*f)/f;}if(fn==='UPPER')return args[0]===null?null:String(args[0]).toUpperCase();if(fn==='LOWER')return args[0]===null?null:String(args[0]).toLowerCase();if(fn==='LENGTH')return args[0]===null?null:String(args[0]).length;if(fn==='SUBSTR'){if(args[0]===null)return null;const str=String(args[0]),st=Number(args[1])-1;return args[2]!=null?str.substr(st,Number(args[2])):str.substr(st);}if(fn==='TRIM')return args[0]===null?null:String(args[0]).trim();if(fn==='ABS')return args[0]===null?null:Math.abs(Number(args[0]));if(fn==='NVL')return args[0]===null?args[1]:args[0];if(fn==='COALESCE'){for(const a of args)if(a!==null)return a;return null;}if(fn==='MOD')return args[0]===null||args[1]===null?null:Number(args[0])%Number(args[1]);if(fn==='CEIL')return args[0]===null?null:Math.ceil(Number(args[0]));if(fn==='FLOOR')return args[0]===null?null:Math.floor(Number(args[0]));if(fn==='REPLACE'){if(args[0]===null)return null;return String(args[0]).split(String(args[1])).join(String(args[2]??''));}if(fn==='LPAD'){if(args[0]===null)return null;return String(args[0]).padStart(Number(args[1]),String(args[2]??' '));}if(fn==='RPAD'){if(args[0]===null)return null;return String(args[0]).padEnd(Number(args[1]),String(args[2]??' '));}if(fn==='INSTR'){if(args[0]===null||args[1]===null)return null;const i=String(args[0]).indexOf(String(args[1]));return i===-1?0:i+1;}if(fn==='INITCAP'){if(args[0]===null)return null;return String(args[0]).toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());}if(fn==='TO_CHAR')return args[0]===null?null:String(args[0]);if(fn==='TO_NUMBER')return args[0]===null?null:Number(args[0]);if(fn==='GREATEST'){const vs=args.filter(a=>a!==null);return vs.length===0?null:Math.max(...vs.map(Number));}if(fn==='LEAST'){const vs=args.filter(a=>a!==null);return vs.length===0?null:Math.min(...vs.map(Number));}if(fn==='SIGN')return args[0]===null?null:Math.sign(Number(args[0]));if(fn==='POWER')return args[0]===null||args[1]===null?null:Math.pow(Number(args[0]),Number(args[1]));if(fn==='SQRT')return args[0]===null?null:Math.sqrt(Number(args[0]));if(fn==='DECODE'){const v=args[0];for(let i=1;i<args.length-1;i+=2){if(valuesEqual(v,args[i]))return args[i+1];}return args.length%2===0?args[args.length-1]:null;}if(fn==='NVL2'){return args[0]!==null?args[1]:args[2];}if(fn==='NULLIF'){return valuesEqual(args[0],args[1])?null:args[0];}return null;}case'case':{if(e.simple){const sv=evalExpr(e.simple,r);for(const w of e.whens){if(valuesEqual(sv,evalExpr(w.when,r)))return evalExpr(w.then,r);}return e.else?evalExpr(e.else,r):null;}for(const w of e.whens){if(evalExpr(w.when,r)===true)return evalExpr(w.then,r);}return e.else?evalExpr(e.else,r):null;}case'exists':{const res=executeAST(e.query);return res.rows.length>0;}case'subquery':{const res=executeAST(e.query);if(res.rows.length===0)return null;return res.rows[0][res.columns[0]];}}return null;}
export function evalExprR(e,r,rc){if(e.type==='column'&&!e.table){for(const c of rc)if(c.toUpperCase()===e.name)return r[c];}return evalExpr(e,r);}
export function cmpVals(a,b){if(a===null&&b===null)return 0;if(a===null)return-1;if(b===null)return 1;if(typeof a==='number'&&typeof b==='number')return a-b;const na=Number(a),nb=Number(b);if(!isNaN(na)&&!isNaN(nb))return na-nb;return String(a).localeCompare(String(b));}
export function hasAgg(cols){for(const c of cols)if(c.type==='expr'&&exprHasAgg(c.expr))return true;return false;}
export function exprHasAgg(e){if(!e)return false;if(e.type==='agg')return true;if(e.type==='binary')return exprHasAgg(e.left)||exprHasAgg(e.right);if(e.type==='unary')return exprHasAgg(e.operand);if(e.type==='func')return e.args.some(a=>exprHasAgg(a));if(e.type==='case'){for(const w of e.whens){if(exprHasAgg(w.when)||exprHasAgg(w.then))return true;}return e.else?exprHasAgg(e.else):false;}return false;}
export function exprName(e){if(!e)return'?';if(e.type==='column')return e.name;if(e.type==='literal')return e.value===null?'NULL':String(e.value);if(e.type==='agg')return e.fn+'('+(e.arg.type==='star'?'*':exprName(e.arg))+')';if(e.type==='func')return e.fn+'('+e.args.map(exprName).join(',')+')';if(e.type==='case')return'CASE';if(e.type==='binary')return exprName(e.left)+e.op+exprName(e.right);return'?';}

// ============================================================
// HELPER: collectColumns
// ============================================================
export function collectColumns(expr) {
  const cols = new Set();
  (function walk(e) {
    if (!e) return;
    if (e.type === 'column') { cols.add(e.name); return; }
    if (e.type === 'binary') { walk(e.left); walk(e.right); return; }
    if (e.type === 'unary') { walk(e.operand); return; }
    if (e.type === 'agg') { walk(e.arg); return; }
    if (e.type === 'func') { e.args.forEach(walk); return; }
    if (e.type === 'case') { for(const w of e.whens){walk(w.when);walk(w.then);} if(e.else)walk(e.else); if(e.simple)walk(e.simple); return; }
    if (e.type === 'is_null') { walk(e.expr); return; }
    if (e.type === 'between') { walk(e.expr); walk(e.low); walk(e.high); return; }
    if (e.type === 'like') { walk(e.expr); return; }
    if (e.type === 'in') { walk(e.expr); if (e.values) e.values.forEach(walk); return; }
    if (e.type === 'star') return;
  })(expr);
  return cols;
}

// ============================================================
// HELPER: describeExpr
// ============================================================
export function describeExpr(expr) {
  if (!expr) return '?';
  if (expr.type === 'literal') return expr.value === null ? 'NULL' : String(expr.value);
  if (expr.type === 'column') return (expr.table ? expr.table + '.' : '') + expr.name;
  if (expr.type === 'binary') {
    const l = describeExpr(expr.left), r = describeExpr(expr.right);
    return l + ' ' + expr.op + ' ' + r;
  }
  if (expr.type === 'is_null') return describeExpr(expr.expr) + (expr.not ? ' IS NOT NULL' : ' IS NULL');
  if (expr.type === 'between') return describeExpr(expr.expr) + ' BETWEEN ' + describeExpr(expr.low) + ' AND ' + describeExpr(expr.high);
  if (expr.type === 'like') return describeExpr(expr.expr) + (expr.not ? ' NOT LIKE ' : ' LIKE ') + "'" + expr.pattern + "'";
  if (expr.type === 'agg') return expr.fn + '(' + (expr.arg ? describeExpr(expr.arg) : '*') + ')';
  if (expr.type === 'func') return expr.fn + '(' + expr.args.map(describeExpr).join(', ') + ')';
  return '…';
}
