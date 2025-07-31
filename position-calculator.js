(async () => {
  const app_id = 'B5xH6FKkZi0OmFA';
  const api = new window.DerivAPIBasic({ endpoint: 'ws.derivws.com', app_id, lang: 'EN' });

  // Load active symbols
  const resp = await api.active_symbols({ active_symbols: 'brief', product_type: 'basic' });
  const symbols = resp.active_symbols;

  const symbolGroups = { Forex: [], Synthetic: [], Commodities: [], Crypto: [] };
  const symbolMeta = {};

  symbols.forEach(sym => {
    const market = sym.market_display_name;
    if (symbolGroups[market]) {
      symbolGroups[market].push({ api: sym.symbol, display: sym.display_name });
      symbolMeta[sym.symbol] = { display: sym.display_name, pip: sym.pip };
    }
  });

  // Populate market dropdown
  Object.entries(symbolGroups).forEach(([market, list]) => {
    if (list.length) {
      const opt = document.createElement('option');
      opt.value = market;
      opt.text = market;
      document.getElementById('marketType').append(opt);
    }
  });

  document.getElementById('marketType').addEventListener('change', e => {
    const sel = document.getElementById('symbol');
    sel.innerHTML = '<option value="">Select Symbol</option>';
    symbolGroups[e.target.value]?.forEach(item => {
      const o = document.createElement('option');
      o.value = item.api;
      o.text = item.display;
      sel.append(o);
    });
  });

  let selected = null;

  document.getElementById('symbol').addEventListener('change', async e => {
    selected = e.target.value;
    if (!selected) return;

    // fetch trading conditions
    const tc = await api.trading_conditions({ trading_conditions: 1, symbol: selected });
    symbolMeta[selected].minLot = tc.trading_conditions.stake_boundary.min;

    // subscribe tick stream
    const tickStream = await api.ticks(selected);
    tickStream.onUpdate().subscribe(t => {
      document.getElementById('entryPrice').value = t.quote.toFixed(tc.trading_conditions.pip ?? 5);
    });
  });

  // submit logic uses symbolMeta and contract pip conversion...
  // use similar calculation block you had
})();
