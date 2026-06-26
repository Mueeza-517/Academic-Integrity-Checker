import './Header.css'
import logo from '../../assets/logo.png'
import { useNavigate } from 'react-router-dom'

export default function Header({ user, onCreateClass, onJoinClass }) {
  const navigate = useNavigate()

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo">
          <img 
             src={logo} 
             alt="Integrity Checker Logo" 
             width="48" 
             height="48" 
            />
          <span className="header-title"><b>Integrity Checker</b></span>
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