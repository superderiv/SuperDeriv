(async () => {
  const api = new window.DerivAPIBasic({ endpoint: 'ws.derivws.com', app_id: 'B5xH6FKkZi0OmFA', lang: 'EN' });

  const resp = await api.active_symbols({ active_symbols: 'brief', product_type: 'basic' });
  const groups = { Forex: [], Synthetic: [], Commodities: [], Crypto: [] };
  const meta = {};

  resp.active_symbols.forEach(sym => {
    const m = sym.market_display_name;
    if (groups[m]) {
      groups[m].push({ api: sym.symbol, display: sym.display_name });
      meta[sym.symbol] = { display: sym.display_name, pip: sym.pip };
    }
  });

  Object.entries(groups).forEach(([m,list]) => {
    if (list.length) {
      const opt = document.createElement('option');
      opt.value = m;
      opt.text = m;
      document.getElementById('marketType').append(opt);
    }
  });

  let selected = null;

  document.getElementById('marketType').addEventListener('change', e => {
    const sel = document.getElementById('symbol');
    sel.innerHTML = '<option value="">Select Symbol</option>';
    groups[e.target.value]?.forEach(item => {
      const o = document.createElement('option');
      o.value = item.api;
      o.text = item.display;
      sel.append(o);
    });
  });

  document.getElementById('symbol').addEventListener('change', async e => {
    selected = e.target.value;
    if (!selected) return;
    const tick = await api.ticks(selected);
    tick.onUpdate().subscribe(t => {
      document.getElementById('entryPrice').value = t.quote.toFixed(meta[selected].pip ?? 5);
    });
  });

  document.getElementById('rrForm').addEventListener('submit', e => {
    e.preventDefault();
    // calculation logic same as before using meta[selected].pip
  });
})();
