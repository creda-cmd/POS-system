import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('If the email exists, a reset link will be sent.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-navy">Reset Password</h1>
          <p className="text-slate-500 mt-1">Enter your email to receive a reset link</p>
        </div>
        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-slate-600">Check your email for the reset link.</p>
            <Link to="/login" className="btn-primary inline-block">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}
        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="text-primary-600 hover:underline">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
