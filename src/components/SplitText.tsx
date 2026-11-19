import type { CSSProperties } from 'react'

type CharLineProps = {
  text: string
  className?: string
}

export function CharLine({ text, className }: CharLineProps) {
  return (
    <span className={className} aria-hidden="true">
      {Array.from(text).map((char, index) => (
        <span
          className="char"
          key={`${char}-${index}`}
          style={{ '--char-index': index } as CSSProperties}
        >
          {char === ' ' ? '\u00a0' : char}
        </span>
      ))}
    </span>
  )
}

type SplitHeadingProps = {
  id: string
  text: string
  className?: string
}

export function SplitHeading({ id, text, className }: SplitHeadingProps) {
  return (
    <h2 id={id} className={className} aria-label={text} data-split-title>
      <CharLine text={text} className="split-line" />
    </h2>
  )
}
