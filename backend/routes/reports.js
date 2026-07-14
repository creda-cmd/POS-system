const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../db/knex');

const router = express.Router();

router.get('/profit', authenticate, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    let interval = 'day';
    if (period === 'year') interval = 'month';

    const salesProfit = await db('sales')
      .where({ business_id: req.user.businessId, status: 'completed' })
      .whereRaw("sale_date >= CURRENT_DATE - INTERVAL '1 year'")
      .select(db.raw(`DATE_TRUNC('${interval}', sale_date) as period`))
      .sum('total_amount as revenue')
      .groupByRaw(`DATE_TRUNC('${interval}', sale_date)`)
      .orderByRaw(`DATE_TRUNC('${interval}', sale_date)`);

    const costProfit = await db('sale_items')
      .join('sales', 'sale_items.sale_id', 'sales.id')
      .where('sales.business_id', req.user.businessId)
      .where('sales.status', 'completed')
      .whereRaw("sales.sale_date >= CURRENT_DATE - INTERVAL '1 year'")
      .select(db.raw(`DATE_TRUNC('${interval}', sales.sale_date) as period`))
      .sum(db.raw('sale_items.cost_price * sale_items.quantity as cost'))
      .sum('sale_items.profit as profit')
      .groupByRaw(`DATE_TRUNC('${interval}', sales.sale_date)`)
      .orderByRaw(`DATE_TRUNC('${interval}', sales.sale_date)`);

    const expenses = await db('expenses')
      .where({ business_id: req.user.businessId })
      .whereRaw("expense_date >= CURRENT_DATE - INTERVAL '1 year'")
      .select(db.raw(`DATE_TRUNC('${interval}', expense_date) as period`))
      .sum('amount as total')
      .groupByRaw(`DATE_TRUNC('${interval}', expense_date)`)
      .orderByRaw(`DATE_TRUNC('${interval}', expense_date)`);

    res.json({ salesProfit, costProfit, expenses });
  } catch (_err) {
    console.error(_err);
    res.status(500).json({ error: 'Failed to generate profit report' });
  }
});

router.get('/inventory', authenticate, async (req, res) => {
  try {
    const products = await db('products')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .where('products.business_id', req.user.businessId)
      .where('products.is_active', true)
      .select('products.*', 'categories.name as category_name')
      .orderBy('products.name', 'asc');

    res.json(products);
  } catch (_err) {
    res.status(500).json({ error: 'Failed to generate inventory report' });
  }
});

module.exports = router;
