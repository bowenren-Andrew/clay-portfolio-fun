import { spawn } from 'node:child_process'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { setTimeout as delay } from 'node:timers/promises'

const chromePath = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const baseUrl = process.env.VERIFY_URL ?? 'http://127.0.0.1:4175/clay-portfolio-fun/'
const normalizedBasePath = new URL(baseUrl).pathname
const siteBasePath = normalizedBasePath.endsWith('/') ? normalizedBasePath : `${normalizedBasePath}/`
const assetBasePath = `${siteBasePath}assets/`
const artifactDir = path.resolve('artifacts', 'ui-check')
const profileDir = path.join(tmpdir(), `clay-portfolio-chrome-${process.pid}-${Date.now()}`)
const port = Number(process.env.CDP_PORT ?? 9333)
const checks = []
const consoleErrors = []
const requiredAssets = [
  'avatar-fun-front.png',
  'avatar-fun-laugh.png',
  'avatar-fun-shocked.png',
  'avatar-fun-side.png',
  'avatar-fun-side34.png',
  'avatar-fun-presenter.png',
  'avatar-fun-laptop.png',
  'hero-loop.mp4',
]
const shopFilterCases = [
  {
    category: '技能',
    titles: ['Python 与机器学习'],
    total: 1,
    expectPinned: false,
  },
  {
    category: '工具',
    titles: ['我的 AI 搭子们'],
    total: 1,
    expectPinned: false,
  },
  {
    category: '爱好',
    titles: ['羽毛球', '无畏契约', '手磨咖啡与电影'],
    total: 3,
    expectPinned: true,
  },
  {
    category: '全部',
    titles: ['Python 与机器学习', '我的 AI 搭子们', '羽毛球', '无畏契约', '手磨咖啡与电影'],
    total: 5,
    expectPinned: true,
  },
]

await mkdir(artifactDir, { recursive: true })

function record(name, passed, detail) {
  checks.push({ name, passed, detail })
  const marker = passed ? 'PASS' : 'FAIL'
  console.log(`${marker} ${name}${detail ? `: ${detail}` : ''}`)
}

function assertCheck(name, condition, detail) {
  record(name, Boolean(condition), detail)
  if (!condition) {
    throw new Error(`Check failed: ${name}${detail ? ` (${detail})` : ''}`)
  }
}

function near(actual, expected, tolerance = 1) {
  return Math.abs(actual - expected) <= tolerance
}

const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    '--window-size=1440,900',
    'about:blank',
  ],
  { stdio: 'ignore', windowsHide: true },
)

