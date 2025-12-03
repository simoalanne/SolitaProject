import test from 'node:test';
import assert from 'node:assert';
import {
  hasManyConsecutiveLosses,
  hasLowProfitMargin,
  hasHighRevenueVolatility,
  hasFailedToGrowRevenue,
  hasUnrealisticBudgetToRevenueRatio
} from '../src/assess/financial.ts';

test('hasManyConsecutiveLosses returns unfavorable if streak exceeds maxAllowed', () => {
  const profits = [10, -5, -3, -2, -1];
  const maxAllowed = 2;
  const rule = hasManyConsecutiveLosses(profits, 0, maxAllowed);
  assert.strictEqual(rule.outcome, 'unfavorable');
  assert.strictEqual(rule.values!.lossYears.value, 4);
});

test('hasManyConsecutiveLosses returns favorable if streak is within maxAllowed', () => {
  const profits = [10, -5, 2, -2, 8];
  const maxAllowed = 2;
  const rule = hasManyConsecutiveLosses(profits, 0, maxAllowed);
  assert.strictEqual(rule.outcome, 'favorable');
});

test('hasLowProfitMargin returns unfavorable when average margin is below threshold', () => {
  const revenues = [100, 200];
  const profits = [1, 2]; // very low margins
  const threshold = 0.05;
  const rule = hasLowProfitMargin(revenues, profits, threshold);
  assert.strictEqual(rule.outcome, 'unfavorable');
});

test('hasLowProfitMargin returns favorable when average margin is above threshold', () => {
  const revenues = [100, 200];
  const profits = [10, 20]; // 10% margin
  const threshold = 0.05;
  const rule = hasLowProfitMargin(revenues, profits, threshold);
  assert.strictEqual(rule.outcome, 'favorable');
});

test('hasHighRevenueVolatility returns unfavorable when volatility exceeds threshold', () => {
  const revenues = [100, 150, 50, 200, 100];
  const threshold = 0.1;
  const rule = hasHighRevenueVolatility(revenues, threshold);
  assert.strictEqual(rule.outcome, 'unfavorable');
});

test('hasHighRevenueVolatility returns favorable when volatility is smaller than threshold', () => {
  const revenues = [100, 110, 105, 115, 120];
  const threshold = 0.1;
  const rule = hasHighRevenueVolatility(revenues, threshold);
  assert.strictEqual(rule.outcome, 'favorable');
});

test('hasFailedToGrowRevenue returns unfavorable when growth is below threshold', () => {
  const revenues = [100, 102, 101, 103, 102];
  const thresholdYears = 3;
  const growthRateThreshold = 0.03;
  const rule = hasFailedToGrowRevenue(revenues, thresholdYears, growthRateThreshold);
  assert.strictEqual(rule.outcome, 'unfavorable');
});

test('hasFailedToGrowRevenue returns favorable when growth meets threshold', () => {
  const revenues = [100, 105, 110, 120, 130];
  const thresholdYears = 3;
  const growthRateThreshold = 0.03;
  const rule = hasFailedToGrowRevenue(revenues, thresholdYears, growthRateThreshold);
  assert.strictEqual(rule.outcome, 'favorable');
});

test('hasUnrealisticBudgetToRevenueRatio returns unfavorable if ratio exceeds threshold', () => {
  const rule = hasUnrealisticBudgetToRevenueRatio(100, 200, 1.5); // 200/100 = 2 > 1.5
  assert.strictEqual(rule.outcome, 'unfavorable');
});

test('hasUnrealisticBudgetToRevenueRatio returns favorable if ratio is within threshold', () => {
  const rule = hasUnrealisticBudgetToRevenueRatio(100, 100, 1.5); // 100/100 = 1 <= 1.5
  assert.strictEqual(rule.outcome, 'favorable');
});
