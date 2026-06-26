import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import ClassCard from '../../components/ClassCard'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [classes, setClasses] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newSection, setNewSection] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { navigate('/'); return }
    const u = JSON.parse(stored)
    setUser(u)

    if (u.role === 'teacher') {
      const all = JSON.parse(localStorage.getItem('classes') || '[]')
      setClasses(all.filter(c => c.teacherEmail === u.email))
    } else {
      const myClasses = JSON.parse(localStorage.getItem(`myClasses_${u.email}`) || '[]')
      setClasses(myClasses)
    }
  }, [])

  const generateUniqueCode = () => {
    const classes = JSON.parse(localStorage.getItem('classes') || '[]')
    let code
    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase()
    } while (classes.find(c => c.code === code))
    return code
  }

  const handleCreateClass = () => {
    if (!newClassName.trim()) return
    const allClasses = JSON.parse(localStorage.getItem('classes') || '[]')
    const newClass = {
      id: Date.now().toString(),
      name: newClassName,
      section: newSection,
      teacher: user?.name,
      teacherEmail: user?.email,
      code: generateUniqueCode(),
      students: [],
      assignments: []
    }
    const updated = [newClass, ...allClasses]
    localStorage.setItem('classes', JSON.stringify(updated))
    setClasses(updated.filter(c => c.teacherEmail === user?.email))
    setShowCreateModal(false)
    setNewClassName('')
    setNewSection('')
  }

  return (
    <div className="home-page">
      <Header
        user={user}
        onCreateClass={() => setShowCreateModal(true)}
        onJoinClass={() => navigate('/join')}
      />

      <main className="home-main">
        {classes.length === 0 ? (
          <div className="empty-state">
            <p>{user?.role === 'teacher' ? 'No classes yet. Create your first class!' : 'No classes yet. Join a class using a code from your teacher!'}</p>
          </div>
        ) : (
          <div className="cards-grid">
            {classes.map((cls, i) => (
              <ClassCard key={cls.id} classData={cls} index={i} />
            ))}
          </div>
        )}
      </main>

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