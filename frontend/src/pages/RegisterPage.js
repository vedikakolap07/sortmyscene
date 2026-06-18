import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      return toast.error('Passwords do not match');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome aboard.');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h2>Create account</h2>
        <p className="auth-sub">Already have one? <Link to="/login">Sign in</Link></p>

        <div className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input
              id="name" name="name" type="text" autoComplete="name"
              value={form.name} onChange={handleChange}
              placeholder="Arjun Sharma" required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email" name="email" type="email" autoComplete="email"
              value={form.email} onChange={handleChange}
              placeholder="you@example.com" required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password" name="password" type="password" autoComplete="new-password"
              value={form.password} onChange={handleChange}
              placeholder="At least 6 characters" required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm" name="confirm" type="password" autoComplete="new-password"
              value={form.confirm} onChange={handleChange}
              placeholder="••••••••" required
            />
          </div>
          <button className="btn-primary btn-full" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </div>
      </div>
    </main>
  );
}
