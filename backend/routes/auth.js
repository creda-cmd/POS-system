const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db/knex');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const { generateResetToken } = require('../utils/helpers');

const router = express.Router();
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').trim().notEmpty(),
    body('businessName').trim().notEmpty(),
    body('businessType').trim().notEmpty(),
    body('phone').optional().trim(),
    body('location').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, fullName, phone, businessName, businessType, location } = req.body;

    try {
      const existing = await db('users').where({ email }).first();
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      const [user] = await db('users')
        .insert({ email, password_hash: passwordHash, full_name: fullName, phone, role: 'owner' })
        .returning('*');

      const [business] = await db('businesses')
        .insert({ owner_id: user.id, name: businessName, type: businessType, phone, location, currency: 'KES' })
        .returning('*');

      await db('employees').insert({
        business_id: business.id,
        user_id: user.id,
        name: fullName,
        phone,
        email,
        role: 'owner',
      });

      const token = jwt.sign({ userId: user.id, businessId: business.id, role: user.role }, JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          businessId: business.id,
          businessName: business.name,
        },
      });
    } catch (_err) {
      console.error(_err);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const user = await db('users').where({ email }).first();
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const business = await db('businesses').where({ owner_id: user.id }).orWhereIn('id', function () {
        this.select('business_id').from('employees').where({ user_id: user.id });
      }).first();

      const token = jwt.sign(
        { userId: user.id, businessId: business?.id, role: user.role },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          businessId: business?.id,
          businessName: business?.name,
        },
      });
    } catch (_err) {
      console.error(_err);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

router.post('/forgot-password', [body('email').isEmail().normalizeEmail()], async (req, res) => {
  try {
    const user = await db('users').where({ email: req.body.email }).first();
    if (!user) return res.json({ message: 'If the email exists, a reset link will be sent.' });

    const token = generateResetToken();
    await db('password_resets').insert({
      user_id: user.id,
      token,
      expires_at: new Date(Date.now() + 3600000),
    });

    res.json({ message: 'If the email exists, a reset link will be sent.', token });
  } catch (_err) {
    console.error(_err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const business = await db('businesses').where({ owner_id: req.user.id }).orWhere('id', req.user.businessId || null).first();
    res.json({
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.full_name,
      role: req.user.role,
      businessId: business?.id,
      businessName: business?.name,
    });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
