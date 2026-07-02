import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ClassCard from '../../components/ClassCard'
import ConfirmModal from '../../components/ConfirmModal'
import API from '../../api'
import './AllClasses.css'

export default function AllClasses() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [classes, setClasses] = useState([])
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
    <div className="allclasses-page">
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
    </div>
  )
}