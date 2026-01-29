
import { PricePoint, Frequency } from '../types';

export const calculateSMA = (data: PricePoint[], period: number): PricePoint[] => {
  const result: PricePoint[] = [];
  if (data.length < period) return [];

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].value;
    }
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
};

/**
 * Simulates Total Return by adding a compounding yield to the price series.
 * Assumes a standard 2.0% annual dividend yield for approximation if not specified.
 */
export const applyTotalReturnSimulation = (data: PricePoint[], annualYield: number = 0.02): PricePoint[] => {
  if (data.length === 0) return data;
  
  const dailyYield = Math.pow(1 + annualYield, 1 / 252) - 1;
  let multiplier = 1;
  
  return data.map((point, index) => {
    if (index > 0) {
      multiplier *= (1 + dailyYield);
    }
    return {
      ...point,
      value: point.value * multiplier
    };
  });
};

export const resampleData = (data: PricePoint[], freq: Frequency): PricePoint[] => {
  if (freq === Frequency.DAILY) return data;

  const resampled: PricePoint[] = [];
  const groups: { [key: string]: PricePoint } = {};

  data.forEach(point => {
    const date = new Date(point.time);
    let key = "";
    
    if (freq === Frequency.WEEKLY) {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      key = `${date.getFullYear()}-W${weekNum}`;
    } else if (freq === Frequency.MONTHLY) {
      key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    }
    
    groups[key] = point;
  });

  return Object.values(groups).sort((a, b) => a.time.localeCompare(b.time));
};

export const calculatePercentile = (values: number[], current: number): number => {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  
  let rank = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] < current) rank++;
    else break;
  }
  
  return (rank / sorted.length) * 100;
};

export const getPercentileValue = (values: number[], percentile: number): number => {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const index = Math.floor((percentile / 100) * (sorted.length - 1));
  return sorted[index];
};

export const calculateAnnualizedVolatility = (data: PricePoint[], freq: Frequency): number => {
  if (data.length < 2) return 0;
  
  const returns: number[] = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i - 1].value === 0) continue;
    const r = Math.log(data[i].value / data[i - 1].value);
    returns.push(r);
  }
  
  if (returns.length < 2) return 0;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
  const std = Math.sqrt(variance);
  
  let periods = 252;
  if (freq === Frequency.WEEKLY) periods = 52;
  if (freq === Frequency.MONTHLY) periods = 12;
  
  return std * Math.sqrt(periods);
};

export const calculateTrend = (data: PricePoint[]): 'Up' | 'Down' => {
  if (data.length < 2) return 'Up';
  const start = data[0].value;
  const end = data[data.length - 1].value;
  return end > start ? 'Up' : 'Down';
};
