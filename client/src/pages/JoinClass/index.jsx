import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import API from '../../api'
import './JoinClass.css'

export default function JoinClass() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (!stored || !token) { navigate('/'); return }
    setUser(JSON.parse(stored))
  }, [])

  const handleJoin = async () => {
    if (!code.trim()) return setError('Please enter a class code')
    try {
      setLoading(true)
      setError('')
      await API.post('/classes/join', { code })
      navigate('/home')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join class.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const handleRoleSwitch = async () => {
    try {
      const newRole = user.role === 'teacher' ? 'student' : 'teacher'
      const { data } = await API.post('/auth/google-switch', {
        email: user.email,
        role: newRole
      })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/home')
    } catch (err) {
      alert('Failed to switch role.')
    }
  }

  return (
    <div className="joinclass-page">
      <Header user={user} onLogout={handleLogout} onRoleSwitch={handleRoleSwitch} />
      <div className="joinclass-container">
        <div className="joinclass-card">
          <h2>Join a class</h2>
          <p>Ask your teacher for the class code, then enter it here.</p>
          <input
            className="joinclass-input"
            placeholder="Class code (e.g. AB12CD)"
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
            maxLength={8}
          />
          {error && <span className="joinclass-error">{error}</span>}
          <div className="joinclass-actions">
            <button className="joinclass-cancel" onClick={() => navigate('/home')}>Cancel</button>
            <button className="joinclass-confirm" onClick={handleJoin} disabled={loading}>
              {loading ? 'Joining...' : 'Join'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}