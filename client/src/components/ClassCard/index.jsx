import './ClassCard.css'
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faCheck, faUsers, faFolder, faEllipsisV, faTrash, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'

export default function ClassCard({ classData, user, onDelete, onUnenroll }) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

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

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    setShowDropdown(false)
    onDelete(classData._id)
  }

  const handleUnenrollClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    setShowDropdown(false)
    onUnenroll(classData._id)
  }

  return (
    <div className="class-card" onClick={() => navigate(`/class/${classData._id}`)}>
      <div
        className="card-header"
        style={{ background: classData.color || '#1a73e8' }}
      >
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
        {classData.code && user?.role === 'teacher' && (
          <div className="card-code" onClick={handleCopyCode} title="Click to copy code">
            <span>Code: <strong>{classData.code}</strong></span>
            <span className="copy-hint">
              <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="copy-icon" />
              {copied ? ' Copied!' : ' Copy'}
            </span>
          </div>
        )}
      </div>

      <div className="card-footer">
        <button className="card-icon-btn" title="People" onClick={e => e.stopPropagation()}>
          <FontAwesomeIcon icon={faUsers} />
        </button>
        <button className="card-icon-btn" title="Folder" onClick={e => e.stopPropagation()}>
          <FontAwesomeIcon icon={faFolder} />
        </button>

        <div className="dropdown-container" ref={dropdownRef}>
          <button className="card-icon-btn" title="More" onClick={handleToggleDropdown}>
            <FontAwesomeIcon icon={faEllipsisV} />
          </button>

          {showDropdown && (
            <div className="dropdown-menu">
              {user?.role === 'teacher' ? (
                <button className="dropdown-item delete-item" onClick={handleDeleteClick}>
                  <FontAwesomeIcon icon={faTrash} />
                  Delete class
                </button>
              ) : (
                <button className="dropdown-item unenroll-item" onClick={handleUnenrollClick}>
                  <FontAwesomeIcon icon={faRightFromBracket} />
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