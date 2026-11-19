import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SplitHeading } from './SplitText'
import { ArrowUpRightIcon, CloseIcon, SparkIcon } from './Icons'
import type { EasterEggId } from '../types'
import { assets } from '../lib/assets'

type ProjectsChapterProps = {
  modalOpen: boolean
  onModalOpenChange: (open: boolean) => void
  onUnlock: (egg: EasterEggId) => void
}

type ProjectPreview = 'rag' | 'dashboard' | 'portfolio'

const projects: Array<{
  index: string
  type: string
  title: string
  description: string
  href: string
  linkLabel: string
  preview: ProjectPreview
  fanClass: string
}> = [
  {
    index: '01',
    type: 'RAG / LIVE',
    title: '课程资料问答助手',
    description: '上传课件 PDF 就能问答的 RAG 应用，已上线。',
    href: 'https://ren-rag-pdf.streamlit.app/',
    linkLabel: '打开应用',
    preview: 'rag',
    fanClass: 'folder-project--left',
  },
  {
    index: '02',
    type: 'DATA / GITHUB',
    title: '中国人口数据仪表盘',
    description: '31 省 2010–2023 人口数据可视化。',
    href: 'https://github.com/bowenren-Andrew/china-population-dashboard',
    linkLabel: '查看仓库',
    preview: 'dashboard',
    fanClass: 'folder-project--center',
  },
  {
    index: '03',
    type: 'WEB / CLAY',
    title: '粘土风简历站',
    description: '这个网站的正经版哥哥。',
    href: 'https://renbowen.qzz.io/clay-portfolio/',
    linkLabel: '去串门',
    preview: 'portfolio',
    fanClass: 'folder-project--right',
  },
]

function ProjectPreviewArt({ type }: { type: ProjectPreview }) {
  if (type === 'rag') {
    return (
      <div className="project-preview project-preview--rag" aria-hidden="true">
        <span className="preview-window-bar">
          <i />
          <i />
          <i />
        </span>
        <span className="preview-chat preview-chat--question">PDF 里讲了什么？</span>
        <span className="preview-chat preview-chat--answer">
          <i />
          <i />
          <i />
        </span>
        <span className="preview-file-chip">3 files.pdf</span>
      </div>
    )
  }

  if (type === 'dashboard') {
    return (
      <div className="project-preview project-preview--dashboard" aria-hidden="true">
        <span className="preview-chart-title">POPULATION / 31</span>
        <span className="preview-chart">
          <i style={{ height: '32%' }} />
          <i style={{ height: '52%' }} />
          <i style={{ height: '44%' }} />
          <i style={{ height: '74%' }} />
          <i style={{ height: '62%' }} />
          <i style={{ height: '88%' }} />
        </span>
        <span className="preview-coordinate">104.1954° E</span>
      </div>
    )
  }

  return (
    <div className="project-preview project-preview--portfolio" aria-hidden="true">
      <span className="preview-clay-face">
        <i className="preview-clay-eye preview-clay-eye--left" />
        <i className="preview-clay-eye preview-clay-eye--right" />
        <i className="preview-clay-smile" />
      </span>
      <span className="preview-portfolio-title">REN / CV</span>
      <span className="preview-portfolio-line" />
      <span className="preview-portfolio-line preview-portfolio-line--short" />
    </div>
  )
}

