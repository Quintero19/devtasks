import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { projectService } from '../services'

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16']
const ICONS = ['📁', '🚀', '⚡', '🎯', '🔥', '💡', '🏆', '⭐', '🎨', '🔧', '📊', '🌟']
const STATUS_COLORS = { active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', completed: 'bg-blue-100 text-blue-700', archived: 'bg-slate-100 text-slate-700' }

function ProjectModal({ project, onClose, onSave }) {
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm({
    defaultValues: project || { title: '', description: '', color: '#0ea5e9', icon: '📁', status: 'active' }
  })
  const [selectedColor, setSelectedColor] = useState(project?.color || '#0ea5e9')
  const [selectedIcon, setSelectedIcon] = useState(project?.icon || '📁')

  const onSubmit = async (data) => {
    try {
      await onSave({ ...data, color: selectedColor, icon: selectedIcon })
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save project')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{project ? 'Edit Project' : 'New Project'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
            <input {...register('title', { required: true })} placeholder="Project name" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea {...register('description')} placeholder="What is this project about?" rows={3} className="input resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setSelectedColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${selectedColor === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map(icon => (
                <button key={icon} type="button" onClick={() => setSelectedIcon(icon)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${selectedIcon === icon ? 'bg-sky-100 dark:bg-sky-900/40 scale-110' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
          {project && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select {...register('status')} className="input">
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Saving...' : project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState(null)

  const fetchProjects = () => {
    projectService.getAll().then(setProjects).finally(() => setLoading(false))
  }

  useEffect(() => { fetchProjects() }, [])

  const handleSave = async (data) => {
    if (editProject) {
      const updated = await projectService.update(editProject._id, data)
      setProjects(ps => ps.map(p => p._id === updated._id ? updated : p))
      toast.success('Project updated!')
    } else {
      const created = await projectService.create(data)
      setProjects(ps => [created, ...ps])
      toast.success('Project created! 🎉')
    }
    setEditProject(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return
    await projectService.delete(id)
    setProjects(ps => ps.filter(p => p._id !== id))
    toast.success('Project deleted')
  }

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Projects</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditProject(null); setShowModal(true) }} className="btn-primary">
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📁</div>
          <p className="text-slate-500 dark:text-slate-400 mb-2">No projects yet</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Create your first project</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project._id} className="card p-5 group hover:shadow-md transition-shadow animate-fade-in">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{project.icon}</span>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditProject(project); setShowModal(true) }} className="btn-ghost p-1.5 text-xs">✏️</button>
                  <button onClick={() => handleDelete(project._id)} className="btn-ghost p-1.5 text-xs hover:bg-red-50 dark:hover:bg-red-900/20">🗑️</button>
                </div>
              </div>

              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{project.title}</h3>
              {project.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{project.description}</p>}

              <div className="flex items-center gap-2 mb-3">
                <span className={`badge ${STATUS_COLORS[project.status]}`}>{project.status}</span>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span>{project.completedCount || 0}/{project.taskCount || 0} tasks</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${project.taskCount ? (project.completedCount / project.taskCount * 100) : 0}%`, backgroundColor: project.color }}
                  />
                </div>
              </div>

              <Link to={`/projects/${project._id}/kanban`} className="btn-secondary w-full block text-center text-xs mt-1">
                Open Kanban Board →
              </Link>
            </div>
          ))}
        </div>
      )}

      {(showModal || editProject) && (
        <ProjectModal
          project={editProject}
          onClose={() => { setShowModal(false); setEditProject(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
