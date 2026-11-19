import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { HeroChapter } from './components/HeroChapter'
import { TimelineChapter } from './components/TimelineChapter'
import { ProjectsChapter } from './components/ProjectsChapter'
import { ShopChapter } from './components/ShopChapter'
import { EndingChapter } from './components/EndingChapter'
import { PlaybackBar } from './components/PlaybackBar'
import { StarBurst } from './components/StarBurst'
import { useReducedMotion } from './hooks/useReducedMotion'
import {
  registerSmoothScroll,
  releaseSmoothScroll,
  scrollToTop,
  startSmoothScroll,
  stopSmoothScroll,
} from './lib/smoothScroll'
import type { EasterEggId } from './types'

gsap.registerPlugin(ScrollTrigger)

const expoOut = (time: number) => (time === 1 ? 1 : 1 - 2 ** (-10 * time))

export default function App() {
  const siteRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [eggs, setEggs] = useState<Set<EasterEggId>>(() => new Set())
  const [celebrating, setCelebrating] = useState(false)
  const [heroMediaReady, setHeroMediaReady] = useState(false)
  const [titleReady, setTitleReady] = useState(false)
  const foundAll = eggs.size === 3

  const unlockEgg = useCallback((egg: EasterEggId) => {
    setEggs((current) => {
      if (current.has(egg)) {
        return current
      }

      const next = new Set(current)
      next.add(egg)
      return next
    })
  }, [])

  useEffect(() => {
    if (reducedMotion) {
      return
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: expoOut,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.25,
      syncTouch: false,
    })

    registerSmoothScroll(lenis)
    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time: number) => lenis.raf(time * 1000)
    const refresh = () => ScrollTrigger.refresh()
    const refreshTimer = window.setTimeout(refresh, 150)
    const loadListener = () => refresh()

    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    window.addEventListener('load', loadListener, { once: true })
    void document.fonts.ready.then(refresh)

    return () => {
      window.clearTimeout(refreshTimer)
      window.removeEventListener('load', loadListener)
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.off('scroll', ScrollTrigger.update)
      lenis.destroy()
      releaseSmoothScroll(lenis)
    }
  }, [reducedMotion])

  useEffect(() => {
    if (paused || modalOpen) {
      stopSmoothScroll()
    } else {
      startSmoothScroll()
    }

    document.documentElement.classList.toggle('modal-open', modalOpen)
  }, [modalOpen, paused])

  useEffect(() => {
    document.documentElement.classList.toggle('is-motion-paused', paused)

    if (paused) {
      gsap.globalTimeline.pause()
      document.querySelectorAll('video').forEach((video) => video.pause())
    } else {
      gsap.globalTimeline.resume()
    }
  }, [paused])

  useEffect(() => {
    if (!foundAll) {
      setCelebrating(false)
      return
    }

    setCelebrating(true)
    const timer = window.setTimeout(() => setCelebrating(false), 2100)
    return () => window.clearTimeout(timer)
  }, [foundAll])

  useEffect(() => {
    if (reducedMotion) {
      setTitleReady(true)
    }
  }, [reducedMotion])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.heroMediaReady = String(heroMediaReady)
    root.dataset.titleReady = String(titleReady)

    if (heroMediaReady && titleReady) {
      root.dataset.assetsReady = 'true'
    } else {
      delete root.dataset.assetsReady
    }

    return () => {
      delete root.dataset.assetsReady
    }
  }, [heroMediaReady, titleReady])

  useLayoutEffect(() => {
    if (reducedMotion) {
      return
    }

    const context = gsap.context(() => {
      const heroChars = gsap.utils.toArray<HTMLElement>('[data-hero-title] .char')

      if (heroChars.length > 0) {
        gsap.fromTo(
          heroChars,
          { opacity: 0.5, yPercent: 68, rotate: 2.5 },
          {
            opacity: 1,
            yPercent: 0,
            rotate: 0,
            duration: 0.82,
            stagger: 0.045,
            ease: 'expo.out',
            onComplete: () => setTitleReady(true),
          },
        )
      } else {
        setTitleReady(true)
      }

      const sectionHeadings = gsap.utils.toArray<HTMLElement>('[data-split-title]')

      sectionHeadings.forEach((heading) => {
        const chars = heading.querySelectorAll<HTMLElement>('.char')

        if (chars.length === 0) {
          return
        }

        gsap.fromTo(
          chars,
          { opacity: 0, yPercent: 110, rotate: 1.5 },
          {
            opacity: 1,
            yPercent: 0,
            rotate: 0,
            duration: 0.82,
            stagger: 0.038,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: heading,
              start: 'top 88%',
              once: true,
              toggleActions: 'play none none none',
            },
          },
        )
      })
    }, siteRef)

    const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 180)
    const titleFallback = window.setTimeout(() => setTitleReady(true), 1800)

    return () => {
      window.clearTimeout(refreshTimer)
      window.clearTimeout(titleFallback)
      context.revert()
    }
  }, [reducedMotion])

  const goHome = () => {
    if (modalOpen) {
      setModalOpen(false)
    }

    scrollToTop()
  }

  return (
    <div ref={siteRef} className={`site ${paused ? 'site--paused' : ''}`}>
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>

      <header className="site-header">
        <a
          className="site-brand"
          href="#intro"
          onClick={(event) => {
            event.preventDefault()
            goHome()
          }}
          aria-label="任博文个人网站，回到顶部"
        >
          <span className="site-brand__mark">RB</span>
          <span className="site-brand__text">
            任博文
            <small className="mono">REN BOWEN / PORTFOLIO</small>
          </span>
        </a>
        <div className="site-header__right">
          <span className="site-header__status">
            <i aria-hidden="true" />
            OPEN FOR TINY QUESTS
          </span>
          <span className="site-header__year mono">© 2026</span>
        </div>
      </header>

      <main id="main-content">
        <HeroChapter
          paused={paused}
          reducedMotion={reducedMotion}
          foundAll={foundAll}
          onUnlock={unlockEgg}
          onMediaReadyChange={setHeroMediaReady}
        />
        <TimelineChapter reducedMotion={reducedMotion} />
        <ProjectsChapter
          modalOpen={modalOpen}
          onModalOpenChange={setModalOpen}
          onUnlock={unlockEgg}
        />
        <ShopChapter reducedMotion={reducedMotion} />
        <EndingChapter onUnlock={unlockEgg} />
      </main>

      <PlaybackBar
        paused={paused}
        eggCount={eggs.size}
        onTogglePause={() => setPaused((current) => !current)}
      />

      {celebrating && <StarBurst />}
    </div>
  )
}

