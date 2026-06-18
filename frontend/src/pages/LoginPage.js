import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h2>Sign in</h2>
        <p className="auth-sub">Don't have an account? <Link to="/register">Create one</Link></p>

        <div className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
          </div>
          <button className="btn-primary btn-full" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </div>
    </main>
  );
}
