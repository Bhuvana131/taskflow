// frontend/src/pages/TasksPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { tasksAPI, projectsAPI, usersAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Card, Button, Modal, Input, Select, Avatar, Badge, Spinner, Empty, Alert } from '../components/UI';
import { formatDate, isOverdue, statusLabel, getErrorMessage } from '../utils/helpers';

const STATUSES = [
  { value: 'todo',        label: 'To Do'       },
  { value: 'in_progress', label: 'In Progress'  },
  { value: 'done',        label: 'Done'         },
];
const PRIORITIES = [
  { value: 'low',    label: 'Low'    },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High'   },
];

const BLANK = { title: '', description: '', status: 'todo', priority: 'medium', dueDate: '', projectId: '', assigneeId: '' };

// ─── Task Card (Kanban) ──────────────────────────────────────────────────────
const TaskCard = ({ task, onEdit, onStatusChange, isAdmin }) => {
  const overdue = isOverdue(task.dueDate, task.status);
  return (
    <div
      style={{
        background: '#fff', border: `1px solid ${overdue ? '#F09595' : '#e8e8e8'}`,
        borderLeft: overdue ? '4px solid #E24B4A' : '4px solid transparent',
        borderRadius: 9, padding: 12, marginBottom: 8,
        cursor: isAdmin ? 'pointer' : 'default',
        transition: 'box-shadow .15s',
        boxShadow: '0 1px 3px rgba(0,0,0,.04)',
      }}
      onClick={() => isAdmin && onEdit(task)}
    >
      <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 6px', lineHeight: 1.4 }}>{task.title}</p>
      {task.description && (
        <p style={{ fontSize: 11, color: '#888', margin: '0 0 8px', overflow: 'hidden', maxHeight: 34, lineHeight: 1.5 }}>{task.description}</p>
      )}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
        {task.projectName && <span style={{ fontSize: 10, background: '#f0f4ff', color: '#185FA5', padding: '2px 7px', borderRadius: 4 }}>{task.projectName}</span>}
        <Badge type={task.priority} label={task.priority} />
        {overdue && <Badge type="overdue" label="overdue" />}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {task.assignee
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Avatar name={task.assignee.name} color={task.assignee.color} size={20} />
              <span style={{ fontSize: 10, color: '#888' }}>{task.assignee.name}</span>
            </div>
          : <span style={{ fontSize: 10, color: '#bbb' }}>Unassigned</span>
        }
        {task.dueDate && (
          <span style={{ fontSize: 10, color: overdue ? '#A32D2D' : '#999' }}>{formatDate(task.dueDate)}</span>
        )}
      </div>
      {/* Quick status move buttons */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
          {STATUSES.filter(s => s.value !== task.status).map(s => (
            <button
              key={s.value}
              onClick={e => { e.stopPropagation(); onStatusChange(task.id, s.value); }}
              style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, border: '1px solid #ddd', background: '#f8f8f8', cursor: 'pointer', color: '#555' }}
            >→ {s.label}</button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
const TasksPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [tasks,    setTasks]    = useState([]);
  const [projects, setProjects] = useState([]);
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [view,     setView]     = useState('kanban');   // 'kanban' | 'list'
  const [filterP,  setFilterP]  = useState('');
  const [filterS,  setFilterS]  = useState('');
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(BLANK);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const load = useCallback(async () => {
    try {
      const params = {};
      if (filterP) params.projectId = filterP;
      if (filterS) params.status    = filterS;
      const [tRes, pRes, uRes] = await Promise.all([
        tasksAPI.getAll(params),
        projectsAPI.getAll(),
        usersAPI.getAll(),
      ]);
      setTasks(tRes.data.tasks);
      setProjects(pRes.data.projects);
      setUsers(uRes.data.users);
    } finally {
      setLoading(false);
    }
  }, [filterP, filterS]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setForm({ ...BLANK, projectId: projects[0]?.id || '', assigneeId: user.id });
    setEditing(null); setError(''); setModal(true);
  };
  const openEdit = (t) => {
    setForm({
      title: t.title, description: t.description || '',
      status: t.status, priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
      projectId: t.projectId, assigneeId: t.assignee?.id || '',
    });
    setEditing(t); setError(''); setModal(true);
  };

  const save = async () => {
    if (!form.title.trim())    { setError('Title is required');   return; }
    if (!form.projectId)       { setError('Project is required'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, assigneeId: form.assigneeId || null, dueDate: form.dueDate || null };
      if (editing) {
        await tasksAPI.update(editing.id, payload);
      } else {
        await tasksAPI.create(payload);
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
    if (!window.confirm('Delete this task?')) return;
    try { await tasksAPI.delete(id); load(); }
    catch (err) { alert(getErrorMessage(err)); }
  };

  const quickStatus = async (id, status) => {
    try { await tasksAPI.update(id, { status }); load(); }
    catch (err) { alert(getErrorMessage(err)); }
  };

  if (loading) return (
    <Layout title="Tasks">
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={36} /></div>
    </Layout>
  );

  const filtered = tasks.filter(t => {
    if (filterP && t.projectId !== filterP) return false;
    if (filterS && t.status    !== filterS) return false;
    return true;
  });

  return (
    <Layout title="Tasks">
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Filters */}
        <select
          value={filterP} onChange={e => setFilterP(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid #ddd', fontSize: 13, cursor: 'pointer', minWidth: 160 }}
        >
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select
          value={filterS} onChange={e => setFilterS(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid #ddd', fontSize: 13, cursor: 'pointer', minWidth: 140 }}
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {/* View toggle */}
        <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: 7, overflow: 'hidden', marginLeft: 'auto' }}>
          {['kanban', 'list'].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{
                padding: '7px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: view === v ? '#185FA5' : '#fff',
                color:      view === v ? '#fff'    : '#555',
                transition: '.15s',
              }}
            >{v === 'kanban' ? '⬜ Board' : '☰ List'}</button>
          ))}
        </div>

        {isAdmin && <Button variant="primary" onClick={openNew}>+ Add Task</Button>}
      </div>

      {filtered.length === 0 && <Empty message="No tasks found" icon="📋" />}

      {/* ── Kanban Board ── */}
      {view === 'kanban' && filtered.length > 0 && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 12 }}>
          {STATUSES.map(col => {
            const colTasks = filtered.filter(t => t.status === col.value);
            const colColors = { todo: '#185FA5', in_progress: '#854F0B', done: '#27500A' };
            return (
              <div key={col.value} style={{ flex: '0 0 280px', background: '#f8f9fb', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colColors[col.value] }}>{col.label}</span>
                  <span style={{ fontSize: 11, background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '2px 8px', color: '#666' }}>{colTasks.length}</span>
                </div>
                {colTasks.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#bbb', fontSize: 12 }}>Empty</div>
                )}
                {colTasks.map(t => (
                  <TaskCard key={t.id} task={t} onEdit={openEdit} onStatusChange={quickStatus} isAdmin={isAdmin} />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* ── List View ── */}
      {view === 'list' && filtered.length > 0 && (
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                {['Task', 'Project', 'Assignee', 'Status', 'Priority', 'Due Date', isAdmin ? 'Actions' : ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#888', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const overdue = isOverdue(t.dueDate, t.status);
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f5f5f5', background: overdue ? '#fff8f8' : 'transparent' }}>
                    <td style={{ padding: '10px 12px', maxWidth: 200 }}>
                      <p style={{ margin: 0, fontWeight: 500 }}>{t.title}</p>
                      {t.description && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{t.description}</p>}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 12, background: '#f0f4ff', color: '#185FA5', padding: '2px 8px', borderRadius: 4 }}>{t.projectName}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {t.assignee
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Avatar name={t.assignee.name} color={t.assignee.color} size={24} />
                            <span style={{ fontSize: 12 }}>{t.assignee.name}</span>
                          </div>
                        : <span style={{ fontSize: 12, color: '#bbb' }}>—</span>
                      }
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <Badge type={t.status} label={statusLabel(t.status)} />
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <Badge type={t.priority} label={t.priority} />
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: overdue ? '#A32D2D' : '#666' }}>
                      {t.dueDate ? formatDate(t.dueDate) : '—'}
                      {overdue && <span style={{ display: 'block', fontSize: 10, color: '#A32D2D' }}>Overdue</span>}
                    </td>
                    {isAdmin && (
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Button size="sm" onClick={() => openEdit(t)}>Edit</Button>
                          <Button size="sm" variant="danger" onClick={() => del(t.id)}>Del</Button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── Task Modal ── */}
      {modal && (
        <Modal title={editing ? 'Edit Task' : 'New Task'} onClose={() => setModal(false)}>
          <Alert type="error" message={error} />
          <Input label="Title *" placeholder="What needs to be done?" value={form.title} onChange={set('title')} />
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>Description</label>
            <textarea
              value={form.description} onChange={set('description')}
              placeholder="More details..."
              rows={3}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #d0d0d0', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Select
              label="Project *"
              value={form.projectId}
              onChange={set('projectId')}
              options={[{ value: '', label: 'Select project...' }, ...projects.map(p => ({ value: p.id, label: p.name }))]}
            />
            <Select
              label="Assign To"
              value={form.assigneeId}
              onChange={set('assigneeId')}
              options={[{ value: '', label: 'Unassigned' }, ...users.map(u => ({ value: u.id, label: u.name }))]}
            />
            <Select label="Status"   value={form.status}   onChange={set('status')}   options={STATUSES}   />
            <Select label="Priority" value={form.priority} onChange={set('priority')} options={PRIORITIES} />
          </div>
          <Input label="Due Date" type="date" value={form.dueDate} onChange={set('dueDate')} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            {editing && <Button variant="danger" onClick={() => { del(editing.id); setModal(false); }}>Delete</Button>}
            <Button onClick={() => setModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Task'}</Button>
          </div>
        </Modal>
      )}
    </Layout>
  );
};

export default TasksPage;
