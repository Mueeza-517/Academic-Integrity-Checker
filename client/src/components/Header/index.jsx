import './Header.css'
import logo from '../../assets/logo.png'
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import API from '../../api'

export default function Header({ user, onCreateClass, onJoinClass, onLogout, onRoleSwitch }) {
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
                <div className="avatar-menu-role-badge">
                  Currently: <strong>{user?.role}</strong>
                </div>
              </div>
              <div className="avatar-menu-divider" />
              <button className="avatar-menu-switch" onClick={() => { onRoleSwitch(); setShowMenu(false) }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
                Switch to {user?.role === 'teacher' ? 'Student' : 'Teacher'}
              </button>
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