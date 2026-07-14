const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const db = require('../db/knex');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const expenses = await db('expenses').where({ business_id: req.user.businessId }).orderBy('expense_date', 'desc');
    res.json(expenses);
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.post(
  '/',
  authenticate,
  [body('name').trim().notEmpty(), body('category').trim().notEmpty(), body('amount').isFloat({ min: 0 }), body('expenseDate').isISO8601(), body('description').optional().trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const [expense] = await db('expenses').insert({
        business_id: req.user.businessId,
        name: req.body.name,
        category: req.body.category,
        amount: req.body.amount,
        expense_date: req.body.expenseDate,
        description: req.body.description,
        created_by: req.user.id,
      }).returning('*');
      res.status(201).json(expense);
    } catch (_err) {
      res.status(500).json({ error: 'Failed to create expense' });
    }
  }
);

router.delete('/:id', authenticate, [param('id').isUUID()], async (req, res) => {
  try {
    await db('expenses').where({ id: req.params.id, business_id: req.user.businessId }).del();
    res.json({ message: 'Expense deleted' });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

module.exports = router;
