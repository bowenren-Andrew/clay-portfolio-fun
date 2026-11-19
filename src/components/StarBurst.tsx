import { useMemo } from 'react'

export function StarBurst() {
  const stars = useMemo(
    () =>
      Array.from({ length: 48 }, (_, index) => ({
        left: (index * 37 + 3) % 101,
        delay: (index % 8) * 0.045,
        duration: 1.25 + (index % 5) * 0.12,
        drift: ((index % 11) - 5) * 2.3,
        size: 7 + (index % 4) * 3,
      })),
    [],
  )

  return (
    <div className="star-burst" aria-hidden="true">
      {stars.map((star, index) => (
        <span
          className="confetti-star"
          key={index}
          style={
            {
              '--star-left': `${star.left}vw`,
              '--star-delay': `${star.delay}s`,
              '--star-duration': `${star.duration}s`,
              '--star-drift': `${star.drift}vw`,
              '--star-size': `${star.size}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
