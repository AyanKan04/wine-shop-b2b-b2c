/**
 * Format number to Vietnamese Dong currency format (e.g. 85.000.000 ₫)
 * @param {number} num 
 * @returns {string}
 */
export function formatVND(num) {
  if (num === null || num === undefined || isNaN(num)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}
