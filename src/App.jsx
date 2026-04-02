import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Scene from './scene.jsx'
import script from './script.json'
import CustomCursor from './cursor follower.jsx'

function App() {
  return (
    <div> 
    <CustomCursor></CustomCursor>
    <Routes>
      <Route path="/" element={<Navigate to={`/${script.start}`} />} />
      <Route path="/:id" element={<Scene script={script} />} />
    </Routes>
    </div>
  )
}

export default App
