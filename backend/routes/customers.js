const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const db = require('../db/knex');

const router = express.Router();

router.get('/', authenticate, [query('q').optional().trim()], async (req, res) => {
  try {
    const { q } = req.query;
    let builder = db('customers').where({ business_id: req.user.businessId }).orderBy('name', 'asc');
    if (q) builder = builder.andWhere((b) => b.where('name', 'ilike', `%${q}%`).orWhere('phone', 'ilike', `%${q}%`));
    const customers = await builder;
    res.json(customers);
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.post(
  '/',
  authenticate,
  [body('name').trim().notEmpty(), body('phone').optional().trim(), body('email').optional().isEmail().normalizeEmail(), body('notes').optional().trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const [customer] = await db('customers')
        .insert({ business_id: req.user.businessId, name: req.body.name, phone: req.body.phone, email: req.body.email, notes: req.body.notes })
        .returning('*');
      res.status(201).json(customer);
    } catch (_err) {
      res.status(500).json({ error: 'Failed to create customer' });
    }
  }
);

router.put('/:id', authenticate, [param('id').isUUID()], async (req, res) => {
  try {
    const update = {};
    if (req.body.name) update.name = req.body.name;
    if (req.body.phone !== undefined) update.phone = req.body.phone;
    if (req.body.email !== undefined) update.email = req.body.email;
    if (req.body.notes !== undefined) update.notes = req.body.notes;
    update.updated_at = new Date();

    const [customer] = await db('customers').where({ id: req.params.id, business_id: req.user.businessId }).update(update).returning('*');
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (_err) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

router.delete('/:id', authenticate, [param('id').isUUID()], async (req, res) => {
  try {
    await db('customers').where({ id: req.params.id, business_id: req.user.businessId }).del();
    res.json({ message: 'Customer deleted' });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;
