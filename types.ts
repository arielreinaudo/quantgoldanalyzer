
export enum Language {
  EN = 'EN',
  ES = 'ES'
}

export enum DataProvider {
  STOOQ = 'Stooq',
  YAHOO = 'Yahoo Finance',
  ALPHA_VANTAGE = 'AlphaVantage',
  POLYGON = 'Polygon'
}

export enum DividendMode {
  PRICE_ONLY = 'Price Only',
  TOTAL_RETURN_REAL = 'Total Return (Real)',
  TOTAL_RETURN_APPROX = 'Total Return (Approx)'
}

export enum Frequency {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly'
}

export interface PricePoint {
  time: string;
  value: number;
}

export interface RatioResult {
  ticker: string;
  assetName: string;
  benchmarkTicker: string;
  horizonYears: number;
  frequency: Frequency;
  dividendMode: DividendMode;
  isGoldProxy: boolean;
  lastUpdate: string;
  lang: Language;
  data: {
    ratio: PricePoint[];
    ratioSMA200d: PricePoint[];
    ratioSMA200w: PricePoint[];
    benchmarkRatio: PricePoint[];
    benchmarkSMA200d: PricePoint[];
    benchmarkSMA200w: PricePoint[];
    relativeRatio: PricePoint[];
    relativeSMA200d: PricePoint[];
    relativeSMA200w: PricePoint[];
  };
  metrics: {
    currentRatio: number;
    percentile: number;
    trend12m: 'Up' | 'Down';
    volatilityAnnual: number;
    chowder: {
      yield: number;
      dgr5y: number;
      chowderNumber: number;
      passGate: boolean;
      gateReason: string;
    };
    dividendSafety: {
      payoutEPS: number;
      payoutFCF: number;
      debtEbitda: number;
      interestCoverage: number;
    };
    expectedReturn: {
      conservative: number;
      base: number;
      optimistic: number;
    };
    mosLadder: {
      zoneA: string;
      zoneB: string;
      zoneC: string;
    };
    scores: {
      core: { moat: number; engine: number; resilience: number; total: number; };
      mos: { valuation: number; yieldHistory: number; goldPercentile: number; regime: number; total: number; };
      goldPurchase: {
        price: number;
        trend: number;
        regime: number;
        relativeStrength: number;
        total: number;
        interpretation: string;
      };
      actionBadge: string;
    };
    mosZone: 'A' | 'B' | 'C';
    percentiles: { p10: number; p25: number; p50: number; p75: number; p90: number; };
    signals: { aboveSMA200d: boolean; aboveSMA200w: boolean; };
  };
}

export interface AnalysisParams {
  ticker: string;
  horizon: number;
  frequency: Frequency;
  benchmark: string;
  dividendMode: DividendMode;
  provider: DataProvider;
  apiKey?: string;
  lang: Language;
  // Manual overrides
  manualPrice?: number;
  manualGoldPrice?: number;
  manualBenchmarkPrice?: number;
  manualYield?: number;
  manualDGR?: number;
  manualPayoutEPS?: number;
  manualPayoutFCF?: number;
  manualDebtEbitda?: number;
  manualInterestCoverage?: number;
}
