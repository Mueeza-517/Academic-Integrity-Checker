import './Sidebar.css'
import logo from '../../assets/logo.png'
import { useNavigate, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faChalkboardUser, faFileLines, faClipboardCheck,
  faCalendarDays, faBullhorn, faUser, faGear, faRightFromBracket
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

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={() => navigate('/home')}>
        <img src={logo} alt="Integrity Checker" width="32" height="32" />
        <span>Integrity Checker</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.path}
            className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <FontAwesomeIcon icon={item.icon} className="sidebar-icon" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}