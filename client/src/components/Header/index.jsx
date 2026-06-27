import './Header.css'
import logo from '../../assets/logo.png'
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'

export default function Header({ user, onCreateClass, onJoinClass, onLogout }) {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef()

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo" onClick={() => navigate('/home')}>
          <img src={logo} alt="Integrity Checker Logo" width="40" height="40" />
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

        <div className="header-user" ref={menuRef}>
          <span className="header-email">{user?.email}</span>
          <div className="avatar-wrapper" onClick={() => setShowMenu(!showMenu)}>
            {user?.picture ? (
              <img
                src={user.picture}
                className="header-avatar-img"
                alt="profile"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="header-avatar">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>

          {showMenu && (
            <div className="avatar-menu">
              <div className="avatar-menu-info">
                <p className="avatar-menu-name">{user?.name}</p>
                <p className="avatar-menu-email">{user?.email}</p>
                <p className="avatar-menu-role">{user?.role}</p>
              </div>
              <div className="avatar-menu-divider" />
              <button className="avatar-menu-logout" onClick={onLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}