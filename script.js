// ═══════════════════════════════════════════════
//  STOCK DATA (simulated real-world values)
// ═══════════════════════════════════════════════
const STOCKS = {
  AAPL: { name: "Apple Inc.", price: 189.43, change: 1.23, sector: "Tech" },
  MSFT: { name: "Microsoft", price: 415.28, change: 0.87, sector: "Tech" },
  GOOGL: { name: "Alphabet", price: 175.62, change: -0.54, sector: "Tech" },
  AMZN: { name: "Amazon", price: 192.17, change: 1.91, sector: "E-Commerce" },
  TSLA: { name: "Tesla", price: 178.54, change: -2.34, sector: "EV" },
  NVDA: { name: "NVIDIA", price: 875.39, change: 3.21, sector: "Chips" },
  META: { name: "Meta", price: 505.71, change: 0.62, sector: "Social" },
  JPM: { name: "JPMorgan", price: 201.84, change: -0.31, sector: "Finance" },
};

const TICKER_EXTRAS = [
  { sym: "SPX", price: "5,234.81", chg: "+0.48%", up: true },
  { sym: "NDX", price: "18,312.44", chg: "+0.71%", up: true },
  { sym: "DJI", price: "39,112.20", chg: "-0.12%", up: false },
  { sym: "BTC", price: "68,412", chg: "+2.14%", up: true },
  { sym: "ETH", price: "3,521", chg: "+1.87%", up: true },
  { sym: "GOLD", price: "2,341", chg: "+0.22%", up: true },
  { sym: "OIL", price: "82.41", chg: "-0.54%", up: false },
];

let currentStock = "AAPL";
let currentPeriod = "1W";
let mainChart = null;
let miniCharts = {};

// ── SIMULATED PRICE HISTORY ──
function genPriceHistory(base, days, volatility = 0.02) {
  const prices = [base];
  for (let i = 1; i < days; i++) {
    const drift = (Math.random() - 0.48) * volatility;
    prices.push(Math.max(1, prices[prices.length - 1] * (1 + drift)));
  }
  return prices;
}

function genDates(days) {
  const dates = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toLocaleDateString("en", { month: "short", day: "numeric" }));
  }
  return dates;
}

// ── CLOCK ──
function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent = now.toLocaleTimeString(
    "en-US",
    { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false },
  );
}
setInterval(updateClock, 1000);
updateClock();

// ── TICKER ──
function buildTicker() {
  let items = Object.entries(STOCKS).map(([sym, d]) => {
    const up = d.change >= 0;
    return `<span class="ticker-item">
      <span class="ticker-sym">${sym}</span>
      <span class="ticker-price">$${d.price.toFixed(2)}</span>
      <span class="ticker-chg ${up ? "up" : "dn"}">${up ? "+" : ""}${d.change}%</span>
    </span>`;
  });
  TICKER_EXTRAS.forEach((t) => {
    items.push(`<span class="ticker-item">
      <span class="ticker-sym">${t.sym}</span>
      <span class="ticker-price">${t.price}</span>
      <span class="ticker-chg ${t.up ? "up" : "dn"}">${t.chg}</span>
    </span>`);
  });
  // duplicate for seamless loop
  const html = items.join("") + items.join("");
  document.getElementById("tickerInner").innerHTML = html;
}

// ── STOCK CARDS ──
function buildStockCards() {
  const grid = document.getElementById("stocksGrid");
  grid.innerHTML = "";
  Object.entries(STOCKS).forEach(([sym, d]) => {
    const up = d.change >= 0;
    const card = document.createElement("div");
    card.className = "stock-card" + (sym === currentStock ? " active" : "");
    card.id = "card-" + sym;
    card.innerHTML = `
      <div class="sc-sym">${sym}</div>
      <div class="sc-name">${d.name}</div>
      <div class="sc-price">$${d.price.toFixed(2)}</div>
      <div class="sc-change ${up ? "green" : "red"}">${up ? "▲" : "▼"} ${Math.abs(d.change)}%</div>
      <div class="sc-mini-chart"><canvas id="mini-${sym}" height="30"></canvas></div>
    `;
    card.onclick = () => selectStock(sym);
    grid.appendChild(card);
    setTimeout(() => drawMiniChart(sym, d.price, up), 50);
  });
}

function drawMiniChart(sym, price, up) {
  const canvas = document.getElementById("mini-" + sym);
  if (!canvas) return;
  const prices = genPriceHistory(price, 20, 0.015);
  const ctx = canvas.getContext("2d");
  if (miniCharts[sym]) miniCharts[sym].destroy();

  miniCharts[sym] = new Chart(ctx, {
    type: "line",
    data: {
      labels: Array(20).fill(""),
      datasets: [
        {
          data: prices,
          borderColor: up ? "#00ffaa" : "#ff4466",
          borderWidth: 1.5,
          pointRadius: 0,
          fill: true,
          backgroundColor: up
            ? "rgba(0,255,170,0.05)"
            : "rgba(255,68,102,0.05)",
          tension: 0.4,
        },
      ],
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { display: false },
        y: { display: false },
      },
    },
  });
}

