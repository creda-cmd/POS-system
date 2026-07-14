const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const db = require('../db/knex');

const router = express.Router();

router.get('/movements', authenticate, async (req, res) => {
  try {
    const { productId } = req.query;
    let builder = db('stock_movements')
      .where('stock_movements.business_id', req.user.businessId)
      .join('products', 'stock_movements.product_id', 'products.id')
      .select('stock_movements.*', 'products.name as product_name')
      .orderBy('stock_movements.created_at', 'desc');

    if (productId) builder = builder.andWhere('product_id', productId);

    const movements = await builder;
    res.json(movements);
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch stock movements' });
  }
});

router.post(
  '/adjust',
  authenticate,
  [body('productId').isUUID(), body('quantity').isInt(), body('reason').optional().trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { productId, quantity, reason } = req.body;
    const trx = await db.transaction();
    try {
      const product = await trx('products').where({ id: productId, business_id: req.user.businessId }).first();
      if (!product) throw new Error('Product not found');

      const newQuantity = Math.max(0, product.quantity + Number(quantity));
      await trx('products').where({ id: productId }).update({ quantity: newQuantity, updated_at: new Date() });

      await trx('stock_movements').insert({
        product_id: productId,
        business_id: req.user.businessId,
        type: Number(quantity) >= 0 ? 'in' : 'out',
        quantity: Number(quantity),
        reason: reason || 'Stock adjustment',
        created_by: req.user.id,
      });

      await trx.commit();
      res.json({ message: 'Stock adjusted', product: { ...product, quantity: newQuantity } });
    } catch (_err) {
      await trx.rollback();
      res.status(400).json({ error: _err.message });
    }
  }
);

module.exports = router;
