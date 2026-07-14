import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('profit');
  const [data, setData] = useState({ salesProfit: [], costProfit: [], expenses: [] });
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchProfitReport();
  }, [period]);

  useEffect(() => {
    if (activeTab === 'inventory') fetchInventory();
    if (activeTab === 'sales') fetchSales();
  }, [activeTab]);

  async function fetchProfitReport() {
    try {
      const { data: report } = await api.get('/reports/profit', { params: { period } });
      setData(report);
    } catch (_err) {
      toast.error('Failed to load profit report');
    }
  }

  async function fetchInventory() {
    try {
      const { data } = await api.get('/reports/inventory');
      setProducts(data);
    } catch (_err) {
      toast.error('Failed to load inventory report');
    }
  }

  async function fetchSales() {
    try {
      const { data } = await api.get('/sales', { params: { period } });
      setSales(data);
    } catch (_err) {
      toast.error('Failed to load sales report');
    }
  }

  const merged = data.salesProfit.map((s) => {
    const cost = data.costProfit.find((c) => c.period === s.period) || {};
    const exp = data.expenses.find((e) => e.period === s.period) || {};
    return {
      period: new Date(s.period).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }),
      revenue: Number(s.revenue || 0),
      profit: Number(cost.profit || 0),
      expenses: Number(exp.total || 0),
    };
  });

  const totalRevenue = merged.reduce((a, b) => a + b.revenue, 0);
  const totalProfit = merged.reduce((a, b) => a + b.profit, 0);
  const totalExpenses = merged.reduce((a, b) => a + b.expenses, 0);

  const formatKes = (v) => `KSh ${Number(v || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const tabs = [
    { id: 'profit', label: 'Profit' },
    { id: 'sales', label: 'Sales' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'inventory', label: 'Inventory' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500">View business performance and inventory</p>
        </div>
        <select className="input w-auto" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="week">Last 7 days</option>
          <option value="month">Last 30 days</option>
          <option value="year">This year</option>
        </select>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium text-sm ${activeTab === tab.id ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profit' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card"><p className="text-sm text-slate-500">Revenue</p><p className="text-xl font-bold">{formatKes(totalRevenue)}</p></div>
            <div className="card"><p className="text-sm text-slate-500">Profit</p><p className="text-xl font-bold text-emerald-600">{formatKes(totalProfit)}</p></div>
            <div className="card"><p className="text-sm text-slate-500">Expenses</p><p className="text-xl font-bold text-red-600">{formatKes(totalExpenses)}</p></div>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Revenue vs Expenses vs Profit</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={merged}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(v) => formatKes(v)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                  <Bar dataKey="profit" fill="#10b981" />
                  <Bar dataKey="expenses" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Profit Trend</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={merged}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(v) => formatKes(v)} />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'sales' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Sales Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-600 uppercase">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Date</th>
                  <th className="px-4 py-3">Transaction</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 rounded-r-lg">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{new Date(s.sale_date).toLocaleDateString('en-KE')}</td>
                    <td className="px-4 py-3 font-medium">{s.transaction_code}</td>
                    <td className="px-4 py-3 capitalize">{s.payment_method.replace('_', ' ')}</td>
                    <td className="px-4 py-3">{formatKes(s.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sales.length === 0 && <div className="text-center py-8 text-slate-500">No sales data</div>}
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Expenses Over Time</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.expenses.map((e) => ({ period: new Date(e.period).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }), amount: Number(e.total || 0) }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(v) => formatKes(v)} />
                <Bar dataKey="amount" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Inventory Report</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-600 uppercase">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Buying Price</th>
                  <th className="px-4 py-3">Selling Price</th>
                  <th className="px-4 py-3 rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const isLow = p.quantity <= p.low_stock_threshold;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3">{p.category_name || '-'}</td>
                      <td className="px-4 py-3">{p.quantity} {p.unit}</td>
                      <td className="px-4 py-3">{formatKes(p.buying_price)}</td>
                      <td className="px-4 py-3">{formatKes(p.selling_price)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {isLow ? 'Low Stock' : 'Available'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {products.length === 0 && <div className="text-center py-8 text-slate-500">No products</div>}
          </div>
        </div>
      )}
    </div>
  );
}
