import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [period, setPeriod] = useState('all');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, [period]);

  async function fetchSales() {
    try {
      setLoading(true);
      const { data } = await api.get('/sales', { params: { period } });
      setSales(data);
    } catch (_err) {
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  }

  async function viewSale(id) {
    try {
      const { data } = await api.get(`/sales/${id}`);
      setSelected(data);
    } catch (_err) {
      toast.error('Failed to load sale details');
    }
  }

  async function cancelSale(id) {
    if (!confirm('Cancel this sale? Stock will be restored.')) return;
    try {
      await api.post(`/sales/${id}/cancel`);
      toast.success('Sale cancelled');
      fetchSales();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel sale');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales History</h1>
          <p className="text-slate-500">View past transactions</p>
        </div>
        <select className="input w-auto" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="all">All time</option>
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
        </select>
      </div>

      <div className="card">
        {loading ? <div className="text-center py-8">Loading...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-600 uppercase">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Transaction ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{s.transaction_code}</td>
                    <td className="px-4 py-3">{new Date(s.sale_date).toLocaleString('en-KE')}</td>
                    <td className="px-4 py-3">KSh {Number(s.total_amount).toLocaleString()}</td>
                    <td className="px-4 py-3 capitalize">{s.payment_method.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${s.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => viewSale(s.id)} className="text-blue-600 hover:underline">View</button>
                      {s.status === 'completed' && (
                        <button onClick={() => cancelSale(s.id)} className="text-red-600 hover:underline">Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sales.length === 0 && <div className="text-center py-8 text-slate-500">No sales found</div>}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Sale {selected.transaction_code}</h2>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-700">Close</button>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <p><span className="font-medium">Date:</span> {new Date(selected.sale_date).toLocaleString('en-KE')}</p>
              <p><span className="font-medium">Payment:</span> <span className="capitalize">{selected.payment_method.replace('_', ' ')}</span></p>
              <p><span className="font-medium">Status:</span> <span className="capitalize">{selected.status}</span></p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Price</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selected.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2">{item.product_name}</td>
                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                    <td className="px-3 py-2 text-right">{Number(item.unit_price).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{Number(item.total_price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-slate-200 mt-4 pt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>KSh {Number(selected.subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>KSh {Number(selected.tax_amount).toFixed(2)}</span></div>
              {selected.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>KSh {Number(selected.discount).toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold"><span>Total</span><span>KSh {Number(selected.total_amount).toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
