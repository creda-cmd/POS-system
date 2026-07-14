const bcrypt = require('bcryptjs');

exports.seed = async function (knex) {
  await knex('payments').del();
  await knex('purchases').del();
  await knex('expenses').del();
  await knex('stock_movements').del();
  await knex('sale_items').del();
  await knex('sales').del();
  await knex('products').del();
  await knex('categories').del();
  await knex('customers').del();
  await knex('suppliers').del();
  await knex('employees').del();
  await knex('businesses').del();
  await knex('users').del();

  const passwordHash = await bcrypt.hash('password123', 12);

  const [owner] = await knex('users')
    .insert({ email: 'owner@smartbiz.test', password_hash: passwordHash, full_name: 'Demo Owner', phone: '0700000000', role: 'owner' })
    .returning('*');

  const [business] = await knex('businesses')
    .insert({
      owner_id: owner.id,
      name: 'Demo Retail Shop',
      type: 'Retail Shop',
      phone: '0700000000',
      location: 'Nairobi, Kenya',
      currency: 'KES',
      tax_rate: 0,
    })
    .returning('*');

  await knex('employees').insert({
    business_id: business.id,
    user_id: owner.id,
    name: 'Demo Owner',
    phone: '0700000000',
    email: 'owner@smartbiz.test',
    role: 'owner',
  });

  const [cat] = await knex('categories').insert({ business_id: business.id, name: 'General' }).returning('*');

  const demoProducts = [
    { business_id: business.id, category_id: cat.id, name: 'Sugar 1kg', buying_price: 120, selling_price: 150, quantity: 100, low_stock_threshold: 10, unit: 'pkt' },
    { business_id: business.id, category_id: cat.id, name: 'Bread', buying_price: 45, selling_price: 55, quantity: 50, low_stock_threshold: 5, unit: 'loaf' },
    { business_id: business.id, category_id: cat.id, name: 'Cooking Oil 1L', buying_price: 180, selling_price: 220, quantity: 40, low_stock_threshold: 8, unit: 'btl' },
    { business_id: business.id, category_id: cat.id, name: 'Soap Bar', buying_price: 25, selling_price: 35, quantity: 200, low_stock_threshold: 20, unit: 'pc' },
    { business_id: business.id, category_id: cat.id, name: 'Rice 2kg', buying_price: 220, selling_price: 260, quantity: 60, low_stock_threshold: 10, unit: 'pkt' },
  ];

  await knex('products').insert(demoProducts);
};
