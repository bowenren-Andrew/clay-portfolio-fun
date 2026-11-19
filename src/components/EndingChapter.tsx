import { SplitHeading } from './SplitText'
import { ArrowUpRightIcon, SparkIcon } from './Icons'
import { scrollToTop } from '../lib/smoothScroll'
import type { EasterEggId } from '../types'
import { assets } from '../lib/assets'

type EndingChapterProps = {
  onUnlock: (egg: EasterEggId) => void
}

export function EndingChapter({ onUnlock }: EndingChapterProps) {
  return (
    <section
      id="ending"
      className="chapter chapter--ending"
      aria-labelledby="ending-title"
      data-chapter
      data-chapter-label="05 / 无限可能"
    >
      <div className="ending-stars" aria-hidden="true">
        <SparkIcon size={34} />
        <SparkIcon size={18} />
        <SparkIcon size={26} />
      </div>
      <div className="chapter-shell ending-shell">
        <div className="ending-layout">
          <div className="ending-media-column">
            <div className="sticker-card ending-sticker">
              <div className="ending-sticker__image-wrap">
                <img
                  src={assets.shocked}
                  alt="任博文惊讶地睁大眼睛，戴着珊瑚红耳机"
                  width="1024"
                  height="1024"
                  loading="lazy"
                  decoding="async"
                />
                <button
                  type="button"
                  className="headphone-spot headphone-spot--left"
                  onClick={() => onUnlock('headphones')}
                  aria-label="点击左侧耳机，寻找隐藏彩蛋"
                />
                <button
                  type="button"
                  className="headphone-spot headphone-spot--right"
                  onClick={() => onUnlock('headphones')}
                  aria-label="点击右侧耳机，寻找隐藏彩蛋"
                />
              </div>
              <span className="sticker-card__label">WAIT, WHAT?</span>
            </div>
            <p className="ending-media-note mono">SOMETHING IS PLAYING... CAN YOU HEAR IT?</p>
          </div>

          <div className="ending-copy">
            <div className="chapter-kicker">
              <span className="chapter-kicker__number">05</span>
              <span>无限可能</span>
              <span className="chapter-kicker__tag">TO BE CONTINUED</span>
            </div>
            <SplitHeading id="ending-title" text="未完待续……" className="ending-title section-title" />
            <p className="ending-lede">
              现在这里的每一块粘土，都是下一步的草稿。
              <br />
              下一次见面，应该又多了一个能跑的新东西。
            </p>
            <button type="button" className="primary-button" onClick={scrollToTop}>
              回到开头，再玩一次
              <ArrowUpRightIcon size={19} />
            </button>

            <div className="ending-signoff">
              <span className="mono">EOF / BUT NOT REALLY</span>
              <span aria-hidden="true">↓</span>
            </div>
          </div>
        </div>

        <footer className="site-footer">
          <p>© 2026 任博文 · 本站由粘土、咖啡和一点点倔强驱动。</p>
          <p className="mono">BUILT WITH REACT, GSAP &amp; QUESTIONABLE SLEEP SCHEDULE</p>
        </footer>
      </div>
    </section>
  )
}

