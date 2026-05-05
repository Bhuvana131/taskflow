// frontend/src/pages/DashboardPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasksAPI, projectsAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Card, Badge, Avatar, Spinner, ProgressBar, Empty } from '../components/UI';
import { formatDate, isOverdue, statusLabel } from '../utils/helpers';

const MetricCard = ({ label, value, color }) => (
  <div style={{ background: '#f8f9fb', borderRadius: 10, padding: 16, textAlign: 'center' }}>
    <p style={{ fontSize: 12, color: '#888', margin: '0 0 6px' }}>{label}</p>
    <p style={{ fontSize: 28, fontWeight: 700, color, margin: 0 }}>{value}</p>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data,     setData]     = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dash, projs] = await Promise.all([
          tasksAPI.getDashboard(),
          projectsAPI.getAll(),
        ]);
        setData(dash.data);
        setProjects(projs.data.projects);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <Layout title="Dashboard">
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={36} /></div>
    </Layout>
  );

  const stats   = data?.stats   || {};
  const myTasks = data?.myTasks || [];

  return (
    <Layout title="Dashboard">
      {/* Greeting */}
      <p style={{ fontSize: 15, color: '#555', marginBottom: 20 }}>
        Welcome back, <strong>{user?.name}</strong>! Here's your overview.
      </p>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <MetricCard label="Total Projects"  value={projects.length}      color="#185FA5" />
        <MetricCard label="Total Tasks"     value={stats.total || 0}     color="#0F6E56" />
        <MetricCard label="In Progress"     value={stats.in_progress||0} color="#854F0B" />
        <MetricCard label="Overdue"         value={stats.overdue  || 0}  color="#A32D2D" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* My tasks */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>My Tasks</h2>
            <button onClick={() => navigate('/tasks')} style={{ fontSize: 12, color: '#185FA5', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
          </div>
          {myTasks.length === 0
            ? <Empty message="No tasks assigned to you" icon="✅" />
            : myTasks.map(t => (
              <div key={t.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 500 }}>{t.title}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Badge type={t.status} label={statusLabel(t.status)} />
                  <Badge type={t.priority} label={t.priority} />
                  {t.projectName && <span style={{ fontSize: 11, color: '#888', background: '#f5f5f5', padding: '2px 7px', borderRadius: 4 }}>{t.projectName}</span>}
                  {t.dueDate && <span style={{ fontSize: 11, color: isOverdue(t.dueDate, t.status) ? '#A32D2D' : '#999' }}>Due {formatDate(t.dueDate)}</span>}
                </div>
              </div>
            ))
          }
        </Card>

        {/* Project progress */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Projects</h2>
            <button onClick={() => navigate('/projects')} style={{ fontSize: 12, color: '#185FA5', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
          </div>
          {projects.length === 0
            ? <Empty message="No projects yet" icon="📁" />
            : projects.map(p => {
              const members = p.members || [];
              return (
                <div key={p.id} style={{ marginBottom: 16, cursor: 'pointer' }} onClick={() => navigate('/tasks')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                    <div style={{ display: 'flex', gap: -4 }}>
                      {members.slice(0, 3).map(m => (
                        <Avatar key={m.id} name={m.name} color={m.color} size={22} />
                      ))}
                    </div>
                  </div>
                  {p.description && <p style={{ fontSize: 12, color: '#888', margin: '0 0 4px' }}>{p.description}</p>}
                  <ProgressBar pct={0} />
                </div>
              );
            })
          }
        </Card>
      </div>

      {/* Overdue alert */}
      {(stats.overdue > 0) && (
        <Card style={{ marginTop: 20, borderLeft: '4px solid #E24B4A' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#A32D2D', margin: '0 0 12px' }}>
            ⚠ {stats.overdue} Overdue Task{stats.overdue > 1 ? 's' : ''}
          </h2>
          {myTasks.filter(t => isOverdue(t.dueDate, t.status)).map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              {t.assignee && <Avatar name={t.assignee.name} color={t.assignee.color} size={26} />}
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{t.title}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#A32D2D' }}>Due {formatDate(t.dueDate)}</p>
              </div>
              <span style={{ fontSize: 11, background: '#f5f5f5', padding: '2px 7px', borderRadius: 4, color: '#666' }}>{t.projectName}</span>
            </div>
          ))}
        </Card>
      )}
    </Layout>
  );
};

export default DashboardPage;
