import { useEffect, useState } from 'react';
import { RiEditLine } from 'react-icons/ri';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [productsRes, movementsRes] = await Promise.all([api.get('/products'), api.get('/inventory/movements')]);
      setProducts(productsRes.data);
      setMovements(movementsRes.data);
    } catch (_err) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdjust(productId) {
    const qty = prompt('Enter quantity to add (+) or remove (-):');
    if (qty === null || qty === '') return;
    const reason = prompt('Reason for adjustment:');
    try {
      await api.post('/inventory/adjust', { productId, quantity: Number(qty), reason });
      toast.success('Stock adjusted');
      fetchData();
    } catch (_err) {
      toast.error(_err.response?.data?.error || 'Failed to adjust stock');
    }
  }

  const lowStock = products.filter((p) => p.quantity <= p.low_stock_threshold);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
        <p className="text-slate-500">Track stock levels and movements</p>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-800">Low Stock Alerts ({lowStock.length})</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {lowStock.map((p) => (
              <span key={p.id} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                {p.name} ({p.quantity} left)
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Stock Levels</h3>
        {loading ? <div className="text-center py-8">Loading...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-600 uppercase">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Product</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Threshold</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const isLow = p.quantity <= p.low_stock_threshold;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3">{p.quantity} {p.unit}</td>
                      <td className="px-4 py-3">{p.low_stock_threshold}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {isLow ? 'Low Stock' : 'Available'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleAdjust(p.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><RiEditLine /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Stock Movements</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-600 uppercase">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Date</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3 rounded-r-lg">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.slice(0, 50).map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{new Date(m.created_at).toLocaleString('en-KE')}</td>
                  <td className="px-4 py-3">{m.product_name}</td>
                  <td className="px-4 py-3 capitalize">{m.type}</td>
                  <td className={`px-4 py-3 ${m.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                  <td className="px-4 py-3">{m.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {movements.length === 0 && <div className="text-center py-8 text-slate-500">No stock movements yet</div>}
        </div>
      </div>
    </div>
  );
}
