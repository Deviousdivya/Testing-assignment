const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateSubtotal,
  applyDiscount,
  calculateShipping,
  calculateOrderTotal,
} = require('../src/discount-calculator');

test('calculateSubtotal sums price * quantity across items', () => {
  const items = [
    { name: 'Mug', price: 12, quantity: 2 },
    { name: 'Notebook', price: 5, quantity: 3 },
  ];
  assert.equal(calculateSubtotal(items), 39);
});

test('calculateSubtotal returns 0 for an empty cart', () => {
  assert.equal(calculateSubtotal([]), 0);
});

test('SAVE10 applies 10% off a subtotal well above $50', () => {
  assert.equal(applyDiscount(100, 'SAVE10'), 90);
});

test('SAVE10 applies 10% off at the $50 threshold', () => {
  assert.equal(applyDiscount(50, 'SAVE10'), 45);
});

test('SAVE10 does not apply below $50', () => {
  assert.equal(applyDiscount(30, 'SAVE10'), 30);
});

test('an unrecognized coupon code applies no discount', () => {
  assert.equal(applyDiscount(80, 'NOTREAL'), 80);
});

test('no coupon code applies no discount', () => {
  assert.equal(applyDiscount(80, undefined), 80);
});

test('shipping is $8 below the $35 free-shipping threshold', () => {
  assert.equal(calculateShipping(20), 8);
});

test('shipping is free well above the $35 threshold', () => {
  assert.equal(calculateShipping(50), 0);
});

test('calculateOrderTotal combines subtotal, coupon, and shipping', () => {
  const items = [{ name: 'Jacket', price: 40, quantity: 2 }];
  assert.equal(calculateOrderTotal(items, 'SAVE10'), 72);
});

test('calculateOrderTotal with no coupon still applies shipping correctly', () => {
  const items = [{ name: 'Pen', price: 10, quantity: 1 }];
  assert.equal(calculateOrderTotal(items, undefined), 18);
});
