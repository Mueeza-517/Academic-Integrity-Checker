import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../api'
import './Submissions.css'

const PAGE_SIZE = 5

export default function Submissions() {
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

      if (classList.length === 0) {
        setAssignments([])
        setLoading(false)
        return
      }

      const promises = classList.map(cls => 
        API.get(`/assignments/class/${cls._id}`)
      )
      
      const results = await Promise.all(promises)
      
      const allAssignments = []
      results.forEach((response, index) => {
        const cls = classList[index]
        if (response.data && Array.isArray(response.data)) {
          response.data.forEach(a => {
            allAssignments.push({ 
              ...a, 
              className: cls.name, 
              classId: cls._id 
            })
          })
        }
      })
      
      allAssignments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setAssignments(allAssignments)
      
    } catch (err) {
      console.error('Failed to fetch assignments:', err)
    } finally {
      setLoading(false)
    }
  }

  const isPastDeadline = (deadline) => new Date() > new Date(deadline)

  const getMySubmission = (a) => {
    return a.submissions?.find(s => s.studentEmail === user?.email)
  }

  const getStatus = (a) => {
    const sub = getMySubmission(a)
    if (sub) return 'submitted'
    if (isPastDeadline(a.deadline)) return 'closed'
    return 'pending'
  }

  const filtered = assignments.filter(a => {
    const sub = getMySubmission(a)
    const classMatch = selectedClass === 'all' || a.classId === selectedClass
    const searchMatch = search.trim() === '' || 
      a.title.toLowerCase().includes(search.trim().toLowerCase()) ||
      a.className.toLowerCase().includes(search.trim().toLowerCase())
    const statusMatch =
      filter === 'all' ? true :
      filter === 'submitted' ? !!sub :
      filter === 'pending' ? (!sub && !isPastDeadline(a.deadline)) :
      filter === 'closed' ? (!sub && isPastDeadline(a.deadline)) : true
    return classMatch && searchMatch && statusMatch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Stats - Only 4 cards
  const totalAssignments = assignments.length
  const totalClosed = assignments.filter(a => !getMySubmission(a) && isPastDeadline(a.deadline)).length
  const totalGraded = assignments.filter(a => {
    const sub = getMySubmission(a)
    return sub && sub.marks !== null && sub.marks !== undefined
  }).length
  const totalUngraded = assignments.filter(a => {
    const sub = getMySubmission(a)
    return sub && (sub.marks === null || sub.marks === undefined)
  }).length

  return (
    <div className="sub-page">

      {/* Stats - 4 Cards only */}
      <div className="sub-stats-grid">
        <div className="sub-stat-card">
          <div className="sub-stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
            </svg>
          </div>
          <div className="sub-stat-text">
            <p className="sub-stat-num">{totalAssignments}</p>
            <p className="sub-stat-label">Total Assignments</p>
          </div>
        </div>

        <div className="sub-stat-card">
          <div className="sub-stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
            </svg>
          </div>
          <div className="sub-stat-text">
            <p className="sub-stat-num">{totalClosed}</p>
            <p className="sub-stat-label">Closed</p>
          </div>
        </div>

        <div className="sub-stat-card">
          <div className="sub-stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
          <div className="sub-stat-text">
            <p className="sub-stat-num">{totalGraded}</p>
            <p className="sub-stat-label">Submitted & Graded</p>
          </div>
        </div>

        <div className="sub-stat-card">
          <div className="sub-stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>
          <div className="sub-stat-text">
            <p className="sub-stat-num">{totalUngraded}</p>
            <p className="sub-stat-label">Submitted & Not Graded</p>
          </div>
        </div>
      </div>

      {/* Filter row - Same as Assignments page */}
      <div className="sub-filters">
        <div className="sub-filter-group">
          <span className="sub-filter-label">Status:</span>
          {['all', 'submitted', 'pending', 'closed'].map(f => (
            <button
              key={f}
              className={`sub-filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="sub-filter-group">
          <span className="sub-filter-label">Class:</span>
          <select
            className="sub-class-select"
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
          >
            <option value="all">All Classes</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="sub-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#9aa0a6">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            type="text"
            placeholder="Search submissions..."
            className="sub-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List - Same style as Assignments page */}
      {loading ? (
        <div className="sub-loading">
          <div className="loading-spinner"></div>
          <p>Loading submissions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="sub-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#dadce0">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
          <p>No submissions found.</p>
        </div>
      ) : (
        <>
          <div className="sub-list">
            {paginated.map((a) => {
              const sub = getMySubmission(a)
              const status = getStatus(a)
              const isGraded = sub && sub.marks !== null && sub.marks !== undefined

              return (
                <div key={a._id} className="sub-row">
                  <div className="sub-row-icon">
                    <svg width="25" height="25" viewBox="0 0 24 24" fill="#3443eb">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                    </svg>
                  </div>

                  <div className="sub-row-info">
                    <p className="sub-row-title">{a.title}</p>
                    <p className="sub-row-class">{a.className}</p>
                    <div className="sub-row-meta">
                      <span className="sub-row-meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#9aa0a6">
                          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                        </svg>
                        Due: {new Date(a.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="sub-row-meta-divider">|</span>
                      <span className="sub-row-meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#9aa0a6">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        {a.postedBy}
                      </span>
                      <span className="sub-row-meta-divider">|</span>
                      <span className="sub-row-meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#9aa0a6">
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                        </svg>
                        {a.totalMarks} marks
                      </span>
                    </div>
                  </div>

                  <div className="sub-row-right">
                    {/* Marks */}
                    <div className="sub-row-marks">
                      {isGraded ? (
                        <span className="sub-row-marks-value">{sub.marks} / {a.totalMarks}</span>
                      ) : (
                        <span className="sub-row-marks-dash">– / {a.totalMarks}</span>
                      )}
                    </div>

                    {/* Status Badge */}
                    {status === 'submitted' && (
                      <span className={`sub-row-badge ${isGraded ? 'graded' : 'submitted'}`}>
                        {isGraded ? 'Graded' : 'Submitted'}
                      </span>
                    )}
                    {status === 'pending' && (
                      <span className="sub-row-badge pending">Pending</span>
                    )}
                    {status === 'closed' && (
                      <span className="sub-row-badge closed">Closed</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination - Same as Assignments page */}
          <div className="sub-pagination">
            <span className="sub-pagination-info">
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} submissions
            </span>
            <div className="sub-pagination-controls">
              <button
                className="sub-page-btn"
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
                  className={`sub-page-btn ${page === p ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="sub-page-btn"
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