async function waitForEndpoint() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`)

      if (response.ok) {
        return await response.json()
      }
    } catch {
      // Chrome is still starting.
    }

    await delay(150)
  }

  throw new Error('Chrome DevTools endpoint did not become available')
}

const targets = await waitForEndpoint()
const pageTarget = targets.find((target) => target.type === 'page')

if (!pageTarget) {
  throw new Error('No Chrome page target found')
}

const socket = new WebSocket(pageTarget.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

let nextId = 1
const pending = new Map()

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)

  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id)
    pending.delete(message.id)

    if (message.error) {
      reject(new Error(`${message.error.message} (${message.error.code})`))
    } else {
      resolve(message.result)
    }
    return
  }

  if (message.method === 'Runtime.exceptionThrown') {
    const description = message.params.exceptionDetails?.exception?.description
    consoleErrors.push(description ?? message.params.exceptionDetails?.text ?? 'Unknown exception')
  }

  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
    consoleErrors.push(message.params.entry.text)
  }
})

function send(method, params = {}) {
  const id = nextId
  nextId += 1

  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params }))
  })
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  })

  if (result.exceptionDetails) {
    const description = result.exceptionDetails.exception?.description
    const location =
      result.exceptionDetails.lineNumber != null
        ? `${result.exceptionDetails.lineNumber + 1}:${(result.exceptionDetails.columnNumber ?? 0) + 1}`
        : null
    throw new Error([result.exceptionDetails.text, location, description].filter(Boolean).join('\n') || 'Runtime.evaluate failed')
  }

  return result.result.value
}

async function waitForReady({ requireAssets = true } = {}) {
  const state = await evaluate(`(async () => {
    if (document.fonts?.ready) await document.fonts.ready;

    if (${requireAssets ? 'true' : 'false'}) {
      const readyDeadline = performance.now() + 15000;
      while (performance.now() < readyDeadline) {
        if (document.documentElement.dataset.assetsReady === 'true') break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const titleDeadline = performance.now() + 5000;
      while (performance.now() < titleDeadline) {
        const chars = Array.from(document.querySelectorAll('[data-hero-title] .char'));
        if (chars.length > 0 && chars.every((char) => Number(getComputedStyle(char).opacity) >= 0.99)) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      await new Promise((resolve) => setTimeout(resolve, 650));
    } else {
      await new Promise((resolve) => setTimeout(resolve, 900));
    }

    const chars = Array.from(document.querySelectorAll('[data-hero-title] .char'));
    return {
      assetsReady: document.documentElement.dataset.assetsReady ?? null,
      heroMediaReady: document.documentElement.dataset.heroMediaReady ?? null,
      titleReady: document.documentElement.dataset.titleReady ?? null,
      titleOpacities: chars.map((char) => Number(getComputedStyle(char).opacity)),
    };
  })()`)

  if (requireAssets) {
    assertCheck(
      'Page reaches media and title ready state before screenshots',
      state.assetsReady === 'true' &&
        state.heroMediaReady === 'true' &&
        state.titleReady === 'true' &&
        state.titleOpacities.length > 0 &&
        state.titleOpacities.every((opacity) => opacity >= 0.99),
      JSON.stringify(state),
    )
  }

  return state
}

async function navigate(width, height, mobile = false, { requireAssets = true } = {}) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  })
  await send('Emulation.setTouchEmulationEnabled', {
    enabled: mobile,
    maxTouchPoints: mobile ? 5 : 1,
  })
  await send('Page.navigate', { url: baseUrl })
  await waitForReady({ requireAssets })
}

async function screenshot(name) {
  const result = await send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  })
  const outputPath = path.join(artifactDir, name)
  await writeFile(outputPath, Buffer.from(result.data, 'base64'))
  return outputPath
}

async function scrollToSection(id) {
  await evaluate(`(() => {
    const target = document.getElementById(${JSON.stringify(id)});
    if (!target) throw new Error('Missing section: ' + ${JSON.stringify(id)});
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
    return true;
  })()`)
  await delay(900)
}

async function getLayoutMetrics(id) {
  return evaluate(`(() => {
    const section = document.getElementById(${JSON.stringify(id)});
    const bar = document.querySelector('.playback-bar')?.getBoundingClientRect();
    const range = document.querySelector('.playback-progress input');
    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      bodyScrollWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      scrollY: window.scrollY,
      sectionTop: section?.getBoundingClientRect().top ?? null,
      sectionHeight: section?.getBoundingClientRect().height ?? null,
      barTop: bar?.top ?? null,
      barBottom: bar?.bottom ?? null,
      rangeValue: range ? Number(range.value) : null,
      activeChapter: document.querySelector('.playback-chapter strong')?.textContent?.trim() ?? null,
      pinSpacers: document.querySelectorAll('.pin-spacer').length,
      sections: Array.from(document.querySelectorAll('[data-chapter]')).map((item) => ({
        id: item.id,
        top: item.getBoundingClientRect().top,
        height: item.getBoundingClientRect().height,
      })),
    };
  })()`)
}

async function pressEscape() {
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
    nativeVirtualKeyCode: 27,
  })
  await send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
    nativeVirtualKeyCode: 27,
  })
  await delay(250)
}

async function clickAt(x, y) {
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 })
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 })
  await delay(250)
}

async function setRangeValue(value) {
  await evaluate(`(() => {
    const input = document.querySelector('.playback-progress input');
    if (!input) throw new Error('Range input missing');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, ${JSON.stringify(String(value))});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`)
  await delay(700)
}

async function clickShopCategory(category) {
  const clicked = await evaluate(`(() => {
    const button = Array.from(document.querySelectorAll('.category-pill'))
      .find((item) => item.getAttribute('data-shop-category') === ${JSON.stringify(category)});
    if (!button) throw new Error('Missing shop category: ' + ${JSON.stringify(category)});
    button.click();
    return true;
  })()`)
  await delay(1150)
  return clicked
}

async function readShopFilterState() {
  return evaluate(`(() => {
    const cards = Array.from(document.querySelectorAll('[data-grocery-card]'));
    const visibleCards = cards.filter((card) =>
      !card.hidden &&
      getComputedStyle(card).display !== 'none' &&
      card.getClientRects().length > 0,
    );
    const hiddenCardsStillLaidOut = cards.filter((card) =>
      card.hidden && getComputedStyle(card).display !== 'none',
    ).length;
    const counterText = document.querySelector('.shop-counter strong')?.textContent?.replace(/\\s+/g, ' ').trim() ?? '';
    const counterMatch = counterText.match(/(\\d+)\\s*\\/\\s*(\\d+)/);
    const track = document.querySelector('.shop-track');
    const trackTransform = track ? getComputedStyle(track).transform : 'none';
    const shopWindow = document.querySelector('.shop-window');
    const shopWindowRect = shopWindow?.getBoundingClientRect();
    const lastCardRect = visibleCards.at(-1)?.getBoundingClientRect();
    let trackX = null;

    if (trackTransform !== 'none') {
      trackX = new DOMMatrixReadOnly(trackTransform).m41;
    }

    return {
      activeCategory: document.querySelector('.category-pill.is-active')?.textContent?.trim() ?? null,
      visibleTitles: visibleCards.map((card) => card.querySelector('h3')?.textContent?.replace(/\\s+/g, ' ').trim() ?? ''),
      cardCount: cards.length,
      visibleCount: visibleCards.length,
      hiddenCardsStillLaidOut,
      counterText,
      counterCurrent: counterMatch ? Number(counterMatch[1]) : null,
      counterTotal: counterMatch ? Number(counterMatch[2]) : null,
      pageOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      bodyScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      shopPinned: Boolean(document.querySelector('#groceries')?.closest('.pin-spacer')),
      trackX,
      trackTransform,
      shopWindowScrollable: shopWindow ? Math.max(0, shopWindow.scrollWidth - shopWindow.clientWidth) : null,
      lastCardRightGap: shopWindowRect && lastCardRect ? shopWindowRect.right - lastCardRect.right : null,
      note: document.querySelector('.pill-note')?.textContent?.trim() ?? '',
      hasFalseFilterCopy: document.body.innerText.includes('FILTER IS A LIE'),
      groupLabel: document.querySelector('.category-pills')?.getAttribute('aria-label') ?? '',
      pressedButtons: Array.from(document.querySelectorAll('.category-pill[aria-pressed="true"]')).map((button) => button.textContent?.trim() ?? ''),
    };
  })()`)
}

async function assertShopFilter(label, testCase, { expectPinned = testCase.expectPinned, requireStart = false } = {}) {
  const state = await readShopFilterState()
  assertCheck(
    `${label} ${testCase.category} shows exactly the expected cards`,
    JSON.stringify(state.visibleTitles) === JSON.stringify(testCase.titles) &&
      state.visibleCount === testCase.total &&
      state.activeCategory === testCase.category &&
      JSON.stringify(state.pressedButtons) === JSON.stringify([testCase.category]) &&
      state.hiddenCardsStillLaidOut === 0,
    JSON.stringify(state),
  )
  assertCheck(
    `${label} ${testCase.category} counter uses the visible-set denominator`,
    state.counterTotal === testCase.total && state.counterCurrent >= 1 && state.counterCurrent <= testCase.total,
    JSON.stringify(state),
  )
  assertCheck(
    `${label} ${testCase.category} keeps the page free of horizontal overflow`,
    !state.pageOverflow,
    `scrollWidth=${state.bodyScrollWidth}; viewport=${state.viewportWidth}`,
  )
  assertCheck(
    `${label} ${testCase.category} uses the expected pin state`,
    state.shopPinned === expectPinned,
    JSON.stringify({ shopPinned: state.shopPinned, expected: expectPinned, trackX: state.trackX }),
  )

  if (requireStart) {
    assertCheck(
      `${label} ${testCase.category} resets the shelf to its first item`,
      state.counterCurrent === 1 && (state.trackX === null || Math.abs(state.trackX) <= 2),
      JSON.stringify({ counterCurrent: state.counterCurrent, trackX: state.trackX }),
    )
  }

  return state
}

async function scrollShopToPinEnd() {
  const layout = await evaluate(`(() => {
    const section = document.querySelector('#groceries');
    const spacer = section?.closest('.pin-spacer');
    if (!spacer) return { pinned: false };
    const start = spacer.getBoundingClientRect().top + window.scrollY;
    const end = start + spacer.offsetHeight - window.innerHeight;
    window.scrollTo({ top: end, left: 0, behavior: 'instant' });
    return { pinned: true, start, end, spacerHeight: spacer.offsetHeight };
  })()`)
  await delay(1200)
  return layout
}

async function scrollShopWindowToEnd() {
  const state = await evaluate(`(() => {
    const shopWindow = document.querySelector('.shop-window');
    if (!shopWindow) throw new Error('Missing shop window');
    shopWindow.scrollTo({ left: shopWindow.scrollWidth, behavior: 'instant' });
    shopWindow.dispatchEvent(new Event('scroll'));
    return {
      scrollLeft: shopWindow.scrollLeft,
      max: Math.max(0, shopWindow.scrollWidth - shopWindow.clientWidth),
    };
  })()`)
  await delay(500)
  return state
}

async function assertDistAssets() {
  const rows = []

  for (const filename of requiredAssets) {
    try {
      const fileStat = await stat(path.resolve('dist', 'assets', filename))
      rows.push({ filename, bytes: fileStat.size, present: fileStat.isFile() })
    } catch (error) {
      rows.push({ filename, present: false, error: error instanceof Error ? error.message : String(error) })
    }
  }

  const failed = rows.filter((row) => !row.present || row.bytes <= 0)
  assertCheck(
    'dist/assets contains all eight media assets',
    failed.length === 0,
    failed.length === 0 ? rows.map((row) => `${row.filename}:${row.bytes}`).join(', ') : JSON.stringify(failed),
  )
}

async function assertAssetHttpResponses() {
  const rows = []

  for (const filename of requiredAssets) {
    try {
      const url = new URL(`${assetBasePath}${filename}`, baseUrl).href
      const response = await fetch(url, { cache: 'no-store' })
      const body = await response.arrayBuffer()
      rows.push({
        url: `${assetBasePath}${filename}`,
        status: response.status,
        contentType: response.headers.get('content-type'),
        bytes: body.byteLength,
      })
    } catch (error) {
      rows.push({
        url: `${assetBasePath}${filename}`,
        status: null,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const failed = rows.filter((row) => row.status !== 200 || row.bytes <= 0)
  assertCheck(
    'All eight asset URLs return HTTP 200 with content',
    failed.length === 0,
    failed.length === 0 ? rows.map((row) => `${row.url}:${row.status}:${row.bytes}B`).join(', ') : JSON.stringify(failed),
  )
}

async function assertRenderedImageIntegrity(label) {
  const state = await evaluate(`(async () => {
    const images = Array.from(document.images);
    for (const image of images) {
      image.loading = 'eager';
    }

    await Promise.all(images.map(async (image) => {
      if (image.complete) {
        if (image.naturalWidth > 0) {
          try { await image.decode(); } catch { /* captured below */ }
        }
        return;
      }

      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 8000);
        const finish = () => {
          clearTimeout(timer);
          resolve();
        };
        image.addEventListener('load', finish, { once: true });
        image.addEventListener('error', finish, { once: true });
      });

      try { await image.decode(); } catch { /* captured below */ }
    }));

    return images.map((image) => {
      const src = image.getAttribute('src');
      const style = getComputedStyle(image);
      const rect = image.getBoundingClientRect();
      const filename = src?.startsWith(${JSON.stringify(assetBasePath)}) ? src.slice(${JSON.stringify(assetBasePath)}.length) : null;
      return {
        src,
        alt: image.getAttribute('alt'),
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        pathIsSiteAsset: Boolean(src?.startsWith(${JSON.stringify(assetBasePath)})),
        pathHasPublicPrefix: Boolean(src?.includes('/public/')),
        knownAsset: Boolean(filename && ${JSON.stringify(requiredAssets)}.includes(filename)),
        opacity: Number(style.opacity),
        display: style.display,
        rect: { width: rect.width, height: rect.height, top: rect.top, left: rect.left },
      };
    });
  })()`)

  const failed = state.filter(
    (image) =>
      !image.complete ||
      image.naturalWidth <= 0 ||
      image.naturalHeight <= 0 ||
      !image.alt?.trim() ||
      !image.pathIsSiteAsset ||
      image.pathHasPublicPrefix ||
      !image.knownAsset ||
      image.opacity <= 0 ||
      image.display === 'none',
  )

  assertCheck(
    `${label} every rendered img is decoded and uses the site asset path`,
    state.length > 0 && failed.length === 0,
    failed.length === 0 ? `${state.length} images decoded` : JSON.stringify(failed),
  )
}

async function assertVideoFrame(label) {
  const state = await evaluate(`(async () => {
    const video = document.querySelector('.hero-video');
    if (!video) return { found: false };

    const readyDeadline = performance.now() + 8000;
    while (video.readyState < 2 && performance.now() < readyDeadline) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    try { await video.play(); } catch { /* readyState and frame are checked below */ }

    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 96;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    let minLuminance = 255;
    let maxLuminance = 0;
    let opaquePixels = 0;
    const sampleDeadline = performance.now() + 3000;

    while (performance.now() < sampleDeadline) {
      if (video.readyState >= 2 && video.videoWidth > 0 && context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        minLuminance = 255;
        maxLuminance = 0;
        opaquePixels = 0;

        for (let index = 0; index < pixels.length; index += 4) {
          const alpha = pixels[index + 3];
          if (alpha > 0) opaquePixels += 1;
          const luminance = Math.round(pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722);
          minLuminance = Math.min(minLuminance, luminance);
          maxLuminance = Math.max(maxLuminance, luminance);
        }

        if (opaquePixels > 1000 && maxLuminance - minLuminance >= 18) break;
      }

      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    const style = getComputedStyle(video);
    const rect = video.getBoundingClientRect();
    return {
      found: true,
      src: video.getAttribute('src'),
      readyState: video.readyState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      currentTime: video.currentTime,
      paused: video.paused,
      opacity: Number(style.opacity),
      rect: { width: rect.width, height: rect.height, top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right },
      frame: {
        opaquePixels,
        luminanceRange: maxLuminance - minLuminance,
        minLuminance,
        maxLuminance,
      },
    };
  })()`)

  assertCheck(
    `${label} video is ready, visible, and draws a non-blank frame`,
    state.found &&
      state.src === `${assetBasePath}hero-loop.mp4` &&
      state.readyState >= 2 &&
      state.videoWidth === 768 &&
      state.videoHeight === 768 &&
      state.opacity >= 0.99 &&
      state.rect.width > 100 &&
      state.rect.height > 100 &&
      state.frame.opaquePixels > 1000 &&
      state.frame.luminanceRange >= 18,
    JSON.stringify(state),
  )
}

async function assertHeroTitle(label) {
  const state = await evaluate(`(() => {
    const title = document.querySelector('[data-hero-title]');
    const chars = Array.from(document.querySelectorAll('[data-hero-title] .char'));
    const rect = title?.getBoundingClientRect();
    return {
      found: Boolean(title),
      text: title?.textContent?.replace(/\\s+/g, '') ?? '',
      ariaLabel: title?.getAttribute('aria-label'),
      charCount: chars.length,
      opacities: chars.map((char) => Number(getComputedStyle(char).opacity)),
      rect: rect ? { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height } : null,
      viewport: { width: innerWidth, height: innerHeight },
    };
  })()`)

  assertCheck(
    `${label} hero title is visible after character animation`,
    state.found &&
      state.text === '嘿，我是任博文' &&
      state.ariaLabel === '嘿，我是任博文' &&
      state.charCount >= 6 &&
      state.opacities.every((opacity) => opacity >= 0.99) &&
      state.rect.width > 0 &&
      state.rect.height > 0 &&
      state.rect.bottom > 0 &&
      state.rect.top < state.viewport.height,
    JSON.stringify(state),
  )
}

async function assertAvatarVisible(label, selector, { video = false } = {}) {
  const state = await evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return { found: false, selector: ${JSON.stringify(selector)} };
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const bar = document.querySelector('.playback-bar')?.getBoundingClientRect();
    const visibleWidth = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
    const visibleHeight = Math.max(0, Math.min(rect.bottom, bar?.top ?? innerHeight) - Math.max(rect.top, 0));
    return {
      found: true,
      selector: ${JSON.stringify(selector)},
      opacity: Number(style.opacity),
      display: style.display,
      visibility: style.visibility,
      naturalWidth: element instanceof HTMLImageElement ? element.naturalWidth : element.videoWidth,
      naturalHeight: element instanceof HTMLImageElement ? element.naturalHeight : element.videoHeight,
      rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height },
      visibleCoverage: rect.width > 0 && rect.height > 0 ? (visibleWidth * visibleHeight) / (rect.width * rect.height) : 0,
      viewport: { width: innerWidth, height: innerHeight },
      isVideo: element instanceof HTMLVideoElement,
    };
  })()`)

  assertCheck(
    `${label} avatar body is visibly rendered above the playback bar`,
    state.found &&
      state.isVideo === Boolean(video) &&
      state.naturalWidth > 0 &&
      state.naturalHeight > 0 &&
      state.opacity > 0.1 &&
      state.display !== 'none' &&
      state.visibility !== 'hidden' &&
      state.rect.width >= 80 &&
      state.rect.height >= 80 &&
      state.visibleCoverage >= 0.45,
    JSON.stringify(state),
  )
}

