import './Login.css'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState('student')

  const handleLogin = () => {
    // Mock login — replace with real Google OAuth later
    localStorage.setItem('user', JSON.stringify({
      name: role === 'teacher' ? 'Dr. Muhammad Awais' : 'Ali Hassan',
      email: role === 'teacher' ? 'teacher@gmail.com' : 'student@gmail.com',
      role
    }))
    navigate('/home')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="9" height="9" rx="1.5" fill="#4285f4"/>
            <rect x="13" y="2" width="9" height="9" rx="1.5" fill="#ea4335"/>
            <rect x="2" y="13" width="9" height="9" rx="1.5" fill="#fbbc04"/>
            <rect x="13" y="13" width="9" height="9" rx="1.5" fill="#34a853"/>
          </svg>
          <h1>Classroom</h1>
          <p>Sign in to continue</p>
        </div>

        <div className="role-toggle">
          <button
            className={`role-btn ${role === 'student' ? 'active' : ''}`}
            onClick={() => setRole('student')}
          >Student</button>
          <button
            className={`role-btn ${role === 'teacher' ? 'active' : ''}`}
            onClick={() => setRole('teacher')}
          >Teacher</button>
        </div>

        <button className="google-btn" onClick={handleLogin}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google as {role === 'teacher' ? 'Teacher' : 'Student'}
        </button>
      </div>
    </div>
  )
}