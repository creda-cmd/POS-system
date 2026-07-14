import { useEffect, useState } from 'react';
import { RiAddLine, RiDeleteBinLine } from 'react-icons/ri';
import api from '../api/axios';
import toast from 'react-hot-toast';

const expenseCategories = ['Rent', 'Electricity', 'Transport', 'Internet', 'Stock Purchases', 'Miscellaneous'];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ name: '', category: 'Stock Purchases', amount: '', expenseDate: new Date().toISOString().split('T')[0], description: '' });

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    try {
      const { data } = await api.get('/expenses');
      setExpenses(data);
    } catch (_err) {
      toast.error('Failed to load expenses');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.post('/expenses', { ...form, amount: Number(form.amount) });
      toast.success('Expense recorded');
      setForm({ name: '', category: 'Stock Purchases', amount: '', expenseDate: new Date().toISOString().split('T')[0], description: '' });
      fetchExpenses();
    } catch (_err) {
      toast.error(_err.response?.data?.error || 'Failed to record expense');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted');
      fetchExpenses();
    } catch (_err) {
      toast.error('Failed to delete expense');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
        <p className="text-slate-500">Record and manage business expenses</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Expense Name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {expenseCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
            <input type="number" required min={0} step="0.01" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input type="date" required className="input" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
          </div>
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <button type="submit" className="btn-primary w-full"><RiAddLine className="mr-1" /> Add Expense</button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-600 uppercase">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{e.name}</td>
                  <td className="px-4 py-3">{e.category}</td>
                  <td className="px-4 py-3">KSh {Number(e.amount).toLocaleString()}</td>
                  <td className="px-4 py-3">{new Date(e.expense_date).toLocaleDateString('en-KE')}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(e.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><RiDeleteBinLine /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {expenses.length === 0 && <div className="text-center py-8 text-slate-500">No expenses recorded</div>}
        </div>
      </div>
    </div>
  );
}