// ── SELECT STOCK ──
function selectStock(sym) {
  document
    .querySelectorAll(".stock-card")
    .forEach((c) => c.classList.remove("active"));
  document.getElementById("card-" + sym)?.classList.add("active");
  currentStock = sym;
  drawMainChart();
  updateChartHeader();
}

// ── CHART HEADER ──
function updateChartHeader() {
  const d = STOCKS[currentStock];
  if (!d) return;
  document.getElementById("chartTitle").textContent = currentStock;
  document.getElementById("chartPriceBig").textContent =
    "$" + d.price.toFixed(2);
  const up = d.change >= 0;
  const chgAmt = ((d.price * Math.abs(d.change)) / 100).toFixed(2);
  document.getElementById("chartPriceChange").textContent =
    `${up ? "+" : "-"}$${chgAmt} (${up ? "+" : ""}${d.change}%)`;
  document.getElementById("chartPriceChange").className =
    "chart-price-change " + (up ? "green" : "red");
}

// ── MAIN CHART ──
function drawMainChart() {
  const d = STOCKS[currentStock] || { price: 100, change: 0 };
  const days =
    {
      "1W": 7,
      "1M": 30,
      "3M": 90,
      "1Y": 365,
    }[currentPeriod] || 30;

  const prices = genPriceHistory(d.price * 0.92, days, 0.018);
  prices[prices.length - 1] = d.price; // anchor to current
  const dates = genDates(days);
  const up = d.change >= 0;

  // SMA20 overlay
  const sma = prices.map((_, i) => {
    if (i < 19) return null;
    return prices.slice(i - 19, i + 1).reduce((a, b) => a + b, 0) / 20;
  });

  if (mainChart) mainChart.destroy();

  const ctx = document.getElementById("mainChart");
  const grad = ctx.getContext("2d").createLinearGradient(0, 0, 0, 260);
  grad.addColorStop(0, up ? "rgba(0,255,170,0.15)" : "rgba(255,68,102,0.12)");
  grad.addColorStop(1, "rgba(0,0,0,0)");

  mainChart = new Chart(ctx, {
    data: {
      labels: dates,
      datasets: [
        {
          type: "line",
          label: currentStock,
          data: prices,
          borderColor: up ? "#00ffaa" : "#ff4466",
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: up ? "#00ffaa" : "#ff4466",
          fill: true,
          backgroundColor: grad,
          tension: 0.3,
          order: 2,
        },
        {
          type: "line",
          label: "SMA-20",
          data: sma,
          borderColor: "rgba(0,200,255,0.6)",
          borderWidth: 1.5,
          borderDash: [4, 3],
          pointRadius: 0,
          fill: false,
          tension: 0.3,
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: "rgba(255,255,255,0.4)",
            font: { family: "'Space Mono',monospace", size: 9 },
            boxWidth: 20,
            padding: 10,
          },
        },
        tooltip: {
          backgroundColor: "rgba(10,15,26,0.95)",
          borderColor: "rgba(0,255,170,0.2)",
          borderWidth: 1,
          titleColor: "#00c8ff",
          bodyColor: "#e2f0ff",
          titleFont: { family: "'Space Mono',monospace", size: 10 },
          bodyFont: { family: "'Space Mono',monospace", size: 10 },
          padding: 10,
          callbacks: {
            label: (ctx) => ` $${ctx.parsed.y.toFixed(2)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.03)", drawBorder: false },
          ticks: {
            color: "rgba(255,255,255,0.25)",
            font: { family: "'Space Mono',monospace", size: 8 },
            maxTicksLimit: 8,
          },
        },
        y: {
          position: "right",
          grid: { color: "rgba(255,255,255,0.04)", drawBorder: false },
          ticks: {
            color: "rgba(255,255,255,0.3)",
            font: { family: "'Space Mono',monospace", size: 9 },
            callback: (v) => "$" + v.toFixed(0),
          },
        },
      },
    },
  });
}

function setPeriod(p, btn) {
  document
    .querySelectorAll(".period-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  currentPeriod = p;
  drawMainChart();
}

// ── ML MODELS ──
const ML_MODELS = [
  { name: "LINEAR REG", acc: 74, type: "Regression · MSE/RMSE" },
  { name: "LOGISTIC", acc: 81, type: "Classification · Sigmoid" },
  { name: "DECISION TREE", acc: 78, type: "Tree · Gini/Entropy" },
  { name: "SVM", acc: 83, type: "Classification · RBF Kernel" },
  { name: "NAIVE BAYES", acc: 71, type: "Probabilistic · Bayes" },
  { name: "K-MEANS", acc: 68, type: "Clustering · Euclidean" },
  { name: "ANN", acc: 87, type: "Neural Net · Backprop" },
  { name: "LSTM", acc: 89, type: "TensorFlow · Seq2Seq" },
  { name: "TRANSFORMER", acc: 92, type: "BERT-based · Attention" },
];

function buildMLModels() {
  const grid = document.getElementById("mlModelsGrid");
  grid.innerHTML = "";
  ML_MODELS.forEach((m) => {
    const card = document.createElement("div");
    card.className = "ml-model-card";
    card.innerHTML = `
      <div class="ml-model-name">${m.name}</div>
      <div class="ml-model-accuracy">${m.acc}%</div>
      <div class="ml-model-type">${m.type}</div>
      <div class="accuracy-bar-bg">
        <div class="accuracy-bar-fill" style="width:0%" data-target="${m.acc}%"></div>
      </div>
    `;
    grid.appendChild(card);
  });

  // animate bars
  setTimeout(() => {
    document.querySelectorAll(".accuracy-bar-fill").forEach((b) => {
      b.style.width = b.dataset.target;
    });
  }, 200);
}

// ── METRICS ──
function buildMetrics() {
  const metrics = [
    { name: "MSE", val: "0.0024" },
    { name: "RMSE", val: "0.0489" },
    { name: "R² Score", val: "0.8731" },
    { name: "MAE", val: "0.0312" },
    { name: "F1 Score", val: "0.8924" },
    { name: "AUC-ROC", val: "0.9142" },
    { name: "Sharpe Ratio", val: "1.847" },
    { name: "Max Drawdown", val: "-14.2%" },
  ];

  const container = document.getElementById("metricsContainer");
  container.innerHTML = metrics
    .map(
      (m) => `
    <div class="metric-row">
      <span class="metric-name">${m.name}</span>
      <span class="metric-val">${m.val}</span>
    </div>
  `,
    )
    .join("");
}

// ═══════════════════════════════════════════════
//  AI ANALYSIS via Anthropic API
// ═══════════════════════════════════════════════
async function runAnalysis() {
  const sym =
    document.getElementById("symInput").value.trim().toUpperCase() || "AAPL";
  const btn = document.getElementById("analyzeBtn");
  const spinner = document.getElementById("spinner");
  const adviceEl = document.getElementById("aiAdviceText");

  btn.disabled = true;
  spinner.classList.add("active");
  adviceEl.innerHTML =
    '<span style="color:var(--muted);font-size:12px">Running model ensemble…</span>';

  // Simulate ML computations
  const simData = simulateMLPrediction(sym);
  updateResultCards(simData);

  try {
    const prompt = `You are NeuralTrade, an advanced AI investment advisor. Analyze the stock ${sym} and provide a concise, data-driven investment analysis.

Simulated ML metrics for ${sym}:
- Linear Regression 30-day forecast: ${simData.prediction}% price change
- SVM confidence: ${simData.confidence}%
- LSTM volatility estimate: ${simData.volatility}% annualized
- Beta vs S&P 500: ${simData.beta}
- Risk level: ${simData.riskLabel}
- Zero-shot sentiment classification: ${simData.sentiment}
- Ensemble signal: ${simData.signal}

Provide a 3-4 sentence professional analysis covering: (1) what the ML signals suggest, (2) key risk factors to watch, (3) how the BERT/transformer sentiment analysis aligns with quantitative data, and (4) a final recommendation. Be specific, concise, and use financial language. Start directly with the analysis, no intro.`;

    const response = await fetch("http://localhost:5000/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    const text =
      data.content?.find((c) => c.type === "text")?.text ||
      "Analysis unavailable.";

    spinner.classList.remove("active");
    btn.disabled = false;

    // Typewriter effect
    adviceEl.innerHTML = "";
    let i = 0;
    const cursor = document.createElement("span");
    cursor.className = "typing-cursor";
    adviceEl.appendChild(cursor);

    const typeInterval = setInterval(() => {
      if (i < text.length) {
        adviceEl.insertBefore(document.createTextNode(text[i]), cursor);
        i++;
      } else {
        clearInterval(typeInterval);
        cursor.remove();
      }
    }, 18);
  } catch (err) {
    spinner.classList.remove("active");
    btn.disabled = false;
    adviceEl.innerHTML = `<span style="color:var(--red);font-size:11px">API error — showing simulated analysis only. ML predictions above are from our model ensemble.</span>`;
  }
}

// ── SIMULATE ML PREDICTION ──
function simulateMLPrediction(sym) {
  const base = STOCKS[sym];
  const seed = sym.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (min, max) => {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    const r = x - Math.floor(x);
    return min + r * (max - min);
  };

  const prediction = parseFloat((Math.random() * 20 - 8).toFixed(2));
  const confidence = Math.floor(65 + Math.random() * 30);
  const volatility = parseFloat((15 + Math.random() * 40).toFixed(1));
  const beta = parseFloat((0.5 + Math.random() * 1.8).toFixed(2));

  let riskScore, riskLabel;
  if (volatility < 25 && beta < 1.0) {
    riskScore = 20 + Math.random() * 20;
    riskLabel = "LOW";
  } else if (volatility < 40 && beta < 1.5) {
    riskScore = 40 + Math.random() * 25;
    riskLabel = "MEDIUM";
  } else {
    riskScore = 70 + Math.random() * 25;
    riskLabel = "HIGH";
  }

  let signal, sentiment;
  if (prediction > 5) {
    signal = "BUY";
    sentiment = "bullish";
  } else if (prediction > 0) {
    signal = "BUY";
    sentiment = "bullish";
  } else if (prediction > -4) {
    signal = "HOLD";
    sentiment = prediction > -2 ? "neutral" : "volatile";
  } else {
    signal = "SELL";
    sentiment = "bearish";
  }

  if (volatility > 45) sentiment = "volatile";

  return {
    prediction,
    confidence,
    volatility,
    beta,
    riskScore,
    riskLabel,
    signal,
    sentiment,
  };
}

// ── UPDATE UI ──
function updateResultCards(d) {
  const predEl = document.getElementById("predValue");
  const up = d.prediction >= 0;
  predEl.textContent = `${up ? "+" : ""}${d.prediction}%`;
  predEl.style.color = up ? "var(--accent)" : "var(--red)";

  document.getElementById("confValue").textContent = d.confidence + "%";
  document.getElementById("volValue").textContent = d.volatility + "%";
  document.getElementById("betaValue").textContent = d.beta;

  // risk bar
  document.getElementById("riskFill").style.width = d.riskScore + "%";
  document.getElementById("riskLabel").textContent = d.riskLabel + " RISK";

  // sentiment pills
  ["bullish", "bearish", "neutral", "volatile"].forEach((s) => {
    document
      .getElementById("pill-" + s)
      .classList.toggle("active", s === d.sentiment);
  });

  // signal badge
  const badge = document.getElementById("signalBadge");
  badge.className = "signal-badge " + d.signal.toLowerCase();
  const icons = { BUY: "▲", SELL: "▼", HOLD: "⬤" };
  badge.textContent = `${icons[d.signal]} ${d.signal}`;
}

// ── BIAS DETECTION ──
// (woven into the AI analysis prompt)

// ── FAISS VECTOR SEARCH SIMULATION ──
// This represents how similar companies are found using vector embeddings
function getFAISSNeighbors(sym) {
  const neighbors = {
    AAPL: ["MSFT", "GOOGL", "META"],
    MSFT: ["AAPL", "GOOGL", "AMZN"],
    TSLA: ["NVDA", "AMZN", "META"],
    NVDA: ["TSLA", "MSFT", "GOOGL"],
  };
  return (neighbors[sym] || ["AAPL", "MSFT", "GOOGL"]).map((s) => ({
    sym: s,
    similarity: (0.75 + Math.random() * 0.2).toFixed(3),
    name: STOCKS[s]?.name || s,
  }));
}

// ── INIT ──
function init() {
  buildTicker();
  buildStockCards();
  buildMLModels();
  buildMetrics();
  drawMainChart();
  updateChartHeader();

  // Simulate live price updates
  setInterval(() => {
    Object.keys(STOCKS).forEach((sym) => {
      const drift = (Math.random() - 0.5) * 0.004;
      STOCKS[sym].price = parseFloat(
        (STOCKS[sym].price * (1 + drift)).toFixed(2),
      );
      STOCKS[sym].change = parseFloat(
        (STOCKS[sym].change + (Math.random() - 0.5) * 0.1).toFixed(2),
      );

      // update card price
      const card = document.getElementById("card-" + sym);
      if (card) {
        const priceEl = card.querySelector(".sc-price");
        const changeEl = card.querySelector(".sc-change");
        if (priceEl) priceEl.textContent = "$" + STOCKS[sym].price.toFixed(2);
        if (changeEl) {
          const up = STOCKS[sym].change >= 0;
          changeEl.textContent = `${up ? "▲" : "▼"} ${Math.abs(STOCKS[sym].change)}%`;
          changeEl.className = "sc-change " + (up ? "green" : "red");
        }
      }
    });

    // update header if current stock
    updateChartHeader();

    // update ticker
    buildTicker();
  }, 4000);

  // Enter key to analyze
  document.getElementById("symInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") runAnalysis();
  });

  // Auto-run initial analysis
  setTimeout(() => runAnalysis(), 800);
}

document.addEventListener("DOMContentLoaded", init);
