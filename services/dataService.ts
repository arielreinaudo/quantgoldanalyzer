
import { AnalysisParams, RatioResult, Frequency, PricePoint, Language, DividendMode } from '../types';
import { 
  calculateSMA, 
  calculatePercentile, 
  getPercentileValue, 
  calculateAnnualizedVolatility, 
  calculateTrend,
  resampleData
} from '../lib/calculations';

const PREFERRED_GOLD_KEY = 'quantgold_preferred_source';

// Estrategia de Proxies para evadir bloqueos de CORS en cliente
const PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

async function fetchWithRetry(url: string): Promise<string | null> {
  const shuffledProxies = [...PROXIES].sort(() => Math.random() - 0.5);
  for (const proxyFn of shuffledProxies) {
    try {
      const res = await fetch(proxyFn(url));
      if (res.ok) return await res.text();
    } catch (e) {}
  }
  return null;
}

async function fetchStooqData(symbol: string): Promise<PricePoint[] | null> {
  const normalized = symbol.toUpperCase().trim();
  const variations = [normalized.includes('.') ? normalized : `${normalized}.US`, normalized];
  for (const s of variations) {
    const text = await fetchWithRetry(`https://stooq.com/q/d/l/?s=${s}&i=d`);
    if (text && text.includes('Date,Open,High,Low,Close')) {
      const data = text.split('\n').slice(1).map(line => {
        const p = line.split(',');
        return p.length < 5 ? null : { time: p[0].trim(), value: parseFloat(p[4]) };
      }).filter((d): d is PricePoint => d !== null && !isNaN(d.value));
      if (data.length > 5) return data;
    }
  }
  return null;
}

async function fetchYahooHistory(ticker: string): Promise<PricePoint[] | null> {
  const normalized = ticker.toUpperCase().trim();
  const now = Math.floor(Date.now() / 1000);
  const start = now - (20 * 365 * 24 * 60 * 60); // 20 años
  const text = await fetchWithRetry(`https://query1.finance.yahoo.com/v7/finance/download/${normalized}?period1=${start}&period2=${now}&interval=1d&events=history&includeAdjustedClose=true`);
  if (text && text.includes('Date,Open,High,Low,Close')) {
    const data = text.split('\n').slice(1).map(line => {
      const p = line.split(',');
      if (p.length < 6) return null;
      // Preferimos Adjusted Close para Yahoo
      const val = p[5] !== 'null' ? parseFloat(p[5]) : parseFloat(p[4]);
      return isNaN(val) ? null : { time: p[0].trim(), value: val };
    }).filter((d): d is PricePoint => d !== null);
    if (data.length > 5) return data;
  }
  return null;
}

async function getPrioritizedGoldData(): Promise<{ data: PricePoint[], isProxy: boolean } | null> {
  const sources = [
    { id: 'YAHOO_GC', fn: () => fetchYahooHistory('GC=F'), isProxy: false },
    { id: 'STOOQ_XAU', fn: () => fetchStooqData('XAU'), isProxy: false },
    { id: 'STOOQ_GLD', fn: async () => {
        const gld = await fetchStooqData('GLD.US');
        return gld ? gld.map(d => ({ ...d, value: d.value * 10.15 })) : null;
      }, isProxy: true }
  ];

  for (const source of sources) {
    try {
      const data = await source.fn();
      if (data && data.length > 10) return { data, isProxy: source.isProxy };
    } catch (e) {}
  }
  return null;
}

