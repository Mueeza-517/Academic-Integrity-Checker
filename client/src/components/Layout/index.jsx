import Sidebar from '../Sidebar'
import Header from '../Header'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../api'
import './Layout.css'

export default function Layout({ children, onCreateClass, onJoinClass }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [classes, setClasses] = useState([])

  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (!stored || !token) { navigate('/'); return }
    setUser(JSON.parse(stored))
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const { data } = await API.get('/classes/my')
      setClasses(data)
    } catch (err) {
      console.error('Failed to load classes')
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
      setUser(data.user)
      fetchClasses()
      navigate('/home')
    } catch (err) {
      alert('Failed to switch role.')
    }
  }

  return (
    <div className="layout">
      <Header
        user={user}
        onCreateClass={onCreateClass}
        onJoinClass={onJoinClass}
        onLogout={handleLogout}
        onRoleSwitch={handleRoleSwitch}
      />
      <div className="layout-body">
        <Sidebar classes={classes} user={user} />
        <main className="layout-main">
          {children}
        </main>
      </div>
    </div>
  )
}