export function ProjectsChapter({ modalOpen, onModalOpenChange, onUnlock }: ProjectsChapterProps) {
  const openerRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const [fileOpened, setFileOpened] = useState(false)

  useEffect(() => {
    if (!modalOpen) {
      return
    }

    const previousFocus = document.activeElement as HTMLElement | null
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 80)
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onModalOpenChange(false)
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hasAttribute('hidden'))

      if (focusable.length === 0) {
        event.preventDefault()
        dialogRef.current.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !dialogRef.current.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [modalOpen, onModalOpenChange])

  const openFile = () => {
    setFileOpened(true)
    onUnlock('file')
  }

  return (
    <section
      id="works"
      className="chapter chapter--works"
      aria-labelledby="works-title"
      data-chapter
      data-chapter-label="03 / 作品"
    >
      <div className="chapter-shell works-shell">
        <div className="chapter-kicker">
          <span className="chapter-kicker__number">03</span>
          <span>作品文件夹</span>
          <span className="chapter-kicker__tag">SELECTED, NOT ALL</span>
        </div>

        <div className="works-layout">
          <div className="works-portrait-column">
            <div className="sticker-card works-sticker">
              <img
                src={assets.laptop}
                alt="任博文抱着珊瑚红笔记本，笑得很得意"
                width="1024"
                height="1024"
                loading="lazy"
                decoding="async"
              />
              <span className="sticker-card__label">SHIPPING THINGS</span>
            </div>
            <p className="works-note">
              <span className="mono">C:\BOWEN\PROJECTS</span>
              有些东西上了线，有些东西还在我脑子里排队。
            </p>
          </div>

          <div className="works-content">
            <SplitHeading id="works-title" text="作品文件夹" className="section-title" />
            <p className="section-lede">
              点开这只橙色文件夹，里面有三张项目卡，还有一个不太听话的文件。
            </p>

            <button
              ref={openerRef}
              type="button"
              className="works-folder"
              onClick={() => onModalOpenChange(true)}
              aria-haspopup="dialog"
              aria-expanded={modalOpen}
              aria-label="打开作品文件夹，查看三个项目"
            >
              <span className="works-folder__tab">BOWEN_REN / SELECTED WORK</span>
              <span className="works-folder__paper works-folder__paper--one" aria-hidden="true" />
              <span className="works-folder__paper works-folder__paper--two" aria-hidden="true" />
              <span className="works-folder__front">
                <span className="works-folder__meta">
                  <span className="mono">ARCHIVE 2023—2026</span>
                  <span className="works-folder__count">3 + 1</span>
                </span>
                <span className="works-folder__title">
                  三个能跑的项目
                  <small>和一个不能点的文件</small>
                </span>
                <span className="works-folder__open">
                  OPEN FOLDER
                  <span aria-hidden="true">↗</span>
                </span>
              </span>
              <span className="works-folder__stamp" aria-hidden="true">
                <SparkIcon size={22} />
                CLICK
              </span>
            </button>

            <p className="folder-hint">
              <span className="mono">TIP:</span> 文件夹不会咬人，里面的 txt 可能会。
            </p>
          </div>
        </div>
      </div>
      <span className="chapter-watermark" aria-hidden="true">
        03
      </span>

      {modalOpen &&
        createPortal(
          <div
            className="folder-modal"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) {
                onModalOpenChange(false)
              }
            }}
          >
            <div
              ref={dialogRef}
              className="folder-window"
              role="dialog"
              aria-modal="true"
              aria-labelledby="folder-dialog-title"
              aria-describedby="folder-dialog-description"
              tabIndex={-1}
            >
              <div className="folder-window__chrome">
                <span className="window-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="folder-window__address mono">bowen://selected-work</span>
                <button
                  ref={closeButtonRef}
                  type="button"
                  className="folder-window__close"
                  onClick={() => onModalOpenChange(false)}
                  aria-label="关闭作品文件夹"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="folder-window__heading">
                <div>
                  <p className="mono">03 / SELECTED WORK</p>
                  <h2 id="folder-dialog-title">作品文件夹</h2>
                </div>
                <p id="folder-dialog-description">
                  三个做出来的东西。
                  <br />
                  都还算能跑。
                </p>
              </div>

              <div className="folder-fan" aria-label="项目列表">
                {projects.map((project) => (
                  <article className={`folder-project ${project.fanClass}`} key={project.title}>
                    <div className="folder-project__topline">
                      <span className="mono">{project.index}</span>
                      <span>{project.type}</span>
                    </div>
                    <ProjectPreviewArt type={project.preview} />
                    <div className="folder-project__body">
                      <h3>{project.title}</h3>
                      <p>{project.description}</p>
                      <a href={project.href} target="_blank" rel="noreferrer">
                        {project.linkLabel}
                        <ArrowUpRightIcon size={17} />
                      </a>
                    </div>
                  </article>
                ))}
              </div>

              <div className="folder-window__bottom">
                <button type="button" className="secret-file" onClick={openFile}>
                  <span className="secret-file__icon" aria-hidden="true">
                    TXT
                  </span>
                  <span className="secret-file__copy">
                    <strong>别点我.txt</strong>
                    <small>{fileOpened ? '好吧，你真点了。' : '1 KB · 字面意思'}</small>
                  </span>
                  {fileOpened && <span className="secret-file__stamp">FOUND</span>}
                </button>
                <p className="folder-window__note mono">ESC / 点空白 / 点 × 都能关门</p>
              </div>
              <span className="sr-only" aria-live="polite">
                {fileOpened ? '彩蛋已找到' : ''}
              </span>
            </div>
          </div>,
          document.body,
        )}
    </section>
  )
}

