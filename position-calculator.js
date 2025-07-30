// Symbol data (placeholder)
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

// Market type → symbols
const marketSymbols = {
  Forex: ["EURUSD", "AUDJPY"],
  Synthetic: ["Boom1000", "Crash300"],
  Commodities: ["XAUUSD", "XAGUSD"],
  Crypto: ["BTCUSD", "ETHUSD"]
};

// Load symbols when market changes
document.getElementById('marketType').addEventListener('change', function () {
  const market = this.value;
  const symbolSelect = document.getElementById('symbol');
  symbolSelect.innerHTML = '<option value="">Select Symbol</option>';
  if (marketSymbols[market]) {
    marketSymbols[market].forEach(sym => {
      const option = document.createElement('option');
      option.value = sym;
      option.textContent = sym;
      symbolSelect.appendChild(option);
    });
  }
});

// Form submit handler
document.getElementById('positionForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const symbol = document.getElementById('symbol').value;
  const tradeType = document.querySelector('input[name="tradeType"]:checked').value;
  const balance = parseFloat(document.getElementById('balance').value);
  const riskMode = document.querySelector('input[name="riskMode"]:checked').value;
  const riskValue = parseFloat(document.getElementById('riskValue').value);
  const entry = parseFloat(document.getElementById('entryPrice').value);
  const slMode = document.querySelector('input[name="slMode"]:checked').value;
  const slInput = parseFloat(document.getElementById('stopLoss').value);
  const tp = parseFloat(document.getElementById('takeProfit').value);

  if (!symbolData[symbol]) {
    alert("Symbol data not found!");
    return;
  }

  const contractSize = symbolData[symbol].contractSize;
  const minLot = symbolData[symbol].minLot;

  // Calculate SL in price
  let stopLossPrice = 0;
  if (slMode === "pips") {
    const pipValue = slInput / 10000;
    stopLossPrice = tradeType === "Buy" ? entry - pipValue : entry + pipValue;
  } else {
    stopLossPrice = slInput;
  }

  const riskAmount = riskMode === "percent"
    ? (balance * riskValue) / 100
    : riskValue;

  const pipDifference = Math.abs(entry - stopLossPrice);
  const pipDecimal = pipDifference < 1 ? 10000 : 1;

  const lotSize = riskAmount / (pipDifference * contractSize);
  const lossPotential = lotSize * contractSize * pipDifference;
  const profitPotential = lotSize * contractSize * Math.abs(tp - entry);
  const rrRatio = profitPotential / lossPotential;

  let resultHtml = `
    <h3>Results for ${symbol}</h3>
    <ul>
      <li><strong>Min Lot Size:</strong> ${minLot}</li>
      <li><strong>Risk Amount:</strong> ${riskAmount.toFixed(2)}</li>
      <li><strong>Recommended Lot Size:</strong> ${lotSize.toFixed(4)}</li>
      <li><strong>Potential Loss:</strong> ${lossPotential.toFixed(2)}</li>
      <li><strong>Potential Profit:</strong> ${profitPotential.toFixed(2)}</li>
      <li><strong>Risk/Reward Ratio:</strong> ${rrRatio.toFixed(2)}</li>
    </ul>
  `;

  const resultContainer = document.getElementById('result');
  resultContainer.innerHTML = resultHtml;

  // EA Suggestion
  const eaBox = document.getElementById("eaSuggestion");
  if (lotSize < minLot) {
    eaBox.style.display = "block";
  } else {
    eaBox.style.display = "none";
  }

  // Share buttons update
  const shareText = `Super Deriv | Position Size Result for ${symbol}:
- Lot Size: ${lotSize.toFixed(4)}
- Risk: ${riskAmount.toFixed(2)}
- RR Ratio: ${rrRatio.toFixed(2)}
https://superderiv.com`; // Update URL later

  document.getElementById("whatsappShare").href =
    "https://wa.me/?text=" + encodeURIComponent(shareText);

  document.getElementById("telegramShare").href =
    "https://t.me/share/url?text=" + encodeURIComponent(shareText);
});

// Copy result to clipboard
function copyResult() {
  const result = document.getElementById("result").innerText;
  navigator.clipboard.writeText(result)
    .then(() => alert("Copied to clipboard!"));
}
