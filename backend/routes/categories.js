const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const db = require('../db/knex');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const categories = await db('categories').where({ business_id: req.user.businessId }).orderBy('name', 'asc');
    res.json(categories);
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post(
  '/',
  authenticate,
  [body('name').trim().notEmpty(), body('description').optional().trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const [category] = await db('categories')
        .insert({ business_id: req.user.businessId, name: req.body.name, description: req.body.description })
        .returning('*');
      res.status(201).json(category);
    } catch (_err) {
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
);

router.delete('/:id', authenticate, [param('id').isUUID()], async (req, res) => {
  try {
    const count = await db('products').where({ category_id: req.params.id }).count('id as c').first();
    if (count && Number(count.c) > 0) {
      return res.status(400).json({ error: 'Cannot delete category with products' });
    }
    await db('categories').where({ id: req.params.id, business_id: req.user.businessId }).del();
    res.json({ message: 'Category deleted' });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
