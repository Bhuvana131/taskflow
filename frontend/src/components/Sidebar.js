// frontend/src/components/Sidebar.js
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge } from './UI';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '▪' },
  { to: '/projects',  label: 'Projects',  icon: '▪' },
  { to: '/tasks',     label: 'Tasks',     icon: '▪' },
  { to: '/team',      label: 'Team',      icon: '▪' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside style={{
      width: 220, background: '#fff', borderRight: '1px solid #eee',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, background: '#185FA5', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 13,
        }}>TM</div>
        <span style={{ fontWeight: 600, fontSize: 15 }}>TaskFlow</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: 10 }}>
        <p style={{ fontSize: 10, color: '#aaa', padding: '8px 10px 4px', textTransform: 'uppercase', letterSpacing: 1 }}>Navigation</p>
        {NAV.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, marginBottom: 2,
              fontSize: 13, fontWeight: isActive ? 500 : 400,
              color: isActive ? '#185FA5' : '#555',
              background: isActive ? '#E6F1FB' : 'transparent',
              textDecoration: 'none', transition: 'all .15s',
            })}
          >
            {n.label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: 12, borderTop: '1px solid #eee' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: '#f8f8f8' }}>
          <Avatar name={user?.name} color={user?.color} size={30} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{user?.name}</p>
            <Badge type={user?.role} label={user?.role} />
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#999', padding: 2 }}
          >⇥</button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
