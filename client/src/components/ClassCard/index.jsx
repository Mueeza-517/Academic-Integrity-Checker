import './ClassCard.css'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faCheck, faUsers, faFolder, faEllipsisV } from '@fortawesome/free-solid-svg-icons'

const CARD_COLORS = [
  '#1e7e72', '#5c2d91', '#b06000', '#1a73e8',
  '#c5221f', '#137333', '#7b5ea7', '#d93025'
]

export default function ClassCard({ classData, index }) {
  const navigate = useNavigate()
  const color = CARD_COLORS[index % CARD_COLORS.length]
  const [copied, setCopied] = useState(false)

  const handleCopyCode = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(classData.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
              <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="copy-icon"/>
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
        <button className="card-icon-btn" title="More" onClick={e => e.stopPropagation()}>
          <FontAwesomeIcon icon={faEllipsisV} />
        </button>
      </div>
    </div>
  )
}