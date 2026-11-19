type IconProps = {
  size?: number
  className?: string
}

export function PauseIcon({ size = 18, className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 5v14M16 5v14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

export function PlayIcon({ size = 18, className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m8 5 11 7-11 7V5Z" fill="currentColor" />
    </svg>
  )
}

export function CloseIcon({ size = 22, className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export function ArrowUpRightIcon({ size = 18, className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SparkIcon({ size = 24, className }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 2c.9 8.2 5.8 13.1 14 14-8.2.9-13.1 5.8-14 14-.9-8.2-5.8-13.1-14-14C10.2 15.1 15.1 10.2 16 2Z" fill="currentColor" />
    </svg>
  )
}
