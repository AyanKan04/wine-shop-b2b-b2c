import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function formatVND(num) {
  if (num === null || num === undefined || isNaN(num)) return '0 ₫';
  return num.toLocaleString('vi-VN') + ' ₫';
}

function calculateTierPrice(basePrice, quantity) {
  if (quantity >= 200) return basePrice * 0.75; // 25% off
  if (quantity >= 50) return basePrice * 0.85;  // 15% off
  if (quantity >= 20) return basePrice * 0.90;  // 10% off
  return basePrice;
}

describe('Frontend Formatter & Tier Price Calculation Utilities', () => {

  it('formatVND - Should format numbers into Vietnamese Dong format', () => {
    const formatted = formatVND(85000000);
    assert.match(formatted, /85\.000\.000/);
    assert.match(formatted, /₫/);
  });

  it('formatVND - Should handle 0 and invalid inputs gracefully', () => {
    assert.equal(formatVND(0), '0 ₫');
    assert.equal(formatVND(null), '0 ₫');
    assert.equal(formatVND(undefined), '0 ₫');
  });

  it('calculateTierPrice - Should calculate Tier 1-5 discounts correctly', () => {
    const base = 100000000;
    assert.equal(calculateTierPrice(base, 5), 100000000); // Tier 1: Base
    assert.equal(calculateTierPrice(base, 25), 90000000); // Tier 2: 10% off
    assert.equal(calculateTierPrice(base, 60), 85000000); // Tier 3: 15% off
    assert.equal(calculateTierPrice(base, 250), 75000000); // Tier 5: 25% off
  });

});
