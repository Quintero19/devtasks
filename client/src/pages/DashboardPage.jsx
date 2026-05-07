import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { taskService, projectService } from '../services'
import { useAuth } from '../context/AuthContext'

const StatCard = ({ label, value, icon, color }) => (
  <div className="card p-5 animate-slide-up">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-xl`}>{icon}</div>
    </div>
  </div>
)

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([taskService.getStats(), projectService.getAll()])
      .then(([s, p]) => { setStats(s); setProjects(p.slice(0, 5)) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Here's what's happening with your projects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Tasks" value={stats?.total || 0} icon="✅" color="bg-sky-50 dark:bg-sky-900/20" />
        <StatCard label="Completed" value={stats?.completed || 0} icon="🏆" color="bg-green-50 dark:bg-green-900/20" />
        <StatCard label="In Progress" value={stats?.inProgress || 0} icon="⚡" color="bg-yellow-50 dark:bg-yellow-900/20" />
        <StatCard label="Active Projects" value={stats?.activeProjects || 0} icon="📁" color="bg-purple-50 dark:bg-purple-900/20" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Weekly Chart */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Weekly Productivity</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats?.weeklyData || []}>
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: 12 }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="completed" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Overdue Alert */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Task Overview</h2>
          <div className="space-y-3">
            {[
              { label: 'Completed', value: stats?.completed, total: stats?.total, color: 'bg-green-500' },
              { label: 'In Progress', value: stats?.inProgress, total: stats?.total, color: 'bg-yellow-500' },
              { label: 'Overdue', value: stats?.overdue, total: stats?.total, color: 'bg-red-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                  <span>{item.label}</span>
                  <span>{item.value}/{item.total}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-700`}
                    style={{ width: `${item.total ? (item.value / item.total * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Projects</h2>
          <Link to="/projects" className="text-xs text-sky-500 hover:text-sky-600">View all →</Link>
        </div>
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">No projects yet</p>
            <Link to="/projects" className="btn-primary mt-3 inline-block text-xs">Create your first project</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map(project => (
              <Link
                key={project._id}
                to={`/projects/${project._id}/kanban`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
              >
                <span className="text-xl">{project.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{project.title}</p>
                  <p className="text-xs text-slate-500">{project.taskCount || 0} tasks · {project.completedCount || 0} done</p>
                </div>
                <div className="h-2 w-20 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{ width: `${project.taskCount ? (project.completedCount / project.taskCount * 100) : 0}%` }}
                  />
                </div>
                <span className="text-slate-300 dark:text-slate-600 group-hover:text-sky-500 transition-colors">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
