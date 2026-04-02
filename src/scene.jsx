import { useParams } from 'react-router-dom'
import { useEffect, useState, useMemo, useContext, useCallback } from 'react'
import Movingbox from './test'
import { TransitionCtx, SanityCtx, EndingsCtx } from './contexts.js'

const ENDING_STYLES = {
  survival:     'bg-stone-900 text-stone-300',
  death:        'bg-red-950 text-red-200',
  madness:      'bg-purple-950 text-purple-200',
  enlightenment:'bg-black text-yellow-100 [filter:saturate(0.4)]',
}

const NODE_STYLES = {
  code:         'animate-pulse [filter:hue-rotate(180deg)]',
  final_voice:  '[animation:shake_0.15s_infinite]',
  descend_after:'brightness-50',
}

// Nodes that cost sanity when visited
const SANITY_COSTS = {
  decode_symbols:      30,
  tell_warren_decoded: 20,
  enlightened_descent: 50,
  descend_after:       50,
  final_voice:         40,
  tug_wire:            20,
  call_name:           20,
  long_silence:        15,
  comprehension:       25,
  enlightenment:       100,
}

const ENDING_TYPES = ['survival', 'death', 'madness', 'enlightenment']

// Nodes that already apply CSS filters — skip sanity distortion on these
const FILTER_NODES = new Set(['code', 'descend_after'])

// Reveal HTML content up to `charLimit` visible characters, preserving tags
function revealHtml(html, charLimit) {
  let visible = 0
  let output = ''
  const openTags = []
  let inTag = false
  let tagBuffer = ''

  for (let i = 0; i < html.length; i++) {
    const ch = html[i]
    if (ch === '<') {
      inTag = true
      tagBuffer = '<'
    } else if (inTag) {
      tagBuffer += ch
      if (ch === '>') {
        inTag = false
        output += tagBuffer
        const m = tagBuffer.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/)
        if (m) {
          const closing = tagBuffer[1] === '/'
          const selfClose = tagBuffer.endsWith('/>') ||
            ['br', 'hr', 'img', 'input'].includes(m[1].toLowerCase())
          if (!closing && !selfClose) openTags.push(m[1])
          else if (closing) {
            const idx = openTags.lastIndexOf(m[1])
            if (idx !== -1) openTags.splice(idx, 1)
          }
        }
        tagBuffer = ''
      }
    } else {
      if (visible >= charLimit) break
      output += ch
      visible++
    }
  }

  for (let i = openTags.length - 1; i >= 0; i--) {
    output += `</${openTags[i]}>`
  }
  return output
}

function countHtmlChars(html) {
  let count = 0
  let inTag = false
  for (const ch of html) {
    if (ch === '<') inTag = true
    else if (ch === '>') inTag = false
    else if (!inTag) count++
  }
  return count
}

