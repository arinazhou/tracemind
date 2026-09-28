import { ANIMATIONS } from '../../animations'
import { Player } from '../Player'

interface Props {
  num: number
  title: string
  open: boolean
  onToggle: () => void
}

/** A collapsible animation. The lesson keeps at most one open, so arrow keys drive one player. */
export function Demo({ num, title, open, onToggle }: Props) {
  const anim = ANIMATIONS[num]
  return (
    <div className={`demo${open ? ' open' : ''}`}>
      <button className="demo-head" onClick={onToggle} aria-expanded={open}>
        <span className="demo-play">{open ? '▾' : '▶'}</span>
        <span><b>Watch it run:</b> {num}. {title}</span>
        <a className="lc-link" href={`#/p/${num}`} onClick={(e) => e.stopPropagation()} style={{ marginLeft: 'auto' }}>open problem page →</a>
      </button>
      {open && anim && (
        <div className="demo-body">
          <Player key={num} anim={anim} />
          <ul className="cx-why" style={{ marginTop: 14 }}>
            <li><b>Time {anim.complexity.time}, space {anim.complexity.space}.</b></li>
            {anim.complexity.why.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
