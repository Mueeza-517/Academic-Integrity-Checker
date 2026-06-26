import './Login.css'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import logo from '../../assets/logo.png'



export default function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState('student')

  const handleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential)
    localStorage.setItem('user', JSON.stringify({
      name: decoded.name,
      email: decoded.email,
      picture: decoded.picture,
      role
    }))
    navigate('/home')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img 
            src={logo} 
            alt="Integrity Checker Logo" 
            width="108" 
            height="108" 
          />
          <h1><b>Inegrity Checker</b></h1>
          <p>Sign in to continue</p>
        </div>

        <div className="role-toggle">
          <button className={`role-btn ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>Student</button>
          <button className={`role-btn ${role === 'teacher' ? 'active' : ''}`} onClick={() => setRole('teacher')}>Teacher</button>
        </div>

        <p className="role-hint">Signing in as <strong>{role}</strong></p>

        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => alert('Login failed. Try again.')}
        />
      </div>
    </div>
  )
}