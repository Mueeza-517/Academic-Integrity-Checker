import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import API from '../../api'
import './AssignmentDetail.css'

const CARD_COLORS = ['#1e7e72', '#5c2d91', '#b06000', '#1a73e8', '#c5221f', '#137333', '#7b5ea7', '#d93025']

export default function AssignmentDetail() {
  const { classId, assignmentId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [assignment, setAssignment] = useState(null)
  const [classData, setClassData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editDeadline, setEditDeadline] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newSection, setNewSection] = useState('')
  const [plagResult, setPlagResult] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (!stored || !token) { navigate('/'); return }
    setUser(JSON.parse(stored))
    fetchData()
  }, [assignmentId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [classRes, assignmentsRes] = await Promise.all([
        API.get(`/classes/${classId}`),
        API.get(`/assignments/class/${classId}`)
      ])
      setClassData(classRes.data)
      const found = assignmentsRes.data.find(a => a._id === assignmentId)
      if (found) {
        setAssignment(found)
        setEditTitle(found.title)
        setEditDesc(found.description || '')
        setEditDeadline(new Date(found.deadline).toISOString().slice(0, 16))
      }
    } catch (err) {
      console.error('Failed to load:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile) return
    try {
      setSubmitting(true)
      const formData = new FormData()
      formData.append('file', selectedFile)
      const { data } = await API.post(`/assignments/${assignmentId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setAssignment(data)
      setSelectedFile(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async () => {
    try {
      const { data } = await API.put(`/assignments/${assignmentId}`, {
        title: editTitle,
        description: editDesc,
        deadline: editDeadline
      })
      setAssignment(data)
      setShowEditModal(false)
    } catch (err) {
      alert('Failed to update assignment.')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this assignment?')) return
    try {
      await API.delete(`/assignments/${assignmentId}`)
      navigate(`/class/${classId}`)
    } catch (err) {
      alert('Failed to delete assignment.')
    }
  }

  const handlePlagCheck = async () => {
    try {
      const { data } = await API.get(`/assignments/${assignmentId}/plagcheck`)
      setPlagResult(data)
    } catch (err) {
      alert('Failed to check plagiarism.')
    }
  }

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return
    try {
      const { data: existing } = await API.get('/classes/my')
      await API.post('/classes', {
        name: newClassName,
        section: newSection,
        color: CARD_COLORS[existing.length % CARD_COLORS.length]
      })
      setShowCreateModal(false)
      setNewClassName('')
      setNewSection('')
      navigate('/home')
    } catch (err) {
      alert('Failed to create class.')
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
      navigate('/home')
    } catch (err) {
      alert('Failed to switch role.')
    }
  }

  const isPastDeadline = (deadline) => new Date() > new Date(deadline)

  const mySubmission = assignment?.submissions?.find(s => s.studentEmail === user?.email)
  const isMissed = isPastDeadline(assignment?.deadline) && !mySubmission

  if (loading) return (
    <div className="ad-page">
      <Header user={user} onLogout={handleLogout} onRoleSwitch={handleRoleSwitch}
        onCreateClass={() => setShowCreateModal(true)} onJoinClass={() => navigate('/join')} />
      <div className="ad-loading">Loading assignment...</div>
    </div>
  )

  return (
    <div className="ad-page">
      <Header
        user={user}
        onLogout={handleLogout}
        onRoleSwitch={handleRoleSwitch}
        onCreateClass={() => setShowCreateModal(true)}
        onJoinClass={() => navigate('/join')}
      />

      {/* Top bar */}
      <div className="ad-topbar" style={{ background: classData?.color || '#1a73e8' }}>
        <button className="ad-back-btn" onClick={() => navigate(`/class/${classId}`)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          {classData?.name}
        </button>

        {user?.role === 'teacher' && (
          <div className="ad-teacher-btns">
            <button className="ad-edit-btn" onClick={() => setShowEditModal(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              Edit
            </button>
            <button className="ad-delete-btn" onClick={handleDelete}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="ad-content">

        {/* Left panel */}
        <div className="ad-left">
          <div className="ad-header">
            <div className="ad-icon" style={{ background: classData?.color || '#1a73e8' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.4-1.4 3.6 3.6 7.6-7.6L21 8l-9 9z"/>
              </svg>
            </div>
            <div className="ad-title-block">
              <h1 className="ad-title">{assignment?.title}</h1>
              <p className="ad-meta">
                {assignment?.postedBy} · {new Date(assignment?.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="ad-divider" />

          <div className="ad-deadline-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isPastDeadline(assignment?.deadline) ? '#c5221f' : '#137333'}>
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
            </svg>
            <span className={`ad-deadline ${isPastDeadline(assignment?.deadline) ? 'past' : 'active'}`}>
              {isPastDeadline(assignment?.deadline) ? 'Closed' : 'Due'} {new Date(assignment?.deadline).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {assignment?.description && (
            <p className="ad-description">{assignment.description}</p>
          )}

          {assignment?.files?.length > 0 && (
            <div className="ad-files">
              <p className="ad-files-label">Attached files</p>
              <div className="ad-files-list">
                {assignment.files.map((file, i) => (
                  <a key={i} href={`http://localhost:5000${file.url}`} target="_blank" rel="noopener noreferrer" className="ad-file-chip">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1a73e8">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                    </svg>
                    {file.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Teacher — submissions list */}
          {user?.role === 'teacher' && (
            <div className="ad-submissions">
              <div className="ad-submissions-header">
                <h3>Submissions ({assignment?.submissions?.length || 0})</h3>
                <button className="ad-plag-btn" onClick={handlePlagCheck}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                  Check Plagiarism
                </button>
              </div>

              {!assignment?.submissions?.length ? (
                <p className="ad-no-submissions">No submissions yet.</p>
              ) : (
                assignment.submissions.map((s, i) => (
                  <div key={i} className="ad-submission-item">
                    <div className="ad-submission-avatar">
                      {s.studentName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="ad-submission-info">
                      <p className="ad-submission-name">{s.studentName}</p>
                      <p className="ad-submission-file">{s.fileName}</p>
                    </div>
                    <span className="ad-submission-time">
                      {new Date(s.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}

              {plagResult && (
                <div className="ad-plag-result">
                  <strong>Plagiarism Report</strong>
                  {plagResult.message && <p>{plagResult.message}</p>}
                  {plagResult.pairs?.length > 0
                    ? plagResult.pairs.map((p, i) => (
                      <div key={i} className="ad-plag-pair">
                        <span>⚠ {p.student1} & {p.student2}</span>
                        <span className="ad-similarity">{p.similarity} similarity</span>
                      </div>
                    ))
                    : !plagResult.message && <p>No plagiarism detected.</p>
                  }
                  <button className="ad-close-plag" onClick={() => setPlagResult(null)}>Close</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel — student submission */}
        {user?.role === 'student' && (
          <div className="ad-right">
            <div className="ad-your-work">
              <div className="ad-your-work-header">
                <h3>Your work</h3>
                <span className={`ad-status ${mySubmission ? 'submitted' : isMissed ? 'missed' : 'assigned'}`}>
                  {mySubmission ? 'Submitted' : isMissed ? 'Missed' : 'Assigned'}
                </span>
              </div>

              {mySubmission ? (
                <div className="ad-submitted-file">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1a73e8">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                  </svg>
                  <span>{mySubmission.fileName}</span>
                </div>
              ) : (
                <label className={`ad-add-file ${isPastDeadline(assignment?.deadline) ? 'disabled' : ''}`}>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xlsx,.xls,.zip,.rar,.pptx"
                    disabled={isPastDeadline(assignment?.deadline)}
                    onChange={e => setSelectedFile(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  {selectedFile ? selectedFile.name : 'Add or create'}
                </label>
              )}

              {isMissed && (
                <div className="ad-missed-msg">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#c5221f">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  Submission time is over
                </div>
              )}

              {!mySubmission && !isPastDeadline(assignment?.deadline) && (
                <button
                  className="ad-turnin-btn"
                  onClick={handleSubmit}
                  disabled={!selectedFile || submitting}
                >
                  {submitting ? 'Submitting...' : 'Turn in'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Edit Assignment</h2>
            <input className="modal-input" placeholder="Title" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            <textarea className="modal-input modal-textarea" placeholder="Description" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
            <label className="deadline-label">Deadline</label>
            <input className="modal-input" type="datetime-local" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} />
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="modal-confirm" onClick={handleEdit}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create class</h2>
            <input className="modal-input" placeholder="Class name (required)" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
            <input className="modal-input" placeholder="Section" value={newSection} onChange={e => setNewSection(e.target.value)} />
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