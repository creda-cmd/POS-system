const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const db = require('../db/knex');
const { generateTransactionCode } = require('../utils/helpers');

const router = express.Router();

router.get('/', authenticate, [query('period').optional().isIn(['today', 'week', 'month', 'all']), query('cashierId').optional().isUUID()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { period, cashierId } = req.query;
    let builder = db('sales').where({ business_id: req.user.businessId }).orderBy('sale_date', 'desc');

    if (period === 'today') builder = builder.whereRaw('sale_date::date = CURRENT_DATE');
    if (period === 'week') builder = builder.whereRaw("sale_date >= CURRENT_DATE - INTERVAL '7 days'");
    if (period === 'month') builder = builder.whereRaw("sale_date >= CURRENT_DATE - INTERVAL '30 days'");
    if (cashierId) builder = builder.andWhere({ cashier_id: cashierId });

    const sales = await builder;
    res.json(sales);
  } catch (_err) {
    console.error(_err);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

router.get('/:id', authenticate, [param('id').isUUID()], async (req, res) => {
  try {
    const sale = await db('sales').where({ id: req.params.id, business_id: req.user.businessId }).first();
    if (!sale) return res.status(404).json({ error: 'Sale not found' });

    const items = await db('sale_items')
      .where({ sale_id: sale.id })
      .join('products', 'sale_items.product_id', 'products.id')
      .select('sale_items.*', 'products.name as product_name');
    res.json({ ...sale, items });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch sale' });
  }
});

router.post(
  '/',
  authenticate,
  [body('items').isArray({ min: 1 }), body('paymentMethod').isIn(['cash', 'mpesa', 'card', 'bank_transfer', 'credit']), body('customerId').optional().isUUID()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { items, paymentMethod, customerId, amountPaid, discount = 0 } = req.body;

    const trx = await db.transaction();
    try {
      let subtotal = 0;
      
      const saleItems = [];

      for (const item of items) {
        const product = await trx('products').where({ id: item.productId, business_id: req.user.businessId }).first();
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        if (product.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity}`);
        }

        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice || product.selling_price);
        const costPrice = Number(product.buying_price);
        const totalPrice = quantity * unitPrice;
        const profit = (unitPrice - costPrice) * quantity;

        saleItems.push({
          product_id: product.id,
          quantity,
          unit_price: unitPrice,
          cost_price: costPrice,
          total_price: totalPrice,
          profit,
        });

        subtotal += totalPrice;
        
      }

      const business = await trx('businesses').where({ id: req.user.businessId }).first();
      const taxRate = business ? Number(business.tax_rate) : 0;
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount - Number(discount);

      const [sale] = await trx('sales').insert({
        business_id: req.user.businessId,
        cashier_id: req.user.id,
        customer_id: customerId || null,
        transaction_code: generateTransactionCode('SALE'),
        subtotal,
        tax_amount: taxAmount,
        discount: Number(discount),
        total_amount: totalAmount,
        payment_method: paymentMethod,
        amount_paid: amountPaid !== undefined ? Number(amountPaid) : totalAmount,
      }).returning('*');

      for (const item of saleItems) {
        item.sale_id = sale.id;
        await trx('sale_items').insert(item);

        await trx('products').where({ id: item.product_id }).decrement('quantity', item.quantity);

        await trx('stock_movements').insert({
          product_id: item.product_id,
          business_id: req.user.businessId,
          type: 'out',
          quantity: -item.quantity,
          reason: `Sale ${sale.transaction_code}`,
          created_by: req.user.id,
        });
      }

      if (customerId) {
        await trx('customers').where({ id: customerId }).increment('total_spending', totalAmount).increment('total_visits', 1);
      }

      await trx.commit();
      res.status(201).json(sale);
    } catch (_err) {
      await trx.rollback();
      console.error(_err);
      res.status(400).json({ error: _err.message || 'Failed to create sale' });
    }
  }
);

router.post('/:id/cancel', authenticate, [param('id').isUUID()], async (req, res) => {
  const trx = await db.transaction();
  try {
    const sale = await trx('sales').where({ id: req.params.id, business_id: req.user.businessId }).first();
    if (!sale) throw new Error('Sale not found');
    if (sale.status === 'cancelled') throw new Error('Sale already cancelled');

    const items = await trx('sale_items').where({ sale_id: sale.id });
    for (const item of items) {
      await trx('products').where({ id: item.product_id }).increment('quantity', item.quantity);
      await trx('stock_movements').insert({
        product_id: item.product_id,
        business_id: req.user.businessId,
        type: 'in',
        quantity: item.quantity,
        reason: `Cancelled sale ${sale.transaction_code}`,
        created_by: req.user.id,
      });
    }

    await trx('sales').where({ id: sale.id }).update({ status: 'cancelled' });
    await trx.commit();
    res.json({ message: 'Sale cancelled' });
  } catch (_err) {
    await trx.rollback();
    res.status(400).json({ error: _err.message });
  }
});

module.exports = router;
