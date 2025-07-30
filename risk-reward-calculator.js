document.getElementById("rrForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const entry = parseFloat(document.getElementById("entryPrice").value);
  const slMode = document.querySelector('input[name="slMode"]:checked').value;
  const tpMode = document.querySelector('input[name="tpMode"]:checked').value;
  const slVal = parseFloat(document.getElementById("stopLoss").value);
  const tpVal = parseFloat(document.getElementById("takeProfit").value);

  if (!entry || !slVal || !tpVal) {
    alert("Please fill all fields.");
    return;
  }

  let stopLossPrice = slMode === "pips" ? entry - slVal / 10000 : slVal;
  let takeProfitPrice = tpMode === "pips" ? entry + tpVal / 10000 : tpVal;

  const loss = Math.abs(entry - stopLossPrice);
  const profit = Math.abs(takeProfitPrice - entry);
  const rr = profit / loss;

  document.getElementById("rrResult").innerHTML = `
    <h3>Risk Reward Ratio</h3>
    <ul>
      <li><strong>Stop Loss (pips):</strong> ${((entry - stopLossPrice) * 10000).toFixed(2)}</li>
      <li><strong>Take Profit (pips):</strong> ${((takeProfitPrice - entry) * 10000).toFixed(2)}</li>
      <li><strong>RR Ratio:</strong> ${rr.toFixed(2)} : 1</li>
    </ul>
  `;

  const msg = `Super Deriv | RR Ratio
- Entry: ${entry}
- SL: ${stopLossPrice.toFixed(5)}
- TP: ${takeProfitPrice.toFixed(5)}
- RR: ${rr.toFixed(2)}:1
https://superderiv.com`;

  document.getElementById("waRR").href = "https://wa.me/?text=" + encodeURIComponent(msg);
  document.getElementById("tgRR").href = "https://t.me/share/url?text=" + encodeURIComponent(msg);
});

function copyRR() {
  const text = document.getElementById("rrResult").innerText;
  navigator.clipboard.writeText(text)
    .then(() => alert("Copied!"));
}
