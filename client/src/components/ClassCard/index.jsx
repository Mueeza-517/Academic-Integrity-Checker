import './ClassCard.css'
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faCheck, faUsers, faFolder, faEllipsisV, faTrash, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'

const CARD_COLORS = [
  '#1e7e72', '#5c2d91', '#b06000', '#1a73e8',
  '#c5221f', '#137333', '#7b5ea7', '#d93025'
]

export default function ClassCard({ classData, userRole, onDeleteClass, onUnenrollClass }) {
  const navigate = useNavigate()
  const color = CARD_COLORS[classData.id ? parseInt(classData.id) % CARD_COLORS.length : 0]
  const [copied, setCopied] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCopyCode = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(classData.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggleDropdown = (e) => {
    e.stopPropagation()
    e.preventDefault()
    setShowDropdown(!showDropdown)
  }

  const handleDeleteClass = (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (window.confirm(`Are you sure you want to delete "${classData.name}"? This action cannot be undone.`)) {
      onDeleteClass(classData.id)
    }
    setShowDropdown(false)
  }

  const handleUnenroll = (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (window.confirm(`Are you sure you want to unenroll from "${classData.name}"?`)) {
      onUnenrollClass(classData.id)
    }
    setShowDropdown(false)
  }

  return (
    <div className="class-card" onClick={() => navigate(`/class/${classData.id}`)}>
      <div className="card-header" style={{ background: color }}>
        <div className="card-info">
          <h3 className="card-title">{classData.name}</h3>
          {classData.section && <p className="card-section">{classData.section}</p>}
          <p className="card-teacher">{classData.teacher}</p>
        </div>
        <div className="card-avatar">
          {classData.teacher?.charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="card-body">
        {classData.code && (
          <div className="card-code" onClick={handleCopyCode} title="Click to copy code">
            <span>Code: {classData.code}</span>
            <span className="copy-hint">
              <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="copy-icon" style={{ color: '#000000' }} />
            </span>
          </div>
        )}
      </div>

      <div className="card-footer">
        <button className="card-icon-btn" title="People" onClick={e => e.stopPropagation()}>
          <FontAwesomeIcon icon={faUsers} style={{ color: '#000000' }} />
        </button>
        <button className="card-icon-btn" title="Folder" onClick={e => e.stopPropagation()}>
          <FontAwesomeIcon icon={faFolder} style={{ color: '#000000' }} />
        </button>
        <div className="dropdown-container" ref={dropdownRef}>
          <button 
            className="card-icon-btn" 
            title="More" 
            onClick={handleToggleDropdown}
          >
            <FontAwesomeIcon icon={faEllipsisV} style={{ color: '#000000' }} />
          </button>
          {showDropdown && (
            <div className="dropdown-menu">
              {userRole === 'teacher' ? (
                <button className="dropdown-item" onClick={handleDeleteClass}>
                  <FontAwesomeIcon icon={faTrash} style={{ marginRight: '10px', color: '#000000' }} />
                  Delete Class
                </button>
              ) : (
                <button className="dropdown-item" onClick={handleUnenroll}>
                  <FontAwesomeIcon icon={faRightFromBracket} style={{ marginRight: '10px', color: '#000000' }} />
                  Unenroll
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}