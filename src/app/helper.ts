import { FundPricePoint } from "./types/FundPricePoint";

export function stdev(arr: number[], usePopulation = false) {
  const mean = arr.reduce((a,b) => a+b, 0) / arr.length;
  const sqDiff = arr.map(x => (x-mean)**2);
  const variance = sqDiff.reduce((a,b) => a+b, 0) / (usePopulation ? arr.length : arr.length-1);
  return Math.sqrt(variance);
}

export function getDailyReturns(fundData: FundPricePoint[]): number[] {
    const dailyReturns: number[] = [];
    for (let i = 1; i < fundData.length; i++) {
        const prev = fundData[i - 1].closePrice;
        const curr = fundData[i].closePrice;
        if (prev > 0) {
            dailyReturns.push(curr / prev - 1);
        }
    }
    return dailyReturns;
}

export function maxDrawdown(prices: number[]): number {
  let peak = prices[0];
  let maxDD = 0;

  for (const p of prices) {
    if (p > peak) peak = p;
    const dd = (p - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }
  return maxDD; 
}