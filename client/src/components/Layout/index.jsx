import { useState, useEffect } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar'
import './Layout.css'

export default function Layout() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (!stored || !token) {
      navigate('/')
      return
    }
    setUser(JSON.parse(stored))
    setLoading(false)
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} onLogout={handleLogout} />
      <div className="app-content">
        <Outlet />
      </div>
    </div>
  )
}