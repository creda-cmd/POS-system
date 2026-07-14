import { useEffect, useState } from 'react';
import { RiEditLine, RiDeleteBinLine, RiAddLine } from 'react-icons/ri';
import api from '../api/axios';
import toast from 'react-hot-toast';

function CustomerModal({ customer, onClose, onSave }) {
  const [form, setForm] = useState({ name: customer?.name || '', phone: customer?.phone || '', email: customer?.email || '', notes: customer?.notes || '' });

  async function handleSubmit(e) {
    e.preventDefault();
    await onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">{customer ? 'Edit Customer' : 'Add Customer'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Notes</label>
            <textarea className="input" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (_err) {
      toast.error('Failed to load customers');
    }
  }

  async function handleSave(form) {
    try {
      if (editing) {
        await api.put(`/customers/${editing.id}`, form);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', form);
        toast.success('Customer created');
      }
      setModalOpen(false);
      setEditing(null);
      fetchCustomers();
    } catch (_err) {
      toast.error(_err.response?.data?.error || 'Failed to save customer');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this customer?')) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch (_err) {
      toast.error('Failed to delete customer');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-500">Manage customer records</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary"><RiAddLine className="mr-1" /> Add Customer</button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-600 uppercase">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Total Spending</th>
                <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.phone || '-'}</td>
                  <td className="px-4 py-3">{c.email || '-'}</td>
                  <td className="px-4 py-3">KSh {Number(c.total_spending).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => { setEditing(c); setModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><RiEditLine /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><RiDeleteBinLine /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && <div className="text-center py-8 text-slate-500">No customers yet</div>}
        </div>
      </div>

      {modalOpen && <CustomerModal customer={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} />}
    </div>
  );
}
