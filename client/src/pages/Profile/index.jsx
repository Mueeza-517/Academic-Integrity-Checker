import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../api'
import './Profile.css'

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (!stored || !token) { navigate('/'); return }
    const u = JSON.parse(stored)
    setUser(u)
    setLoading(false)
  }, [])

  const handleRoleSwitch = async () => {
    try {
      const newRole = user.role === 'teacher' ? 'student' : 'teacher'
      const { data } = await API.post('/auth/google-switch', {
        email: user.email,
        role: newRole
      })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      navigate('/home')
    } catch (err) {
      alert('Failed to switch role.')
    }
  }

  return (
    <div className="profile-page">

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-avatar-section">
          {user?.picture ? (
            <img
              src={user.picture}
              className="profile-avatar-img"
              alt="profile"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="profile-avatar-placeholder">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="profile-info">
          <h1 className="profile-name">{user?.name}</h1>
          <p className="profile-email">{user?.email}</p>
          <p className="profile-role">{user?.role === 'teacher' ? 'Teacher' : 'Student'}</p>
        </div>
      </div>

      <div className="profile-section">
        <h2 className="profile-section-title">Account Information</h2>
        <div className="profile-info-list">
          <div className="profile-info-item">
            <div className="profile-info-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#3443eb">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            </div>
            <div>
              <p className="profile-info-label">Full Name</p>
              <p className="profile-info-value">{user?.name}</p>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="profile-info-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#3443eb">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </div>
            <div>
              <p className="profile-info-label">Email Address</p>
              <p className="profile-info-value">{user?.email}</p>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="profile-info-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#3443eb">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
            </div>
            <div>
              <p className="profile-info-label">Current Role</p>
              <p className="profile-info-value" style={{ textTransform: 'capitalize' }}>{user?.role}</p>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="profile-info-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#3443eb">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
            </div>
            <div>
              <p className="profile-info-label">Login Method</p>
              <p className="profile-info-value">Google OAuth</p>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h2 className="profile-section-title">Switch Role</h2>
        <div className="profile-switch-card">
          <div className="profile-switch-info">
            <p className="profile-switch-current">
              Currently signed in as <strong>{user?.role}</strong>
            </p>
            <p className="profile-switch-desc">
              Switch to {user?.role === 'teacher' ? 'student' : 'teacher'} mode to
              {user?.role === 'teacher' ? ' join classes and submit assignments' : ' create classes and post assignments'}
            </p>
          </div>
          <button className="profile-switch-btn" onClick={handleRoleSwitch}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            Switch to {user?.role === 'teacher' ? 'Student' : 'Teacher'}
          </button>
        </div>
      </div>
    </div>
  )
}