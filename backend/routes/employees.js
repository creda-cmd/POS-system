const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const db = require('../db/knex');

const router = express.Router();
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

router.get('/', authenticate, async (req, res) => {
  try {
    const employees = await db('employees').where({ business_id: req.user.businessId }).orderBy('name', 'asc');
    res.json(employees);
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

router.post(
  '/',
  authenticate,
  [body('name').trim().notEmpty(), body('email').optional().isEmail().normalizeEmail(), body('phone').optional().trim(), body('role').isIn(['manager', 'cashier']), body('password').isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, phone, role, password } = req.body;

    const trx = await db.transaction();
    try {
      let userId = null;
      if (email) {
        const existing = await trx('users').where({ email }).first();
        if (existing) throw new Error('Email already in use');

        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const [user] = await trx('users').insert({ email, password_hash: passwordHash, full_name: name, phone, role }).returning('id');
        userId = user.id;
      }

      const [employee] = await trx('employees').insert({ business_id: req.user.businessId, user_id: userId, name, phone, email, role }).returning('*');

      await trx.commit();
      res.status(201).json(employee);
    } catch (_err) {
      await trx.rollback();
      res.status(400).json({ error: _err.message });
    }
  }
);

module.exports = router;
