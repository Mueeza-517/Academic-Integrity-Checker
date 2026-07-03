import './Sidebar.css'
import logo from '../../assets/logo.png'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faChalkboardUser, faFileLines, faClipboardCheck,
  faCalendarDays, faBullhorn, faUser, faGear, faRightFromBracket,
  faBars, faXmark
} from '@fortawesome/free-solid-svg-icons'

const NAV_ITEMS = [
  { label: 'Home', path: '/home', icon: faHouse },
  { label: 'My Classes', path: '/classes', icon: faChalkboardUser },
  { label: 'Assignments', path: '/assignments', icon: faFileLines },
  { label: 'Submissions', path: '/submissions', icon: faClipboardCheck },
  { label: 'Calendar', path: '/calendar', icon: faCalendarDays },
  { label: 'Announcements', path: '/announcements', icon: faBullhorn },
  { label: 'Profile', path: '/profile', icon: faUser },
  { label: 'Settings', path: '/settings', icon: faGear },
]

export default function Sidebar({ user, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleNavigate = (path) => {
    navigate(path)
    setMobileOpen(false)
  }

  return (
    <>
      <div className="mobile-topbar">
        <div className="mobile-topbar-logo" onClick={() => handleNavigate('/home')}>
          <img src={logo} alt="Integrity Checker" width="36" height="28" />
          <span>Integrity Checker</span>
        </div>
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
      </div>

      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-logo" onClick={() => handleNavigate('/home')}>
            <img src={logo} alt="Integrity Checker" width="32" height="32" />
            <span>Integrity Checker</span>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => handleNavigate(item.path)}
            >
              <FontAwesomeIcon icon={item.icon} className="sidebar-icon" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  )
}