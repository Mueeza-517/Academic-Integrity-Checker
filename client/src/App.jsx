import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import ClassRoom from './pages/ClassRoom'
import JoinClass from './pages/JoinClass'
import AssignmentDetail from './pages/AssignmentDetail'
import AllClasses from './pages/AllClasses'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/classes" element={<AllClasses />} />
          <Route path="/class/:classId" element={<ClassRoom />} />
          <Route path="/class/:classId/assignment/:assignmentId" element={<AssignmentDetail />} />
          <Route path="/join" element={<JoinClass />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}