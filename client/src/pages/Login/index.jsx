import './Login.css'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import API from '../../api'
import logo from '../../assets/logo.png'

export default function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState('student')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSuccess = async (credentialResponse) => {
    try {
      setLoading(true)
      setError('')
      const decoded = jwtDecode(credentialResponse.credential)

      const { data } = await API.post('/auth/google', {
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
        role
      })

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/home')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img
            src={logo}
            alt="Integrity Checker Logo"
            width="118"
            height="78"
          />
          <h1><b>Integrity Checker</b></h1>
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

        <p className="role-hint">Signing in as <strong>{role}</strong></p>

        {error && <p className="login-error">{error}</p>}

        {loading ? (
          <p className="login-loading">Signing in...</p>
        ) : (
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => setError('Login failed. Try again.')}
          />
        )}
      </div>
    </div>
  )
}