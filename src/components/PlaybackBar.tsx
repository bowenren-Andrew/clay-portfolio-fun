import { useEffect, useRef, useState } from 'react'
import { PauseIcon, PlayIcon, SparkIcon } from './Icons'
import { getScrollMax, seekToPercent } from '../lib/smoothScroll'

type PlaybackBarProps = {
  paused: boolean
  eggCount: number
  onTogglePause: () => void
}

const chapterLabels = ['01 / 初见', '02 / 履历', '03 / 作品', '04 / 杂货铺', '05 / 无限可能']

export function PlaybackBar({ paused, eggCount, onTogglePause }: PlaybackBarProps) {
  const [activeChapter, setActiveChapter] = useState(0)
  const [progress, setProgress] = useState(0)
  const activeRef = useRef(0)
  const progressRef = useRef(0)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const max = getScrollMax()
      const y = window.scrollY
      const nextProgress = max > 0 ? Math.min(100, Math.max(0, (y / max) * 100)) : 0

      if (Math.abs(nextProgress - progressRef.current) > 0.05) {
        progressRef.current = nextProgress
        setProgress(nextProgress)
      }

      const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter]'))
      let nextActive = 0
      const threshold = window.innerHeight * 0.46

      sections.forEach((section, index) => {
        if (section.getBoundingClientRect().top <= threshold) {
          nextActive = index
        }
      })

      if (max - y < 4 && sections.length > 0) {
        nextActive = sections.length - 1
      }

      if (nextActive !== activeRef.current) {
        activeRef.current = nextActive
        setActiveChapter(nextActive)
      }
    }

    const schedule = () => {
      if (frame === 0) {
        frame = requestAnimationFrame(update)
      }
    }

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const resizeObserver = new ResizeObserver(schedule)
    resizeObserver.observe(document.body)

    const initialTimer = window.setTimeout(schedule, 120)
    const layoutTimer = window.setTimeout(schedule, 750)
    void document.fonts.ready.then(schedule)
    update()

    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      resizeObserver.disconnect()
      window.clearTimeout(initialTimer)
      window.clearTimeout(layoutTimer)
      cancelAnimationFrame(frame)
    }
  }, [])

  const seek = (value: number) => {
    setProgress(value)
    progressRef.current = value
    seekToPercent(value, true)
  }

  const safeChapter = chapterLabels[activeChapter] ?? chapterLabels[0]

  return (
    <aside className="playback-bar" aria-label="全站播放控制">
      <div className="playback-bar__inner">
        <div className="playback-chapter" aria-live="polite" aria-atomic="true">
          <span className="playback-chapter__eyebrow mono">NOW VIEWING</span>
          <strong>{safeChapter}</strong>
        </div>

        <div className="playback-progress">
          <div className="playback-progress__labels mono" aria-hidden="true">
            <span>START</span>
            <span>{String(Math.round(progress)).padStart(2, '0')}%</span>
            <span>END</span>
          </div>
          <div className="playback-progress__control">
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress}
              onChange={(event) => seek(Number(event.currentTarget.value))}
              aria-label="页面进度，拖动跳到对应章节"
              aria-valuetext={`${safeChapter}，页面进度 ${Math.round(progress)}%`}
              style={{ '--progress': `${progress}%` } as React.CSSProperties}
            />
            <span className="progress-ticks" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>
        </div>

        <div className="playback-controls">
          <button
            type="button"
            className={`bar-button ${paused ? 'is-paused' : ''}`}
            onClick={onTogglePause}
            aria-pressed={paused}
            aria-label={paused ? '继续全站动效和视频' : '暂停全站动效和视频'}
          >
            {paused ? <PlayIcon size={16} /> : <PauseIcon size={16} />}
            <span className="bar-button__label">{paused ? '继续' : '暂停'}</span>
          </button>

          <div className={`egg-counter ${eggCount === 3 ? 'is-complete' : ''}`} aria-live="polite">
            <SparkIcon size={15} />
            <span className="egg-counter__label">彩蛋</span>
            <output>{eggCount}/3</output>
          </div>
        </div>
      </div>
    </aside>
  )
}
