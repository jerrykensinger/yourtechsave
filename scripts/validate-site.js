#!/usr/bin/env node
// YourTechSave site check. No dependencies. Run: node scripts/validate-site.js
// ERRORS fail the check (exit 1). WARNINGS are printed for review but never fail it.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const errors = [], warnings = [];
const err = m => errors.push(m), warn = m => warnings.push(m);
const today = new Date(); today.setHours(0, 0, 0, 0);
const DAY = 86400000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const parse = s => new Date(s + 'T00:00:00');

function load(rel) {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); }
  catch (e) { err(rel + ': cannot read or parse JSON (' + e.message + ')'); return null; }
}
function checkDate(where, field, v, { required = true, allowFuture = false } = {}) {
  if (v === null || v === undefined || v === '') { if (required) err(where + ': missing ' + field); return null; }
  if (typeof v !== 'string' || !ISO.test(v) || isNaN(parse(v))) { err(where + ': ' + field + ' is not a YYYY-MM-DD date (' + v + ')'); return null; }
  if (!allowFuture && parse(v) > today) err(where + ': ' + field + ' is in the future (' + v + ')');
  return parse(v);
}
function isUrl(v) { return typeof v === 'string' && /^https:\/\//.test(v); }

const wireless = load('data/wireless-providers.json');
const internet = load('data/internet-providers.json');
const promos = load('data/promotions.json');
const numbers = new Set(); // every price-like number found in the data files

function checkProviders(rel, data) {
  if (!data) return;
  const max = data.policy && data.policy.max_age_days;
  if (!Number.isFinite(max) || max <= 0) err(rel + ': policy.max_age_days missing or invalid');
  if (!Array.isArray(data.providers) || !data.providers.length) { err(rel + ': providers missing or empty'); return; }
  const ids = new Set();
  data.providers.forEach(p => {
    const w = rel + ' [' + (p.id || '?') + ']';
    if (!p.id) err(w + ': missing id'); else if (ids.has(p.id)) err(w + ': duplicate id'); else ids.add(p.id);
    if (!p.name) err(w + ': missing name');
    const d = checkDate(w, 'last_verified', p.last_verified);
    if (d && max) {
      const age = Math.floor((today - d) / DAY);
      if (age >= max - 1) warn(w + ': verified ' + age + ' day(s) ago; goes stale soon (limit ' + max + ')');
    }
    if (!isUrl(p.official_plans_url)) err(w + ': official_plans_url missing or not https');
    if (!Array.isArray(p.plans) || !p.plans.length) err(w + ': no plans');
    (p.plans || []).forEach(pl => {
      const pw = w + ' plan "' + (pl.name || '?') + '"';
      if (!pl.name) err(pw + ': missing name');
      if (pl.standard_monthly_price !== undefined && pl.standard_monthly_price !== null) {
        if (typeof pl.standard_monthly_price !== 'number' || !(pl.standard_monthly_price >= 0)) err(pw + ': standard_monthly_price is not a valid number');
        else numbers.add(pl.standard_monthly_price);
      }
      if (pl.source && !isUrl(pl.source)) err(pw + ': source is not https');
      [pl.display_price, pl.pricing_note].forEach(t => (String(t || '').match(/\$[\d,]+(?:\.\d+)?/g) || []).forEach(x => numbers.add(parseFloat(x.replace(/[$,]/g, '')))));
    });
    (p.facts || []).forEach(f => (JSON.stringify(f).match(/\$[\d,]+(?:\.\d+)?/g) || []).forEach(x => numbers.add(parseFloat(x.replace(/[$,]/g, '')))));
  });
}
checkProviders('data/wireless-providers.json', wireless);
checkProviders('data/internet-providers.json', internet);

if (promos) {
  const max = promos.policy && promos.policy.max_age_days;
  if (!Number.isFinite(max) || max <= 0) err('data/promotions.json: policy.max_age_days missing or invalid');
  const STATUSES = ['current', 'needs_review', 'ended'];
  const ids = new Set();
  (promos.promotions || []).forEach(p => {
    const w = 'promotions [' + (p.id || '?') + ']';
    if (!p.id) err(w + ': missing id'); else if (ids.has(p.id)) err(w + ': duplicate id'); else ids.add(p.id);
    ['provider', 'category', 'title', 'summary', 'eligibility'].forEach(f => { if (!p[f]) err(w + ': missing ' + f); });
    if (!STATUSES.includes(p.status)) err(w + ': status must be one of ' + STATUSES.join(', ') + ' (got ' + p.status + ')');
    if (!isUrl(p.source)) err(w + ': source missing or not https');
    checkDate(w, 'first_seen', p.first_seen);
    const end = checkDate(w, 'end_date', p.end_date, { required: false, allowFuture: true });
    if (p.status === 'needs_review') {
      if (!p.review_reason) err(w + ': needs_review promo has no review_reason');
      checkDate(w, 'last_verified', p.last_verified, { required: false });
    } else {
      const lv = checkDate(w, 'last_verified', p.last_verified);
      if (lv && max) {
        const age = Math.floor((today - lv) / DAY);
        if (p.status === 'current' && age >= max - 1) warn(w + ': verified ' + age + ' day(s) ago; will be hidden from Current soon');
      }
    }
    // Lifecycle rule: a passed end_date is a review trigger, never proof of ending.
    if (p.status === 'current' && end && end < today) warn(w + ': Current but published end_date ' + p.end_date + ' has passed; needs a provider re-check or status needs_review/ended');
    (JSON.stringify(p).match(/\$[\d,]+(?:\.\d+)?/g) || []).forEach(x => numbers.add(parseFloat(x.replace(/[$,]/g, ''))));
  });
}

// ---- HTML pages: internal links and hardcoded dollar figures ----
function walk(dir, out = []) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
    if (['.git', '.github', 'node_modules', 'scripts'].includes(e.name)) return;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.html')) out.push(p);
  });
  return out;
}
const pages = walk(ROOT);
const rel = f => path.relative(ROOT, f).split(path.sep).join('/');
function exists(target) {
  const p = path.join(ROOT, target);
  if (fs.existsSync(p) && fs.statSync(p).isFile()) return true;
  return fs.existsSync(path.join(p, 'index.html'));
}
const figureTally = [];
pages.forEach(f => {
  const html = fs.readFileSync(f, 'utf8');
  const here = path.posix.dirname('/' + rel(f));
  const re = /<(?:a|link|script|img)\b[^>]*?\s(?:href|src)="([^"]+)"/gi;
  let m;
  while ((m = re.exec(html))) {
    let u = m[1];
    if (/^(https?:|mailto:|tel:|#|data:|javascript:)/i.test(u)) continue;
    u = u.split('#')[0].split('?')[0];
    if (!u) continue;
    const abs = u.startsWith('/') ? u : path.posix.normalize(here + '/' + u);
    if (!exists(abs.replace(/^\//, ''))) err(rel(f) + ': broken internal link ' + m[1]);
  }
  if (/^(compare|guides)\//.test(rel(f))) {
    const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ');
    const found = [...new Set((text.match(/\$[\d,]+(?:\.\d+)?/g) || []))];
    const unknown = found.filter(x => !numbers.has(parseFloat(x.replace(/[$,]/g, ''))));
    if (found.length) figureTally.push({ page: rel(f), found, unknown });
  }
});
figureTally.forEach(t => {
  if (t.unknown.length) warn(t.page + ': hardcoded dollar figure(s) not found in any data file: ' + t.unknown.join(', '));
});

// Time-sensitive promo wording in static pages should be data-driven.
pages.filter(f => /^compare\//.test(rel(f))).forEach(f => {
  const text = fs.readFileSync(f, 'utf8').replace(/<[^>]+>/g, ' ');
  if (/currently advertises|limited[- ]time offer|for a limited time/i.test(text)) warn(rel(f) + ': static page states a current promotion; promotions belong in data/promotions.json');
});

// Sitemap entries must exist.
try {
  const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  (sm.match(/<loc>[^<]+<\/loc>/g) || []).forEach(l => {
    const u = l.replace(/<\/?loc>/g, '').replace(/^https:\/\/(www\.)?yourtechsave\.com/, '');
    if (!exists(u.replace(/^\//, ''))) err('sitemap.xml: ' + u + ' does not exist in the repo');
  });
} catch (e) { warn('sitemap.xml not readable'); }

console.log('Checked ' + pages.length + ' HTML pages and 3 data files.');
warnings.forEach(w => console.log('WARNING  ' + w));
errors.forEach(e => console.log('ERROR    ' + e));
console.log(errors.length + ' error(s), ' + warnings.length + ' warning(s).');
process.exit(errors.length ? 1 : 0);