export default function Scene({ script }) {
  const { id = script.start } = useParams()
  const transitionTo = useContext(TransitionCtx)
  const { sanity, reduceSanity, resetSanity } = useContext(SanityCtx)
  const { seenEndings, recordEnding } = useContext(EndingsCtx)
  const node = script.nodes[id]

  const [revealed, setRevealed] = useState(0)
  const [done, setDone] = useState(false)

  const totalChars = useMemo(() => (node ? countHtmlChars(node.text) : 0), [node])

  // Reset typewriter and apply sanity cost when node changes
  useEffect(() => {
    setRevealed(0)
    setDone(false)
    if (node && SANITY_COSTS[id]) {
      reduceSanity(SANITY_COSTS[id])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Typewriter interval
  useEffect(() => {
    if (done || totalChars === 0) return
    const intervalId = setInterval(() => {
      setRevealed(r => Math.min(r + 5, totalChars))
    }, 20)
    return () => clearInterval(intervalId)
  }, [done, totalChars])

  // Mark done when revealed reaches total
  useEffect(() => {
    if (!done && totalChars > 0 && revealed >= totalChars) {
      setDone(true)
    }
  }, [revealed, totalChars, done])

  const skipTypewriter = useCallback(() => {
    if (!done) {
      setRevealed(totalChars)
      setDone(true)
    }
  }, [done, totalChars])

  const displayHtml = useMemo(() => {
    if (!node) return ''
    if (done) return node.text
    return revealHtml(node.text, revealed)
  }, [node, revealed, done])

  // Record ending when landing on an ending node
  useEffect(() => {
    if (node?.ending) recordEnding(node.ending_type)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRestart = useCallback(() => {
    resetSanity()
    transitionTo(`/${script.start}`)
  }, [resetSanity, transitionTo, script.start])

  // Keyboard: space/enter to skip typewriter; 1-3 to choose
  useEffect(() => {
    const handler = (e) => {
      if (!done && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault()
        skipTypewriter()
        return
      }
      if (done && node?.choices?.length) {
        const num = parseInt(e.key)
        if (num >= 1 && num <= node.choices.length) {
          transitionTo(`/${node.choices[num - 1].next}`)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [done, node, transitionTo, skipTypewriter])

  useEffect(() => {
    document.documentElement.style.setProperty('--cursor-size', node?.ending ? '600px' : '400px')
  }, [node?.ending])

  if (!node) return <p>not found: {id}</p>

  const endingStyle = node.ending ? (ENDING_STYLES[node.ending_type] ?? '') : ''
  const nodeStyle   = NODE_STYLES[id] ?? ''

  // Sanity distortion — skip on nodes that already apply filters
  const sanityFilter = !node.ending && !FILTER_NODES.has(id) && sanity < 70
    ? `hue-rotate(${(70 - sanity) * 2}deg) blur(${Math.max(0, (45 - sanity) * 0.025)}px)`
    : undefined

  return (
    <div
      className={`flex flex-col items-center min-h-screen transition-colors duration-1000 ${endingStyle} ${nodeStyle}`}
      style={sanityFilter ? { filter: sanityFilter } : undefined}
      onClick={skipTypewriter}
    >
      {/* Endings tracker */}
      <div className="fixed top-4 right-4 z-10 select-none opacity-25 hover:opacity-70 transition-opacity text-xs tracking-widest flex items-center gap-1">
        {ENDING_TYPES.map(t => (
          <span key={t} style={{ opacity: seenEndings.includes(t) ? 1 : 0.2 }}>■</span>
        ))}
        <span className="ml-1">{seenEndings.length}/4</span>
      </div>

      <p
        className='w-[65%] text-center text-xl leading-20 mt-16'
        dangerouslySetInnerHTML={{ __html: displayHtml }}
      />

      {/* Hint while typewriter is running */}
      {!done && (
        <p className="fixed bottom-4 left-1/2 -translate-x-1/2 text-xs opacity-20 select-none tracking-widest">
          click or press space to reveal
        </p>
      )}

      {node.ending ? (
        <div className='mt-20 flex flex-col items-center gap-6'>
          <p className='text-3xl font-bold tracking-widest uppercase opacity-70'>
            {node.ending_label}
          </p>
          <button
            className='mt-4 px-6 py-2 border border-current opacity-50 hover:opacity-100 transition-opacity cursor-pointer'
            onClick={(e) => { e.stopPropagation(); handleRestart() }}
          >
            Begin Again
          </button>
        </div>
      ) : (
        done && node.choices.map((choice, i) =>
          <Movingbox
            key={choice.next}
            text={choice.text}
            madness={20}
            seed={choice.next}
            onClick={() => transitionTo(`/${choice.next}`)}
            index={i + 1}
          />
        )
      )}

      {/* Keyboard hint when choices are visible */}
      {done && !node.ending && node.choices.length > 0 && (
        <p className="fixed bottom-4 left-1/2 -translate-x-1/2 text-xs opacity-20 select-none tracking-widest">
          press 1–{node.choices.length} to choose
        </p>
      )}
    </div>
  )
}
