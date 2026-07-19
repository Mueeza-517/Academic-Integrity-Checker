import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ConfirmModal from '../../components/ConfirmModal'
import API from '../../api'
import './ClassRoom.css'

const CARD_COLORS = ['#3443eb']

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
  const [newTotalMarks, setNewTotalMarks] = useState(100)
  const [givingMarks, setGivingMarks] = useState({})
  const [marksInput, setMarksInput] = useState({})
  const [confirm, setConfirm] = useState(null)

  // Edit assignment state
  const [showEditAssignment, setShowEditAssignment] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editDeadline, setEditDeadline] = useState('')
  const [editTotalMarks, setEditTotalMarks] = useState(100)

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
      formData.append('totalMarks', newTotalMarks)
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
      setNewTotalMarks(100)
      setNewFiles([])
      setShowAddAssignment(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create assignment.')
    }
  }

  const openEditAssignment = (a) => {
    setEditingId(a._id)
    setEditTitle(a.title)
    setEditDesc(a.description || '')
    setEditDeadline(new Date(a.deadline).toISOString().slice(0, 16))
    setEditTotalMarks(a.totalMarks || 100)
    setShowEditAssignment(true)
  }

  const handleUpdateAssignment = async () => {
    if (!editTitle.trim() || !editDeadline) return
    try {
      const { data } = await API.put(`/assignments/${editingId}`, {
        title: editTitle,
        description: editDesc,
        deadline: editDeadline,
        totalMarks: editTotalMarks
      })
      setAssignments(prev => prev.map(a => a._id === editingId ? data : a))
      setShowEditAssignment(false)
      setEditingId(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update assignment.')
    }
  }

  const handleDeleteAssignment = (assignmentId) => {
    setConfirm({
      title: 'Delete Assignment',
      message: 'Are you sure you want to delete this assignment? All submissions will be lost.',
      confirmText: 'Delete',
      confirmColor: '#c5221f',
      onConfirm: async () => {
        try {
          await API.delete(`/assignments/${assignmentId}`)
          setAssignments(prev => prev.filter(a => a._id !== assignmentId))
        } catch (err) {
          alert('Failed to delete assignment.')
        }
        setConfirm(null)
      }
    })
  }

  const handleDeleteSubmission = async (assignmentId) => {
    setConfirm({
      title: 'Remove Submission',
      message: 'Are you sure you want to remove your submission? You can resubmit before the deadline.',
      confirmText: 'Remove',
      confirmColor: '#c5221f',
      onConfirm: async () => {
        try {
          const { data } = await API.delete(`/assignments/${assignmentId}/submit`)
          setAssignments(prev => prev.map(a => a._id === assignmentId ? data : a))
        } catch (err) {
          alert(err.response?.data?.message || 'Failed to remove submission.')
        }
        setConfirm(null)
      }
    })
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
        color: '#3443eb'
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

  const handleGiveMarks = async (assignmentId, studentEmail, totalMarks) => {
    const marks = marksInput[`${assignmentId}_${studentEmail}`]
    if (marks === undefined || marks === '') return alert('Please enter marks')
    if (Number(marks) > totalMarks) return alert(`Marks cannot exceed ${totalMarks}`)
    if (Number(marks) < 0) return alert('Marks cannot be negative')
    try {
      const { data } = await API.put(
        `/assignments/${assignmentId}/submissions/${studentEmail}/marks`,
        { marks: Number(marks) }
      )
      setAssignments(prev => prev.map(a => a._id === assignmentId ? data : a))
      setGivingMarks(prev => ({ ...prev, [`${assignmentId}_${studentEmail}`]: false }))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to give marks.')
    }
  }

  return (
    <div className="classroom-page">
      <div className="classroom-content">
        {classData && (
          <div className="banner-wrapper">
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
                assignments.map((a) => {
                  const mySubmission = a.submissions?.find(s => s.studentEmail === user?.email)
                  return (
                    <div key={a._id} className="assignment-card-v2">

                      {/* Header row: title/meta on left, action buttons on right */}
                      <div className="ac-header-row">
                        <div className="ac-header-left">
                          <h3 className="ac-title">{a.title}</h3>
                          <div className="ac-meta-row">
                            <span className={`ac-deadline ${isPastDeadline(a.deadline) ? 'past' : 'active'}`}>
                              Due: {new Date(a.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {new Date(a.deadline).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="ac-meta-divider">|</span>
                            <span className="ac-marks">{a.totalMarks} Marks</span>
                          </div>
                        </div>

                        <div className="ac-header-actions">
                          {user?.role === 'teacher' && (
                            <>
                              <button className="ac-action-btn" onClick={() => openEditAssignment(a)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                </svg>
                                Update
                              </button>
                              <button className="ac-action-btn" onClick={() => handleDeleteAssignment(a._id)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                </svg>
                                Delete
                              </button>
                              <button className="ac-action-btn" onClick={() => handlePlagCheck(a._id)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                                </svg>
                                Plagiarism
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="ac-divider" />

                      {/* Attachments */}
                      {a.files && a.files.length > 0 && (
                        <>
                          <p className="ac-section-label">Attachments</p>
                          <div className="ac-attachments">
                            {a.files.map((file, index) => (
                              <div key={index} className="ac-file-row">
                                <div className="ac-file-left">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#5f6368">
                                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                                  </svg>
                                  <span className="ac-file-name">{file.name}</span>
                                </div>
                                <a
                                  href={`http://localhost:5000${file.url}`}
                                  download={file.name}
                                  onClick={async (e) => {
                                    e.preventDefault()
                                    try {
                                      const response = await fetch(`http://localhost:5000${file.url}`)
                                      const blob = await response.blob()
                                      const url = window.URL.createObjectURL(blob)
                                      const a = document.createElement('a')
                                      a.href = url
                                      a.download = file.name
                                      document.body.appendChild(a)
                                      a.click()
                                      window.URL.revokeObjectURL(url)
                                      document.body.removeChild(a)
                                    } catch (err) {
                                      alert('Failed to download file.')
                                    }
                                  }}
                                  className="ac-download-btn"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                                  </svg>
                                  Download
                                </a>
                              </div>
                            ))}
                          </div>
                          <div className="ac-divider" />
                        </>
                      )}

                      {/* Description */}
                      {a.description && (
                        <>
                          <p className="ac-section-label">Description</p>
                          <p className="ac-description">{a.description}</p>
                        </>
                      )}


                      {user?.role === 'student' && (
                        <>
                          <div className="ac-divider" />
                          <div className="submit-area">
                            {mySubmission ? (
                              <div className="submitted-full">
                                <div className="submitted-file-row">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#000">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                  </svg>
                                  <span className="submitted-filename">{mySubmission.fileName}</span>
                                  {mySubmission.marks !== null && mySubmission.marks !== undefined && (
                                    <span className="marks-tag">
                                      Marks: {mySubmission.marks}/{a.totalMarks}
                                    </span>
                                  )}
                                </div>
                                <div className="submitted-actions">
                                  <button
                                    className="sub-download-btn"
                                    onClick={async () => {
                                      try {
                                        const filePath = mySubmission.filePath.replace(/\\/g, '/').split('uploads/')[1]
                                        const response = await fetch(`http://localhost:5000/uploads/${filePath}`)
                                        const blob = await response.blob()
                                        const url = window.URL.createObjectURL(blob)
                                        const link = document.createElement('a')
                                        link.href = url
                                        link.download = mySubmission.fileName
                                        document.body.appendChild(link)
                                        link.click()
                                        window.URL.revokeObjectURL(url)
                                        document.body.removeChild(link)
                                      } catch {
                                        alert('Failed to download.')
                                      }
                                    }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                                    </svg>
                                    Download
                                  </button>
                                  {!isPastDeadline(a.deadline) && (
                                    <>
                                      <label className="sub-resubmit-btn">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                                        </svg>
                                        Resubmit
                                        <input
                                          type="file"
                                          accept=".pdf,.doc,.docx,.xlsx,.xls,.zip,.rar,.pptx"
                                          onChange={(e) => { if (e.target.files[0]) handleSubmit(a._id, e.target.files[0]) }}
                                          style={{ display: 'none' }}
                                        />
                                      </label>
                                      <button
                                        className="sub-delete-btn"
                                        onClick={() => handleDeleteSubmission(a._id)}
                                      >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                        </svg>
                                        Remove
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <>
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
                                {isPastDeadline(a.deadline) && (
                                  <span className="error-msg">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#c5221f">
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                    </svg>
                                    Submission time is over
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </>
                      )}
                      {user?.role === 'teacher' && a.submissions?.length > 0 && (
                        <>
                          <div className="ac-divider" />
                          <p className="ac-section-label">
                            Submissions ({a.submissions.length})
                          </p>
                          <div className="marks-section">
                            {a.submissions.map((s, i) => (
                              <div key={i} className="marks-row">
                                <span className="marks-student">{s.studentName}</span>
                                <button
                                  className="teacher-file-btn"
                                  onClick={async () => {
                                    try {
                                      const filePath = s.filePath.replace(/\\/g, '/').split('uploads/')[1]
                                      const response = await fetch(`http://localhost:5000/uploads/${filePath}`)
                                      const blob = await response.blob()
                                      const url = window.URL.createObjectURL(blob)
                                      const link = document.createElement('a')
                                      link.href = url
                                      link.download = s.fileName
                                      document.body.appendChild(link)
                                      link.click()
                                      window.URL.revokeObjectURL(url)
                                      document.body.removeChild(link)
                                    } catch {
                                      alert('Failed to download.')
                                    }
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                                  </svg>
                                  {s.fileName}
                                </button>
                                {s.marks !== null && s.marks !== undefined ? (
                                  <span className="marks-given">{s.marks}/{a.totalMarks}</span>
                                ) : (
                                  <>
                                    <input
                                      className="marks-input"
                                      type="number"
                                      min="0"
                                      max={a.totalMarks}
                                      placeholder={`0-${a.totalMarks}`}
                                      value={marksInput[`${a._id}_${s.studentEmail}`] || ''}
                                      onChange={e => setMarksInput(prev => ({
                                        ...prev,
                                        [`${a._id}_${s.studentEmail}`]: e.target.value
                                      }))}
                                      onClick={e => e.stopPropagation()}
                                    />
                                    <button
                                      className="marks-save-btn"
                                      onClick={() => handleGiveMarks(a._id, s.studentEmail, a.totalMarks)}
                                    >
                                      Save
                                    </button>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
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
                  )
                })
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

            <label className="deadline-label">Total Marks (1-100)</label>
            <input
              className="modal-input"
              type="number"
              min="1"
              max="100"
              value={newTotalMarks}
              onChange={e => setNewTotalMarks(Math.min(100, Math.max(1, Number(e.target.value))))}
            />

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
                          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                        </svg>
                        {file.name} ({formatFileSize(file.size)})
                      </span>
                      <button className="remove-file" onClick={() => removeFile(index)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
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

      {showEditAssignment && (
        <div className="modal-overlay" onClick={() => setShowEditAssignment(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Update Assignment</h2>
            <input className="modal-input" placeholder="Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            <textarea className="modal-input modal-textarea" placeholder="Description (optional)" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />

            <label className="deadline-label">Deadline</label>
            <input className="modal-input" type="datetime-local" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />

            <label className="deadline-label">Total Marks (1-100)</label>
            <input
              className="modal-input"
              type="number"
              min="1"
              max="100"
              value={editTotalMarks}
              onChange={e => setEditTotalMarks(Math.min(100, Math.max(1, Number(e.target.value))))}
            />

            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowEditAssignment(false)}>Cancel</button>
              <button className="modal-confirm" onClick={handleUpdateAssignment}>Save</button>
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