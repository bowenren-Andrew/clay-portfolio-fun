import Lenis from 'lenis'

const expoOut = (time: number) => (time === 1 ? 1 : 1 - 2 ** (-10 * time))

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

let activeLenis: Lenis | null = null

export function registerSmoothScroll(lenis: Lenis) {
  activeLenis = lenis
}

export function releaseSmoothScroll(lenis: Lenis) {
  if (activeLenis === lenis) {
    activeLenis = null
  }
}

export function stopSmoothScroll() {
  activeLenis?.stop()
}

export function startSmoothScroll() {
  activeLenis?.start()
}

export function getScrollMax() {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
}

export function seekToPercent(percent: number, immediate = true) {
  const target = (Math.max(0, Math.min(100, percent)) / 100) * getScrollMax()

  if (activeLenis) {
    activeLenis.scrollTo(target, {
      duration: immediate ? 0 : 1.15,
      immediate,
      force: true,
      easing: expoOut,
    })
    return
  }

  window.scrollTo({ top: target, behavior: immediate || prefersReducedMotion() ? 'auto' : 'smooth' })
}

export function scrollToSection(selector: string) {
  const target = document.querySelector<HTMLElement>(selector)

  if (!target) {
    return
  }

  if (activeLenis) {
    activeLenis.scrollTo(target, { duration: 1.25, easing: expoOut })
    return
  }

  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
}

export function scrollToTop() {
  if (activeLenis) {
    activeLenis.scrollTo(0, { duration: 1.35, easing: expoOut })
    return
  }

  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

