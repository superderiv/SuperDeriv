const derivAppID = "B5xH6FKkZi0OmFA";
const ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=B5xH6FKkZi0OmFA");

let symbolGroups = {
  Forex: [],
  Synthetic: [],
  Commodities: [],
  Crypto: [],
};

let symbolMeta = {}; // Holds apiSymbol → { minLot, pipSize, displayName }

let selectedSymbolAPI = "";

// STEP 1: Fetch all active symbols grouped by market
ws.onopen = () => {
  ws.send(JSON.stringify({ active_symbols: "brief", product_type: "basic" }));
};

ws.onmessage = (msg) => {
  const data = JSON.parse(msg.data);

  // Step 1: Populate symbols
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
          pip: sym.pip,
        };
      }
    });
    populateMarketType();
  }

  // Step 2: Get trading conditions like min lot
  if (data.trading_conditions) {
    const s = data.echo_req.symbol;
    symbolMeta[s].minLot = data.trading_conditions.stake_boundary.min || 0.01;
  }

  // Step 3: Get entry price (tick)
  if (data.tick) {
    document.getElementById("entryPrice").value = data.tick.quote.toFixed(5);
  }
};

// 👇 Populate Market Type dropdown
function populateMarketType() {
  const marketType = document.getElementById("marketType");
  Object.keys(symbolGroups).forEach(group => {
    if (symbolGroups[group].length > 0) {
      const opt = document.createElement("option");
      opt.value = group;
      opt.textContent = group;
      marketType.appendChild(opt);
    }
  });
}

// 🔁 Update Symbol dropdown when market type changes
document.getElementById("marketType").addEventListener("change", function () {
  const market = this.value;
  const symbolSelect = document.getElementById("symbol");
  symbolSelect.innerHTML = `<option value="">Select Symbol</option>`;
  if (symbolGroups[market]) {
    symbolGroups[market].forEach(({ display, api }) => {
      const option = document.createElement("option");
      option.value = api;
      option.textContent = display;
      symbolSelect.appendChild(option);
    });
  }
});

// 🔄 On symbol select → fetch conditions + price
document.getElementById("symbol").addEventListener("change", function () {
  const apiSymbol = this.value;
  selectedSymbolAPI = apiSymbol;

  if (!apiSymbol) return;

  // Request trading conditions
  ws.send(JSON.stringify({ trading_conditions: 1, symbol: apiSymbol }));

  // Request tick price
  ws.send(JSON.stringify({ ticks: apiSymbol }));
});

// 🧮 Handle form submit
document.getElementById("positionForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const tradeType = document.querySelector('input[name="tradeType"]:checked').value;
  const balance = parseFloat(document.getElementById("balance").value);
  const riskMode = document.querySelector('input[name="riskMode"]:checked').value;
  const riskValue = parseFloat(document.getElementById("riskValue").value);
  const entry = parseFloat(document.getElementById("entryPrice").value);
  const slMode = document.querySelector('input[name="slMode"]:checked').value;
  const slInput = parseFloat(document.getElementById("stopLoss").value);
  const tp = parseFloat(document.getElementById("takeProfit").value);

  const symbolInfo = symbolMeta[selectedSymbolAPI];
  if (!symbolInfo) return alert("Symbol info missing!");

  const contractSize = 100000; // Default contract size for most FX
  const pipDecimal = symbolInfo.pip || 0.0001;
  const minLot = symbolInfo.minLot || 0.01;

  // Convert SL to price
  let stopLossPrice = 0;
  if (slMode === "pips") {
    const pip = slInput * pipDecimal;
    stopLossPrice = tradeType === "Buy" ? entry - pip : entry + pip;
  } else {
    stopLossPrice = slInput;
  }

  const riskAmount = riskMode === "percent"
    ? (balance * riskValue) / 100
    : riskValue;

  const pipDifference = Math.abs(entry - stopLossPrice);
  const lotSize = riskAmount / (pipDifference * contractSize);
  const lossPotential = lotSize * contractSize * pipDifference;
  const profitPotential = lotSize * contractSize * Math.abs(tp - entry);
  const rrRatio = profitPotential / lossPotential;

  const resultHTML = `
    <h3>Results for ${symbolInfo.display}</h3>
    <ul>
      <li><strong>Min Lot:</strong> ${minLot}</li>
      <li><strong>Risk Amount:</strong> ${riskAmount.toFixed(2)}</li>
      <li><strong>Recommended Lot:</strong> ${lotSize.toFixed(4)}</li>
      <li><strong>Potential Loss:</strong> ${lossPotential.toFixed(2)}</li>
      <li><strong>Potential Profit:</strong> ${profitPotential.toFixed(2)}</li>
      <li><strong>RR Ratio:</strong> ${rrRatio.toFixed(2)} : 1</li>
    </ul>
  `;
  document.getElementById("result").innerHTML = resultHTML;

  // Show EA Suggestion
  const eaBox = document.getElementById("eaSuggestion");
  eaBox.style.display = lotSize < minLot ? "block" : "none";

  // Shareable message
  const shareText = `Super Deriv | Position Result:
Symbol: ${symbolInfo.display}
Lot: ${lotSize.toFixed(4)}
Risk: ${riskAmount.toFixed(2)}
RR: ${rrRatio.toFixed(2)}:1
https://superderiv.com`;

  document.getElementById("whatsappShare").href = "https://wa.me/?text=" + encodeURIComponent(shareText);
  document.getElementById("telegramShare").href = "https://t.me/share/url?text=" + encodeURIComponent(shareText);
});

function copyResult() {
  const text = document.getElementById("result").innerText;
  navigator.clipboard.writeText(text).then(() => alert("Copied!"));
}
