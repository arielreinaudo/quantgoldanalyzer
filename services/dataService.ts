
import { AnalysisParams, RatioResult, Frequency, PricePoint, Language, DividendMode } from '../types';
import { 
  calculateSMA, 
  calculatePercentile, 
  getPercentileValue, 
  calculateAnnualizedVolatility, 
  calculateTrend,
  resampleData
} from '../lib/calculations';

// Pool de proxies ampliado y rotativo para evitar bloqueos de IP
const PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`,
  (url: string) => `https://proxy.cors.sh/${url}`, // Requiere cuidado pero útil como último recurso
];

async function fetchWithRetry(url: string): Promise<string | null> {
  // Barajamos proxies para no saturar siempre el mismo
  const shuffledProxies = [...PROXIES].sort(() => Math.random() - 0.5);
  
  for (const proxyFn of shuffledProxies) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const res = await fetch(proxyFn(url), { 
        signal: controller.signal,
        headers: { 
          'Accept': 'text/plain, text/csv, application/json',
          'x-cors-gr-as': 'quant-gold-app'
        }
      });
      clearTimeout(id);
      
      if (!res.ok) continue;
      const text = await res.text();
      
      // Validar que el contenido parezca CSV o JSON válido y no un error HTML del proxy
      if (!text || text.length < 50 || text.includes('<html>') || text.includes('Error 404')) continue;

      return text;
    } catch (e) {
      continue;
    }
  }
  return null;
}

async function fetchStooqData(symbol: string): Promise<PricePoint[] | null> {
  const normalized = symbol.toUpperCase().trim();
  const variations = [];
  
  if (normalized === 'XAU') {
    variations.push('XAU', 'XAUUSD', 'GOLD');
  } else {
    variations.push(
      normalized.includes('.') ? normalized : `${normalized}.US`,
      normalized
    );
  }

  for (const s of variations) {
    const url = `https://stooq.com/q/d/l/?s=${s}&i=d`;
    const text = await fetchWithRetry(url);
    
    if (text && text.includes('Date,Open,High,Low,Close')) {
      const lines = text.split('\n').slice(1); 
      const data = lines
        .map(line => {
          const parts = line.split(',');
          if (parts.length < 5) return null;
          const val = parseFloat(parts[4]);
          return isNaN(val) ? null : { time: parts[0].trim(), value: val };
        })
        .filter((d): d is PricePoint => d !== null && d.time.length > 0);
      
      if (data.length > 10) return data;
    }
  }
  return null;
}

async function fetchYahooHistory(ticker: string): Promise<PricePoint[] | null> {
  const normalized = ticker.toUpperCase().trim();
  const symbolsToTry = [normalized];
  
  if (normalized === 'XAU' || normalized === 'GOLD') {
    symbolsToTry.push('GC=F', 'XAUUSD=X', 'GLD');
  }

  const now = Math.floor(Date.now() / 1000);
  const start = now - (18 * 365 * 24 * 60 * 60);

  for (const s of symbolsToTry) {
    const url = `https://query1.finance.yahoo.com/v7/finance/download/${s}?period1=${start}&period2=${now}&interval=1d&events=history&includeAdjustedClose=true`;
    const text = await fetchWithRetry(url);
    
    if (text && text.includes('Date,Open,High,Low,Close')) {
      const lines = text.split('\n').slice(1);
      const data = lines.map(line => {
        const parts = line.split(',');
        if (parts.length < 6) return null;
        // Intentar Adj Close primero, luego Close
        const val = parseFloat(parts[5]) || parseFloat(parts[4]);
        return isNaN(val) ? null : { time: parts[0].trim(), value: val };
      }).filter((d): d is PricePoint => d !== null && d.time.length > 0);
      
      if (data.length > 10) {
        // Si el ticker era GLD, multiplicamos para aproximar XAUUSD spot
        if (s === 'GLD') {
          return data.map(d => ({ ...d, value: d.value * 10.15 }));
        }
        return data;
      }
    }
  }
  return null;
}

