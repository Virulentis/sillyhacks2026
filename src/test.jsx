import { motion } from "motion/react";
import { useRef, useState, useEffect } from "react";

const GLYPHS = 'ABCDEFabcdef'
function scramble(len) {
  return Array.from({ length: len }, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join('')
}

function seededRand(seed) {
  let s = typeof seed === 'string'
    ? [...seed].reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0)
    : seed | 0
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0
    return (s >>> 0) / 0xffffffff
  }
}

export default function Movingbox({ text = "error text", madness = 10, seed = 0, onClick }) {
  const vals = useRef(null)
  if (!vals.current) {
    const rand = seededRand(seed)
    const left = 5 + rand() * 80   // 5–85% from left
    const top = 45 + rand() * 40   // 45–85% from top (avoids the text area)
    const dx = (rand())  * madness
    const dy = (rand())  * madness
    const duration = .5+ rand() * 0.2
    vals.current = { left, top, dx, dy, duration }
  }
  const { left, top, dx, dy, duration } = vals.current
  const [hovered, setHovered] = useState(false)
  const [display, setDisplay] = useState(() => scramble(text.length))
  const [isInf, setIsInf] = useState(false);

  useEffect(() => {
    if (hovered) return
    const id = setInterval(() => setDisplay(scramble(text.length)), 80)
    return () => clearInterval(id)
  }, [hovered, text.length])

  return (
    <div
      style={{ position: 'fixed', left: `${left}%`, top: `${top}%` }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        className="w-fit h-auto p-2 cursor-pointer select-none"
        animate={{ x: [0, dx, 0], y: [0, dy, 0] }}
        transition={{ duration: isInf ? duration : 0, repeat: Infinity, ease: "linear" }}
        whileHover={{scale: 1.1, ease: "linear"}}
      >
        <p>{hovered ? text : display}</p>
      </motion.div>
    </div>
  )
}
