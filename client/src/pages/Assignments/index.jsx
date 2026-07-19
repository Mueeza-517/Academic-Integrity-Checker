import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../api'
import './Assignments.css'

const PAGE_SIZE = 5

export default function Assignments() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedClass, setSelectedClass] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (!stored || !token) { navigate('/'); return }
    setUser(JSON.parse(stored))
    fetchAll()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [filter, selectedClass, search])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const { data: classList } = await API.get('/classes/my')
      setClasses(classList)

      const allAssignments = []
      for (const cls of classList) {
        const { data } = await API.get(`/assignments/class/${cls._id}`)
        data.forEach(a => allAssignments.push({ ...a, className: cls.name, classId: cls._id }))
      }
      allAssignments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setAssignments(allAssignments)
    } catch (err) {
      console.error('Failed to fetch assignments:', err)
    } finally {
      setLoading(false)
    }
  }

  const isPastDeadline = (deadline) => new Date() > new Date(deadline)

  const getStudentStatus = (a) => {
    const mySubmission = a.submissions?.find(s => s.studentEmail === user?.email)
    if (mySubmission) return 'submitted'
    if (isPastDeadline(a.deadline)) return 'missed'
    return 'pending'
  }

  const filtered = assignments.filter(a => {
    const classMatch = selectedClass === 'all' || a.classId === selectedClass
    const statusMatch =
      filter === 'all' ? true :
      filter === 'open' ? !isPastDeadline(a.deadline) :
      filter === 'closed' ? isPastDeadline(a.deadline) : true
    const searchMatch = search.trim() === '' || a.title.toLowerCase().includes(search.trim().toLowerCase())
    return classMatch && statusMatch && searchMatch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="asgn-page">

      {/* Top stat cards */}
      <div className="asgn-stats-row">
        <div className="asgn-stat-card">
          <div className="asgn-stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
            </svg>
          </div>
          <div className="asgn-stat-text">
            <p className="asgn-stat-num">{assignments.length}</p>
            <p className="asgn-stat-label">Total Assignments</p>
          </div>
        </div>

        <div className="asgn-stat-card">
          <div className="asgn-stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
          </div>
          <div className="asgn-stat-text">
            <p className="asgn-stat-num">{assignments.filter(a => !isPastDeadline(a.deadline)).length}</p>
            <p className="asgn-stat-label">Open Assignments</p>
          </div>
        </div>

        <div className="asgn-stat-card">
          <div className="asgn-stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
            </svg>
          </div>
          <div className="asgn-stat-text">
            <p className="asgn-stat-num">{assignments.filter(a => isPastDeadline(a.deadline)).length}</p>
            <p className="asgn-stat-label">Closed Assignments</p>
          </div>
        </div>

        <div className="asgn-stat-card">
          <div className="asgn-stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
            </svg>
          </div>
          <div className="asgn-stat-text">
            <p className="asgn-stat-num">{assignments.reduce((sum, a) => sum + (a.submissions?.length || 0), 0)}</p>
            <p className="asgn-stat-label">Submissions</p>
          </div>
        </div>
      </div>

      {/* Filter row */}
      <div className="asgn-filters">
        <div className="asgn-filter-group">
          <span className="asgn-filter-label">Status:</span>
          {['all', 'open', 'closed'].map(f => (
            <button
              key={f}
              className={`asgn-filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="asgn-filter-group">
          <span className="asgn-filter-label">Class:</span>
          <select
            className="asgn-class-select"
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
          >
            <option value="all">All Classes</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="asgn-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#9aa0a6">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            type="text"
            placeholder="Search assignments"
            className="asgn-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="asgn-loading">Loading assignments...</div>
      ) : filtered.length === 0 ? (
        <div className="asgn-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#dadce0">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
          <p>No assignments found.</p>
        </div>
      ) : (
        <>
          <div className="asgn-list">
            {paginated.map((a) => {
              const status = user?.role === 'student' ? getStudentStatus(a) : null
              const badgeStatus = user?.role === 'student'
                ? status
                : (isPastDeadline(a.deadline) ? 'closed' : 'open')

              return (
                <div key={a._id} className="asgn-row">
                  <div className="asgn-row-icon">
                    <svg width="25" height="25" viewBox="0 0 24 24" fill="#3443eb">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                    </svg>
                  </div>

                  <div className="asgn-row-info">
                    <p className="asgn-row-title">{a.title}</p>
                    <p className="asgn-row-class">{a.className}</p>
                    <div className="asgn-row-meta">
                      <span className="asgn-row-meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#9aa0a6">
                          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                        </svg>
                        Due: {new Date(a.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="asgn-row-meta-divider">|</span>
                      <span className="asgn-row-meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#9aa0a6">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        {a.postedBy}
                      </span>
                      <span className="asgn-row-meta-divider">|</span>
                      <span className="asgn-row-meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#9aa0a6">
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                        </svg>
                        {a.totalMarks} marks
                      </span>
                    </div>
                  </div>

                  <div className="asgn-row-right">
                    {user?.role === 'student' ? (
                      <span className={`asgn-row-badge status-${status}`}>
                        {status === 'submitted' ? 'Submitted' : status === 'missed' ? 'Missed' : 'Pending'}
                      </span>
                    ) : (
                      <span className={`asgn-row-badge status-${badgeStatus}`}>
                        {badgeStatus === 'closed' ? 'Closed' : 'Open'}
                      </span>
                    )}
                    {/* THREE DOTS BUTTON REMOVED */}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          <div className="asgn-pagination">
            <span className="asgn-pagination-info">
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} assignments
            </span>
            <div className="asgn-pagination-controls">
              <button
                className="asgn-page-btn"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`asgn-page-num ${page === p ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="asgn-page-btn"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}