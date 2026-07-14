import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

function Receipt({ sale, business, items, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">{business?.name || 'SmartBiz POS'}</h2>
            <p className="text-sm text-slate-500">{business?.location || ''}</p>
            <p className="text-sm text-slate-500">{new Date(sale.sale_date || sale.created_at).toLocaleString('en-KE')}</p>
          </div>
          <p className="text-sm text-slate-600 mb-2">Receipt: {sale.transaction_code}</p>
          <table className="w-full text-sm mb-4">
            <thead className="border-b border-slate-300">
              <tr>
                <th className="text-left py-1">Item</th>
                <th className="text-right py-1">Qty</th>
                <th className="text-right py-1">Price</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-1">{item.product_name || item.name}</td>
                  <td className="text-right py-1">{item.quantity}</td>
                  <td className="text-right py-1">{Number(item.unit_price).toFixed(2)}</td>
                  <td className="text-right py-1">{Number(item.total_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-slate-300 pt-2 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>KSh {Number(sale.subtotal).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>KSh {Number(sale.tax_amount).toFixed(2)}</span></div>
            {sale.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>- KSh {Number(sale.discount).toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>KSh {Number(sale.total_amount).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Payment</span><span className="capitalize">{sale.payment_method.replace('_', ' ')}</span></div>
          </div>
          <p className="text-center text-xs text-slate-500 mt-6">{business?.receipt_info || 'Thank you for your business!'}</p>
        </div>
        <div className="bg-slate-50 p-4 flex justify-end gap-3 no-print">
          <button onClick={() => window.print()} className="btn-primary">Print Receipt</button>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function POS() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [business, setBusiness] = useState(null);
  const [completedSale, setCompletedSale] = useState(null);
  const [saleItems, setSaleItems] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchBusiness();
  }, []);

  async function fetchProducts() {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch (_err) {
      toast.error('Failed to load products');
    }
  }

  async function fetchCustomers() {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchBusiness() {
    try {
      const { data } = await api.get('/business');
      setBusiness(data);
    } catch (err) {
      console.error(err);
    }
  }

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          toast.error('Not enough stock');
          return prev;
        }
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { productId: product.id, name: product.name, unitPrice: Number(product.selling_price), quantity: 1, max: product.quantity }];
    });
  }

  function updateQty(productId, qty) {
    const item = cart.find((i) => i.productId === productId);
    if (!item) return;
    const value = Math.max(1, Math.min(qty, item.max));
    setCart(cart.map((i) => (i.productId === productId ? { ...i, quantity: value } : i)));
  }

  function removeFromCart(productId) {
    setCart(cart.filter((i) => i.productId !== productId));
  }

  const subtotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const tax = (subtotal * (business?.tax_rate || 0)) / 100;
  const total = subtotal + tax - discount;

  async function completeSale() {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    try {
      const { data: sale } = await api.post('/sales', {
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
        paymentMethod,
        customerId: customerId || undefined,
        amountPaid: amountPaid ? Number(amountPaid) : total,
        discount,
      });
      const { data: saleWithItems } = await api.get(`/sales/${sale.id}`);
      setCompletedSale(sale);
      setSaleItems(saleWithItems.items);
      setCart([]);
      setAmountPaid('');
      setDiscount(0);
      fetchProducts();
      toast.success('Sale completed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Sale failed');
    }
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search)
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Point of Sale</h1>
        <p className="text-slate-500">Process sales quickly</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <input
            type="text"
            placeholder="Search products by name or barcode..."
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.slice(0, 18).map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.quantity <= 0}
                className={`card text-left p-4 hover:shadow-md transition ${p.quantity <= 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                <p className="text-sm text-slate-500">{p.quantity} {p.unit} left</p>
                <p className="text-primary-600 font-bold mt-2">KSh {Number(p.selling_price).toLocaleString()}</p>
              </button>
            ))}
          </div>
          {filteredProducts.length === 0 && <div className="text-center py-8 text-slate-500">No products found</div>}
        </div>

        <div className="card h-fit">
          <h2 className="text-lg font-semibold mb-4">Current Sale</h2>
          {cart.length === 0 ? (
            <div className="text-center py-8 text-slate-500">Cart is empty</div>
          ) : (
            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.productId} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-slate-500">KSh {item.unitPrice.toLocaleString()} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={item.max}
                      value={item.quantity}
                      onChange={(e) => updateQty(item.productId, Number(e.target.value))}
                      className="w-16 input py-1 text-center"
                    />
                    <button onClick={() => removeFromCart(item.productId)} className="text-red-600 text-sm hover:underline">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>KSh {subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span>Tax ({business?.tax_rate || 0}%)</span><span>KSh {tax.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm items-center">
              <span>Discount</span>
              <input type="number" min={0} className="input w-24 py-1 text-right" value={discount} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))} />
            </div>
            <div className="flex justify-between text-xl font-bold"><span>Total</span><span>KSh {total.toLocaleString()}</span></div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
              <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit">Credit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer (optional)</label>
              <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Walk-in customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount Paid</label>
              <input type="number" min={0} className="input" value={amountPaid} placeholder={total.toString()} onChange={(e) => setAmountPaid(e.target.value)} />
            </div>

            <button onClick={completeSale} disabled={cart.length === 0} className="btn-primary w-full py-3 text-lg">
              Complete Sale
            </button>
          </div>
        </div>
      </div>

      {completedSale && <Receipt sale={completedSale} business={business} items={saleItems} onClose={() => setCompletedSale(null)} />}
    </div>
  );
}
