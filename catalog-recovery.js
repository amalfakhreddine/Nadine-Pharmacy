// Recover only missing catalog fields. Valid live edits and visibility win.
(function () {
  const byId = new Map(), byName = new Map();
  const key = v => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');
  for (const p of window.NADINE_PRELOADED_PRODUCTS || []) {
    byId.set(String(p.id), p);
    const name = key(p.name);
    byName.set(name, byName.has(name) ? null : p);
  }
  function price(value) {
    if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;
    if (typeof value !== 'string' || !value.trim()) return null;
    const s = value.trim().replace(/^\$\s*|\s*USD$/gi, '');
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(s)) return null;
    const n = Number(s.replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  window.nadinePrice = price;
  window.nadineMoney = v => { const n = price(v); return n === null ? 'Price unavailable' : '$' + n.toFixed(2); };
  window.nadineRecoverProduct = function (p) {
    if (!p) return p;
    const source = byId.get(String(p.id)) || byName.get(key(p.name));
    const result = {...p};
    if (source) {
      // Stock, active and category are deliberately not restored from old defaults.
      for (const field of ['name', 'description', 'barcode', 'meta']) {
        if (!String(result[field] || '').trim()) result[field] = source[field];
      }
      if (!Array.isArray(result.images) || !result.images.length) result.images = [...(source.images || [])];
    }
    result.price = price(p.price) ?? price(source?.price);
    return result;
  };
})();
