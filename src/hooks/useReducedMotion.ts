import { useEffect, useState } from 'react'

const query = '(prefers-reduced-motion: reduce)'

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)

    setReduced(media.matches)
    media.addEventListener('change', onChange)

    return () => media.removeEventListener('change', onChange)
  }, [])

  return reduced
}
