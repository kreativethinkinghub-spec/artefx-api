const CATEGORY_KEYS = {
  security: ['https','hsts','xframe','xcto','csp','referrer'],
  seo:      ['title','metaDesc','h1','canonical','viewport','ogTags','schema','robots','sitemap'],
  popia:    ['privacyLink','cookieBanner','formHttps'],
  ai:       ['llms','aiCrawl'],
  quality:  ['imgAlt','lang','pageSize'],
};

const CATEGORY_LABELS = {
  security: 'Security',
  seo:      'SEO',
  popia:    'POPIA Compliance',
  ai:       'AI-Readiness',
  quality:  'Page Quality',
};

function scoreColor(s) {
  if (s === 100) return '#16A34A';
  if (s >= 80)  return '#2B6BFF';
  if (s >= 60)  return '#FF7A1A';
  return '#DC2626';
}

function checksHtml(data, keys) {
  return keys.map(k => {
    const c = data.checks[k];
    if (!c) return '';
    const cls = c.pass ? 'pass' : 'fail';
    const badge = c.pass ? 'PASS' : 'FAIL';
    return `
    <div class="check-item ${cls}">
      <span class="badge badge-${cls}">${badge}</span>
      <div class="check-body">
        <strong>${c.label}</strong>
        <p>${c.detail}</p>
      </div>
    </div>`;
  }).join('');
}

function catRows(scores) {
  return Object.entries(CATEGORY_LABELS).map(([k, label]) => {
    const s = scores[k] ?? 0;
    return `
    <div class="cat-row">
      <span class="cat-name">${label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${s}%;background:${scoreColor(s)}"></div></div>
      <span class="cat-score" style="color:${scoreColor(s)}">${s}</span>
    </div>`;
  }).join('');
}

function sections(data) {
  return Object.entries(CATEGORY_KEYS).map(([k, keys], i) => {
    const label = CATEGORY_LABELS[k];
    const s = data.scores[k] ?? 0;
    return `
  <div class="glass sec-card">
    <div class="sec-head">
      <span class="sec-eyebrow">${String(i+1).padStart(2,'0')} — ${label}</span>
      <span class="sec-score-badge" style="color:${scoreColor(s)};border-color:${scoreColor(s)}22;background:${scoreColor(s)}11">${s} / 100</span>
    </div>
    <div class="check-list">${checksHtml(data, keys)}</div>
  </div>`;
  }).join('');
}

