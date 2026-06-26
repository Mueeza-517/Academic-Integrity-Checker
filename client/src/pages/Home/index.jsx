import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import ClassCard from '../../components/ClassCard'
import './Home.css'

// Mock data — replace with API calls later
const MOCK_CLASSES = [
  { id: '1', name: 'ISL', section: '24A', teacher: 'Haris Nadeem' },
  { id: '2', name: 'IS_Lab', section: 'A', teacher: 'Zainab' },
  { id: '3', name: 'COAL_LAB_A', section: 'A', teacher: 'Kamran Mustafa' },
  { id: '4', name: 'AIL 24A', section: '24 A', teacher: 'Riza Khalid' },
  { id: '5', name: 'ADBMS', section: 'A', teacher: 'Muhammad Waleed' },
  { id: '6', name: 'Computer Networks', section: 'A', teacher: 'Abdul Rehman' },
  { id: '7', name: 'PD(OOP)', section: 'A', teacher: 'Muhammad Ahmed Butt' },
  { id: '8', name: 'Object Oriented Progr...', section: 'A', teacher: 'Prof. Dr Muhammad Awais' },
  { id: '9', name: 'PF Fall 2024', section: '', teacher: 'Prof. Dr Muhammad Awais' },
  { id: '10', name: 'Discrete Mathematics', section: 'A-24', teacher: 'Waqas ALI' },
  { id: '11', name: 'AICT', section: 'A', teacher: 'Sana Afzal' },
]

export default function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [classes, setClasses] = useState(MOCK_CLASSES)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newSection, setNewSection] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [showJoinModal, setShowJoinModal] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { navigate('/'); return }
    setUser(JSON.parse(stored))
  }, [])

  const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()

  const handleCreateClass = () => {
    if (!newClassName.trim()) return
    const newClass = {
      id: Date.now().toString(),
      name: newClassName,
      section: newSection,
      teacher: user?.name,
      code: generateCode()
    }
    setClasses(prev => [newClass, ...prev])
    setShowCreateModal(false)
    setNewClassName('')
    setNewSection('')
  }

  const handleJoinClass = () => {
    if (!joinCode.trim()) return
    // In real app: call API with joinCode to get class info
    alert(`Joining class with code: ${joinCode}`)
    setShowJoinModal(false)
    setJoinCode('')
  }

  return (
    <div className="home-page">
      <Header
        user={user}
        onCreateClass={() => setShowCreateModal(true)}
        onJoinClass={() => setShowJoinModal(true)}
      />

      <main className="home-main">
        <div className="cards-grid">
          {classes.map((cls, i) => (
            <ClassCard key={cls.id} classData={cls} index={i} />
          ))}
        </div>
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

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Join class</h2>
            <p className="modal-hint">Ask your teacher for the class code, then enter it here.</p>
            <input
              className="modal-input"
              placeholder="Class code"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={8}
            />
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowJoinModal(false)}>Cancel</button>
              <button className="modal-confirm" onClick={handleJoinClass}>Join</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}