import DerivAPIBasic from 'https://cdn.jsdelivr.net/npm/@deriv/deriv-api/dist/DerivAPIBasic.js';

(async () => {
  const api = new DerivAPIBasic({ app_id: 'B5xH6FKkZi0OmFA', endpoint: 'ws.derivws.com', lang: 'EN' });
  const resp = await api.active_symbols({ active_symbols: 'brief', product_type: 'basic' });
  const symbolMeta = {};
  const symbolSelect = document.getElementById('symbol');
  symbolSelect.innerHTML = '<option value="">Select Symbol</option>';

  resp.active_symbols.forEach(sym => {
    symbolMeta[sym.symbol] = { display: sym.display_name, pip: sym.pip };
    const opt = document.createElement('option');
    opt.value = sym.symbol;
    opt.text = sym.display_name;
    symbolSelect.append(opt);
  });

  let selectedSymbol = null;

  symbolSelect.addEventListener('change', async () => {
    selectedSymbol = symbolSelect.value;
    if (!selectedSymbol) return;

    const tc = await api.trading_conditions({ trading_conditions: 1, symbol: selectedSymbol });
    symbolMeta[selectedSymbol].minLot = tc.trading_conditions.stake_boundary.min;

    const tickSub = await api.ticks(selectedSymbol);
    tickSub.onUpdate().subscribe(t => {
      document.getElementById('entryPrice').value = t.quote.toFixed(symbolMeta[selectedSymbol].pip);
    });
  });

  document.getElementById('positionForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!selectedSymbol) return alert('Select a symbol.');

    const data = {
      scheme: new FormData(e.target),
      entry: parseFloat(document.getElementById('entryPrice').value),
      slMode: document.querySelector('input[name="slMode"]:checked').value,
      slVal: parseFloat(document.getElementById('stopLoss').value),
      tpVal: parseFloat(document.getElementById('takeProfit').value),
      balance: parseFloat(document.getElementById('balance').value),
      riskMode: document.querySelector('input[name="riskMode"]:checked').value,
      riskVal: parseFloat(document.getElementById('riskValue').value),
      tradeType: document.querySelector('input[name="tradeType"]:checked').value
    };

    const meta = symbolMeta[selectedSymbol];
    const pipUnit = meta.pip;
    const minLot = meta.minLot;
    const slPrice = data.slMode === 'pips'
      ? (data.tradeType === 'Buy' ? data.entry - data.slVal * pipUnit : data.entry + data.slVal * pipUnit)
      : data.slVal;

    const riskAmount = data.riskMode === 'percent'
      ? (data.balance * data.riskVal / 100)
      : data.riskVal;

    const pipDistance = Math.abs(data.entry - slPrice);
    const contractSize = 100000;
    const lotSize = riskAmount / (pipDistance * contractSize);
    const loss = lotSize * contractSize * pipDistance;
    const profit = lotSize * contractSize * Math.abs(data.tpVal - data.entry);
    const rr = profit / loss;

    document.getElementById('result').innerHTML = `
      <h3>Results for ${meta.display}</h3>
      <ul>
        <li><strong>Min Lot:</strong> ${minLot}</li>
        <li><strong>Recommended Lot:</strong> ${lotSize.toFixed(4)}</li>
        <li><strong>Potential Loss:</strong> ${loss.toFixed(2)}</li>
        <li><strong>Potential Profit:</strong> ${profit.toFixed(2)}</li>
        <li><strong>RR Ratio:</strong> ${rr.toFixed(2)} : 1</li>
      </ul>
    `;

    document.getElementById('eaSuggestion').style.display = lotSize < minLot ? 'block' : 'none';

    const share = `Super deriv | ${meta.display} result
Lot: ${lotSize.toFixed(4)}, RR: ${rr.toFixed(2)}
`;
    document.getElementById('whatsappShare').href = 'https://wa.me/?text=' + encodeURIComponent(share);
    document.getElementById('telegramShare').href = 'https://t.me/share/url?text=' + encodeURIComponent(share);
  });
})();
