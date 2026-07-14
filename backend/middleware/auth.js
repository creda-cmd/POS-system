const jwt = require('jsonwebtoken');
const db = require('../db/knex');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await db('users').where({ id: decoded.userId, is_active: true }).first();
    if (!user) {
      return res.status(401).json({ error: 'User not found or inactive.' });
    }

    const business = await db('businesses').where({ owner_id: user.id }).orWhere('id', decoded.businessId || null).first();

    req.user = { ...user, businessId: business?.id || decoded.businessId };
    next();
  } catch (_err) {
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole, JWT_SECRET };
