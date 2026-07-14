import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Settings() {
  const [business, setBusiness] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    fetchBusiness();
  }, []);

  async function fetchBusiness() {
    try {
      const { data } = await api.get('/business');
      setBusiness(data);
      setForm(data);
    } catch (_err) {
      toast.error('Failed to load settings');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.put('/business', {
        name: form.name,
        type: form.type,
        phone: form.phone,
        email: form.email,
        location: form.location,
        currency: form.currency,
        taxRate: Number(form.tax_rate),
        receiptInfo: form.receipt_info,
        logoUrl: form.logo_url,
      });
      toast.success('Settings saved');
      fetchBusiness();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save settings');
    }
  }

  if (!business) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Customize your business details</p>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
            <input required className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Business Type</label>
            <input className="input" value={form.type || ''} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
            <input className="input" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
            <input className="input" value={form.currency || ''} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tax Rate (%)</label>
            <input type="number" className="input" value={form.tax_rate || 0} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL</label>
            <input className="input" value={form.logo_url || ''} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Receipt Footer</label>
            <textarea rows={3} className="input" value={form.receipt_info || ''} onChange={(e) => setForm({ ...form, receipt_info: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary">Save Settings</button>
        </div>
      </form>
    </div>
  );
}
