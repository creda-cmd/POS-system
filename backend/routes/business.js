const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const db = require('../db/knex');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const business = await db('businesses').where({ id: req.user.businessId }).first();
    if (!business) return res.status(404).json({ error: 'Business not found' });
    res.json(business);
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch business' });
  }
});

router.put(
  '/',
  authenticate,
  [
    body('name').optional().trim().notEmpty(),
    body('type').optional().trim(),
    body('phone').optional().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('location').optional().trim(),
    body('currency').optional().trim(),
    body('taxRate').optional().isFloat({ min: 0, max: 100 }),
    body('receiptInfo').optional().trim(),
    body('logoUrl').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const update = {};
      if (req.body.name) update.name = req.body.name;
      if (req.body.type) update.type = req.body.type;
      if (req.body.phone !== undefined) update.phone = req.body.phone;
      if (req.body.email) update.email = req.body.email;
      if (req.body.location !== undefined) update.location = req.body.location;
      if (req.body.currency) update.currency = req.body.currency;
      if (req.body.taxRate !== undefined) update.tax_rate = req.body.taxRate;
      if (req.body.receiptInfo !== undefined) update.receipt_info = req.body.receiptInfo;
      if (req.body.logoUrl !== undefined) update.logo_url = req.body.logoUrl;
      update.updated_at = new Date();

      const [business] = await db('businesses').where({ id: req.user.businessId }).update(update).returning('*');
      res.json(business);
    } catch (_err) {
      res.status(500).json({ error: 'Failed to update business' });
    }
  }
);

module.exports = router;
