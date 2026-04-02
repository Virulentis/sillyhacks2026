import { Routes, Route, useNavigate } from 'react-router-dom'
import { useCallback, useState } from 'react'
import './App.css'
import Scene from './scene.jsx'
import script from './script.json'
import CustomCursor from './cursor follower.jsx'
import { TransitionCtx, SanityCtx, EndingsCtx } from './contexts.js'

function AppInner() {
  const navigate = useNavigate()
  const [dark, setDark] = useState(false)
  const [sanity, setSanity] = useState(100)
  const [seenEndings, setSeenEndings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sh26_endings') || '[]') }
    catch { return [] }
  })

  const transitionTo = useCallback((path) => {
    setDark(true)
    setTimeout(() => {
      navigate(path)
      requestAnimationFrame(() => requestAnimationFrame(() => setDark(false)))
    }, 350)
  }, [navigate])

  const reduceSanity = useCallback((amount) => {
    setSanity(s => Math.max(0, s - amount))
  }, [])

  const resetSanity = useCallback(() => setSanity(100), [])

  const recordEnding = useCallback((endingType) => {
    setSeenEndings(prev => {
      if (prev.includes(endingType)) return prev
      const next = [...prev, endingType]
      localStorage.setItem('sh26_endings', JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <TransitionCtx.Provider value={transitionTo}>
      <SanityCtx.Provider value={{ sanity, reduceSanity, resetSanity }}>
        <EndingsCtx.Provider value={{ seenEndings, recordEnding }}>
          <CustomCursor />
          <div
            className="fixed inset-0 bg-black pointer-events-none"
            style={{ opacity: dark ? 1 : 0, transition: 'opacity 0.35s ease', zIndex: 9998 }}
          />
          <Routes>
            <Route path="/" element={<Scene script={script} />} />
            <Route path="/:id" element={<Scene script={script} />} />
          </Routes>
        </EndingsCtx.Provider>
      </SanityCtx.Provider>
    </TransitionCtx.Provider>
  )
}

function App() {
  return (
    <div>
      <AppInner />
    </div>
  )
}

export default App
