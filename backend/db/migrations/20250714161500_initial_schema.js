exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('full_name', 255).notNullable();
    table.string('phone', 50);
    table.string('role', 50).notNullable().defaultTo('owner');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('businesses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('owner_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.string('type', 100);
    table.text('description');
    table.string('phone', 50);
    table.string('email', 255);
    table.string('location', 255);
    table.string('logo_url', 500);
    table.string('currency', 10).defaultTo('KES');
    table.decimal('tax_rate', 5, 2).defaultTo(0);
    table.text('receipt_info');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('employees', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('business_id').notNullable().references('id').inTable('businesses').onDelete('CASCADE');
    table.uuid('user_id').unique().references('id').inTable('users').onDelete('SET NULL');
    table.string('name', 255).notNullable();
    table.string('phone', 50);
    table.string('email', 255);
    table.string('role', 50).notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('business_id').notNullable().references('id').inTable('businesses').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('products', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('business_id').notNullable().references('id').inTable('businesses').onDelete('CASCADE');
    table.uuid('category_id').references('id').inTable('categories').onDelete('SET NULL');
    table.string('name', 255).notNullable();
    table.text('description');
    table.string('barcode', 100);
    table.string('sku', 100);
    table.decimal('buying_price', 12, 2).notNullable().defaultTo(0);
    table.decimal('selling_price', 12, 2).notNullable().defaultTo(0);
    table.integer('quantity').notNullable().defaultTo(0);
    table.integer('low_stock_threshold').notNullable().defaultTo(10);
    table.string('image_url', 500);
    table.string('unit', 50).defaultTo('piece');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['business_id', 'barcode']);
  });

  await knex.schema.createTable('customers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('business_id').notNullable().references('id').inTable('businesses').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.string('phone', 50);
    table.string('email', 255);
    table.text('notes');
    table.decimal('credit_balance', 12, 2).defaultTo(0);
    table.decimal('total_spending', 12, 2).defaultTo(0);
    table.integer('total_visits').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('suppliers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('business_id').notNullable().references('id').inTable('businesses').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.string('phone', 50);
    table.string('email', 255);
    table.text('address');
    table.decimal('balance', 12, 2).defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('sales', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('business_id').notNullable().references('id').inTable('businesses').onDelete('CASCADE');
    table.uuid('cashier_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.uuid('customer_id').references('id').inTable('customers').onDelete('SET NULL');
    table.string('transaction_code', 50).notNullable().unique();
    table.decimal('subtotal', 12, 2).notNullable().defaultTo(0);
    table.decimal('tax_amount', 12, 2).defaultTo(0);
    table.decimal('discount', 12, 2).defaultTo(0);
    table.decimal('total_amount', 12, 2).notNullable().defaultTo(0);
    table.string('payment_method', 50).notNullable();
    table.decimal('amount_paid', 12, 2).defaultTo(0);
    table.string('status', 50).defaultTo('completed');
    table.timestamp('sale_date').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('sale_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('sale_id').notNullable().references('id').inTable('sales').onDelete('CASCADE');
    table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('RESTRICT');
    table.integer('quantity').notNullable();
    table.decimal('unit_price', 12, 2).notNullable();
    table.decimal('cost_price', 12, 2).notNullable();
    table.decimal('total_price', 12, 2).notNullable();
    table.decimal('profit', 12, 2).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('stock_movements', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    table.uuid('business_id').notNullable().references('id').inTable('businesses').onDelete('CASCADE');
    table.string('type', 50).notNullable();
    table.integer('quantity').notNullable();
    table.string('reason', 255);
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('expenses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('business_id').notNullable().references('id').inTable('businesses').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.string('category', 100).notNullable();
    table.decimal('amount', 12, 2).notNullable();
    table.text('description');
    table.date('expense_date').notNullable();
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('purchases', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('business_id').notNullable().references('id').inTable('businesses').onDelete('CASCADE');
    table.uuid('supplier_id').references('id').inTable('suppliers').onDelete('SET NULL');
    table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    table.integer('quantity').notNullable();
    table.decimal('unit_cost', 12, 2).notNullable();
    table.decimal('total_cost', 12, 2).notNullable();
    table.string('payment_status', 50).defaultTo('paid');
    table.timestamp('purchase_date').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('business_id').notNullable().references('id').inTable('businesses').onDelete('CASCADE');
    table.string('type', 50).notNullable();
    table.uuid('reference_id').notNullable();
    table.decimal('amount', 12, 2).notNullable();
    table.string('method', 50).notNullable();
    table.string('transaction_reference', 255);
    table.timestamp('payment_date').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('password_resets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token', 255).notNullable().unique();
    table.timestamp('expires_at').notNullable();
    table.boolean('used').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('password_resets');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('purchases');
  await knex.schema.dropTableIfExists('expenses');
  await knex.schema.dropTableIfExists('stock_movements');
  await knex.schema.dropTableIfExists('sale_items');
  await knex.schema.dropTableIfExists('sales');
  await knex.schema.dropTableIfExists('customers');
  await knex.schema.dropTableIfExists('suppliers');
  await knex.schema.dropTableIfExists('products');
  await knex.schema.dropTableIfExists('categories');
  await knex.schema.dropTableIfExists('employees');
  await knex.schema.dropTableIfExists('businesses');
  await knex.schema.dropTableIfExists('users');
};
