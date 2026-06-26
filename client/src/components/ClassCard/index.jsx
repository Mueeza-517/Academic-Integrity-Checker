import './ClassCard.css'
import { useNavigate } from 'react-router-dom'

const CARD_COLORS = [
  '#1e7e72', '#5c2d91', '#b06000', '#1a73e8',
  '#c5221f', '#137333', '#7b5ea7', '#d93025'
]

export default function ClassCard({ classData, index }) {
  const navigate = useNavigate()
  const color = CARD_COLORS[index % CARD_COLORS.length]

  return (
    <div className="class-card" onClick={() => navigate(`/class/${classData.id}`)}>
      <div className="card-header" style={{ background: color }}>
        <div className="card-info">
          <h3 className="card-title">{classData.name}</h3>
          <p className="card-section">{classData.section}</p>
          <p className="card-teacher">{classData.teacher}</p>
        </div>
        <div className="card-avatar">
          {classData.teacher?.charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="card-body" />

      <div className="card-footer">
        <button className="card-icon-btn" title="People" onClick={e => e.stopPropagation()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
          </svg>
        </button>
        <button className="card-icon-btn" title="Folder" onClick={e => e.stopPropagation()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
        </button>
        <button className="card-icon-btn" title="More" onClick={e => e.stopPropagation()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}