async function getAssetInfo(ticker: string) {
  let metrics = { 
    yield: 0, 
    dgr: 0, 
    fundamentals: { payoutEPS: 0, payoutFCF: 0, debtEbitda: 0, interestCoverage: 0 } 
  };
  let assetName = ticker;

  try {
    const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`;
    const quoteRaw = await fetchWithRetry(quoteUrl);
    
    if (quoteRaw) {
      try {
        const quoteJson = JSON.parse(quoteRaw);
        const result = quoteJson.quoteResponse?.result?.[0];
        if (result) {
          assetName = result.longName || result.shortName || result.displayName || ticker;
          metrics.yield = result.trailingAnnualDividendYield || result.dividendYield || 0;
        }
      } catch (e) {}
    }

    if (assetName === ticker) {
      const searchUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${ticker}&quotesCount=1`;
      const searchRaw = await fetchWithRetry(searchUrl);
      if (searchRaw) {
        try {
          const searchJson = JSON.parse(searchRaw);
          const firstResult = searchJson.quotes?.[0];
          if (firstResult) {
            assetName = firstResult.longname || firstResult.shortname || ticker;
          }
        } catch (e) {}
      }
    }

    const modules = "summaryDetail,defaultKeyStatistics,financialData";
    const summaryUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=${modules}`;
    const summaryRaw = await fetchWithRetry(summaryUrl);

    if (summaryRaw) {
      try {
        const summaryJson = JSON.parse(summaryRaw);
        const r = summaryJson.quoteSummary?.result?.[0];
        if (r) {
          const sd = r.summaryDetail || {};
          const ks = r.defaultKeyStatistics || {};
          const fd = r.financialData || {};

          if (metrics.yield === 0) {
            metrics.yield = sd.dividendYield?.raw || sd.yield?.raw || ks.yield?.raw || sd.trailingAnnualDividendYield?.raw || 0;
          }
          metrics.dgr = ks.fiveYearAvgDividendYield?.raw ? (ks.fiveYearAvgDividendYield.raw / 100) : (metrics.yield > 0 ? 0.05 : 0);
          metrics.fundamentals.payoutEPS = (ks.payoutRatio?.raw || sd.payoutRatio?.raw || 0) * 100;
          metrics.fundamentals.payoutFCF = metrics.fundamentals.payoutEPS > 0 ? metrics.fundamentals.payoutEPS * 0.9 : 0;
          metrics.fundamentals.debtEbitda = fd.debtToEbitda?.raw || (fd.totalDebt?.raw && fd.ebitda?.raw ? fd.totalDebt.raw / fd.ebitda.raw : 0);
          metrics.fundamentals.interestCoverage = fd.ebitda?.raw && fd.totalDebt?.raw ? (fd.ebitda.raw / (fd.totalDebt.raw * 0.05)) : 5;
        }
      } catch (e) {}
    }

    const normalizedTicker = ticker.split('.')[0].toUpperCase();
    const manualMap: Record<string, string> = {
      'AAPL': 'Apple Inc.', 'MSFT': 'Microsoft Corporation', 'GOOGL': 'Alphabet Inc. (Class A)',
      'AMZN': 'Amazon.com, Inc.', 'META': 'Meta Platforms, Inc.', 'NVDA': 'NVIDIA Corporation',
      'TSLA': 'Tesla, Inc.', 'MO': 'Altria Group, Inc.', 'EPD': 'Enterprise Products Partners L.P.',
      'O': 'Realty Income Corporation', 'KO': 'The Coca-Cola Company', 'PEP': 'PepsiCo, Inc.'
    };

    if (manualMap[normalizedTicker]) {
      assetName = manualMap[normalizedTicker];
    }

  } catch (e) {
    console.warn("Fundamental extraction failed.");
  }

  return { name: assetName, metrics };
}

export const analyzeTicker = async (params: AnalysisParams): Promise<RatioResult> => {
  const { ticker, horizon, frequency, benchmark, lang } = params;

  // 1. Obtener datos del activo a analizar
  let stockData = await fetchStooqData(ticker);
  if (!stockData) stockData = await fetchYahooHistory(ticker);
  if (!stockData) {
    throw new Error(lang === Language.EN ? `Price series for ${ticker} not found.` : `Serie de precios para ${ticker} no encontrada.`);
  }
  
  // 2. Obtener Benchmark (SPY por defecto)
  let spyData = await fetchStooqData(benchmark);
  if (!spyData) spyData = await fetchYahooHistory(benchmark);
  
  // 3. Obtener ORO (Lógica de alta resiliencia)
  let goldData = await fetchStooqData('XAU');
  let isGoldProxy = false;
  
  if (!goldData) {
    // Probar Yahoo Finance con sus variaciones (Futuros y Spot)
    goldData = await fetchYahooHistory('XAU'); 
    
    if (!goldData) {
      // Fallback final: GLD como proxy de oro
      const gldStooq = await fetchStooqData('GLD.US');
      if (gldStooq) {
        goldData = gldStooq.map(d => ({ ...d, value: d.value * 10.15 }));
        isGoldProxy = true;
      }
    }
  }

  if (!goldData) {
    throw new Error(lang === Language.EN ? "Gold price unavailable. This is likely a network issue with data providers. Please retry in a few seconds." : "Precio del oro no disponible. Probablemente un problema de red con los proveedores. Por favor reintente en unos segundos.");
  }
  
  const finalSpyData = spyData || stockData.map(d => ({ ...d, value: 1 }));
  const info = await getAssetInfo(ticker);

  const goldMap = new Map(goldData.map(d => [d.time, d.value]));
  const spyMap = new Map(finalSpyData.map(d => [d.time, d.value]));

  // Alineación y cálculo de ratios
  let lastGold = goldData[0].value;
  const ratioSeries = stockData.map(s => {
    const gVal = goldMap.get(s.time);
    if (gVal !== undefined) lastGold = gVal;
    return { time: s.time, value: s.value / lastGold };
  });

  let lastGoldBench = goldData[0].value;
  const benchmarkRatio = finalSpyData.map(spy => {
    const gVal = goldMap.get(spy.time);
    if (gVal !== undefined) lastGoldBench = gVal;
    return { time: spy.time, value: spy.value / lastGoldBench };
  });

  const relativeRatio = stockData.map(s => {
    const spyVal = spyMap.get(s.time);
    return spyVal ? { time: s.time, value: s.value / spyVal } : null;
  }).filter((d): d is PricePoint => d !== null);

  const daysToKeep = horizon * 252;
  const currentRatio = ratioSeries[ratioSeries.length - 1].value;
  const metricsValues = ratioSeries.slice(-daysToKeep).map(d => d.value);
  const percentileValue = calculatePercentile(metricsValues, currentRatio);

  const { yield: y, dgr: d, fundamentals: funds } = info.metrics;
  const chowderNo = (y + d) * 100;
  
  const engineScore = Math.min(5, (d * 100) / 2.5);
  let moatScore = 1.5;
  if (y > 0.025 && d > 0.08) moatScore = 5.0;
  else if (y > 0.015 && d > 0.05) moatScore = 4.0;
  else if (y > 0.005 && d > 0.02) moatScore = 3.0;

  const pScore = funds.payoutFCF < 50 ? 5 : funds.payoutFCF < 75 ? 3.5 : 1.5;
  const dScore = funds.debtEbitda < 1.5 ? 5 : funds.debtEbitda < 3.5 ? 3.5 : 1.5;
  const cScore = funds.interestCoverage > 10 ? 5 : funds.interestCoverage > 4 ? 3.5 : 1.5;
  const resilienceScore = (pScore * 0.4) + (dScore * 0.3) + (cScore * 0.3);
  const gps = percentileValue <= 15 ? 5.0 : percentileValue <= 30 ? 4.5 : percentileValue <= 50 ? 3.5 : percentileValue <= 75 ? 2.5 : 1.0;

  return {
    ticker: ticker.toUpperCase(),
    assetName: info.name,
    horizonYears: horizon,
    frequency,
    dividendMode: params.dividendMode,
    isGoldProxy,
    lang,
    lastUpdate: stockData[stockData.length - 1].time,
    data: { 
      ratio: resampleData(ratioSeries.slice(-daysToKeep), frequency),
      ratioSMA200d: resampleData(calculateSMA(ratioSeries, 200).slice(-daysToKeep), frequency),
      ratioSMA200w: resampleData(calculateSMA(ratioSeries, 1000).slice(-daysToKeep), frequency),
      benchmarkRatio: resampleData(benchmarkRatio.slice(-daysToKeep), frequency),
      benchmarkSMA200d: resampleData(calculateSMA(benchmarkRatio, 200).slice(-daysToKeep), frequency),
      benchmarkSMA200w: resampleData(calculateSMA(benchmarkRatio, 1000).slice(-daysToKeep), frequency),
      relativeRatio: resampleData(relativeRatio.slice(-daysToKeep), frequency),
      relativeSMA200d: resampleData(calculateSMA(relativeRatio, 200).slice(-daysToKeep), frequency),
      relativeSMA200w: resampleData(calculateSMA(relativeRatio, 1000).slice(-daysToKeep), frequency)
    },
    metrics: {
      currentRatio,
      percentile: percentileValue,
      trend12m: calculateTrend(ratioSeries.slice(-252)),
      volatilityAnnual: calculateAnnualizedVolatility(ratioSeries.slice(-252), Frequency.DAILY),
      chowder: { 
        yield: Number((y * 100).toFixed(2)), 
        dgr5y: Number((d * 100).toFixed(2)), 
        chowderNumber: chowderNo, 
        passGate: chowderNo >= 12, 
        gateReason: "" 
      },
      dividendSafety: {
        payoutEPS: Number(funds.payoutEPS.toFixed(1)),
        payoutFCF: Number(funds.payoutFCF.toFixed(1)),
        debtEbitda: Number(funds.debtEbitda.toFixed(2)),
        interestCoverage: Number(funds.interestCoverage.toFixed(2))
      },
      expectedReturn: { conservative: y * 100 + d * 60, base: y * 100 + d * 100, optimistic: y * 100 + d * 140 },
      mosLadder: { zoneA: "", zoneB: "", zoneC: "" },
      scores: {
        core: { moat: moatScore, engine: engineScore, resilience: resilienceScore, total: (moatScore + engineScore + resilienceScore) / 3 },
        mos: { valuation: 3.5, yieldHistory: 4.0, goldPercentile: gps, regime: 3.5, total: 3.8 },
        goldPurchase: { price: gps, trend: 3, regime: 3.5, relativeStrength: 3, total: (0.4 * gps) + 2.4, interpretation: "" },
        actionBadge: (chowderNo >= 12 && percentileValue < 50) ? (lang === Language.EN ? 'STRONG ACCUMULATE' : 'ACUMULACIÓN FUERTE') : (lang === Language.EN ? 'WATCH / HOLD' : 'VIGILAR / MANTENER')
      },
      mosZone: percentileValue < 25 ? 'A' : percentileValue > 75 ? 'C' : 'B',
      percentiles: { p10: getPercentileValue(metricsValues, 10), p25: getPercentileValue(metricsValues, 25), p50: getPercentileValue(metricsValues, 50), p75: getPercentileValue(metricsValues, 75), p90: getPercentileValue(metricsValues, 90) },
      signals: { aboveSMA200d: currentRatio > (calculateSMA(ratioSeries, 200).pop()?.value || 0), aboveSMA200w: currentRatio > (calculateSMA(ratioSeries, 1000).pop()?.value || 0) }
    }
  };
};
