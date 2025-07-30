const derivAppID = "B5xH6FKkZi0OmFA";
const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${derivAppID}`);

let symbolGroups = {
  Forex: [],
  Synthetic: [],
  Commodities: [],
  Crypto: [],
};

let symbolMeta = {}; // apiSymbol → { display, pip }
let selectedSymbol = "";

// STEP 1: Load symbols grouped by market
ws.onopen = () => {
  ws.send(JSON.stringify({ active_symbols: "brief", product_type: "basic" }));
};

ws.onmessage = (msg) => {
  const data = JSON.parse(msg.data);

  if (data.active_symbols) {
    data.active_symbols.forEach(sym => {
      const market = sym.market_display_name;
      if (symbolGroups[market]) {
        symbolGroups[market].push({
          display: sym.display_name,
          api: sym.symbol
        });
        symbolMeta[sym.symbol] = {
          display: sym.display_name,
          pip: sym.pip
        };
      }
    });
    populateMarketDropdown();
  }

  if (data.tick) {
    document.getElementById("entryPrice").value = data.tick.quote.toFixed(5);
  }
};

// Populate Market dropdown
function populateMarketDropdown() {
  const marketDropdown = document.getElementById("marketType");
  Object.keys(symbolGroups).forEach(market => {
    if (symbolGroups[market].length > 0) {
      const opt = document.createElement("option");
      opt.value = market;
      opt.textContent = market;
      marketDropdown.appendChild(opt);
    }
  });
}

// Populate Symbol dropdown based on market
document.getElementById("marketType").addEventListener("change", function () {
  const selectedMarket = this.value;
  const symbolDropdown = document.getElementById("symbol");
  symbolDropdown.innerHTML = '<option value="">Select Symbol</option>';
  if (symbolGroups[selectedMarket]) {
    symbolGroups[selectedMarket].forEach(({ display, api }) => {
      const opt = document.createElement("option");
      opt.value = api;
      opt.textContent = display;
      symbolDropdown.appendChild(opt);
    });
  }
});

// On symbol selection → fetch tick
document.getElementById("symbol").addEventListener("change", function () {
  selectedSymbol = this.value;
  if (!selectedSymbol) return;

  ws.send(JSON.stringify({ ticks: selectedSymbol }));
});

// FORM SUBMIT
document.getElementById("rrForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const entry = parseFloat(document.getElementById("entryPrice").value);
  const slMode = document.querySelector('input[name="slMode"]:checked').value;
  const tpMode = document.querySelector('input[name="tpMode"]:checked').value;
  const slInput = parseFloat(document.getElementById("stopLoss").value);
  const tpInput = parseFloat(document.getElementById("takeProfit").value);

  if (!selectedSymbol || !entry || !slInput || !tpInput) {
    alert("Please fill all fields.");
    return;
  }

  const pip = symbolMeta[selectedSymbol]?.pip || 0.0001;

  const stopLoss = slMode === "pips" ? entry - (slInput * pip) : slInput;
  const takeProfit = tpMode === "pips" ? entry + (tpInput * pip) : tpInput;

  const loss = Math.abs(entry - stopLoss);
  const profit = Math.abs(takeProfit - entry);
  const rrRatio = profit / loss;

  document.getElementById("rrResult").innerHTML = `
    <h3>Risk Reward Ratio</h3>
    <ul>
      <li><strong>Stop Loss:</strong> ${loss.toFixed(5)}</li>
      <li><strong>Take Profit:</strong> ${profit.toFixed(5)}</li>
      <li><strong>RR Ratio:</strong> ${rrRatio.toFixed(2)} : 1</li>
    </ul>
  `;

  const displayName = symbolMeta[selectedSymbol]?.display || selectedSymbol;
  const shareMsg = `Super Deriv | RR Result
Symbol: ${displayName}
RR Ratio: ${rrRatio.toFixed(2)} : 1
Entry: ${entry}
SL: ${stopLoss.toFixed(5)}
TP: ${takeProfit.toFixed(5)}
https://superderiv.com`;

  document.getElementById("waRR").href = "https://wa.me/?text=" + encodeURIComponent(shareMsg);
  document.getElementById("tgRR").href = "https://t.me/share/url?text=" + encodeURIComponent(shareMsg);
});

// COPY
function copyRR() {
  const text = document.getElementById("rrResult").innerText;
  navigator.clipboard.writeText(text).then(() => alert("Copied!"));
}
