import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import ClassRoom from './pages/ClassRoom'
import JoinClass from './pages/JoinClass'
import AssignmentDetail from './pages/AssignmentDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/class/:classId" element={<ClassRoom />} />
        <Route path="/class/:classId/assignment/:assignmentId" element={<AssignmentDetail />} />
        <Route path="/join" element={<JoinClass />} />
      </Routes>
    </BrowserRouter>
  )
}