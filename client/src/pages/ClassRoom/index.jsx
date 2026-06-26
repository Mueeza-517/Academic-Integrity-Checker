import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import './ClassRoom.css'

const MOCK_ASSIGNMENTS = [
  {
    id: 'a1',
    title: 'Lab Assignment 1 - ER Diagram',
    description: 'Create an ER diagram for a library management system.',
    deadline: '2025-12-31T23:59',
    submissions: []
  }
]

export default function ClassRoom() {
  const { classId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [assignments, setAssignments] = useState(MOCK_ASSIGNMENTS)
  const [showAddAssignment, setShowAddAssignment] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newDeadline, setNewDeadline] = useState('')
  const [plagResult, setPlagResult] = useState(null)
  const [activePlagId, setActivePlagId] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { navigate('/'); return }
    setUser(JSON.parse(stored))
  }, [])

  const handleAddAssignment = () => {
    if (!newTitle.trim() || !newDeadline) return
    setAssignments(prev => [...prev, {
      id: Date.now().toString(),
      title: newTitle,
      description: newDesc,
      deadline: newDeadline,
      submissions: []
    }])
    setNewTitle(''); setNewDesc(''); setNewDeadline('')
    setShowAddAssignment(false)
  }

  const handleSubmit = (assignmentId, file) => {
    const assignment = assignments.find(a => a.id === assignmentId)
    const now = new Date()
    const deadline = new Date(assignment.deadline)

    if (now > deadline) {
      alert('⛔ Submission time is over. You cannot submit after the deadline.')
      return
    }

    setAssignments(prev => prev.map(a => {
      if (a.id !== assignmentId) return a
      const existing = a.submissions.filter(s => s.student !== user?.name)
      return {
        ...a,
        submissions: [...existing, {
          student: user?.name,
          fileName: file.name,
          fileSize: file.size,
          submittedAt: new Date().toISOString()
        }]
      }
    }))
  }

  const handlePlagCheck = (assignmentId) => {
    const assignment = assignments.find(a => a.id === assignmentId)
    if (assignment.submissions.length < 2) {
      setPlagResult({ id: assignmentId, message: 'Need at least 2 submissions to check plagiarism.', pairs: [] })
    } else {
      // Mock plag check — real implementation compares file hashes or content
      const mockPairs = assignment.submissions.length >= 2
        ? [{ student1: assignment.submissions[0]?.student, student2: assignment.submissions[1]?.student, similarity: '87%' }]
        : []
      setPlagResult({ id: assignmentId, pairs: mockPairs })
    }
    setActivePlagId(assignmentId)
  }

  const isPastDeadline = (deadline) => new Date() > new Date(deadline)

  return (
    <div className="classroom-page">
      <Header user={user} />

      <main className="classroom-main">
        <div className="classroom-header">
          <h2>Class Assignments</h2>
          {user?.role === 'teacher' && (
            <button className="add-assignment-btn" onClick={() => setShowAddAssignment(true)}>
              + Create Assignment
            </button>
          )}
        </div>

        <div className="assignments-list">
          {assignments.map(a => (
            <div key={a.id} className="assignment-card">
              <div className="assignment-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#1a73e8">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.4-1.4 3.6 3.6 7.6-7.6L21 8l-9 9z"/>
                </svg>
              </div>
              <div className="assignment-info">
                <div className="assignment-top">
                  <h3>{a.title}</h3>
                  <span className={`deadline-badge ${isPastDeadline(a.deadline) ? 'past' : 'active'}`}>
                    {isPastDeadline(a.deadline) ? '⛔ Closed' : '🟢 Open'} · Due {new Date(a.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="assignment-desc">{a.description}</p>

                {user?.role === 'student' && (
                  <div className="submit-area">
                    <label className={`file-label ${isPastDeadline(a.deadline) ? 'disabled' : ''}`}>
                      📎 Attach & Submit
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xlsx,.xls,.zip,.rar,.pptx"
                        disabled={isPastDeadline(a.deadline)}
                        onChange={e => { if (e.target.files[0]) handleSubmit(a.id, e.target.files[0]) }}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {a.submissions.find(s => s.student === user?.name) && (
                      <span className="submitted-tag">✅ Submitted: {a.submissions.find(s => s.student === user?.name).fileName}</span>
                    )}
                    {isPastDeadline(a.deadline) && (
                      <span className="error-msg">⛔ Submission time is over</span>
                    )}
                  </div>
                )}

                {user?.role === 'teacher' && (
                  <div className="teacher-actions">
                    <span className="submission-count">{a.submissions.length} submission{a.submissions.length !== 1 ? 's' : ''}</span>
                    <button className="plag-btn" onClick={() => handlePlagCheck(a.id)}>
                      🔍 Check Plagiarism
                    </button>
                  </div>
                )}

                {activePlagId === a.id && plagResult?.id === a.id && (
                  <div className="plag-result">
                    <strong>Plagiarism Report</strong>
                    {plagResult.message && <p>{plagResult.message}</p>}
                    {plagResult.pairs?.length > 0
                      ? plagResult.pairs.map((p, i) => (
                          <div key={i} className="plag-pair">
                            <span>⚠️ {p.student1} & {p.student2}</span>
                            <span className="similarity">{p.similarity} similarity</span>
                          </div>
                        ))
                      : !plagResult.message && <p>✅ No plagiarism detected.</p>
                    }
                    <button className="close-plag" onClick={() => setActivePlagId(null)}>Close</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {showAddAssignment && (
        <div className="modal-overlay" onClick={() => setShowAddAssignment(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create Assignment</h2>
            <input className="modal-input" placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <textarea className="modal-input modal-textarea" placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            <label className="deadline-label">Deadline</label>
            <input className="modal-input" type="datetime-local" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} />
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowAddAssignment(false)}>Cancel</button>
              <button className="modal-confirm" onClick={handleAddAssignment}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}