import { useEffect, useState } from 'react';
import { RiEditLine, RiDeleteBinLine, RiAddLine } from 'react-icons/ri';
import api from '../api/axios';
import toast from 'react-hot-toast';

function ProductModal({ product, categories, onClose, onSave }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    categoryId: product?.category_id || '',
    description: product?.description || '',
    buyingPrice: product?.buying_price || '',
    sellingPrice: product?.selling_price || '',
    quantity: product?.quantity || 0,
    lowStockThreshold: product?.low_stock_threshold || 10,
    barcode: product?.barcode || '',
    sku: product?.sku || '',
    imageUrl: product?.image_url || '',
    unit: product?.unit || 'piece',
  });

  async function handleSubmit(e) {
    e.preventDefault();
    await onSave({
      ...form,
      buyingPrice: Number(form.buyingPrice),
      sellingPrice: Number(form.sellingPrice),
      quantity: Number(form.quantity),
      lowStockThreshold: Number(form.lowStockThreshold),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold mb-4">{product ? 'Edit Product' : 'Add Product'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Product Name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Category</label>
            <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Unit</label>
            <input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Buying Price</label>
            <input type="number" required min={0} step="0.01" className="input" value={form.buyingPrice} onChange={(e) => setForm({ ...form, buyingPrice: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Selling Price</label>
            <input type="number" required min={0} step="0.01" className="input" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Quantity</label>
            <input type="number" required min={0} className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Low Stock Alert</label>
            <input type="number" required min={0} className="input" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Barcode</label>
            <input className="input" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">SKU</label>
            <input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Product Image URL</label>
            <input className="input" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="md:col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch (_err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSave(form) {
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, form);
        toast.success('Product updated');
      } else {
        await api.post('/products', form);
        toast.success('Product created');
      }
      setModalOpen(false);
      setEditing(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (_err) {
      toast.error('Failed to delete product');
    }
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-500">Manage your product catalog</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary">
          <RiAddLine className="mr-1" /> Add Product
        </button>
      </div>

      <div className="card">
        <input type="text" placeholder="Search products..." className="input max-w-md mb-4" value={search} onChange={(e) => setSearch(e.target.value)} />
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Buying</th>
                  <th className="px-4 py-3">Selling</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const category = categories.find((c) => c.id === p.category_id);
                  const isLow = p.quantity <= p.low_stock_threshold;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3">{category?.name || p.category_name || '-'}</td>
                      <td className="px-4 py-3">KSh {Number(p.buying_price).toLocaleString()}</td>
                      <td className="px-4 py-3">KSh {Number(p.selling_price).toLocaleString()}</td>
                      <td className="px-4 py-3">{p.quantity} {p.unit}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {isLow ? 'Low Stock' : 'Available'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => { setEditing(p); setModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><RiEditLine /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><RiDeleteBinLine /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="text-center py-8 text-slate-500">No products found</div>}
          </div>
        )}
      </div>

      {modalOpen && <ProductModal product={editing} categories={categories} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} />}
    </div>
  );
}
