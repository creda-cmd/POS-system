const crypto = require('crypto');

function generateTransactionCode(prefix = 'TXN') {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

function toKes(amount) {
  return `KSh ${Number(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

module.exports = { generateTransactionCode, generateResetToken, toKes };
