import './Header.css'
import { useNavigate } from 'react-router-dom'

export default function Header({ user, onCreateClass, onJoinClass }) {
  const navigate = useNavigate()

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="7" rx="1" fill="#4285f4"/>
            <rect x="14" y="3" width="7" height="7" rx="1" fill="#ea4335"/>
            <rect x="3" y="14" width="7" height="7" rx="1" fill="#fbbc04"/>
            <rect x="14" y="14" width="7" height="7" rx="1" fill="#34a853"/>
          </svg>
          <span className="header-title">Classroom</span>
        </div>
      </div>

      <div className="header-right">
  {user?.role === 'teacher' && (
    <button className="header-btn" onClick={onCreateClass} title="Create class">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
      </svg>
    </button>
  )}
  {user?.role === 'student' && (
    <button className="header-btn" onClick={onJoinClass} title="Join class">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
      </svg>
    </button>
  )}
  <div className="header-user">
    <span className="header-email">{user?.email}</span>
    {user?.picture
      ? <img src={user.picture} className="header-avatar-img" alt="profile" />
      : <div className="header-avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
    }
  </div>
</div>
    </header>
  )
}