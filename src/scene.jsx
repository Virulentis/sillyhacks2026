import { useParams, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import Movingbox from './test'

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

export default function Scene({ script }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const node = script.nodes[id]
  

  if (!node) return <p>not found: {id}</p>

  const endingStyle = node.ending ? (ENDING_STYLES[node.ending_type] ?? '') : ''
  const nodeStyle   = NODE_STYLES[id] ?? ''

  useEffect(() => {
    document.documentElement.style.setProperty('--cursor-size', node.ending ? '600px' : '250px')
  }, [node.ending])

  return (
    <div className={`flex flex-col items-center min-h-screen transition-colors duration-1000 ${endingStyle} ${nodeStyle}`}>
      <p
        className='w-[65%] text-center text-xl leading-20 mt-16'
        dangerouslySetInnerHTML={{ __html: node.text }}
      />

      {node.ending ? (
        <div className='mt-20 flex flex-col items-center gap-6'>
          <p className='text-3xl font-bold tracking-widest uppercase opacity-70'>
            {node.ending_label}
          </p>
          <button
            className='mt-4 px-6 py-2 border border-current opacity-50 hover:opacity-100 transition-opacity cursor-pointer'
            onClick={() => navigate(`/${script.start}`)}
          >
            Begin Again
          </button>
        </div>
      ) : (
        node.choices.map(choice =>
          <Movingbox
            key={choice.next}
            text={choice.text}
            madness={20}
            seed={choice.next}
            onClick={() => navigate(`/${choice.next}`)}
          />
        )
      )}
    </div>
  )
}