export const analyzeTicker = async (params: AnalysisParams): Promise<RatioResult> => {
  const { ticker, horizon, frequency, benchmark, lang } = params;

  // 1. FETCHING REAL DATA
  const stockDataPromise = fetchStooqData(ticker).then(d => d || fetchYahooHistory(ticker));
  const spyDataPromise = fetchStooqData(benchmark).then(d => d || fetchYahooHistory(benchmark));
  const goldResultPromise = getPrioritizedGoldData();

  const [stockData, spyData, goldResult] = await Promise.all([
    stockDataPromise,
    spyDataPromise,
    goldResultPromise
  ]);

  if (!stockData) throw new Error(lang === Language.EN ? `Price history for ${ticker} not found.` : `No se encontró historia para ${ticker}.`);
  if (!goldResult) throw new Error(lang === Language.EN ? "Gold price unavailable." : "Precio del oro no disponible.");

  let { data: goldData, isProxy: isGoldProxy } = goldResult;
  let benchmarkData = spyData || stockData.map(s => ({ ...s, value: s.value * 1.1 })); // Fallback dummy

  // 2. APPLY MANUAL OVERRIDES FOR THE LAST POINT (Real-time update)
  if (params.manualPrice && !isNaN(params.manualPrice)) {
    stockData[stockData.length - 1].value = params.manualPrice;
  }
  if (params.manualGoldPrice && !isNaN(params.manualGoldPrice)) {
    goldData[goldData.length - 1].value = params.manualGoldPrice;
  }

  // 3. CALCULO DE RATIOS (Alineación por fecha)
  const goldMap = new Map(goldData.map(d => [d.time, d.value]));
  const spyMap = new Map(benchmarkData.map(d => [d.time, d.value]));
  
  let lastGold = goldData[0].value;
  const ratioSeries = stockData.map(s => {
    const gVal = goldMap.get(s.time);
    if (gVal !== undefined) lastGold = gVal;
    return { time: s.time, value: s.value / lastGold };
  });

  const currentRatio = stockData[stockData.length-1].value / (goldMap.get(stockData[stockData.length-1].time) || lastGold);
  
  // Filtramos por horizonte (años)
  const filteredRatio = ratioSeries.slice(-horizon * 252);
  const metricsValues = filteredRatio.map(d => d.value);
  const percentileValue = calculatePercentile(metricsValues, currentRatio);

  // FUNDAMENTALES (Manuales del usuario)
  const y = params.manualYield ?? 0.5;
  const d = (params.manualDGR ?? 0.1) * 100;
  const pEPS = params.manualPayoutEPS ?? 40;
  const pFCF = params.manualPayoutFCF ?? 35;
  const debt = params.manualDebtEbitda ?? 1.5;
  const cov = params.manualInterestCoverage ?? 10;
  const chowderNo = y + d;

  // SCORING LOGIC
  const engineScore = Math.min(5, d / 2.5);
  let moatScore = 2.0;
  if (y > 2.5 && d > 8) moatScore = 5.0;
  else if (y > 1.5 && d > 5) moatScore = 4.0;
  else if (y > 0.5 && d > 2) moatScore = 3.0;

  const pScore = pFCF < 50 ? 5 : pFCF < 75 ? 3.5 : 1.5;
  const dScore = debt < 1.5 ? 5 : debt < 3.5 ? 3.5 : 1.5;
  const cScore = cov > 10 ? 5 : cov > 4 ? 3.5 : 1.5;
  const resilienceScore = (pScore * 0.4) + (dScore * 0.3) + (cScore * 0.3);

  const yieldHistScore = Math.min(5, (y / 3) * 4);
  const goldPriceScore = percentileValue < 25 ? 5 : percentileValue < 50 ? 4 : percentileValue < 75 ? 3 : 1.5;
  
  const lastSMA200d = calculateSMA(ratioSeries, 200).pop()?.value || currentRatio;
  const lastSMA200w = calculateSMA(ratioSeries, 1000).pop()?.value || currentRatio;

  return {
    ticker: ticker.toUpperCase(),
    assetName: ticker,
    horizonYears: horizon,
    frequency,
    dividendMode: params.dividendMode,
    isGoldProxy,
    lang,
    lastUpdate: stockData[stockData.length - 1].time,
    data: { 
      ratio: resampleData(filteredRatio, frequency),
      ratioSMA200d: resampleData(calculateSMA(ratioSeries, 200).slice(-horizon * 252), frequency),
      ratioSMA200w: resampleData(calculateSMA(ratioSeries, 1000).slice(-horizon * 252), frequency),
      benchmarkRatio: resampleData(stockData.map(s => ({
        time: s.time,
        value: (spyMap.get(s.time) || (spyData ? spyData[0].value : 1)) / (goldMap.get(s.time) || lastGold)
      })).slice(-horizon * 252), frequency),
      benchmarkSMA200d: [], benchmarkSMA200w: [], relativeRatio: [], relativeSMA200d: [], relativeSMA200w: [] 
    },
    metrics: {
      currentRatio,
      percentile: percentileValue,
      trend12m: calculateTrend(ratioSeries.slice(-252)),
      volatilityAnnual: calculateAnnualizedVolatility(ratioSeries.slice(-252), Frequency.DAILY),
      chowder: { yield: y, dgr5y: d, chowderNumber: chowderNo, passGate: chowderNo >= 12, gateReason: "" },
      dividendSafety: { payoutEPS: pEPS, payoutFCF: pFCF, debtEbitda: debt, interestCoverage: cov },
      expectedReturn: { conservative: y + (d * 0.6), base: y + d, optimistic: y + (d * 1.4) },
      mosLadder: { zoneA: "", zoneB: "", zoneC: "" },
      scores: {
        core: { moat: moatScore, engine: engineScore, resilience: resilienceScore, total: (moatScore + engineScore + resilienceScore) / 3 },
        mos: { valuation: 3, yieldHistory: yieldHistScore, goldPercentile: goldPriceScore, regime: 3, total: (3 + yieldHistScore + goldPriceScore + 3) / 4 },
        goldPurchase: { 
          price: goldPriceScore, 
          trend: currentRatio > lastSMA200d ? 4.5 : 2, 
          regime: 4, 
          relativeStrength: 3, 
          total: (goldPriceScore + 4.5 + 4 + 3) / 4, 
          interpretation: "" 
        },
        actionBadge: chowderNo >= 12 ? "ACCUMULATE" : "HOLD"
      },
      mosZone: (percentileValue < 25 && resilienceScore > 3.5) ? 'A' : (percentileValue > 75 || resilienceScore < 2.5) ? 'C' : 'B',
      percentiles: { 
        p10: getPercentileValue(metricsValues, 10), 
        p25: getPercentileValue(metricsValues, 25), 
        p50: getPercentileValue(metricsValues, 50), 
        p75: getPercentileValue(metricsValues, 75), 
        p90: getPercentileValue(metricsValues, 90) 
      },
      signals: { aboveSMA200d: currentRatio > lastSMA200d, aboveSMA200w: currentRatio > lastSMA200w }
    }
  };
};
