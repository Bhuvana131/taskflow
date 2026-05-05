// frontend/src/components/UI.js
import React from 'react';
import { initials } from '../utils/helpers';

// ─── Avatar ──────────────────────────────────────────────────────────────────
export const Avatar = ({ name = '?', color = '#185FA5', size = 32 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: color, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.36, fontWeight: 600, flexShrink: 0,
  }}>
    {initials(name)}
  </div>
);

// ─── Badge ───────────────────────────────────────────────────────────────────
const BADGE_STYLES = {
  todo:        { background: '#E6F1FB', color: '#185FA5' },
  in_progress: { background: '#FAEEDA', color: '#633806' },
  done:        { background: '#EAF3DE', color: '#27500A' },
  overdue:     { background: '#FCEBEB', color: '#791F1F' },
  admin:       { background: '#EEEDFE', color: '#3C3489' },
  member:      { background: '#E1F5EE', color: '#085041' },
  high:        { background: '#FCEBEB', color: '#791F1F' },
  medium:      { background: '#FAEEDA', color: '#633806' },
  low:         { background: '#EAF3DE', color: '#27500A' },
};

export const Badge = ({ type, label, style = {} }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '3px 8px', borderRadius: 12,
    fontSize: 11, fontWeight: 600,
    ...BADGE_STYLES[type],
    ...style,
  }}>
    {label || type}
  </span>
);

// ─── Button ──────────────────────────────────────────────────────────────────
export const Button = ({ children, variant = 'default', size = 'md', onClick, disabled, type = 'button', style = {} }) => {
  const variants = {
    default: { background: 'transparent', color: 'var(--text-primary)', border: '1px solid #ccc' },
    primary: { background: '#185FA5', color: '#fff', border: '1px solid #185FA5' },
    danger:  { background: '#A32D2D', color: '#fff', border: '1px solid #A32D2D' },
    ghost:   { background: 'transparent', color: '#185FA5', border: 'none' },
  };
  const sizes = {
    sm: { padding: '4px 10px', fontSize: 12 },
    md: { padding: '8px 16px', fontSize: 13 },
    lg: { padding: '10px 20px', fontSize: 14 },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        borderRadius: 7, cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 500, fontFamily: 'inherit', transition: 'all .15s',
        opacity: disabled ? 0.6 : 1,
        ...variants[variant], ...sizes[size], ...style,
      }}
    >
      {children}
    </button>
  );
};

// ─── Input ───────────────────────────────────────────────────────────────────
export const Input = ({ label, error, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</label>}
    <input
      {...props}
      style={{
        width: '100%', padding: '8px 12px', borderRadius: 7,
        border: `1px solid ${error ? '#E24B4A' : '#d0d0d0'}`,
        fontSize: 13, fontFamily: 'inherit', outline: 'none',
        background: '#fff', color: '#1a1a1a',
        boxSizing: 'border-box',
        ...props.style,
      }}
    />
    {error && <p style={{ fontSize: 11, color: '#A32D2D', marginTop: 3 }}>{error}</p>}
  </div>
);

// ─── Select ──────────────────────────────────────────────────────────────────
export const Select = ({ label, options = [], error, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</label>}
    <select
      {...props}
      style={{
        width: '100%', padding: '8px 12px', borderRadius: 7,
        border: `1px solid ${error ? '#E24B4A' : '#d0d0d0'}`,
        fontSize: 13, fontFamily: 'inherit', outline: 'none',
        background: '#fff', color: '#1a1a1a', cursor: 'pointer',
        boxSizing: 'border-box', ...props.style,
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    {error && <p style={{ fontSize: 11, color: '#A32D2D', marginTop: 3 }}>{error}</p>}
  </div>
);

// ─── Modal ───────────────────────────────────────────────────────────────────
export const Modal = ({ title, onClose, children, width = 480 }) => (
  <div
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}
  >
    <div style={{
      background: '#fff', borderRadius: 14, padding: 28,
      width: '100%', maxWidth: width, maxHeight: '90vh',
      overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,.18)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{title}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888', lineHeight: 1 }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

// ─── Card ────────────────────────────────────────────────────────────────────
export const Card = ({ children, style = {}, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: '#fff', borderRadius: 12,
      border: '1px solid #e8e8e8', padding: 16,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow .15s',
      ...style,
    }}
  >
    {children}
  </div>
);

// ─── Spinner ─────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 24 }) => (
  <div style={{
    width: size, height: size, border: `2px solid #e0e0e0`,
    borderTop: `2px solid #185FA5`, borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  }}/>
);

// ─── Alert ───────────────────────────────────────────────────────────────────
export const Alert = ({ type = 'error', message }) => {
  if (!message) return null;
  const styles = {
    error:   { background: '#FCEBEB', color: '#791F1F', border: '1px solid #F09595' },
    success: { background: '#EAF3DE', color: '#27500A', border: '1px solid #C0DD97' },
    warning: { background: '#FAEEDA', color: '#633806', border: '1px solid #FAC775' },
  };
  return (
    <div style={{ ...styles[type], padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
      {message}
    </div>
  );
};

// ─── Empty State ─────────────────────────────────────────────────────────────
export const Empty = ({ message = 'No data found', icon = '📭' }) => (
  <div style={{ textAlign: 'center', padding: '48px 24px', color: '#888' }}>
    <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
    <p style={{ fontSize: 14 }}>{message}</p>
  </div>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export const ProgressBar = ({ pct = 0, color = '#185FA5' }) => (
  <div style={{ width: '100%', height: 5, background: '#eee', borderRadius: 3, overflow: 'hidden', marginTop: 8 }}>
    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .4s' }} />
  </div>
);
