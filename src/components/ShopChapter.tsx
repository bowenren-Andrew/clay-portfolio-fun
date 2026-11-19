import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitHeading } from './SplitText'
import { BadmintonDoodle, CoffeeFilmDoodle, ValorantDoodle } from './GroceryIllustrations'
import { assets } from '../lib/assets'

gsap.registerPlugin(ScrollTrigger)

type ShopChapterProps = {
  reducedMotion: boolean
}

const categories = ['全部', '技能', '工具', '爱好'] as const

export function ShopChapter({ reducedMotion }: ShopChapterProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [activeCard, setActiveCard] = useState(0)
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>('全部')
  const activeCardRef = useRef(0)

  const updateActiveCard = (nextIndex: number) => {
    const safeIndex = Math.max(0, Math.min(4, nextIndex))

    if (safeIndex === activeCardRef.current) {
      return
    }

    activeCardRef.current = safeIndex
    setActiveCard(safeIndex)
  }

  useLayoutEffect(() => {
    const section = sectionRef.current

    if (!section) {
      return
    }

    const cards = Array.from(section.querySelectorAll<HTMLElement>('[data-grocery-card]'))
    const media = gsap.matchMedia()
    let cleanupNative = () => undefined

    media.add('(min-width: 768px)', () => {
      const shopWindow = section.querySelector<HTMLElement>('.shop-window')
      const track = section.querySelector<HTMLElement>('.shop-track')

      if (!shopWindow || !track) {
        return
      }

      if (reducedMotion) {
        let frame = 0
        const onScroll = () => {
          cancelAnimationFrame(frame)
          frame = requestAnimationFrame(() => {
            const max = Math.max(1, shopWindow.scrollWidth - shopWindow.clientWidth)
            updateActiveCard(Math.round((shopWindow.scrollLeft / max) * (cards.length - 1)))
          })
        }

        shopWindow.addEventListener('scroll', onScroll, { passive: true })
        cleanupNative = () => {
          cancelAnimationFrame(frame)
          shopWindow.removeEventListener('scroll', onScroll)
        }

        return cleanupNative
      }

      const getDistance = () => Math.max(0, track.scrollWidth - shopWindow.clientWidth)

      if (getDistance() <= 0) {
        return
      }

      const horizontalTween = gsap.to(track, {
        x: () => -getDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${getDistance() + window.innerHeight * 0.35}`,
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            updateActiveCard(Math.round(self.progress * (cards.length - 1)))
          },
        },
      })

      return () => {
        horizontalTween.scrollTrigger?.kill()
        horizontalTween.kill()
        gsap.set(track, { clearProps: 'transform' })
      }
    })

    media.add('(max-width: 767px)', () => {
      let frame = 0

      const updateFromViewport = () => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => {
          const center = window.innerHeight * 0.53
          let closestIndex = 0
          let closestDistance = Number.POSITIVE_INFINITY

          cards.forEach((card, index) => {
            const rect = card.getBoundingClientRect()
            const cardCenter = rect.top + rect.height / 2
            const distance = Math.abs(cardCenter - center)

            if (distance < closestDistance) {
              closestDistance = distance
              closestIndex = index
            }
          })

          updateActiveCard(closestIndex)
        })
      }

      window.addEventListener('scroll', updateFromViewport, { passive: true })
      window.addEventListener('resize', updateFromViewport)
      updateFromViewport()

      return () => {
        cancelAnimationFrame(frame)
        window.removeEventListener('scroll', updateFromViewport)
        window.removeEventListener('resize', updateFromViewport)
      }
    })

    requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => {
      cleanupNative()
      media.revert()
      activeCardRef.current = 0
    }
  }, [reducedMotion])

  return (
    <section
      ref={sectionRef}
      id="groceries"
      className="chapter chapter--shop"
      aria-labelledby="shop-title"
      data-chapter
      data-chapter-label="04 / 杂货铺"
    >
      <div className="chapter-shell shop-shell">
        <div className="shop-heading-row">
          <div className="shop-heading-copy">
            <div className="chapter-kicker">
              <span className="chapter-kicker__number">04</span>
              <span>杂货铺</span>
              <span className="chapter-kicker__tag">MISCELLANEOUS JOY</span>
            </div>
            <SplitHeading id="shop-title" text="杂货铺" className="section-title section-title--shop" />
            <p className="section-lede">一些正经技能，一些不正经爱好。都放在这排货架上。</p>
          </div>

          <div className="shop-counter" aria-live="polite" aria-atomic="true">
            <span className="mono">SHELF ITEM</span>
            <strong>
              {String(activeCard + 1).padStart(2, '0')} <span>/ 05</span>
            </strong>
          </div>
        </div>

        <div className="shop-toolbar">
          <div className="category-pills" role="group" aria-label="杂货分类，仅作视觉高亮">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                className={`category-pill ${activeCategory === category ? 'is-active' : ''}`}
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <span className="pill-note mono">FILTER IS A LIE, SCROLL INSTEAD</span>
        </div>

        <div className="shop-window">
          <div className="shop-track">
            <article className="grocery-card grocery-card--skill" data-grocery-card>
              <div className="grocery-card__topline">
                <span className="grocery-card__tag">技能</span>
                <span className="grocery-card__number mono">01</span>
              </div>
              <div className="grocery-card__content grocery-card__content--split">
                <div>
                  <h3 className="skill-card-title">Python 与<br />机器学习</h3>
                  <p>正在系统学习，目标 PyTorch。</p>
                </div>
                <div className="mini-sticker mini-sticker--side34">
                  <img
                    src={assets.side34}
                    alt="任博文的三分之四侧面头像"
                    width="1024"
                    height="1024"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
              <div className="grocery-card__footer">
                <span className="mono">CURRENTLY LEARNING</span>
                <span className="grocery-progress" aria-hidden="true"><i /></span>
              </div>
            </article>

            <article className="grocery-card grocery-card--tools" data-grocery-card>
              <div className="grocery-card__topline">
                <span className="grocery-card__tag">工具</span>
                <span className="grocery-card__number mono">02</span>
              </div>
              <div className="grocery-card__content grocery-card__content--split">
                <div>
                  <h3>我的 AI 搭子们</h3>
                  <p>Codex、DSH、Muse，干活主力。</p>
                  <ul className="ai-friends" aria-label="AI 搭子">
                    <li>CODEX</li>
                    <li>DSH</li>
                    <li>MUSE</li>
                  </ul>
                </div>
                <div className="mini-sticker mini-sticker--side">
                  <img
                    src={assets.side}
                    alt="任博文的全侧面头像"
                    width="1024"
                    height="1024"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
              <div className="grocery-card__footer">
                <span className="mono">TEAM, BUT MAKE IT BOTS</span>
                <span className="grocery-card__stamp">×3</span>
              </div>
            </article>

            <article className="grocery-card grocery-card--badminton" data-grocery-card>
              <div className="grocery-card__topline">
                <span className="grocery-card__tag">爱好</span>
                <span className="grocery-card__number mono">03</span>
              </div>
              <div className="grocery-card__content grocery-card__content--centered">
                <BadmintonDoodle />
                <div>
                  <h3>羽毛球</h3>
                  <p>一周一次，菜但爱打。</p>
                </div>
              </div>
              <div className="grocery-card__footer">
                <span className="mono">WEEKLY RITUAL</span>
                <span className="grocery-card__stamp">1×</span>
              </div>
            </article>

            <article className="grocery-card grocery-card--valorant" data-grocery-card>
              <div className="grocery-card__topline">
                <span className="grocery-card__tag">爱好</span>
                <span className="grocery-card__number mono">04</span>
              </div>
              <div className="grocery-card__content grocery-card__content--centered">
                <ValorantDoodle />
                <div>
                  <h3>无畏契约</h3>
                  <p>放松的时候来两局。</p>
                </div>
              </div>
              <div className="grocery-card__footer">
                <span className="mono">ONE MORE ROUND</span>
                <span className="grocery-card__stamp">2×</span>
              </div>
            </article>

            <article className="grocery-card grocery-card--coffee" data-grocery-card>
              <div className="grocery-card__topline">
                <span className="grocery-card__tag">爱好</span>
                <span className="grocery-card__number mono">05</span>
              </div>
              <div className="grocery-card__content grocery-card__content--centered">
                <CoffeeFilmDoodle />
                <div>
                  <h3>手磨咖啡与电影</h3>
                  <p>充电方式。</p>
                </div>
              </div>
              <div className="grocery-card__footer">
                <span className="mono">REFILL THE BATTERY</span>
                <span className="grocery-card__stamp">∞</span>
              </div>
            </article>
          </div>
        </div>
        <div className="shop-scroll-hint" aria-hidden="true">
          <span className="mono">KEEP SCROLLING</span>
          <span>→</span>
        </div>
      </div>
      <span className="chapter-watermark" aria-hidden="true">
        04
      </span>
    </section>
  )
}



