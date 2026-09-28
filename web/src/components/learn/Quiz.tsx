import { useState } from 'react'

export interface Question {
  q: string
  options: string[]
  answer: number
  why: string
}

export function Quiz({ questions }: { questions: Question[] }) {
  const [picked, setPicked] = useState<Record<number, number>>({})
  const answered = Object.keys(picked).length
  const correct = questions.filter((q, i) => picked[i] === q.answer).length
  return (
    <div className="quiz">
      {questions.map((q, i) => {
        const p = picked[i]
        return (
          <div key={i} className="card panel quiz-q">
            <div className="quiz-num">Q{i + 1}</div>
            <p className="quiz-text">{q.q}</p>
            <div className="quiz-options">
              {q.options.map((o, k) => {
                const state = p === undefined ? '' : k === q.answer ? ' right' : k === p ? ' wrong' : ' faded'
                return (
                  <button key={k} className={`quiz-opt${state}`} disabled={p !== undefined} onClick={() => setPicked({ ...picked, [i]: k })}>
                    {o}
                  </button>
                )
              })}
            </div>
            {p !== undefined && <p className={`quiz-why ${p === q.answer ? 'ok' : 'no'}`}>{p === q.answer ? '✓ ' : '✗ '}{q.why}</p>}
          </div>
        )
      })}
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="muted" style={{ fontWeight: 700 }}>
          {answered === questions.length ? `Score: ${correct} / ${questions.length}${correct === questions.length ? '. Ready for mediums.' : ''}` : `${answered} / ${questions.length} answered`}
        </span>
        {answered > 0 && <button className="btn" onClick={() => setPicked({})}>Reset quiz</button>}
      </div>
    </div>
  )
}
