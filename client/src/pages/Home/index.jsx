import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import ClassCard from '../../components/ClassCard'
import ConfirmModal from '../../components/ConfirmModal'
import API from '../../api'
import './Home.css'

const CARD_COLORS = ['#3443eb']

const HOW_IT_WORKS = [
  {
    step: '1. Create a Class',
    text: 'Create a new class and share the unique class code with your students.',
    icon: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  },
  {
    step: '2. Students Join',
    text: 'Students join the class using the class code from the join page.',
    icon: <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
  },
  {
    step: '3. Create Work',
    text: 'Upload assignments with deadlines and instructions for your class.',
    icon: <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
  },
  {
    step: '4. Students Submit',
    text: 'Students submit their work online before the deadline expires.',
    icon: <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
  },
  {
    step: '5. Review & Grade',
    text: 'Review submissions and provide feedback. Late submissions are not accepted.',
    icon: <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1.2 14.2L6.8 11.2l1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z" />
  }
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
  const [stats, setStats] = useState({
    classes: 0, assignments: 0, submitted: 0, missed: 0, pendingReview: 0
  })

  const gridWrapperRef = useRef(null)
  const probeCardRef = useRef(null)
  const [columnsPerRow, setColumnsPerRow] = useState(4)
  const [rowHeight, setRowHeight] = useState(null)

  useEffect(() => {
    const calculateColumns = () => {
      if (!gridWrapperRef.current) return
      const containerWidth = gridWrapperRef.current.offsetWidth
      const cardMinWidth = 280
      const gap = 20
      const cols = Math.max(1, Math.floor((containerWidth + gap) / (cardMinWidth + gap)))
      setColumnsPerRow(cols)
    }

    calculateColumns()
    window.addEventListener('resize', calculateColumns)
    return () => window.removeEventListener('resize', calculateColumns)
  }, [])

  useEffect(() => {
    if (probeCardRef.current) {
      setRowHeight(probeCardRef.current.offsetHeight)
    }
  }, [classes, columnsPerRow])

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
      fetchStats(data)
    } catch (err) {
      setError('Failed to load classes.')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async (classList) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'))
      let totalAssignments = 0
      let submitted = 0
      let missed = 0
      let pendingReview = 0

      for (const cls of classList) {
        const { data: assignments } = await API.get(`/assignments/class/${cls._id}`)
        totalAssignments += assignments.length

        for (const a of assignments) {
          const isPast = new Date() > new Date(a.deadline)
          if (currentUser?.role === 'student') {
            const mySubmission = a.submissions?.find(s => s.studentEmail === currentUser.email)
            if (mySubmission) submitted++
            else if (isPast) missed++
          } else {
            pendingReview += a.submissions?.length || 0
          }
        }
      }

      setStats({
        classes: classList.length,
        assignments: totalAssignments,
        submitted,
        missed,
        pendingReview
      })
    } catch (err) {
      console.error('Failed to fetch stats')
    }
  }

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return
    try {
      const { data } = await API.post('/classes', {
        name: newClassName,
        section: newSection,
        color: '#3443eb'
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

  const slotsForTwoRows = columnsPerRow * 2
  const visibleClasses = classes.slice(0, slotsForTwoRows)

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

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#1a73e8">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
              </svg>
            </div>
            <div className="stat-info">
              <h2>{stats.classes}</h2>
              <p>Total Classes</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#1a73e8">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>
            </div>
            <div className="stat-info">
              <h2>{stats.assignments}</h2>
              <p>Total Assignments</p>
            </div>
          </div>

          {user?.role === 'student' ? (
            <>
              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="#1a73e8">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </div>
                <div className="stat-info">
                  <h2>{stats.submitted}</h2>
                  <p>Submitted</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="#1a73e8">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                  </svg>
                </div>
                <div className="stat-info">
                  <h2>{stats.missed}</h2>
                  <p>Missed</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="#1a73e8">
                    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
                  </svg>
                </div>
                <div className="stat-info">
                  <h2>{stats.pendingReview}</h2>
                  <p>Total Submissions</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="#1a73e8">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                  </svg>
                </div>
                <div className="stat-info">
                  <h2>{Math.max(0, stats.assignments - stats.pendingReview)}</h2>
                  <p>Pending Review</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="classes-section-header">
          <h2 className="classes-section-title"><b>Your Classes</b></h2>
          {classes.length > 0 && (
            <button className="view-all-btn" onClick={() => navigate('/classes')}>
              View all
            </button>
          )}
        </div>

        <div
          className="classes-grid-wrapper"
          ref={gridWrapperRef}
          style={rowHeight ? { minHeight: `${rowHeight * 2 + 20}px` } : {}}
        >
          {/* Hidden probe card - always rendered, used only to measure real card height */}
          <div className="class-card-probe" ref={probeCardRef}>
            <ClassCard
              classData={{ name: 'Probe', section: '', teacher: '', code: 'XXXXXX', color: '#000' }}
              user={user}
              onDelete={() => {}}
              onUnenroll={() => {}}
            />
          </div>

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
              {visibleClasses.map((cls) => (
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
        </div>

        <div className="how-it-works">
          <h2 className="how-it-works-title">How it works</h2>
          <div className="how-steps">
            {HOW_IT_WORKS.map((s, i) => (
              <div className="how-step" key={i}>
                <div className="how-step-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                    {s.icon}
                  </svg>
                </div>
                <div className="how-step-text">
                  <p className="how-step-title">{s.step}</p>
                  <p className="how-step-desc">{s.text}</p>
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <svg className="how-step-arrow" width="14" height="14" viewBox="0 0 24 24" fill="#dadce0">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

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