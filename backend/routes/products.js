const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const db = require('../db/knex');

const router = express.Router();

router.get('/', authenticate, [query('q').optional().trim(), query('categoryId').optional().isUUID(), query('lowStock').optional().isBoolean()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { q, categoryId, lowStock } = req.query;
    let queryBuilder = db('products')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .where('products.business_id', req.user.businessId)
      .andWhere('products.is_active', true)
      .select('products.*', 'categories.name as category_name')
      .orderBy('products.created_at', 'desc');

    if (q) {
      queryBuilder = queryBuilder.andWhere((builder) => {
        builder.where('products.name', 'ilike', `%${q}%`).orWhere('products.barcode', 'ilike', `%${q}%`).orWhere('products.sku', 'ilike', `%${q}%`);
      });
    }

    if (categoryId) queryBuilder = queryBuilder.andWhere('products.category_id', categoryId);

    const products = await queryBuilder;

    if (lowStock === 'true') {
      return res.json(products.filter((p) => p.quantity <= p.low_stock_threshold));
    }

    res.json(products);
  } catch (_err) {
    console.error(_err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/:id', authenticate, [param('id').isUUID()], async (req, res) => {
  try {
    const product = await db('products').where({ id: req.params.id, business_id: req.user.businessId }).first();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post(
  '/',
  authenticate,
  [
    body('name').trim().notEmpty(),
    body('categoryId').optional({ checkFalsy: true }).isUUID(),
    body('buyingPrice').isFloat({ min: 0 }),
    body('sellingPrice').isFloat({ min: 0 }),
    body('quantity').isInt({ min: 0 }),
    body('lowStockThreshold').optional().isInt({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const product = {
        business_id: req.user.businessId,
        category_id: req.body.categoryId || null,
        name: req.body.name,
        description: req.body.description,
        buying_price: req.body.buyingPrice,
        selling_price: req.body.sellingPrice,
        quantity: req.body.quantity || 0,
        low_stock_threshold: req.body.lowStockThreshold || 10,
        barcode: req.body.barcode,
        sku: req.body.sku,
        image_url: req.body.imageUrl,
        unit: req.body.unit || 'piece',
      };

      const [created] = await db('products').insert(product).returning('*');

      if (product.quantity > 0) {
        await db('stock_movements').insert({
          product_id: created.id,
          business_id: req.user.businessId,
          type: 'in',
          quantity: product.quantity,
          reason: 'Initial stock',
          created_by: req.user.id,
        });
      }

      res.status(201).json(created);
    } catch (_err) {
      console.error(_err);
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
);

router.put(
  '/:id',
  authenticate,
  [
    param('id').isUUID(),
    body('name').optional().trim().notEmpty(),
    body('categoryId').optional({ checkFalsy: true }).isUUID(),
    body('buyingPrice').optional().isFloat({ min: 0 }),
    body('sellingPrice').optional().isFloat({ min: 0 }),
    body('quantity').optional().isInt({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const existing = await db('products').where({ id: req.params.id, business_id: req.user.businessId }).first();
      if (!existing) return res.status(404).json({ error: 'Product not found' });

      const update = {};
      if (req.body.name) update.name = req.body.name;
      if (req.body.categoryId !== undefined) update.category_id = req.body.categoryId;
      if (req.body.description !== undefined) update.description = req.body.description;
      if (req.body.buyingPrice !== undefined) update.buying_price = req.body.buyingPrice;
      if (req.body.sellingPrice !== undefined) update.selling_price = req.body.sellingPrice;
      if (req.body.quantity !== undefined) update.quantity = req.body.quantity;
      if (req.body.lowStockThreshold !== undefined) update.low_stock_threshold = req.body.lowStockThreshold;
      if (req.body.barcode !== undefined) update.barcode = req.body.barcode;
      if (req.body.sku !== undefined) update.sku = req.body.sku;
      if (req.body.imageUrl !== undefined) update.image_url = req.body.imageUrl;
      if (req.body.unit !== undefined) update.unit = req.body.unit;
      update.updated_at = new Date();

      const [updated] = await db('products').where({ id: req.params.id }).update(update).returning('*');
      res.json(updated);
    } catch (_err) {
      res.status(500).json({ error: 'Failed to update product' });
    }
  }
);

router.delete('/:id', authenticate, [param('id').isUUID()], async (req, res) => {
  try {
    const existing = await db('products').where({ id: req.params.id, business_id: req.user.businessId }).first();
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    await db('products').where({ id: req.params.id }).update({ is_active: false, updated_at: new Date() });
    res.json({ message: 'Product deleted' });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
