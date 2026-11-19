import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitHeading } from './SplitText'
import { SparkIcon } from './Icons'
import { assets } from '../lib/assets'

gsap.registerPlugin(ScrollTrigger)

type TimelineChapterProps = {
  reducedMotion: boolean
}

const timeline = [
  {
    year: '2023',
    title: '考入大学',
    text: '计算机科学与技术，从此和代码过上了。',
    index: '01',
  },
  {
    year: '2025',
    title: '开始正经做项目',
    text: '把想法一个个变成能跑的东西。',
    index: '02',
  },
  {
    year: '2026',
    title: '大三进行时',
    text: '一边学机器学习，一边接小单、一边捣鼓 AI 视频。',
    index: '03',
  },
]

export function TimelineChapter({ reducedMotion }: TimelineChapterProps) {
  const sectionRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    if (reducedMotion || !sectionRef.current) {
      return
    }

    const media = gsap.matchMedia()

    media.add('(min-width: 768px)', () => {
      const section = sectionRef.current
      const steps = section?.querySelectorAll<HTMLElement>('[data-timeline-step]')
      const years = section?.querySelectorAll<HTMLElement>('[data-ghost-year]')
      const dots = section?.querySelectorAll<HTMLElement>('[data-timeline-dot]')
      const progressLine = section?.querySelector<HTMLElement>('[data-timeline-progress]')

      if (!section || !steps || !years || !dots || !progressLine || steps.length === 0) {
        return
      }

      gsap.set(years, { opacity: 0.035, yPercent: 9, scale: 0.96 })
      gsap.set(dots, { scale: 0.72, opacity: 0.55 })
      gsap.set(progressLine, { scaleY: 0, transformOrigin: 'top center' })

      const timelineTween = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=185%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      timelineTween.to(
        progressLine,
        {
          scaleY: 1,
          duration: 2.7,
          ease: 'expo.out',
        },
        0,
      )

      steps.forEach((step, index) => {
        const year = years[index]
        const dot = dots[index]
        const start = index * 0.95

        timelineTween
          .to(
            year,
            {
              opacity: 0.12,
              yPercent: 0,
              scale: 1,
              duration: 0.45,
              ease: 'expo.out',
            },
            start,
          )
          .to(
            dot,
            {
              opacity: 1,
              scale: 1,
              duration: 0.35,
              ease: 'expo.out',
            },
            start + 0.05,
          )
      })

      timelineTween.to({}, { duration: 0.5 })

      return () => {
        timelineTween.scrollTrigger?.kill()
        timelineTween.kill()
        gsap.set(steps, { clearProps: 'opacity,transform' })
        gsap.set(years, { clearProps: 'opacity,transform' })
        gsap.set(dots, { clearProps: 'opacity,transform' })
        gsap.set(progressLine, { clearProps: 'opacity,transform' })
      }
    })

    requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => media.revert()
  }, [reducedMotion])

  return (
    <section
      ref={sectionRef}
      id="timeline"
      className="chapter chapter--timeline"
      aria-labelledby="timeline-title"
      data-chapter
      data-chapter-label="02 / 履历"
    >
      <div className="chapter-shell timeline-shell">
        <div className="chapter-kicker">
          <span className="chapter-kicker__number">02</span>
          <span>我的履历</span>
          <span className="chapter-kicker__tag">STILL FIGURING IT OUT</span>
        </div>

        <div className="timeline-layout">
          <div className="timeline-portrait-column">
            <div className="sticker-card timeline-sticker">
              <img
                src={assets.presenter}
                alt="任博文伸出手指，认真讲解的样子"
                width="1024"
                height="1024"
                loading="lazy"
                decoding="async"
              />
              <span className="sticker-card__label">THE EXPLAINER</span>
            </div>
            <div className="timeline-aside-note">
              <SparkIcon size={20} />
              <p>
                简历上是这么写的。
                <br />
                现实里通常更吵一点。
              </p>
            </div>
          </div>

          <div className="timeline-content">
            <SplitHeading id="timeline-title" text="我的履历" className="section-title" />
            <p className="section-lede">几行字，概括不了全部的折腾。先挑重点说。</p>

            <div className="timeline-list-wrap">
              <span className="timeline-progress-line" data-timeline-progress aria-hidden="true" />
              <ol className="timeline-list">
              {timeline.map((item) => (
                <li className="timeline-step" key={item.year} data-timeline-step>
                  <span className="ghost-year" data-ghost-year aria-hidden="true">
                    {item.year}
                  </span>
                  <div className="timeline-step__dot" data-timeline-dot aria-hidden="true" />
                  <div className="timeline-step__body">
                    <div className="timeline-step__meta">
                      <span className="year-pill">{item.year}</span>
                      <span className="mono">CHAPTER {item.index}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </li>
              ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
      <span className="chapter-watermark" aria-hidden="true">
        02
      </span>
    </section>
  )
}




