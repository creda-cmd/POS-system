const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../db/knex');

const router = express.Router();

router.get('/summary', authenticate, async (req, res) => {
  try {
    const businessId = req.user.businessId;

    const todaySalesResult = await db('sales')
      .where({ business_id: businessId, status: 'completed' })
      .whereRaw('sale_date::date = CURRENT_DATE')
      .sum('total_amount as total')
      .count('id as count')
      .first();

    const monthSalesResult = await db('sales')
      .where({ business_id: businessId, status: 'completed' })
      .whereRaw("sale_date >= DATE_TRUNC('month', CURRENT_DATE)")
      .sum('total_amount as total')
      .first();

    const totalRevenueResult = await db('sales')
      .where({ business_id: businessId, status: 'completed' })
      .sum('total_amount as total')
      .first();

    const totalExpensesResult = await db('expenses').where({ business_id: businessId }).sum('amount as total').first();

    const productsCount = await db('products').where({ business_id: businessId, is_active: true }).count('id as c').first();

    const lowStockCount = await db('products')
      .where({ business_id: businessId, is_active: true })
      .whereRaw('quantity <= low_stock_threshold')
      .count('id as c')
      .first();

    const customersCount = await db('customers').where({ business_id: businessId }).count('id as c').first();

    const todayProfitResult = await db('sale_items')
      .join('sales', 'sale_items.sale_id', 'sales.id')
      .where('sales.business_id', businessId)
      .where('sales.status', 'completed')
      .whereRaw('sale_date::date = CURRENT_DATE')
      .sum('sale_items.profit as total')
      .first();

    res.json({
      todaySales: Number(todaySalesResult?.total || 0),
      todaySalesCount: Number(todaySalesResult?.count || 0),
      monthlySales: Number(monthSalesResult?.total || 0),
      totalRevenue: Number(totalRevenueResult?.total || 0),
      totalExpenses: Number(totalExpensesResult?.total || 0),
      todayProfit: Number(todayProfitResult?.total || 0),
      productsCount: Number(productsCount?.c || 0),
      lowStockCount: Number(lowStockCount?.c || 0),
      customersCount: Number(customersCount?.c || 0),
    });
  } catch (_err) {
    console.error(_err);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

router.get('/trends', authenticate, async (req, res) => {
  try {
    const businessId = req.user.businessId;

    const salesTrend = await db('sales')
      .where({ business_id: businessId, status: 'completed' })
      .whereRaw("sale_date >= CURRENT_DATE - INTERVAL '30 days'")
      .select(db.raw('DATE(sale_date) as date'))
      .sum('total_amount as sales')
      .groupByRaw('DATE(sale_date)')
      .orderByRaw('DATE(sale_date)');

    const bestSelling = await db('sale_items')
      .join('products', 'sale_items.product_id', 'products.id')
      .join('sales', 'sale_items.sale_id', 'sales.id')
      .where('sales.business_id', businessId)
      .where('sales.status', 'completed')
      .select('products.name')
      .sum('sale_items.quantity as total_quantity')
      .sum('sale_items.total_price as total_sales')
      .groupBy('products.name')
      .orderBy('total_quantity', 'desc')
      .limit(5);

    res.json({ salesTrend, bestSelling });
  } catch (_err) {
    console.error(_err);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

module.exports = router;
