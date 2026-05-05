// frontend/src/pages/ProjectsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { projectsAPI, usersAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Card, Button, Modal, Input, Avatar, Badge, Spinner, Empty, ProgressBar, Alert } from '../components/UI';
import { getErrorMessage } from '../utils/helpers';

const BLANK = { name: '', description: '', memberIds: [] };

const ProjectsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [projects, setProjects] = useState([]);
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(BLANK);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const load = useCallback(async () => {
    try {
      const [pRes, uRes] = await Promise.all([
        projectsAPI.getAll(),
        usersAPI.getAll(),
      ]);
      setProjects(pRes.data.projects);
      setUsers(uRes.data.users);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setForm({ name: '', description: '', memberIds: [user.id] });
    setEditing(null); setError(''); setModal(true);
  };

  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description || '', memberIds: p.members.map(m => m.id) });
    setEditing(p); setError(''); setModal(true);
  };

  const toggleMember = (uid) => {
    setForm(p => ({
      ...p,
      memberIds: p.memberIds.includes(uid)
        ? p.memberIds.filter(id => id !== uid)
        : [...p.memberIds, uid],
    }));
  };

  const save = async () => {
    if (!form.name.trim()) { setError('Project name is required'); return; }
    setSaving(true); setError('');
    try {
      if (editing) {
        await projectsAPI.update(editing.id, form);
      } else {
        await projectsAPI.create(form);
      }
      setModal(false);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await projectsAPI.delete(id);
      setProjects(p => p.filter(x => x.id !== id));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  if (loading) return (
    <Layout title="Projects">
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={36} /></div>
    </Layout>
  );

  return (
    <Layout title="Projects">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ color: '#666', fontSize: 13, margin: 0 }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        {isAdmin && <Button variant="primary" onClick={openNew}>+ New Project</Button>}
      </div>

      {projects.length === 0
        ? <Empty message={isAdmin ? 'No projects yet. Create one to get started.' : 'You have not been added to any projects.'} icon="📁" />
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {projects.map(p => {
              const totalMembers = p.members?.length || 0;
              return (
                <Card key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, flex: 1 }}>{p.name}</h3>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                        <Button size="sm" onClick={() => openEdit(p)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => del(p.id)}>Del</Button>
                      </div>
                    )}
                  </div>
                  {p.description && <p style={{ fontSize: 12, color: '#888', margin: '0 0 10px' }}>{p.description}</p>}
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
                    Owner: {p.owner_name} &nbsp;·&nbsp; {totalMembers} member{totalMembers !== 1 ? 's' : ''}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                    {(p.members || []).slice(0, 6).map(m => (
                      <Avatar key={m.id} name={m.name} color={m.color} size={26} />
                    ))}
                    {totalMembers > 6 && <span style={{ fontSize: 11, color: '#888', alignSelf: 'center' }}>+{totalMembers - 6}</span>}
                  </div>
                  <ProgressBar pct={0} />
                  <p style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>Created {new Date(p.created_at).toLocaleDateString()}</p>
                </Card>
              );
            })}
          </div>
        )
      }

      {modal && (
        <Modal title={editing ? 'Edit Project' : 'New Project'} onClose={() => setModal(false)}>
          <Alert type="error" message={error} />
          <Input label="Project Name *" placeholder="e.g. Website Redesign" value={form.name} onChange={set('name')} />
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="What is this project about?"
              rows={3}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #d0d0d0', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 8 }}>Members</label>
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
              {users.map(u => (
                <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 6px', cursor: 'pointer', borderRadius: 6, transition: '.15s' }}>
                  <input type="checkbox" checked={form.memberIds.includes(u.id)} onChange={() => toggleMember(u.id)} />
                  <Avatar name={u.name} color={u.color} size={26} />
                  <span style={{ flex: 1, fontSize: 13 }}>{u.name}</span>
                  <Badge type={u.role} label={u.role} />
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => setModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Project'}</Button>
          </div>
        </Modal>
      )}
    </Layout>
  );
};

export default ProjectsPage;
