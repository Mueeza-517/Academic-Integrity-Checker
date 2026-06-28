import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import ClassCard from '../../components/ClassCard'
import ConfirmModal from '../../components/ConfirmModal'
import API from '../../api'
import './Home.css'

const CARD_COLORS = [
  '#1e7e72', '#5c2d91', '#b06000', '#1a73e8',
  '#c5221f', '#137333', '#7b5ea7', '#d93025'
]

export default function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [classes, setClasses] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newSection, setNewSection] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (!stored || !token) { navigate('/'); return }
    setUser(JSON.parse(stored))
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const { data } = await API.get('/classes/my')
      setClasses(data)
    } catch (err) {
      setError('Failed to load classes.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return
    try {
      const totalCount = await API.get('/classes/my')
      const colorIndex = totalCount.data.length % CARD_COLORS.length
      const { data } = await API.post('/classes', {
        name: newClassName,
        section: newSection,
        color: CARD_COLORS[colorIndex]
      })
      setClasses(prev => [...prev, data])
      setShowCreateModal(false)
      setNewClassName('')
      setNewSection('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create class.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const handleRoleSwitch = async () => {
    try {
      const newRole = user.role === 'teacher' ? 'student' : 'teacher'
      const { data } = await API.post('/auth/google-switch', {
        email: user.email,
        role: newRole
      })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      setClasses([])
      fetchClasses()
    } catch (err) {
      alert('Failed to switch role.')
    }
  }

  const handleDeleteClass = (classId) => {
    setConfirm({
      title: 'Delete Class',
      message: 'Are you sure you want to delete this class? All assignments and submissions will be lost.',
      confirmText: 'Delete',
      confirmColor: '#c5221f',
      onConfirm: async () => {
        try {
          await API.delete(`/classes/${classId}`)
          setClasses(prev => prev.filter(c => c._id !== classId))
        } catch (err) {
          alert('Failed to delete class.')
        }
        setConfirm(null)
      }
    })
  }

  const handleUnenroll = (classId) => {
    setConfirm({
      title: 'Unenroll from Class',
      message: 'Are you sure you want to unenroll from this class?',
      confirmText: 'Unenroll',
      confirmColor: '#e65100',
      onConfirm: async () => {
        try {
          await API.post(`/classes/${classId}/unenroll`)
          setClasses(prev => prev.filter(c => c._id !== classId))
        } catch (err) {
          alert('Failed to unenroll.')
        }
        setConfirm(null)
      }
    })
  }

  return (
    <div className="home-page">
      <Header
        user={user}
        onCreateClass={() => setShowCreateModal(true)}
        onJoinClass={() => navigate('/join')}
        onLogout={handleLogout}
        onRoleSwitch={handleRoleSwitch}
      />

      <main className="home-main">
        {loading ? (
          <div className="empty-state"><p>Loading classes...</p></div>
        ) : error ? (
          <div className="empty-state"><p>{error}</p></div>
        ) : classes.length === 0 ? (
          <div className="empty-state">
            <p>{user?.role === 'teacher'
              ? 'No classes yet. Create your first class!'
              : 'No classes yet. Join a class using a code from your teacher!'}
            </p>
          </div>
        ) : (
          <div className="cards-grid">
            {classes.map((cls) => (
              <ClassCard
                key={cls._id}
                classData={cls}
                user={user}
                onDelete={handleDeleteClass}
                onUnenroll={handleUnenroll}
              />
            ))}
          </div>
        )}
      </main>

      {/* Confirm Modal */}
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmText={confirm.confirmText}
          confirmColor={confirm.confirmColor}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create class</h2>
            <input
              className="modal-input"
              placeholder="Class name (required)"
              value={newClassName}
              onChange={e => setNewClassName(e.target.value)}
            />
            <input
              className="modal-input"
              placeholder="Section"
              value={newSection}
              onChange={e => setNewSection(e.target.value)}
            />
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="modal-confirm" onClick={handleCreateClass}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}