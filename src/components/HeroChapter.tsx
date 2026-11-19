import { useEffect, useRef, useState } from 'react'
import { CharLine } from './SplitText'
import { SparkIcon } from './Icons'
import { scrollToSection } from '../lib/smoothScroll'
import { assets } from '../lib/assets'
import type { EasterEggId } from '../types'

type HeroChapterProps = {
  paused: boolean
  reducedMotion: boolean
  foundAll: boolean
  onUnlock: (egg: EasterEggId) => void
  onMediaReadyChange: (ready: boolean) => void
}

const faces = [
  {
    src: assets.front,
    label: '定妆正面',
    alt: '任博文正面笑脸，戴着珊瑚红耳机',
  },
  {
    src: assets.laugh,
    label: '大笑',
    alt: '任博文开怀大笑，露出牙齿',
  },
  {
    src: assets.shocked,
    label: '惊讶',
    alt: '任博文惊讶地睁大眼睛',
  },
]

export function HeroChapter({
  paused,
  reducedMotion,
  foundAll,
  onUnlock,
  onMediaReadyChange,
}: HeroChapterProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const posterRef = useRef<HTMLImageElement>(null)
  const cardRef = useRef<HTMLButtonElement>(null)
  const mediaRef = useRef<HTMLSpanElement>(null)
  const gazeFrame = useRef<number | null>(null)
  const clickCount = useRef(0)
  const [faceIndex, setFaceIndex] = useState(0)
  const [hasStillFace, setHasStillFace] = useState(false)
  const [posterReady, setPosterReady] = useState(false)
  const [videoReady, setVideoReady] = useState(false)

  useEffect(() => {
    const video = videoRef.current

    if (!video) {
      return
    }

    if (video.readyState >= 2) {
      setVideoReady(true)
    }

    const markReady = () => setVideoReady(true)
    const markFailed = () => setVideoReady(false)

    video.addEventListener('loadeddata', markReady)
    video.addEventListener('canplay', markReady)
    video.addEventListener('error', markFailed)

    return () => {
      video.removeEventListener('loadeddata', markReady)
      video.removeEventListener('canplay', markReady)
      video.removeEventListener('error', markFailed)
    }
  }, [hasStillFace])

  useEffect(() => {
    const poster = posterRef.current

    if (poster?.complete && poster.naturalWidth > 0) {
      setPosterReady(true)
    }
  }, [faceIndex, hasStillFace])

  useEffect(() => {
    onMediaReadyChange(posterReady && (hasStillFace || videoReady))
  }, [hasStillFace, onMediaReadyChange, posterReady, videoReady])

  useEffect(() => {
    const video = videoRef.current

    if (!video) {
      return
    }

    if (paused || hasStillFace) {
      video.pause()
      return
    }

    void video.play().catch(() => {
      // Muted autoplay is broadly supported; the image layer stays visible if playback is denied.
    })
  }, [paused, hasStillFace])

  useEffect(() => {
    if (reducedMotion) {
      return
    }

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const wideScreen = window.matchMedia('(min-width: 768px)')

    const setGaze = (x: number, y: number) => {
      const card = cardRef.current
      const media = mediaRef.current

      if (!card || !media) {
        return
      }

      card.style.setProperty('--gaze-card-x', `${(x * 4.5).toFixed(2)}px`)
      card.style.setProperty('--gaze-card-y', `${(y * 3.2).toFixed(2)}px`)
      media.style.setProperty('--gaze-art-x', `${(x * -9.2).toFixed(2)}px`)
      media.style.setProperty('--gaze-art-y', `${(y * -6.2).toFixed(2)}px`)
    }

    const resetGaze = () => {
      setGaze(0, 0)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (
        paused ||
        !finePointer.matches ||
        !wideScreen.matches ||
        event.pointerType !== 'mouse'
      ) {
        return
      }

      if (gazeFrame.current !== null) {
        cancelAnimationFrame(gazeFrame.current)
      }

      gazeFrame.current = requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth - 0.5) * 2
        const y = (event.clientY / window.innerHeight - 0.5) * 2
        setGaze(x, y)
      })
    }

    const onPointerLeave = () => resetGaze()
    const onPreferenceChange = () => resetGaze()

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onPointerLeave)
    finePointer.addEventListener('change', onPreferenceChange)
    wideScreen.addEventListener('change', onPreferenceChange)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('pointerleave', onPointerLeave)
      finePointer.removeEventListener('change', onPreferenceChange)
      wideScreen.removeEventListener('change', onPreferenceChange)

      if (gazeFrame.current !== null) {
        cancelAnimationFrame(gazeFrame.current)
      }
    }
  }, [paused, reducedMotion])

  const cycleFace = () => {
    clickCount.current += 1
    setHasStillFace(true)
    setFaceIndex((current) => (current + 1) % faces.length)

    if (clickCount.current >= 3) {
      onUnlock('expressions')
    }
  }

  const visibleFace = faces[faceIndex]
  const clickHint = hasStillFace
    ? `当前表情：${visibleFace.label}。再点一次继续切换`
    : '播放动态头像，点击切换表情'

  return (
    <section
      id="intro"
      className="chapter chapter--hero"
      aria-labelledby="intro-title"
      data-chapter
      data-chapter-label="01 / 初见"
    >
      <div className="hero-orbit hero-orbit--one" aria-hidden="true" />
      <div className="hero-orbit hero-orbit--two" aria-hidden="true" />
      <div className="hero-layout">
        <div className="hero-copy">
          <div className="chapter-kicker">
            <span className="chapter-kicker__number">01</span>
            <span>初次见面</span>
            <span className="chapter-kicker__tag">HELLO, HUMAN</span>
          </div>

          <h1 id="intro-title" className="hero-title" aria-label="嘿，我是任博文" data-hero-title>
            <CharLine text="嘿，我是" className="hero-title__kicker" />
            <span className="hero-title__name-wrap" aria-hidden="true">
              <CharLine text="任博文" className="hero-title__name" />
              <span className="hero-title__underline" />
            </span>
          </h1>

          <div className={`found-line ${foundAll ? 'found-line--visible' : ''}`} role="status" aria-live="polite">
            好家伙，全被你找到了。
          </div>

          <p className="hero-lede">
            一边学机器学习，一边接点小单，还爱捣鼓 AI 视频。
            <strong>偶尔翻车，常常好玩。</strong>
          </p>

          <div className="hero-actions">
            <a
              className="text-link"
              href="#works"
              onClick={(event) => {
                event.preventDefault()
                scrollToSection('#works')
              }}
            >
              翻翻我的作品
              <span aria-hidden="true">↘</span>
            </a>
            <p className="hero-side-note">
              <span className="mono">NO. 01</span>
              一个不太正经，但做起事来很正经的人。
            </p>
          </div>
        </div>

        <div className="hero-media-column">
          <div className="hero-doodle hero-doodle--top" aria-hidden="true">
            <SparkIcon size={34} />
            <span>点我换脸</span>
          </div>

          <button
            ref={cardRef}
            type="button"
            className="hero-sticker sticker-card"
            onClick={cycleFace}
            aria-label={clickHint}
            aria-busy={!(posterReady && (hasStillFace || videoReady))}
            data-media-ready={posterReady && (hasStillFace || videoReady)}
            data-video-ready={videoReady}
          >
            <span ref={mediaRef} className="hero-sticker__media">
              {hasStillFace ? (
                <img
                  ref={posterRef}
                  key={visibleFace.src}
                  className="hero-sticker__face hero-sticker__face--enter"
                  src={visibleFace.src}
                  alt={visibleFace.alt}
                  width="1024"
                  height="1024"
                  draggable="false"
                  onLoad={() => setPosterReady(true)}
                />
              ) : (
                <>
                  <img
                    ref={posterRef}
                    className="hero-sticker__poster"
                    src={assets.front}
                    alt="任博文正面笑脸，戴着珊瑚红耳机"
                    width="1024"
                    height="1024"
                    draggable="false"
                    fetchPriority="high"
                    decoding="async"
                    onLoad={() => setPosterReady(true)}
                  />
                  <span className="hero-video-crop">
                    <video
                      ref={videoRef}
                      className={`hero-video ${videoReady ? 'is-ready' : ''}`}
                      src={assets.heroLoop}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      aria-label="任博文的动态循环头像"
                      onLoadedData={() => setVideoReady(true)}
                      onCanPlay={() => setVideoReady(true)}
                      onError={() => setVideoReady(false)}
                    />
                  </span>
                </>
              )}
              <span className="hero-sticker__grain" aria-hidden="true" />
            </span>

            <span className="hero-sticker__badge" aria-hidden="true">
              <span className="live-dot" />
              {hasStillFace ? visibleFace.label : 'LIVE / LOOP'}
            </span>
            <span className="hero-sticker__click-label" aria-hidden="true">
              {hasStillFace ? '再点一下' : 'CLICK MY FACE'}
            </span>
          </button>

          <p className="hero-caption">
            <span className="mono">BOWEN.exe</span>
            目前运行良好，偶尔需要咖啡。
          </p>
          <span className="sr-only" aria-live="polite">
            {hasStillFace ? `已切换到${visibleFace.label}` : ''}
          </span>
        </div>
      </div>

      <div className="hero-scroll-note" aria-hidden="true">
        <span>SCROLL</span>
        <span className="hero-scroll-note__line" />
        <span>往下逛</span>
      </div>
    </section>
  )
}