async function primeLazyImages() {
  await evaluate(`(() => {
    for (const image of document.images) image.loading = 'eager';
    return true;
  })()`)
  await delay(150)
}

try {
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Log.enable')
  await send('Emulation.setEmulatedMedia', { features: [] })

  await assertDistAssets()
  await assertAssetHttpResponses()

  await navigate(1440, 900, false)
  assertCheck(
    'Desktop app rendered with five chapters',
    (await evaluate(`document.querySelectorAll('[data-chapter]').length`)) === 5,
  )
  await primeLazyImages()
  await assertHeroTitle('Desktop')
  await assertRenderedImageIntegrity('Desktop')
  const initialAltState = await evaluate(`Array.from(document.images).map((image) => image.getAttribute('alt')?.trim() ?? '')`)
  const expectedInitialAlts = [
    '任博文正面笑脸，戴着珊瑚红耳机',
    '任博文伸出手指讲解的黏土形象',
    '任博文抱着珊瑚红笔记本的黏土形象',
    '任博文四分之三侧面头像',
    '任博文全侧面头像',
    '任博文惊讶地睁大眼睛的黏土形象',
  ]
  const invalidAltFragments = ['定妆正面', '三分之四', '摊上珊瑚红', '煤炭风']
  assertCheck(
    'Initial rendered image alt text matches the audited copy',
    JSON.stringify(initialAltState) === JSON.stringify(expectedInitialAlts) &&
      initialAltState.every((alt) => !invalidAltFragments.some((fragment) => alt.includes(fragment))),
    JSON.stringify(initialAltState),
  )
  const initialFoundLine = await evaluate(`(() => {
    const line = document.querySelector('.found-line');
    return {
      text: line?.textContent?.trim() ?? '',
      visibleClass: line?.classList.contains('found-line--visible') ?? false,
      opacity: line ? Number(getComputedStyle(line).opacity) : null,
      role: line?.getAttribute('role'),
    };
  })()`)
  assertCheck(
    'Completion line contains no text before 3/3',
    initialFoundLine.text === '' && !initialFoundLine.visibleClass && initialFoundLine.opacity === 0 && initialFoundLine.role === 'status',
    JSON.stringify(initialFoundLine),
  )
  await assertVideoFrame('Desktop')
  await assertAvatarVisible('Desktop intro', '.hero-video', { video: true })

  const heroState = await evaluate(`(() => {
    const crop = document.querySelector('.hero-video-crop');
    const video = document.querySelector('.hero-video');
    const card = document.querySelector('.hero-sticker');
    const cropRect = crop?.getBoundingClientRect();
    const videoRect = video?.getBoundingClientRect();
    return {
      videoAutoplay: video?.autoplay,
      videoMuted: video?.muted,
      videoLoop: video?.loop,
      videoPaused: video?.paused,
      cropOverflow: crop ? getComputedStyle(crop).overflow : null,
      objectPosition: video ? getComputedStyle(video).objectPosition : null,
      videoHeightRatio: cropRect && videoRect ? videoRect.height / cropRect.height : null,
      cardShadow: card ? getComputedStyle(card).boxShadow : null,
      cardTransform: card ? getComputedStyle(card).transform : null,
    };
  })()`)
  assertCheck('Hero video autoplay is configured', heroState.videoAutoplay && heroState.videoMuted && heroState.videoLoop)
  assertCheck('Hero crop hides the watermark band', heroState.cropOverflow === 'hidden' && heroState.videoHeightRatio >= 1.14, JSON.stringify(heroState))
  assertCheck('Sticker uses the required hard shadow', heroState.cardShadow.includes('8px 8px 0px'))
  await screenshot('desktop-01-intro.png')

  const desktopChapters = ['intro', 'timeline', 'works', 'groceries', 'ending']
  const expectedLabels = ['01 / 初见', '02 / 履历', '03 / 作品', '04 / 杂货铺', '05 / 无限可能']
  const avatarSelectors = [
    '.hero-video',
    '.timeline-sticker img',
    '.works-sticker img',
    '.grocery-card--skill .mini-sticker img',
    '.ending-sticker img',
  ]

  for (let index = 0; index < desktopChapters.length; index += 1) {
    const id = desktopChapters[index]
    await scrollToSection(id)
    const metrics = await getLayoutMetrics(id)
    assertCheck(`Desktop ${id} has no horizontal overflow`, !metrics.horizontalOverflow, `scrollWidth=${metrics.bodyScrollWidth}`)
    assertCheck(
      `Desktop ${id} updates playback chapter`,
      metrics.activeChapter === expectedLabels[index],
      `active=${metrics.activeChapter}; expected=${expectedLabels[index]}; scrollY=${metrics.scrollY}`,
    )
    if (index > 0) {
      await assertRenderedImageIntegrity(`Desktop ${id}`)
      await assertAvatarVisible(`Desktop ${id}`, avatarSelectors[index])
      await screenshot(`desktop-0${index + 1}-${id}.png`)
    }

    if (id === 'timeline') {
      const timelineAudit = await evaluate(`(() => ({
        years: Array.from(document.querySelectorAll('[data-ghost-year]')).map((year) => year.textContent?.trim()),
        pills: Array.from(document.querySelectorAll('.timeline-step .year-pill')).map((pill) => pill.textContent?.trim()),
        titles: Array.from(document.querySelectorAll('.timeline-step h3')).map((title) => title.textContent?.trim()),
        firstBody: document.querySelector('.timeline-step p')?.textContent?.trim() ?? '',
        hasOldAdmission: document.body.innerText.includes('2023 考入大学'),
      }))()`)
      assertCheck(
        'Timeline uses the finalized 2024-2026 sequence',
        JSON.stringify(timelineAudit.years) === JSON.stringify(['2024', '2025', '2026']) &&
          JSON.stringify(timelineAudit.pills) === JSON.stringify(['2024', '2025', '2026']) &&
          JSON.stringify(timelineAudit.titles) === JSON.stringify(['考入大学', '开始正经做项目', '大三进行时']) &&
          timelineAudit.firstBody.includes('计算机科学与技术') &&
          !timelineAudit.hasOldAdmission,
        JSON.stringify(timelineAudit),
      )
      await evaluate(`window.scrollBy({ top: window.innerHeight * 1.08, behavior: 'instant' })`)
      await delay(900)
      const ghostOpacities = await evaluate(`Array.from(document.querySelectorAll('[data-ghost-year]')).map((year) => Number(getComputedStyle(year).opacity))`)
      assertCheck('Timeline ghost years reveal progressively', Math.max(...ghostOpacities) > 0.1, JSON.stringify(ghostOpacities))
      await screenshot('desktop-02b-timeline-progress.png')
    }

    if (id === 'works') {
      const archiveLabel = await evaluate(`document.querySelector('.works-folder__meta .mono')?.textContent?.trim()`)
      assertCheck('Works archive starts in 2024', archiveLabel === 'ARCHIVE 2024-2026', archiveLabel)
    }

    if (id === 'groceries') {
      await evaluate(`window.scrollBy({ top: window.innerHeight * 1.2, behavior: 'instant' })`)
      await delay(900)
      const galleryProgress = await evaluate(`(() => ({
        x: getComputedStyle(document.querySelector('.shop-track')).transform,
        counter: document.querySelector('.shop-counter strong')?.textContent?.replace(/\\s+/g, ' ').trim(),
      }))()`)
      assertCheck('Shop cards translate horizontally while pinned', galleryProgress.x !== 'none' && !galleryProgress.counter?.startsWith('01'), JSON.stringify(galleryProgress))
      await screenshot('desktop-04b-groceries-progress.png')

      const shopCopyState = await readShopFilterState()
      assertCheck(
        'Shop filter copy and control label describe the real behavior',
        !shopCopyState.hasFalseFilterCopy &&
          shopCopyState.note === '点分类，只看这一种' &&
          shopCopyState.groupLabel === '杂货分类筛选' &&
          shopCopyState.cardCount === 5,
        JSON.stringify(shopCopyState),
      )

      for (const testCase of shopFilterCases) {
        await clickShopCategory(testCase.category)
        await assertShopFilter('Desktop shop', testCase, { requireStart: true })

        if (testCase.category === '爱好') {
          const pinEndLayout = await scrollShopToPinEnd()
          const hobbyEndState = await readShopFilterState()
          assertCheck('Desktop hobby filter keeps a reachable horizontal pin', pinEndLayout.pinned === true, JSON.stringify(pinEndLayout))
          assertCheck(
            'Desktop hobby filter reaches the third card without a blank tail',
            hobbyEndState.counterCurrent === 3 &&
              hobbyEndState.counterTotal === 3 &&
              hobbyEndState.visibleTitles.at(-1) === '手磨咖啡与电影' &&
              Math.abs(hobbyEndState.lastCardRightGap ?? Number.POSITIVE_INFINITY) <= 40,
            JSON.stringify(hobbyEndState),
          )
        }
      }
    }
  }

  assertCheck(
    'Desktop pins exist for chapters two and four only',
    (await evaluate(`(() => {
      const spacers = Array.from(document.querySelectorAll('.pin-spacer'));
      return spacers.length >= 2 && spacers.every((spacer) => {
        const section = spacer.querySelector('[data-chapter]');
        return section?.id === 'timeline' || section?.id === 'groceries';
      });
    })()`)),
  )

  await evaluate(`window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })`)
  await delay(700)
  const desktopFooterClearance = await evaluate(`(() => {
    const footer = document.querySelector('.site-footer')?.getBoundingClientRect();
    const bar = document.querySelector('.playback-bar')?.getBoundingClientRect();
    return { footerBottom: footer?.bottom, barTop: bar?.top, clearance: bar && footer ? bar.top - footer.bottom : null };
  })()`)
  assertCheck('Desktop playback bar does not cover footer content', desktopFooterClearance.clearance >= 0, JSON.stringify(desktopFooterClearance))

  await evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`)
  await delay(850)
  const videoBeforePause = await evaluate(`document.querySelector('.hero-video')?.paused`)
  await evaluate(`document.querySelector('.bar-button')?.click()`)
  await delay(250)
  const pausedState = await evaluate(`(() => ({
    pressed: document.querySelector('.bar-button')?.getAttribute('aria-pressed'),
    videoPaused: document.querySelector('.hero-video')?.paused,
    liveAnimationState: getComputedStyle(document.querySelector('.live-dot')).animationPlayState,
  }))()`)
  assertCheck('Pause button freezes video and CSS animation', pausedState.pressed === 'true' && pausedState.videoPaused === true && pausedState.liveAnimationState === 'paused', JSON.stringify({ videoBeforePause, ...pausedState }))
  await screenshot('desktop-paused.png')
  await evaluate(`document.querySelector('.bar-button')?.click()`)
  await delay(450)
  const resumedState = await evaluate(`(() => ({
    pressed: document.querySelector('.bar-button')?.getAttribute('aria-pressed'),
    videoPaused: document.querySelector('.hero-video')?.paused,
    liveAnimationState: getComputedStyle(document.querySelector('.live-dot')).animationPlayState,
  }))()`)
  assertCheck('Pause button resumes video and CSS animation', resumedState.pressed === 'false' && resumedState.videoPaused === false && resumedState.liveAnimationState === 'running', JSON.stringify(resumedState))

  await setRangeValue(45)
  const seekState = await evaluate(`({ scrollY: window.scrollY, rangeValue: Number(document.querySelector('.playback-progress input').value) })`)
  assertCheck('Progress slider jumps through the page', seekState.scrollY > 500, JSON.stringify(seekState))
  await setRangeValue(0)
  assertCheck('Progress slider returns to the top', (await evaluate('window.scrollY')) < 5)

  const altTextState = await evaluate(`(() => ({
    images: document.querySelectorAll('img').length,
    missingAlt: Array.from(document.querySelectorAll('img')).filter((image) => !image.getAttribute('alt')?.trim()).length,
    videoLabel: document.querySelector('video')?.getAttribute('aria-label'),
  }))()`)
  assertCheck(
    'All rendered images have descriptive alt text',
    altTextState.missingAlt === 0 && Boolean(altTextState.videoLabel),
    JSON.stringify(altTextState),
  )

  await scrollToSection('works')
  await evaluate(`document.querySelector('.works-folder')?.click()`)
  await delay(450)
  const modalState = await evaluate(`(() => ({
    open: Boolean(document.querySelector('.folder-window')),
    cards: document.querySelectorAll('.folder-project').length,
    focusedClass: document.activeElement?.className,
    linkTargets: Array.from(document.querySelectorAll('.folder-project a')).map((link) => link.href),
    transforms: Array.from(document.querySelectorAll('.folder-project')).map((card) => getComputedStyle(card).transform),
    projectCards: Array.from(document.querySelectorAll('.folder-project')).map((card) => ({
      title: card.querySelector('h3')?.textContent?.trim(),
      href: card.querySelector('a')?.getAttribute('href'),
      label: card.querySelector('a')?.textContent?.replace(/\\s+/g, ' ').trim(),
    })),
  }))()`)
  assertCheck('Folder opens with three fanned project cards', modalState.open && modalState.cards === 3 && modalState.transforms.every((value) => value !== 'none'))
  const requiredLinks = [
    'https://ren-rag-pdf.streamlit.app/',
    'https://github.com/bowenren-Andrew/china-population-dashboard',
    'https://renbowen.qzz.io/clay-portfolio/',
  ]
  assertCheck(
    'All project links use the required URLs',
    requiredLinks.every((link) => modalState.linkTargets.includes(link)),
    JSON.stringify(modalState.linkTargets),
  )
  const portfolioProject = modalState.projectCards.find((project) => project.href === 'https://renbowen.qzz.io/clay-portfolio/')
  assertCheck(
    'Portfolio card title, online link, and button copy agree',
    portfolioProject?.title === '粘土风简历站' &&
      portfolioProject?.label === '访问线上简历站' &&
      modalState.projectCards.every((project) => !project.title?.includes('煤炭风')),
    JSON.stringify(modalState.projectCards),
  )
  await screenshot('desktop-folder-open.png')

  await pressEscape()
  assertCheck('Folder closes with Escape', !(await evaluate(`Boolean(document.querySelector('.folder-window'))`)))

  await evaluate(`document.querySelector('.works-folder')?.click()`)
  await delay(350)
  await clickAt(6, 6)
  assertCheck('Folder closes from blank backdrop', !(await evaluate(`Boolean(document.querySelector('.folder-window'))`)))

  await evaluate(`document.querySelector('.works-folder')?.click()`)
  await delay(350)
  await evaluate(`document.querySelector('.folder-window__close')?.click()`)
  await delay(250)
  assertCheck('Folder closes with close button', !(await evaluate(`Boolean(document.querySelector('.folder-window'))`)))

  await evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`)
  await delay(550)
  const faceSequence = []
  const expectedFaceAlts = [
    '任博文开怀大笑的黏土形象',
    '任博文惊讶地睁大眼睛的黏土形象',
    '任博文正面笑脸，戴着珊瑚红耳机',
  ]
  for (let click = 0; click < 3; click += 1) {
    await evaluate(`document.querySelector('.hero-sticker')?.click()`)
    const face = await evaluate(`(async () => {
      const image = document.querySelector('.hero-sticker__face');
      const deadline = performance.now() + 6000;
      while (image && !(image.complete && image.naturalWidth > 0) && performance.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      try { await image?.decode(); } catch { /* captured below */ }
      return {
        src: image?.getAttribute('src'),
        complete: image?.complete,
        naturalWidth: image?.naturalWidth,
        naturalHeight: image?.naturalHeight,
        alt: image?.getAttribute('alt')?.trim() ?? '',
      };
    })()`)
    faceSequence.push(face.src)
    assertCheck(
      `Expression click ${click + 1} image is decoded and has the audited alt`,
      face.complete && face.naturalWidth > 0 && face.naturalHeight > 0 && face.alt === expectedFaceAlts[click],
      JSON.stringify(face),
    )
  }
  const faceEggState = await evaluate(`(() => ({
    count: document.querySelector('.egg-counter output')?.textContent,
    stillImage: document.querySelector('.hero-sticker__face')?.getAttribute('src'),
    videoHidden: !document.querySelector('.hero-video'),
  }))()`)
  assertCheck(
    'Expression clicks cycle laugh, shocked, then front',
    faceSequence[0]?.endsWith('avatar-fun-laugh.png') &&
      faceSequence[1]?.endsWith('avatar-fun-shocked.png') &&
      faceSequence[2]?.endsWith('avatar-fun-front.png'),
    JSON.stringify(faceSequence),
  )
  await screenshot('desktop-faces-cycle.png')
  assertCheck('Expression clicks reach three and add the first egg', faceEggState.count === '1/3' && faceEggState.videoHidden, JSON.stringify(faceEggState))

  await scrollToSection('works')
  await evaluate(`document.querySelector('.works-folder')?.click()`)
  await delay(350)
  await evaluate(`document.querySelector('.secret-file')?.click()`)
  await delay(300)
  const fileEggState = await evaluate(`(() => ({ count: document.querySelector('.egg-counter output')?.textContent, openedLabel: document.querySelector('.secret-file__copy small')?.textContent }))()`)
  assertCheck('Secret file adds the second egg', fileEggState.count === '2/3', JSON.stringify(fileEggState))
  const partialEggState = await evaluate(`(() => {
    const line = document.querySelector('.found-line');
    return {
      count: document.querySelector('.egg-counter output')?.textContent,
      text: line?.textContent?.trim() ?? '',
      visibleClass: line?.classList.contains('found-line--visible') ?? false,
      opacity: line ? Number(getComputedStyle(line).opacity) : null,
    };
  })()`)
  assertCheck(
    'Completion line stays empty and hidden at 2/3',
    partialEggState.count === '2/3' && partialEggState.text === '' && !partialEggState.visibleClass && partialEggState.opacity === 0,
    JSON.stringify(partialEggState),
  )
  await pressEscape()

  await scrollToSection('ending')
  await evaluate(`document.querySelector('.headphone-spot--left')?.click()`)
  await delay(700)
  const finalEggState = await evaluate(`(() => ({
    count: document.querySelector('.egg-counter output')?.textContent,
    found: document.querySelector('.found-line')?.classList.contains('found-line--visible'),
    foundText: document.querySelector('.found-line')?.textContent?.trim(),
    foundOpacity: Number(getComputedStyle(document.querySelector('.found-line')).opacity),
    starBurst: Boolean(document.querySelector('.star-burst')),
    stars: document.querySelectorAll('.confetti-star').length,
  }))()`)
  assertCheck('Headphone click completes all three eggs', finalEggState.count === '3/3' && finalEggState.found && finalEggState.foundOpacity === 1 && finalEggState.starBurst, JSON.stringify(finalEggState))
  assertCheck('Celebration text is exact', finalEggState.foundText === '好家伙，全被你找到了。', finalEggState.foundText)
  await screenshot('desktop-easter-complete.png')
  await delay(2500)
  assertCheck('Star shower lasts about two seconds', !(await evaluate(`Boolean(document.querySelector('.star-burst'))`)))

  await navigate(390, 844, true)
  await primeLazyImages()
  await assertHeroTitle('Mobile')
  await assertRenderedImageIntegrity('Mobile')
  await assertVideoFrame('Mobile')
  await assertAvatarVisible('Mobile intro', '.hero-video', { video: true })
  assertCheck('Mobile layout removes all ScrollTrigger pin spacers', (await evaluate(`document.querySelectorAll('.pin-spacer').length`)) === 0)
  const mobileHero = await evaluate(`(() => {
    const card = document.querySelector('.hero-sticker')?.getBoundingClientRect();
    const bar = document.querySelector('.playback-bar')?.getBoundingClientRect();
    return { cardWidth: card?.width, viewport: window.innerWidth, barWidth: bar?.width, horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1 };
  })()`)
  assertCheck('Mobile hero and bar fit in 390px viewport', !mobileHero.horizontalOverflow && mobileHero.cardWidth <= mobileHero.viewport && near(mobileHero.barWidth, mobileHero.viewport, 2), JSON.stringify(mobileHero))

  for (let index = 0; index < desktopChapters.length; index += 1) {
    const id = desktopChapters[index]
    await scrollToSection(id)
    const metrics = await getLayoutMetrics(id)
    assertCheck(`Mobile ${id} has no horizontal overflow`, !metrics.horizontalOverflow, `scrollWidth=${metrics.bodyScrollWidth}`)
    await assertRenderedImageIntegrity(`Mobile ${id}`)
    await assertAvatarVisible(`Mobile ${id}`, avatarSelectors[index], { video: index === 0 })
    await screenshot(`mobile-0${index + 1}-${id}.png`)
  }

  await scrollToSection('timeline')
  await evaluate(`window.scrollBy({ top: 420, behavior: 'instant' })`)
  await delay(500)
  await screenshot('mobile-02b-timeline-content.png')

  await scrollToSection('works')
  await evaluate(`window.scrollBy({ top: 345, behavior: 'instant' })`)
  await delay(500)
  const mobileWorksOverflow = await getLayoutMetrics('works')
  assertCheck('Mobile works content remains inside viewport', !mobileWorksOverflow.horizontalOverflow, `scrollWidth=${mobileWorksOverflow.bodyScrollWidth}`)
  await screenshot('mobile-03b-works-folder.png')

  await scrollToSection('groceries')
  await evaluate(`window.scrollBy({ top: 480, behavior: 'instant' })`)
  await delay(500)
  await screenshot('mobile-04b-groceries-cards.png')

  await scrollToSection('groceries')
  for (const testCase of shopFilterCases) {
    await clickShopCategory(testCase.category)
    await assertShopFilter('Mobile shop', testCase, { expectPinned: false })
  }

  await evaluate(`window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })`)
  await delay(600)
  await screenshot('mobile-05b-ending-footer.png')

  await scrollToSection('works')
  await evaluate(`document.querySelector('.works-folder')?.click()`)
  await delay(400)
  const mobileModal = await evaluate(`(() => {
    const modal = document.querySelector('.folder-window')?.getBoundingClientRect();
    return { open: Boolean(modal), width: modal?.width, height: modal?.height, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight };
  })()`)
  assertCheck('Mobile folder dialog is full screen', mobileModal.open && near(mobileModal.width, mobileModal.viewportWidth, 1), JSON.stringify(mobileModal))
  await screenshot('mobile-folder-open.png')
  await pressEscape()

  await evaluate(`window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })`)
  await delay(500)
  const footerClearance = await evaluate(`(() => {
    const footer = document.querySelector('.site-footer')?.getBoundingClientRect();
    const bar = document.querySelector('.playback-bar')?.getBoundingClientRect();
    return { footerBottom: footer?.bottom, barTop: bar?.top, clearance: bar && footer ? bar.top - footer.bottom : null };
  })()`)
  assertCheck('Bottom playback bar does not cover footer content', footerClearance.clearance >= 0, JSON.stringify(footerClearance))

  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  })
  await navigate(1440, 900, false)
  const reducedState = await evaluate(`(() => ({
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    pinSpacers: document.querySelectorAll('.pin-spacer').length,
    titleOpacity: getComputedStyle(document.querySelector('.hero-title .char')).opacity,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  }))()`)
  assertCheck('Reduced motion skips pins and shows final title state', reducedState.reduced && reducedState.pinSpacers === 0 && Number(reducedState.titleOpacity) === 1 && !reducedState.horizontalOverflow, JSON.stringify(reducedState))

  await scrollToSection('groceries')
  for (const testCase of shopFilterCases) {
    await clickShopCategory(testCase.category)
    await assertShopFilter('Reduced motion shop', testCase, { expectPinned: false, requireStart: true })

    if (testCase.category === '爱好') {
      const nativeEnd = await scrollShopWindowToEnd()
      const hobbyNativeEndState = await readShopFilterState()
      assertCheck(
        'Reduced motion hobby filter remains horizontally reachable',
        nativeEnd.max > 0 &&
          hobbyNativeEndState.counterCurrent === 3 &&
          hobbyNativeEndState.counterTotal === 3 &&
          Math.abs(hobbyNativeEndState.lastCardRightGap ?? Number.POSITIVE_INFINITY) <= 40,
        JSON.stringify({ nativeEnd, hobbyNativeEndState }),
      )
    }
  }

  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1180, y: 360, button: 'none' })
  await delay(150)
  const reducedParallax = await evaluate(`(() => {
    const media = document.querySelector('.hero-sticker__media');
    return { x: media?.style.getPropertyValue('--gaze-art-x'), y: media?.style.getPropertyValue('--gaze-art-y') };
  })()`)
  assertCheck('Reduced motion disables gaze parallax', !reducedParallax.x && !reducedParallax.y, JSON.stringify(reducedParallax))

  await send('Emulation.setScriptExecutionDisabled', { value: true })
  await send('Page.navigate', { url: baseUrl })
  await delay(1100)
  const noJsState = await evaluate(`(() => {
    const fallback = document.querySelector('.static-fallback');
    const mediaSources = Array.from(fallback?.querySelectorAll('img, video') ?? [])
      .flatMap((element) => [element.getAttribute('src'), element.getAttribute('poster')].filter(Boolean));
    const invalidSources = mediaSources.filter((source) => !source.startsWith(${JSON.stringify(assetBasePath)}) || source.includes('/public/') || source.includes('../'));
    return {
      fallbackPresent: Boolean(fallback),
      title: fallback?.querySelector('h1')?.textContent?.trim(),
      sectionCount: fallback?.querySelectorAll('section').length,
      projectLinks: fallback?.querySelectorAll('a[href^="https://"]').length,
      bodyTextLength: document.body.innerText.trim().length,
      imageAlts: Array.from(fallback?.querySelectorAll('img') ?? []).map((image) => image.getAttribute('alt')?.trim() ?? ''),
      timelineText: fallback?.querySelector('#fallback-timeline')?.innerText ?? '',
      portfolioTitle: Array.from(fallback?.querySelectorAll('h3') ?? []).find((heading) => heading.textContent?.includes('简历站'))?.textContent?.trim(),
      portfolioHref: Array.from(fallback?.querySelectorAll('a') ?? []).find((link) => link.textContent?.includes('简历站'))?.getAttribute('href'),
      portfolioLinkText: Array.from(fallback?.querySelectorAll('a') ?? []).find((link) => link.textContent?.includes('简历站'))?.textContent?.trim(),
      mediaSources,
      invalidSources,
    };
  })()`)
  assertCheck(
    'No-JS fallback renders complete semantic content',
    noJsState.fallbackPresent &&
      noJsState.title === '嘿，我是任博文' &&
      noJsState.sectionCount === 5 &&
      noJsState.projectLinks === 3 &&
      noJsState.bodyTextLength > 500 &&
      noJsState.mediaSources.length >= 6 &&
      noJsState.invalidSources.length === 0 &&
      noJsState.timelineText.includes('2024 考入大学') &&
      !noJsState.timelineText.includes('2023 考入大学') &&
      JSON.stringify(noJsState.imageAlts) === JSON.stringify([
        '任博文正面笑脸，戴着珊瑚红耳机',
        '任博文抱着珊瑚红笔记本的黏土形象',
        '任博文四分之三侧面头像',
        '任博文全侧面头像',
        '任博文惊讶地睁大眼睛的黏土形象',
      ]) &&
      noJsState.portfolioTitle === '粘土风简历站' &&
      noJsState.portfolioHref === 'https://renbowen.qzz.io/clay-portfolio/' &&
      noJsState.portfolioLinkText === '访问线上简历站',
    JSON.stringify(noJsState),
  )
  await screenshot('no-js-fallback.png')

  assertCheck('No runtime page errors', consoleErrors.length === 0, consoleErrors.join(' | '))

  const report = {
    baseUrl,
    checkedAt: new Date().toISOString(),
    checks,
    consoleErrors,
    artifactDir,
  }
  await writeFile(path.join(artifactDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8')
  console.log(`\n${checks.filter((check) => check.passed).length}/${checks.length} checks passed.`)
  console.log(`Screenshots: ${artifactDir}`)
} catch (error) {
  const report = {
    baseUrl,
    checkedAt: new Date().toISOString(),
    checks,
    consoleErrors,
    failure: error instanceof Error ? error.stack : String(error),
    artifactDir,
  }
  await writeFile(path.join(artifactDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8')
  console.error(`\nVerification failed: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
} finally {
  socket.close()
  chrome.kill()
}
