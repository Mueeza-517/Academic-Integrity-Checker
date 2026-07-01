import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import API from '../../api'
import './ClassRoom.css'

const CARD_COLORS = ['#1e7e72', '#5c2d91', '#b06000', '#1a73e8', '#c5221f', '#137333', '#7b5ea7', '#d93025']

export default function ClassRoom() {
  const { classId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [classData, setClassData] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [activeTab, setActiveTab] = useState('classwork')
  const [showAddAssignment, setShowAddAssignment] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newDeadline, setNewDeadline] = useState('')
  const [newFiles, setNewFiles] = useState([])
  const [plagResult, setPlagResult] = useState(null)
  const [activePlagId, setActivePlagId] = useState(null)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newSection, setNewSection] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (!stored || !token) { navigate('/'); return }
    setUser(JSON.parse(stored))
    fetchClass()
    fetchAssignments()
  }, [classId])

  const fetchClass = async () => {
    try {
      const { data } = await API.get(`/classes/${classId}`)
      setClassData(data)
    } catch (err) {
      console.error('Failed to load class:', err)
    }
  }

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const { data } = await API.get(`/assignments/class/${classId}`)
      setAssignments(data)
    } catch (err) {
      console.error('Failed to load assignments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAssignment = async () => {
    if (!newTitle.trim() || !newDeadline) return
    try {
      const formData = new FormData()
      formData.append('classId', classId)
      formData.append('title', newTitle)
      formData.append('description', newDesc)
      formData.append('deadline', newDeadline)
      newFiles.forEach(file => {
        formData.append('files', file)
      })
      const { data } = await API.post('/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setAssignments(prev => [data, ...prev])
      setNewTitle('')
      setNewDesc('')
      setNewDeadline('')
      setNewFiles([])
      setShowAddAssignment(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create assignment.')
    }
  }

  const handleSubmit = async (assignmentId, file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await API.post(`/assignments/${assignmentId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setAssignments(prev => prev.map(a => a._id === assignmentId ? data : a))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit assignment.')
    }
  }

  const handlePlagCheck = async (assignmentId) => {
    try {
      const { data } = await API.get(`/assignments/${assignmentId}/plagcheck`)
      setPlagResult({ id: assignmentId, ...data })
      setActivePlagId(assignmentId)
    } catch (err) {
      alert('Failed to check plagiarism.')
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

  const isPastDeadline = (deadline) => new Date() > new Date(deadline)

  const handleGoBack = () => {
    navigate('/home')
  }

  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setNewFiles(prev => [...prev, ...filesArray])
    }
  }

  const removeFile = (index) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="classroom-page">
      <Header
        user={user}
        onLogout={handleLogout}
        onRoleSwitch={handleRoleSwitch}
        onCreateClass={() => setShowCreateModal(true)}
        onJoinClass={() => navigate('/join')}
      />

      <div className="classroom-content">
        {classData && (
          <div className="banner-wrapper">
            <button className="back-btn" onClick={handleGoBack} title="Go back to home">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              <span>Back</span>
            </button>
            <div
              className="class-banner"
              style={
                classData.bannerImage
                  ? { backgroundImage: `url(${classData.bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: classData.color || '#1a73e8' }
              }
            >
              <div className="banner-info">
                <h1>{classData.name}</h1>
                {classData.section && <p>{classData.section}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="classroom-tabs">
          <button className={`tab-btn ${activeTab === 'classwork' ? 'active' : ''}`} onClick={() => setActiveTab('classwork')}>Classwork</button>
          <button className={`tab-btn ${activeTab === 'people' ? 'active' : ''}`} onClick={() => setActiveTab('people')}>People</button>
        </div>

        <main className="classroom-main">
          {activeTab === 'classwork' && (
            <div className="classwork-layout">
              {user?.role === 'teacher' && (
                <button className="new-assignment-btn" onClick={() => setShowAddAssignment(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                  New assignment
                </button>
              )}

              {loading ? (
                <div className="empty-state"><p>Loading assignments...</p></div>
              ) : assignments.length === 0 ? (
                <div className="empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="#dadce0">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.4-1.4 3.6 3.6 7.6-7.6L21 8l-9 9z" />
                  </svg>
                  <p>No assignments yet.</p>
                </div>
              ) : (
                assignments.map((a) => (
                  <div key={a._id} className="assignment-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/class/${classId}/assignment/${a._id}`)}>
                    <div className="assignment-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#1a73e8">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.4-1.4 3.6 3.6 7.6-7.6L21 8l-9 9z" />
                      </svg>
                    </div>
                    <div className="assignment-content">
                      <div className="assignment-header">
                        <h3 className="assignment-title">{a.title}</h3>
                        <span className="assignment-date">
                          {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      {a.description && <p className="assignment-desc">{a.description}</p>}

                      {a.files && a.files.length > 0 && (
                        <div className="assignment-files">
                          <p className="files-label">Attached files:</p>
                          <div className="files-list">
                            {a.files.map((file, index) => (
                              <a key={index} href={file.url} target="_blank" rel="noopener noreferrer" className="file-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#1a73e8">
                                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                </svg>
                                {file.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="assignment-deadline">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={isPastDeadline(a.deadline) ? '#c5221f' : '#137333'}>
                          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                        </svg>
                        <span className={`deadline-badge ${isPastDeadline(a.deadline) ? 'past' : 'active'}`}>
                          {isPastDeadline(a.deadline) ? 'Closed' : 'Open'} · Due{' '}
                          {new Date(a.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {user?.role === 'student' && (
                        <div className="submit-area">
                          <label className={`file-label ${isPastDeadline(a.deadline) ? 'disabled' : ''}`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
                            </svg>
                            Attach & Submit
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.xlsx,.xls,.zip,.rar,.pptx"
                              disabled={isPastDeadline(a.deadline)}
                              onChange={(e) => { if (e.target.files[0]) handleSubmit(a._id, e.target.files[0]) }}
                              style={{ display: 'none' }}
                            />
                          </label>
                          {a.submissions?.find(s => s.studentEmail === user?.email) && (
                            <span className="submitted-tag">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="#137333">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                              </svg>
                              {a.submissions.find(s => s.studentEmail === user?.email).fileName}
                            </span>
                          )}
                          {isPastDeadline(a.deadline) && !a.submissions?.find(s => s.studentEmail === user?.email) && (
                            <span className="error-msg">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="#c5221f">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                              </svg>
                              Submission time is over
                            </span>
                          )}
                        </div>
                      )}

                      {user?.role === 'teacher' && (
                        <div className="teacher-actions">
                          <span className="submission-count">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#5f6368">
                              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                            </svg>
                            {a.submissions?.length || 0} submission{a.submissions?.length !== 1 ? 's' : ''}
                          </span>
                          <button className="plag-btn" onClick={() => handlePlagCheck(a._id)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                            </svg>
                            Check Plagiarism
                          </button>
                        </div>
                      )}

                      {activePlagId === a._id && plagResult?.id === a._id && (
                        <div className="plag-result">
                          <strong>Plagiarism Report</strong>
                          {plagResult.message && <p>{plagResult.message}</p>}
                          {plagResult.pairs?.length > 0
                            ? plagResult.pairs.map((p, i) => (
                              <div key={i} className="plag-pair">
                                <div className="plag-pair-names">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#e65100">
                                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                                  </svg>
                                  {p.student1} & {p.student2}
                                </div>
                                <span className="similarity">{p.similarity} similarity</span>
                              </div>
                            ))
                            : !plagResult.message && <p>No plagiarism detected.</p>}
                          <button className="close-plag" onClick={() => setActivePlagId(null)}>Close</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'people' && (
            <div className="people-layout">
              <h3>Teacher</h3>
              <div className="person-item">
                <div className="person-avatar">{classData?.teacher?.charAt(0).toUpperCase()}</div>
                <span>{classData?.teacher}</span>
              </div>
              <h3>Students ({classData?.students?.length || 0})</h3>
              {!classData?.students?.length ? (
                <p className="no-students">No students have joined yet.</p>
              ) : (
                classData.students.map((student, i) => (
                  <div key={i} className="person-item">
                    {student.picture ? (
                      <img src={student.picture} className="person-avatar-img" alt={student.name} referrerPolicy="no-referrer" />
                    ) : (
                      <div className="person-avatar">{student.name?.charAt(0).toUpperCase()}</div>
                    )}
                    <div>
                      <p className="person-name">{student.name}</p>
                      <p className="person-email">{student.email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {showAddAssignment && (
        <div className="modal-overlay" onClick={() => setShowAddAssignment(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create Assignment</h2>
            <input className="modal-input" placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <textarea className="modal-input modal-textarea" placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            <label className="deadline-label">Deadline</label>
            <input className="modal-input" type="datetime-local" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} />
            <div className="file-upload-area">
              <label className="file-upload-label" htmlFor="assignment-files">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
                </svg>
                Attach files (optional - multiple)
              </label>
              <input
                id="assignment-files"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xlsx,.xls,.zip,.rar,.pptx,.jpg,.jpeg,.png,.gif,.txt,.csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {newFiles.length > 0 && (
                <div className="selected-files">
                  {newFiles.map((file, index) => (
                    <div key={index} className="selected-file">
                      <span className="file-name">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#1a73e8">
                          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                        </svg>
                        {file.name} ({formatFileSize(file.size)})
                      </span>
                      <button className="remove-file" onClick={() => removeFile(index)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowAddAssignment(false)}>Cancel</button>
              <button className="modal-confirm" onClick={handleAddAssignment}>Create</button>
            </div>
          </div>
        </div>
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