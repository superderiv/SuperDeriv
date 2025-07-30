const derivAppID = "B5xH6FKkZi0OmFA";
const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${derivAppID}`);

// Symbol mapping
const derivSymbols = {
  EURUSD: "frxEURUSD",
  AUDJPY: "frxAUDJPY",
  Boom1000: "boom_1000_index",
  Crash300: "crash_300_index",
  XAUUSD: "frxXAUUSD",
  XAGUSD: "frxXAGUSD",
  BTCUSD: "cryBTCUSD",
  ETHUSD: "cryETHUSD",
};

// Symbol data (contractSize, minLot)
const symbolData = {
  EURUSD: { minLot: 0.01, contractSize: 100000 },
  AUDJPY: { minLot: 0.01, contractSize: 100000 },
  Boom1000: { minLot: 0.2, contractSize: 1 },
  Crash300: { minLot: 0.2, contractSize: 1 },
  XAUUSD: { minLot: 0.01, contractSize: 100 },
  XAGUSD: { minLot: 0.01, contractSize: 5000 },
  BTCUSD: { minLot: 0.01, contractSize: 1 },
  ETHUSD: { minLot: 0.01, contractSize: 10 },
};

// Market → UI Symbols
const marketSymbols = {
  Forex: ["EURUSD", "AUDJPY"],
  Synthetic: ["Boom1000", "Crash300"],
  Commodities: ["XAUUSD", "XAGUSD"],
  Crypto: ["BTCUSD", "ETHUSD"]
};

// Load symbols
document.getElementById("marketType").addEventListener("change", function () {
  const market = this.value;
  const symbolSelect = document.getElementById("symbol");
  symbolSelect.innerHTML = '<option value="">Select Symbol</option>';
  if (marketSymbols[market]) {
    marketSymbols[market].forEach(sym => {
      const option = document.createElement("option");
      option.value = sym;
      option.textContent = sym;
      symbolSelect.appendChild(option);
    });
  }
});

// Fetch price when symbol selected
document.getElementById("symbol").addEventListener("change", function () {
  const symbolKey = this.value;
  const apiSymbol = derivSymbols[symbolKey];
  if (!apiSymbol) return;

  ws.send(JSON.stringify({ ticks: apiSymbol }));

  ws.onmessage = function (msg) {
    const data = JSON.parse(msg.data);
    if (data.tick) {
      document.getElementById("entryPrice").value = data.tick.quote.toFixed(5);
    }
  };
});

// FORM SUBMIT
document.getElementById("positionForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const symbol = document.getElementById("symbol").value;
  const tradeType = document.querySelector('input[name="tradeType"]:checked').value;
  const balance = parseFloat(document.getElementById("balance").value);
  const riskMode = document.querySelector('input[name="riskMode"]:checked').value;
  const riskValue = parseFloat(document.getElementById("riskValue").value);
  const entry = parseFloat(document.getElementById("entryPrice").value);
  const slMode = document.querySelector('input[name="slMode"]:checked').value;
  const slInput = parseFloat(document.getElementById("stopLoss").value);
  const tp = parseFloat(document.getElementById("takeProfit").value);

  if (!symbolData[symbol]) return alert("Symbol data missing!");

  const { minLot, contractSize } = symbolData[symbol];
  let stopLossPrice = 0;

  if (slMode === "pips") {
    const pip = slInput / 10000;
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

  document.getElementById("result").innerHTML = `
    <h3>Results for ${symbol}</h3>
    <ul>
      <li><strong>Min Lot Size:</strong> ${minLot}</li>
      <li><strong>Risk Amount:</strong> ${riskAmount.toFixed(2)}</li>
      <li><strong>Recommended Lot:</strong> ${lotSize.toFixed(4)}</li>
      <li><strong>Potential Loss:</strong> ${lossPotential.toFixed(2)}</li>
      <li><strong>Potential Profit:</strong> ${profitPotential.toFixed(2)}</li>
      <li><strong>RR Ratio:</strong> ${rrRatio.toFixed(2)} : 1</li>
    </ul>
  `;

  document.getElementById("eaSuggestion").style.display =
    lotSize < minLot ? "block" : "none";

  const shareText = `Super Deriv | Position Size Result for ${symbol}:
Lot Size: ${lotSize.toFixed(4)}
Risk: ${riskAmount.toFixed(2)}
RR: ${rrRatio.toFixed(2)}:1
https://superderiv.com`;

  document.getElementById("whatsappShare").href = "https://wa.me/?text=" + encodeURIComponent(shareText);
  document.getElementById("telegramShare").href = "https://t.me/share/url?text=" + encodeURIComponent(shareText);
});

// COPY RESULT
function copyResult() {
  const result = document.getElementById("result").innerText;
  navigator.clipboard.writeText(result).then(() => alert("Copied!"));
}
