/**
 * Order total calculator for a small online store.
 *
 * Rules:
 *  - Subtotal = sum of (price * quantity) across all items.
 *  - Coupon "SAVE10": 10% off the subtotal, but only on orders of $50 or
 *    more (it's meant to reward larger carts, not every order).
 *  - Shipping is a flat $8, waived entirely on orders of $35 or more.
 *  - Shipping is added AFTER the coupon discount - the coupon only ever
 *    discounts the goods themselves, never the shipping fee.
 *  - An unrecognized or missing coupon code applies no discount.
 *  - Every returned dollar amount is rounded to 2 decimal places.
 */
function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function applyDiscount(subtotal, couponCode) {
  if (couponCode === 'SAVE10' && subtotal >= 50) {
    return round2(subtotal * 0.9);
  }
  return round2(subtotal);
}

function calculateShipping(subtotal) {
  return subtotal >= 35 ? 0 : 8;
}

function calculateOrderTotal(items, couponCode) {
  const subtotal = calculateSubtotal(items);
  const discountedSubtotal = applyDiscount(subtotal, couponCode);
  const shipping = calculateShipping(subtotal);
  return round2(discountedSubtotal + shipping);
}

module.exports = { calculateSubtotal, applyDiscount, calculateShipping, calculateOrderTotal };
