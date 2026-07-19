import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import ClassRoom from './pages/ClassRoom'
import JoinClass from './pages/JoinClass'
import AllClasses from './pages/AllClasses'
import Assignments from './pages/Assignments'


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/classes" element={<AllClasses />} />
          <Route path="/class/:classId" element={<ClassRoom />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/join" element={<JoinClass />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}