export function buildReportHtml(data, reportId) {
  const { url, scanned, scores } = data;
  const host = (() => { try { return new URL(url).hostname; } catch { return url; } })();
  const dateStr = new Date(scanned).toLocaleDateString('en-ZA', { day:'numeric', month:'long', year:'numeric' });
  const overall = scores.overall ?? 0;
  const totalPass = Object.values(data.checks).filter(c => c.pass).length;
  const totalFail = Object.values(data.checks).filter(c => !c.pass).length;

  return `<!DOCTYPE html>
<html lang="en-ZA">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>SENTINEL Report — ${host}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#f6f7f9;--ink:#0b0d12;--dim:#6b6e7a;--line:rgba(11,13,18,.08);--blue:#2B6BFF;--tang:#FF7A1A;--yel:#FFD400;--glass:rgba(255,255,255,.78);--ok:#16A34A;--ok-bg:rgba(22,163,74,.08);--ok-border:rgba(22,163,74,.18);--fail:#DC2626;--fail-bg:rgba(220,38,38,.07);--fail-border:rgba(220,38,38,.2);--mono:'JetBrains Mono',monospace}
html{background:var(--bg);color:var(--ink);font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{padding:0}
.aurora{position:fixed;inset:-20%;z-index:0;pointer-events:none;background:radial-gradient(circle at 18% 22%,rgba(43,107,255,.13),transparent 42%),radial-gradient(circle at 82% 18%,rgba(255,122,26,.09),transparent 42%),radial-gradient(circle at 55% 88%,rgba(255,212,0,.11),transparent 42%)}
.glass{background:var(--glass);border:1px solid rgba(255,255,255,.88);border-radius:22px;backdrop-filter:blur(24px) saturate(1.5);box-shadow:0 8px 32px rgba(11,13,18,.07),inset 0 1px 0 rgba(255,255,255,.9)}

/* COVER */
.cover{position:relative;z-index:1;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 32px;text-align:center;page-break-after:always;break-after:page}
.cover-card{width:100%;max-width:560px;padding:52px 48px;display:flex;flex-direction:column;align-items:center}
.cover-logo{margin-bottom:28px}
.cover-product{font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.28em;text-transform:uppercase;color:var(--tang);margin-bottom:10px}
.cover-title{font-size:34px;font-weight:900;letter-spacing:-.03em;line-height:1.1;color:var(--ink);margin-bottom:6px}
.cover-sub{font-size:13px;color:var(--dim);margin-bottom:32px;line-height:1.6}
.tri-bar{display:flex;height:4px;border-radius:3px;overflow:hidden;width:100%;margin-bottom:32px}
.tri-bar span:nth-child(1){flex:1;background:var(--blue)}
.tri-bar span:nth-child(2){flex:1;background:var(--tang)}
.tri-bar span:nth-child(3){flex:1;background:var(--yel)}
.cover-client-label{font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--dim);margin-bottom:6px}
.cover-client{font-family:var(--mono);font-size:20px;font-weight:700;color:var(--ink);margin-bottom:28px}
.cover-scores{display:flex;gap:16px;justify-content:center;margin-bottom:28px}
.cscore{text-align:center;padding:14px 20px;border-radius:16px}
.cscore-num{font-size:34px;font-weight:900;letter-spacing:-.04em;line-height:1}
.cscore-lbl{font-size:8px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--dim);margin-top:3px}
.cover-verdict{background:var(--ok-bg);border:1px solid var(--ok-border);color:var(--ok);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:7px 18px;border-radius:100px;margin-bottom:32px}
.cover-verdict.mixed{background:rgba(43,107,255,.08);border-color:rgba(43,107,255,.2);color:var(--blue)}
.cover-footer-line{font-size:11px;color:var(--dim)}
.cover-footer-line b{color:var(--blue);font-weight:700}

/* REPORT PAGES */
.wrap{position:relative;z-index:1;max-width:840px;margin:0 auto;padding:40px 24px 64px}
.doc-nav{display:flex;align-items:center;justify-content:space-between;padding:14px 22px;margin-bottom:24px;flex-wrap:wrap;gap:12px}
.brand{font-weight:900;font-size:16px;color:var(--ink)}
.brand b{color:var(--blue)}
.tag{font-family:var(--mono);font-size:9px;letter-spacing:.16em;color:var(--dim);border:1px solid var(--line);border-radius:6px;padding:3px 8px;text-transform:uppercase}
.nav-meta .site{font-family:var(--mono);font-size:13px;font-weight:700;color:var(--ink)}
.nav-meta .date{font-size:11px;color:var(--dim);margin-top:2px;text-align:right}
.hero-card{padding:36px;margin-bottom:16px;display:grid;grid-template-columns:auto 1fr;gap:36px;align-items:center}
.score-big{font-size:84px;font-weight:900;letter-spacing:-.05em;line-height:.9;color:var(--blue);text-align:center}
.score-sub{font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);margin-top:4px;text-align:center}
.verdict{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:4px 12px;border-radius:100px;margin-top:10px}
.verdict.ok{background:var(--ok-bg);border:1px solid var(--ok-border);color:var(--ok)}
.verdict.mixed{background:rgba(43,107,255,.08);border:1px solid rgba(43,107,255,.2);color:var(--blue)}
.hero-right h1{font-size:20px;font-weight:800;letter-spacing:-.02em;margin-bottom:4px}
.hero-right .sub{font-size:12px;color:var(--dim);margin-bottom:18px;line-height:1.5}
.cats{display:flex;flex-direction:column;gap:9px}
.cat-row{display:grid;grid-template-columns:110px 1fr 42px;align-items:center;gap:10px}
.cat-name{font-size:11px;font-weight:600;color:var(--dim)}
.bar-track{height:4px;background:rgba(11,13,18,.07);border-radius:100px}
.bar-fill{height:100%;border-radius:100px}
.cat-score{font-family:var(--mono);font-size:12px;font-weight:700;text-align:right}
.chips-row{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}
.chip{display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:14px;font-size:13px}
.chip-val{font-family:var(--mono);font-size:18px;font-weight:700;line-height:1}
.chip-lbl{font-size:10px;font-weight:600;color:var(--dim);letter-spacing:.04em}
.chip.ok{background:var(--ok-bg);border:1px solid var(--ok-border)}
.chip.ok .chip-val{color:var(--ok)}
.chip.fail{background:var(--fail-bg);border:1px solid var(--fail-border)}
.chip.fail .chip-val{color:var(--fail)}
.chip.neutral{background:rgba(11,13,18,.04);border:1px solid var(--line)}
.chip.neutral .chip-val{color:var(--dim)}
.sec-card{margin-bottom:14px}
.sec-head{display:flex;align-items:center;justify-content:space-between;padding:13px 20px;border-bottom:1px solid var(--line)}
.sec-eyebrow{font-size:10px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:var(--tang)}
.sec-score-badge{font-family:var(--mono);font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;border:1px solid}
.check-list{padding:2px 0}
.check-item{display:flex;gap:12px;align-items:flex-start;padding:11px 20px;border-bottom:1px solid var(--line)}
.check-item:last-child{border-bottom:none}
.badge{font-family:var(--mono);font-size:8px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:3px 8px;border-radius:100px;flex-shrink:0;margin-top:2px;white-space:nowrap;border:1px solid}
.badge-pass{background:var(--ok-bg);color:var(--ok);border-color:var(--ok-border)}
.badge-fail{background:var(--fail-bg);color:var(--fail);border-color:var(--fail-border)}
.check-body strong{display:block;font-size:12px;font-weight:700;color:var(--ink);margin-bottom:1px}
.check-body p{font-size:11px;color:var(--dim);line-height:1.5}
.doc-foot{display:flex;align-items:center;justify-content:space-between;padding:14px 22px;margin-top:8px;flex-wrap:wrap;gap:8px}
.foot-left{font-size:11px;color:var(--dim)}
.foot-left b{color:var(--blue);font-weight:700}
.foot-right{font-family:var(--mono);font-size:9px;color:rgba(11,13,18,.28)}
@media print{@page{margin:0}.aurora{position:fixed!important}}
</style>
</head>
<body>
<div class="aurora"></div>

<!-- COVER -->
<div class="cover">
  <div class="glass cover-card">
    <div class="cover-logo">
      <svg width="60" height="60" viewBox="0 0 130 130" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ca" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4D8AFF"/><stop offset="100%" stop-color="#2B6BFF"/></linearGradient><linearGradient id="cb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FF9A40"/><stop offset="100%" stop-color="#FF7A1A"/></linearGradient><linearGradient id="cc" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFE04D"/><stop offset="100%" stop-color="#FFD400"/></linearGradient></defs><polygon points="65,72 114,90 65,108 16,90" fill="url(#ca)"/><polygon points="16,90 65,108 65,116 16,98" fill="#1a55e8"/><polygon points="114,90 65,108 65,116 114,98" fill="#2060ef"/><polygon points="65,42 106,57 65,72 24,57" fill="url(#cb)"/><polygon points="24,57 65,72 65,79 24,64" fill="#d46010"/><polygon points="106,57 65,72 65,79 106,64" fill="#e06818"/><polygon points="65,12 100,25 65,38 30,25" fill="url(#cc)"/><polygon points="30,25 65,38 65,44 30,31" fill="#d4aa00"/><polygon points="100,25 65,38 65,44 100,31" fill="#deb800"/></svg>
    </div>
    <div class="cover-product">ARTEFX SENTINEL™</div>
    <div class="cover-title">Website Intelligence<br>Report</div>
    <div class="cover-sub">Automated scan across Security, SEO,<br>POPIA Compliance, AI-Readiness &amp; Page Quality</div>
    <div class="tri-bar"><span></span><span></span><span></span></div>
    <div class="cover-client-label">Prepared for</div>
    <div class="cover-client">${host}</div>
    <div class="cover-scores">
      <div class="glass cscore"><div class="cscore-num" style="color:${scoreColor(overall)}">${overall}</div><div class="cscore-lbl">Overall Score</div></div>
      <div class="glass cscore"><div class="cscore-num" style="color:var(--ok)">${totalPass}</div><div class="cscore-lbl">Passed</div></div>
      <div class="glass cscore"><div class="cscore-num" style="color:${totalFail > 0 ? 'var(--fail)' : 'var(--dim)'}">${totalFail}</div><div class="cscore-lbl">Failed</div></div>
    </div>
    <div class="cover-verdict ${totalFail === 0 ? '' : 'mixed'}">${totalFail === 0 ? 'All ' + totalPass + ' checks passing · Perfect Score' : totalPass + ' passing · ' + totalFail + ' need attention'}</div>
    <div class="cover-footer-line">Scanned ${dateStr} &nbsp;·&nbsp; <b>ARTEFX</b> by KTH Tech &nbsp;·&nbsp; artefx.online</div>
  </div>
</div>

<!-- REPORT -->
<div class="wrap">
  <div class="glass doc-nav">
    <div style="display:flex;align-items:center;gap:10px">
      <span class="brand">ARTE<b>FX</b></span>
      <span class="tag">SENTINEL Report</span>
    </div>
    <div class="nav-meta">
      <div class="site">${host}</div>
      <div class="date">Scanned ${dateStr}</div>
    </div>
  </div>

  <div class="glass hero-card">
    <div>
      <div class="score-big">${overall}</div>
      <div class="score-sub">Overall Score</div>
      <div style="text-align:center"><div class="verdict ${totalFail === 0 ? 'ok' : 'mixed'}">${totalFail === 0 ? 'All ' + totalPass + ' Passing' : totalPass + ' Passing · ' + totalFail + ' Issues'}</div></div>
    </div>
    <div class="hero-right">
      <h1>${host} — Website Intelligence</h1>
      <p class="sub">Full SENTINEL scan across 5 categories. Scanned ${dateStr}.</p>
      <div class="tri-bar"><span></span><span></span><span></span></div>
      <div class="cats">${catRows(scores)}</div>
    </div>
  </div>

  <div class="chips-row">
    <div class="glass chip ok"><div><div class="chip-val">${totalPass}</div><div class="chip-lbl">Checks Passed</div></div></div>
    ${totalFail > 0 ? `<div class="glass chip fail"><div><div class="chip-val">${totalFail}</div><div class="chip-lbl">Need Fixing</div></div></div>` : ''}
    <div class="glass chip neutral" style="margin-left:auto"><div><div class="chip-val">${overall}</div><div class="chip-lbl">Score / 100</div></div></div>
  </div>

  ${sections(data)}

  <div class="glass doc-foot">
    <span class="foot-left">© 2026 <b>ARTEFX</b> — a KTH Tech studio · artefx.online</span>
    <span class="foot-right">${reportId}</span>
  </div>
</div>
</body>
</html>`;
}
