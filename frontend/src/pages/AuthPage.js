// frontend/src/pages/AuthPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input, Select, Button, Alert } from '../components/UI';
import { getErrorMessage } from '../utils/helpers';

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
      } else {
        if (!form.name.trim()) { setError('Name is required'); setLoading(false); return; }
        await register(form);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #E6F1FB 0%, #f5f5f5 100%)', padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '36px 40px',
        width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,.10)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 40, height: 40, background: '#185FA5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15 }}>TM</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>TaskFlow</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#888' }}>Team Task Manager</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: 8, padding: 3, marginBottom: 24 }}>
          {['login', 'signup'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1, padding: '8px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
                fontSize: 13, fontWeight: 500, transition: 'all .2s',
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? '#185FA5' : '#666',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,.12)' : 'none',
              }}>
              {t === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <Alert type="error" message={error} />

        <form onSubmit={handleSubmit}>
          {tab === 'signup' && (
            <Input label="Full Name" placeholder="Jane Smith" value={form.name} onChange={set('name')} required />
          )}
          <Input label="Email" type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
          <Input label="Password" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
          {tab === 'signup' && (
            <Select
              label="Role"
              value={form.role}
              onChange={set('role')}
              options={[
                { value: 'member', label: 'Member' },
                { value: 'admin',  label: 'Admin'  },
              ]}
            />
          )}
          <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '10px 0', fontSize: 14 }}>
            {loading ? 'Please wait...' : (tab === 'login' ? 'Sign In' : 'Create Account')}
          </Button>
        </form>

        {tab === 'login' && (
          <p style={{ fontSize: 12, color: '#999', textAlign: 'center', marginTop: 16 }}>
            Demo: admin@demo.com / admin123
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
