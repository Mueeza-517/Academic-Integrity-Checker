import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import './JoinClass.css'

export default function JoinClass() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { navigate('/'); return }
    setUser(JSON.parse(stored))
  }, [])

  const handleJoin = () => {
    if (!code.trim()) return setError('Please enter a class code')
    const classes = JSON.parse(localStorage.getItem('classes') || '[]')
    const found = classes.find(c => c.code === code.toUpperCase())
    if (!found) return setError('Invalid class code. Please check and try again.')

    // Add student to class
    const updatedClasses = classes.map(c => {
      if (c.code !== code.toUpperCase()) return c
      const alreadyJoined = c.students?.includes(user.email)
      if (alreadyJoined) return c
      return { ...c, students: [...(c.students || []), user.email] }
    })
    localStorage.setItem('classes', JSON.stringify(updatedClasses))

    // Save to student's joined classes
    const myClasses = JSON.parse(localStorage.getItem(`myClasses_${user.email}`) || '[]')
    const alreadyIn = myClasses.find(c => c.code === code.toUpperCase())
    if (!alreadyIn) {
      myClasses.push(found)
      localStorage.setItem(`myClasses_${user.email}`, JSON.stringify(myClasses))
    }

    navigate('/home')
  }

  return (
    <div className="joinclass-page">
      <Header user={user} />
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
            <button className="joinclass-confirm" onClick={handleJoin}>Join</button>
          </div>
        </div>
      </div>
    </div>
  )
}