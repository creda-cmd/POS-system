import { useEffect, useState } from 'react';
import { RiMoneyDollarCircleLine, RiShoppingCart2Line, RiBox3Line, RiAlertLine, RiUser3Line } from 'react-icons/ri';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../api/axios';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

function StatCard({ title, value, icon: Icon, colorClass }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon className="text-2xl text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState({ salesTrend: [], bestSelling: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryRes, trendsRes] = await Promise.all([api.get('/dashboard/summary'), api.get('/dashboard/trends')]);
        setSummary(summaryRes.data);
        setTrends(trendsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatKes = (v) => `KSh ${Number(v || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Overview of your business today</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Sales" value={formatKes(summary?.todaySales)} icon={RiMoneyDollarCircleLine} colorClass="bg-primary-500" />
        <StatCard title="Monthly Sales" value={formatKes(summary?.monthlySales)} icon={RiShoppingCart2Line} colorClass="bg-blue-500" />
        <StatCard title="Today Profit" value={formatKes(summary?.todayProfit)} icon={RiMoneyDollarCircleLine} colorClass="bg-emerald-600" />
        <StatCard title="Total Expenses" value={formatKes(summary?.totalExpenses)} icon={RiMoneyDollarCircleLine} colorClass="bg-red-500" />
        <StatCard title="Products" value={summary?.productsCount || 0} icon={RiBox3Line} colorClass="bg-amber-500" />
        <StatCard title="Low Stock" value={summary?.lowStockCount || 0} icon={RiAlertLine} colorClass="bg-red-600" />
        <StatCard title="Customers" value={summary?.customersCount || 0} icon={RiUser3Line} colorClass="bg-indigo-500" />
        <StatCard title="Today's Orders" value={summary?.todaySalesCount || 0} icon={RiShoppingCart2Line} colorClass="bg-cyan-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Sales Trend (Last 30 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends.salesTrend.map((d) => ({ date: d.date, sales: Number(d.sales || 0) }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })} />
                <YAxis />
                <Tooltip formatter={(v) => formatKes(v)} />
                <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Best Selling Products</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends.bestSelling}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_quantity" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Sales by Product</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={trends.bestSelling} dataKey="total_sales" nameKey="name" outerRadius={90} label>
                  {trends.bestSelling.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatKes(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
