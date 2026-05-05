// frontend/src/pages/TeamPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { usersAPI, tasksAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Card, Button, Modal, Input, Select, Avatar, Badge, Spinner, Empty, Alert } from '../components/UI';
import { getErrorMessage } from '../utils/helpers';

const TeamPage = () => {
  const { user, updateUser } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [users,   setUsers]   = useState([]);
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ name: '', role: 'member', password: '' });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const load = useCallback(async () => {
    try {
      const [uRes, tRes] = await Promise.all([
        usersAPI.getAll(),
        tasksAPI.getAll(),
      ]);
      setUsers(uRes.data.users);
      setTasks(tRes.data.tasks);
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (u) => {
    setForm({ name: u.name, role: u.role, password: '' });
    setEditing(u);
    setError('');
    setModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name, role: form.role };
      if (form.password) payload.password = form.password;
      const { data } = await usersAPI.update(editing.id, payload);
      if (editing.id === user.id) updateUser(data.user);
      setModal(false);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (id) => {
    if (id === user.id) { alert("You cannot remove your own account."); return; }
    if (!window.confirm('Remove this user from the system?')) return;
    try {
      await usersAPI.delete(id);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  // Task completion stats per user
  const getStats = (uid) => {
    const mine = tasks.filter(t => t.assignee?.id === uid);
    return {
      total:      mine.length,
      done:       mine.filter(t => t.status === 'done').length,
      inProgress: mine.filter(t => t.status === 'in_progress').length,
    };
  };

  if (loading) return (
    <Layout title="Team">
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={36} />
      </div>
    </Layout>
  );

  return (
    <Layout title="Team">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ color: '#666', fontSize: 13, margin: 0 }}>
          {users.length} member{users.length !== 1 ? 's' : ''}
        </p>
      </div>

      {users.length === 0 ? (
        <Empty message="No team members found." icon="👥" />
      ) : (
        <Card>
          {users.map((u, i) => {
            const stats = getStats(u.id);
            const pct   = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
            return (
              <div
                key={u.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '16px 0',
                  borderBottom: i < users.length - 1 ? '1px solid #f0f0f0' : 'none',
                }}
              >
                {/* Avatar */}
                <Avatar name={u.name} color={u.color} size={46} />

                {/* Name + email */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</span>
                    {u.id === user.id && (
                      <span style={{ fontSize: 10, color: '#aaa', background: '#f5f5f5', padding: '1px 7px', borderRadius: 10 }}>
                        you
                      </span>
                    )}
                    <Badge type={u.role} label={u.role} />
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#999' }}>{u.email}</p>
                </div>

                {/* Task stats */}
                <div style={{ textAlign: 'center', minWidth: 80 }}>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#185FA5' }}>{pct}%</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#aaa' }}>completion</p>
                </div>
                <div style={{ textAlign: 'center', minWidth: 60 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#333' }}>{stats.total}</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#aaa' }}>tasks</p>
                </div>
                <div style={{ textAlign: 'center', minWidth: 60 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#27500A' }}>{stats.done}</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#aaa' }}>done</p>
                </div>
                <div style={{ textAlign: 'center', minWidth: 60 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#854F0B' }}>{stats.inProgress}</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#aaa' }}>active</p>
                </div>

                {/* Actions (admin only) */}
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button size="sm" onClick={() => openEdit(u)}>Edit</Button>
                    {u.id !== user.id && (
                      <Button size="sm" variant="danger" onClick={() => removeUser(u.id)}>Remove</Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}

      {/* Roles legend */}
      <div style={{ marginTop: 24 }}>
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 14px' }}>Role Permissions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              {
                role: 'admin', title: 'Admin',
                perms: ['Create / edit / delete projects', 'Create / edit / delete tasks', 'Assign tasks to any member', 'Manage team members and roles', 'View all projects and tasks'],
              },
              {
                role: 'member', title: 'Member',
                perms: ['View projects they are added to', 'View tasks in their projects', 'Update status of assigned tasks', 'View team member list', 'Cannot create or delete resources'],
              },
            ].map(r => (
              <div key={r.role} style={{ background: '#f8f9fb', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Badge type={r.role} label={r.title} />
                </div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {r.perms.map(p => (
                    <li key={p} style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Edit modal */}
      {modal && (
        <Modal title={`Edit — ${editing?.name}`} onClose={() => setModal(false)}>
          <Alert type="error" message={error} />
          <Input
            label="Full Name"
            value={form.name}
            onChange={set('name')}
            placeholder="Full name"
          />
          {isAdmin && (
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
          <Input
            label="New Password (leave blank to keep current)"
            type="password"
            value={form.password}
            onChange={set('password')}
            placeholder="••••••••"
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button onClick={() => setModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Modal>
      )}
    </Layout>
  );
};

export default TeamPage;
