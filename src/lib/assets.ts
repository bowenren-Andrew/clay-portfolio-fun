const base = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`

export const assetPath = (filename: string) => `${base}assets/${filename}`

export const assets = {
  front: assetPath('avatar-fun-front.png'),
  laugh: assetPath('avatar-fun-laugh.png'),
  shocked: assetPath('avatar-fun-shocked.png'),
  side: assetPath('avatar-fun-side.png'),
  side34: assetPath('avatar-fun-side34.png'),
  presenter: assetPath('avatar-fun-presenter.png'),
  laptop: assetPath('avatar-fun-laptop.png'),
  heroLoop: assetPath('hero-loop.mp4'),
} as const
