// frontend/src/components/Layout.js
import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, title }) => (
  <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f5f5f5' }}>
    <Sidebar />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top bar */}
      <header style={{
        padding: '0 24px', height: 56, borderBottom: '1px solid #eee',
        background: '#fff', display: 'flex', alignItems: 'center', flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{title}</h1>
      </header>
      {/* Page content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {children}
      </main>
    </div>
  </div>
);

export default Layout;
