import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { format, isPast } from 'date-fns'
import { taskService, projectService, aiService } from '../services'

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'bg-slate-400' },
  { id: 'inprogress', label: 'In Progress', color: 'bg-yellow-400' },
  { id: 'review', label: 'Review', color: 'bg-blue-400' },
  { id: 'completed', label: 'Completed', color: 'bg-green-400' },
]

const PRIORITY_STYLES = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

function TaskCard({ task, index, onEdit, onDelete }) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed'

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`card p-3 mb-2 cursor-grab active:cursor-grabbing select-none transition-shadow ${snapshot.isDragging ? 'shadow-lg rotate-1 opacity-90' : 'hover:shadow-md'} ${task.aiGenerated ? 'border-l-2 border-l-sky-400' : ''}`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-slate-900 dark:text-white leading-snug flex-1">{task.title}</p>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => onEdit(task)} className="text-slate-400 hover:text-slate-600 p-0.5 text-xs">✏️</button>
              <button onClick={() => onDelete(task._id)} className="text-slate-400 hover:text-red-500 p-0.5 text-xs">🗑️</button>
            </div>
          </div>

          {task.description && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{task.description}</p>}

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge text-xs ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
            {task.dueDate && (
              <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                {isOverdue ? '⚠️ ' : '📅 '}
                {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
            {task.aiGenerated && <span className="text-xs text-sky-500">✨ AI</span>}
          </div>
        </div>
      )}
    </Draggable>
  )
}

function TaskModal({ task, projectId, onClose, onSave }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: task || { title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', tags: '' }
  })

  const onSubmit = async (data) => {
    try {
      const payload = { ...data, projectId, tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [] }
      await onSave(payload)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{task ? 'Edit Task' : 'New Task'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
            <input {...register('title', { required: true })} className="input" placeholder="Task title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea {...register('description')} rows={3} className="input resize-none" placeholder="Details..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <select {...register('priority')} className="input">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select {...register('status')} className="input">
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
            <input {...register('dueDate')} type="date" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags (comma separated)</label>
            <input {...register('tags')} className="input" placeholder="design, frontend, api" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AIGeneratorModal({ projectId, onClose, onGenerated }) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const generate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      const data = await aiService.generateTasks(prompt, projectId)
      setResult(data)
      if (data.saved) {
        onGenerated(data.tasks)
        toast.success(`✨ ${data.tasks.length} tasks generated and saved!`)
        onClose()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI generation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">✨</span>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">AI Task Generator</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">Describe your goal and AI will create a complete task roadmap</p>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 mb-4 text-xs text-slate-500 space-y-1">
          <p>Examples:</p>
          <p className="italic">"Necesito aprender redes de computadoras"</p>
          <p className="italic">"Build a REST API with authentication"</p>
          <p className="italic">"Create a mobile app MVP"</p>
        </div>

        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={3}
          className="input mb-4"
          placeholder="Describe your goal or project..."
        />

        {result && !result.saved && (
          <div className="bg-sky-50 dark:bg-sky-900/20 rounded-lg p-3 mb-4">
            <p className="text-xs font-medium text-sky-700 dark:text-sky-300 mb-2">{result.summary}</p>
            <div className="space-y-1">
              {result.tasks.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span className="text-sky-400">→</span>
                  <span>{t.title}</span>
                  <span className="text-slate-400">({t.priority})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={generate} disabled={loading || !prompt.trim()} className="btn-primary flex items-center gap-2">
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
            ) : (
              <>✨ Generate Tasks</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function KanbanPage() {
  const { id: projectId } = useParams()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [defaultStatus, setDefaultStatus] = useState('todo')
  const [showAI, setShowAI] = useState(false)

  useEffect(() => {
    Promise.all([
      projectService.getOne(projectId),
      taskService.getByProject(projectId)
    ]).then(([p, t]) => { setProject(p); setTasks(t) })
      .finally(() => setLoading(false))
  }, [projectId])

  const getTasksByStatus = (status) => tasks.filter(t => t.status === status)

  const handleDragEnd = async (result) => {
    if (!result.destination) return
    const { draggableId, destination } = result
    const newStatus = destination.droppableId

    setTasks(prev => prev.map(t => t._id === draggableId ? { ...t, status: newStatus } : t))

    try {
      await taskService.updateStatus(draggableId, newStatus, destination.index)
    } catch {
      toast.error('Failed to update task')
    }
  }

  const handleSaveTask = async (data) => {
    if (editTask) {
      const updated = await taskService.update(editTask._id, data)
      setTasks(prev => prev.map(t => t._id === updated._id ? updated : t))
      toast.success('Task updated!')
    } else {
      const created = await taskService.create({ ...data, status: defaultStatus })
      setTasks(prev => [...prev, created])
      toast.success('Task created!')
    }
    setEditTask(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return
    await taskService.delete(id)
    setTasks(prev => prev.filter(t => t._id !== id))
    toast.success('Task deleted')
  }

  const handleAddTask = (status) => {
    setDefaultStatus(status)
    setEditTask(null)
    setShowTaskModal(true)
  }

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <Link to="/projects" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm">← Projects</Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-xl">{project?.icon}</span>
          <h1 className="font-semibold text-slate-900 dark:text-white">{project?.title}</h1>
          <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 text-xs">{tasks.length} tasks</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAI(true)} className="flex items-center gap-1.5 px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-lg text-sm font-medium transition-colors">
            ✨ AI Generate
          </button>
          <button onClick={() => handleAddTask('todo')} className="btn-primary">+ Add Task</button>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.map(col => (
              <div key={col.id} className="w-72 flex flex-col">
                {/* Column Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${col.color}`} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{col.label}</span>
                  <span className="ml-auto badge bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs">
                    {getTasksByStatus(col.id).length}
                  </span>
                </div>

                {/* Droppable area */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-h-32 rounded-xl p-2 transition-colors ${snapshot.isDraggingOver ? 'bg-sky-50 dark:bg-sky-900/20 border-2 border-dashed border-sky-300' : 'bg-slate-100 dark:bg-slate-800/40'}`}
                    >
                      {getTasksByStatus(col.id).map((task, index) => (
                        <TaskCard
                          key={task._id}
                          task={task}
                          index={index}
                          onEdit={(t) => { setEditTask(t); setShowTaskModal(true) }}
                          onDelete={handleDelete}
                        />
                      ))}
                      {provided.placeholder}

                      <button
                        onClick={() => handleAddTask(col.id)}
                        className="w-full mt-1 py-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        + Add task
                      </button>
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>

      {showTaskModal && (
        <TaskModal
          task={editTask}
          projectId={projectId}
          onClose={() => { setShowTaskModal(false); setEditTask(null) }}
          onSave={handleSaveTask}
        />
      )}

      {showAI && (
        <AIGeneratorModal
          projectId={projectId}
          onClose={() => setShowAI(false)}
          onGenerated={(newTasks) => setTasks(prev => [...prev, ...newTasks])}
        />
      )}
    </div>
  )
}
