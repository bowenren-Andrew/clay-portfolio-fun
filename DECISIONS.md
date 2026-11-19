# DECISIONS

1. **从零初始化 React + Vite + TypeScript。**
   理由：工作区当时只有 `public/assets/`，没有现成脚手架或代码规范可继承。采用常规单页结构，组件按五章拆分，避免把全部逻辑塞进单个文件。

2. **视觉色板严格限制为苔藓绿、奶油、深色和珊瑚红。**
   理由：需求限定唯一强调色。文件夹的“橙色”使用珊瑚红填充与奶油纸边来表现，避免额外引入橙色强调色；卡片内的图片本身自带的颜色不纳入 UI 色板。

3. **不加载外部字体和图片。**
   理由：避免网络依赖、闪烁和外部资源失效。中文优先系统圆体，英文点缀使用系统等宽字体；噪点、图标、项目缩略图均使用内联 CSS/SVG 本地绘制。

4. **背景使用多层径向渐变、斑点和内联 SVG `feTurbulence` 噪点。**
   理由：满足“不能纯色平铺”的要求，同时不增加图片资源或修改原素材。

5. **首屏贴纸卡第一次点击后停留在静图循环。**
   理由：需求明确点击后按 front → laugh → shocked → front 循环，并要求切换时暂停并隐藏视频。第三次点击回到正面静图，方便表情循环继续，也让彩蛋计数有明确终点。

6. **首屏视频按容器 115% 高度、顶部对齐并用 `overflow: hidden` 裁切。**
   理由：直接裁掉底部约 12% 以上的水印区域。海报与静图仍完整显示人物，视频不设置原生控件。

7. **桌面视线跟随采用 9.2px 内层反向位移和 4.5px 卡片同向位移。**
   理由：两层方向相反形成明显视差，同时内层位移低于需求上限 10px。仅启用 `(hover: hover) and (pointer: fine)` 且宽度不小于 768px；触屏、移动端和 reduced-motion 下不绑定。

8. **仅履历和杂货铺两章使用 ScrollTrigger pin。**
   理由：严格对应需求。其它章节保持自然文档流，移动端与 reduced-motion 均不创建 pin spacer。

9. **履历章节的内容始终可读，年份和大号幽灵数字负责“依次浮现”。**
   理由：最初让整段条目从低透明度显现，截图中文字过淡、进入章节时阅读体验差。改为正文保持清晰，年份从低透明度逐个变为 12%，珊瑚色进度线和节点缩放表示滚动推进。

10. **杂货铺横向 pin 使用线性滚动映射，其余动画统一 `expo.out`。**
    理由：横向位移直接跟随滚动位置时，线性映射可以保证卡片始终与滚动进度一致，避免用户滚完大半屏后卡片才追上。标题、卡片入场、弹窗和所有 CSS 过渡统一使用 expo.out 系缓动；滚动绑定位移采用线性属合理的交互例外。

11. **分类丸子仅切换高亮状态，不真正过滤。**
    理由：需求说明“仅视觉高亮即可”。同时保留 `aria-pressed`，让视觉状态对辅助技术可感知。

12. **作品文件夹使用 Portal 挂到 `document.body`。**
    理由：避免被章节的 `overflow: clip` 或 transformed 祖先裁切，保证桌面居中弹窗和移动端全屏弹窗都稳定覆盖视口。

13. **弹窗实现 ESC、空白点击、关闭按钮三种关闭方式，并附加焦点管理。**
    理由：需求要求三种关闭方式；同时打开时把焦点移到关闭按钮、Tab 在弹窗内循环、关闭后还原到文件夹触发按钮，避免键盘用户迷失在背后页面。

14. **“别点我.txt” 与三个项目卡同处弹窗底部区域。**
    理由：保持 macOS 文件夹语义，文件既容易被发现，又不会抢占三个核心项目的视觉层级。

15. **耳机彩蛋同时提供左右两个不可见但可聚焦的热区。**
    理由：惊讶头像左右耳机都能成为点击入口，选择更宽容；热区保留 `aria-label` 和 focus 状态，鼠标悬停时出现小珊瑚星提示。

16. **彩蛋使用唯一集合计数，不依赖点击次数累加。**
    理由：重复点同一个入口不会被刷到 3/3。三颗彩蛋各触发一次后进入 3/3 庆祝，并且每次加载从 0/3 开始。

17. **庆祝层使用 48 颗 CSS 珊瑚星，动画约 2 秒。**
    理由：满足全屏撒星要求，动画只改变 `transform` 和 `opacity`，不增加粒子库依赖。完成文案固定显示在首屏标题下方。

18. **暂停按钮同时暂停 GSAP 全局时间线、CSS 动画、视频和 Lenis。**
    理由：比只暂停视频更完整地满足“全站动效冻结”。恢复时重新启动 GSAP 和 Lenis，视频只在尚未切换到静图时恢复播放。

19. **底栏进度滑杆映射整页滚动百分比，章节名按各 section 的文档位置判定。**
    理由：pin 会让页面实际高度变化，直接使用当前布局高度和滚动位置能在桌面 pin、移动端纵向布局两种情况下保持一致；拖动滑杆直接跳转，松手后可继续滚轮浏览。

20. **`prefers-reduced-motion` 下完全跳过 pin、视线视差和逐字 GSAP 动画。**
    理由：标题直接显示最终状态；Lenis 不初始化；杂货铺改用原生横向滚动，履历直接呈现全部年表；CSS 动画和过渡也缩短到不可感知时长。

21. **移动端断点固定为 `< 768px`。**
    理由：对应需求。该宽度下取消 pin 和 gaze，五章纵向排列，履历与杂货铺内容正常堆叠，文件夹弹窗变为 100% 宽高并内部滚动。

22. **所有动效只作用于 `transform` 和 `opacity`。**
    理由：降低布局抖动和重绘成本。颜色、阴影和边框仅作为静态状态切换，没有尺寸或背景位置动画。

23. **`index.html` 内置完整语义化无 JS 骨架。**
    理由：React 启动前或无 JavaScript 时仍能读取五章正文、图片 alt、三个项目链接与页脚；React 成功挂载后再接管为完整交互版本。

24. **素材保持原路径只读，不复制、不重命名、不压缩。**
    理由：遵守“不要动 public/assets 原件”。图片通过尺寸属性和懒加载控制布局，首屏优先加载，其余图片延迟加载。

25. **使用本机 Chrome + 原生 CDP 编写零测试依赖的验收脚本。**
    理由：不额外安装 Playwright/Puppeteer。脚本覆盖 1440×900 与 390×844 的双档截图、无横向溢出、章节名与滑杆、暂停/恢复、三种弹窗关闭方式、三条彩蛋、3/3 庆祝、reduced-motion、无 JS 骨架以及资源 alt 文本。

26. **测试产物放在 `artifacts/` 并加入 `.gitignore`。**
    理由：截图和临时 Chrome profile 属于验收证据，不进入构建产物，也不污染源码目录。

27. **不执行 `npm audit fix --force` 的 Vite 降级建议。**
    理由：审计中的 5 个 high 问题来自 Vite 8 开发工具链的 `picomatch` 传递依赖，自动修复会强制降级到 Vite 6.2.7 并跨越主版本。`npm audit --omit=dev` 结果为 0 个漏洞，生产依赖干净；保留当前 Vite 8 构建版本，避免为开发期 ReDoS 提示引入未验证的破坏性降级。




## 2026-11-18 验收问题诊断（修复前取证）

### 1. `npm run preview` + 无头 Chrome 网络记录

- 测试地址：`http://127.0.0.1:4174/`
- 浏览器：Chrome Headless，1440×900，启用 CDP `Network` 域。
- 测试过程：等待 load → 滚过五章触发懒加载 → 首屏贴纸卡点击三次触发 laugh、shocked 和 front 静图加载。
- 共捕获 18 条 `/assets/` 请求（包含后续对 8 个文件做无 Range fetch 校验的请求），按 8 个不同资源归并如下：

| 资源 URL | 图片/直接 GET 状态 | 说明 |
| --- | --- | --- |
| `/assets/avatar-fun-front.png` | 200 | `image/png`，DOM `naturalWidth=1024` |
| `/assets/avatar-fun-laugh.png` | 200 | 点击贴纸卡后加载，`image/png` |
| `/assets/avatar-fun-shocked.png` | 200 | 点击贴纸卡后加载，`image/png` |
| `/assets/avatar-fun-side.png` | 200 | `image/png`，DOM `naturalWidth=1024` |
| `/assets/avatar-fun-side34.png` | 200 | `image/png`，DOM `naturalWidth=1024` |
| `/assets/avatar-fun-presenter.png` | 200 | `image/png`，DOM `naturalWidth=1024` |
| `/assets/avatar-fun-laptop.png` | 200 | `image/png`，DOM `naturalWidth=1024` |
| `/assets/hero-loop.mp4` | 200 | 无 Range 的直接 GET 为 200、`video/mp4` |

- 失败的 URL：**无**。`Network.loadingFailed` 未产生任何失败记录。
- 浏览器原生 `<video>` 的渐进播放请求返回 **206 Partial Content**，这是媒体 Range 请求的正常语义响应；同一 URL 的无 Range GET 为 200。没有 4xx/5xx。
- 视频 DOM 实测：`readyState=4`、`videoWidth=768`、`videoHeight=768`、`paused=false`、`currentTime≈2.5s`，Canvas 抽帧 `luminance=3..245`、4096 个非透明像素，说明视频帧非空白。
- 5 个实际渲染的头像 `<img>` 全部 `complete=true`、`naturalWidth=1024`、`naturalHeight=1024`。

### 2. `dist/assets/` 文件核对

构建目录实际包含以下 8 个原始素材，文件名与大小均正确：

1. `avatar-fun-front.png`（1,268,493 bytes）
2. `avatar-fun-laugh.png`（1,393,025 bytes）
3. `avatar-fun-shocked.png`（1,330,441 bytes）
4. `avatar-fun-side.png`（1,265,355 bytes）
5. `avatar-fun-side34.png`（1,318,588 bytes）
6. `avatar-fun-presenter.png`（1,334,518 bytes）
7. `avatar-fun-laptop.png`（1,308,149 bytes）
8. `hero-loop.mp4`（552,541 bytes）

### 3. 源码中的 img/video src

- React：`/assets/avatar-fun-front.png`、`/assets/avatar-fun-laugh.png`、`/assets/avatar-fun-shocked.png`、`/assets/avatar-fun-side34.png`、`/assets/avatar-fun-side.png`、`/assets/avatar-fun-presenter.png`、`/assets/avatar-fun-laptop.png`、`/assets/hero-loop.mp4`。
- `index.html` 的无 JS 骨架使用完全相同的 `/assets/...` 绝对路径。
- 全仓未发现 `/public/` 前缀，也未发现 `../` 跨层素材路径。

### 4. 首屏标题问题

以 `Page.loadEventFired` 为零点采样 `[data-hero-title] .char`：

- `0ms`：7 个字的 opacity 为 `[0.41, 0.15, 0, 0, 0, 0, 0]`，7 个字中 5 个完全不可见。
- `80ms`：`[0.75, 0.63, 0.47, 0.22, 0, 0, 0]`。
- `180ms`：全部接近 1。
- `620ms`：全部为 1。

结论：逐字 GSAP 动画的 `fromTo` 初始态确实把大部分文字设为 `opacity: 0`，且存在 120ms 延迟；截图在动画完成前触发时会出现“大标题没显示”。首屏贴纸在同一环境下 80ms 已显示视频帧，因此本次本地未复现贴纸空卡或破图。为避免慢机器/早截图/媒体解码时机导致同样现象，将做以下补救：在视频下方保留同图静态贴纸层、为关键首图增加预加载、把卡片与标题显式标记为 ready，并让验收在媒体 ready、标题终态后再截图。

### 5. 修复决策

1. 首屏贴纸卡增加始终存在的正面 `<img>` 底层，视频加载完成后叠加；即使视频解码慢，也能看到头像，不再出现空卡。
2. 首屏正面图和视频在文档中预加载；所有头像继续使用 `/assets/<文件名>` 绝对路径。
3. 首屏标题动画不再允许文字完全透明：初始 opacity 提升到可读范围，并取消延迟；保留逐字位移入场。
4. 增加页面就绪标记：字体、首屏图片、标题终态和视频首帧满足条件后标记 `data-assets-ready`，减少截图与视觉不同步。
5. 重写验收硬门槛：每张 `<img>` 必须 `complete && naturalWidth > 0`；视频必须 `readyState >= 2`，Canvas 抽帧必须有足够亮度差；资源和标题均 ready 后才能截图；再用 1440×900、390×844 重新生成五章截图并覆盖旧图。

## 2026-11-18 修复后验收记录

### 修复内容

- 首屏贴纸卡始终保留正面头像静态底层，视频只有触发 `loadeddata` / `canplay` 后才通过 opacity 淡入；视频解码慢、自动播放被拒绝或媒体切换时不会再出现空卡。
- 首屏标题逐字动画的初始 opacity 从 0 提升到 0.5，并移除 120ms delay；最终态仍由同一 `expo.out` 动画完成，避免早截图把标题误判为消失。
- 页面新增 `data-hero-media-ready`、`data-title-ready` 与 `data-assets-ready` 就绪标记；验收脚本必须先等到媒体与标题终态，才允许截图。
- 给首屏正面图增加 preload，并修正贴纸颗粒层的层级，确保视频覆盖后颗粒纹理仍显示。
- `scripts/verify-ui.mjs` 增加硬门槛：构建产物中逐个核对 8 个素材、对 8 个 `/assets/<文件名>` URL 做直接 GET、强制所有 `<img>` 解码、视频 readyState 与 Canvas 抽帧检查、标题字符透明度检查、当前章节头像可见面积检查。

### 实际验收结果

- `npm run build`：通过，`tsc --noEmit` 与 Vite build 均成功。
- `npm run preview -- --host 127.0.0.1 --port 4174`：生产预览成功。
- `npm run verify:ui`：**82/82 checks passed**，`consoleErrors` 为 0。
- 8 个素材直接 GET 全部为 **200**，响应体均非空；`dist/assets/` 中 8 个素材逐个存在且字节数大于 0。
- 所有实际渲染的 `<img>`：`complete=true`，`naturalWidth=1024`，`naturalHeight=1024`，src 全部为 `/assets/<文件名>`。
- 桌面与移动端视频：`readyState=4`，`videoWidth=768`，`videoHeight=768`；Canvas 抽帧得到 9216 个不透明像素、亮度范围 250，帧非空白。
- 首屏标题：7 个字符最终 opacity 全部为 1，标题文本与 `aria-label` 均为“嘿，我是任博文”。
- 当前章节头像检查：五章的指定头像元素均可见，桌面端覆盖率为 1；移动端首章视频可见覆盖率为 0.673，其余四章头像覆盖率为 1。
- 1440×900 与 390×844 两档均重新生成五章截图并覆盖旧图，另重新生成弹窗、表情轮换、暂停、彩蛋、无 JS 和页脚检查图。
- 逐张目视确认：首屏标题、贴纸卡头像和视频均显示；五章头像本体可见；视频底部水印未进入裁切视口；无破图图标和空白卡。
- 桌面底部播放条与页脚间距约 49.6px，移动端约 30.6px；页脚及最后内容可完整露出，不覆盖在播放条下。

### 本轮截图文件

- `artifacts/ui-check/desktop-01-intro.png`
- `artifacts/ui-check/desktop-02-timeline.png`
- `artifacts/ui-check/desktop-03-works.png`
- `artifacts/ui-check/desktop-04-groceries.png`
- `artifacts/ui-check/desktop-05-ending.png`
- `artifacts/ui-check/mobile-01-intro.png`
- `artifacts/ui-check/mobile-02-timeline.png`
- `artifacts/ui-check/mobile-03-works.png`
- `artifacts/ui-check/mobile-04-groceries.png`
- `artifacts/ui-check/mobile-05-ending.png`

补充说明：浏览器原生 `<video>` 使用 Range 请求时返回 206 Partial Content 是正常媒体分段语义；本轮的硬检查采用无 Range 的直接 GET，因此要求并已验证为 200。

## 2026-11-19 GitHub Pages 上线方案

1. **发布路线与 `clay-portfolio` 保持一致。**
   理由：目标域名已经有可用的 GitHub Pages 自定义域名体系。新仓库采用 `master` 发布分支和同名的 `.github/workflows/deploy.yml`，继续使用 `actions/configure-pages@v5`、`actions/upload-pages-artifact@v3` 与 `actions/deploy-pages@v4`。

2. **Vite `base` 设为 `/clay-portfolio-fun/`。**
   理由：目标地址是 `https://renbowen.qzz.io/clay-portfolio-fun/`，GitHub Pages 项目站点位于用户自定义域名的项目子路径。根路径 `/assets/...` 会错误落到用户站根目录。

3. **所有运行时素材路径通过 `import.meta.env.BASE_URL` 生成。**
   理由：Vite 的 `base` 不会自动改写 JavaScript 中的绝对字符串。新增 `src/lib/assets.ts` 统一生成子路径感知的素材 URL；`index.html` 的无 JS 骨架使用 `%BASE_URL%assets/...`，由 Vite 在构建时替换。

4. **本地开发与预览端口使用 5175 / 4175。**
   理由：`clay-portfolio` 已使用 5174 / 4174；新项目使用相邻端口，两个站点可以同时运行而不抢端口。生产路由不依赖本地端口。

5. **自定义域名不新建 DNS 记录。**
   理由：`renbowen.qzz.io` 已通过 GitHub Pages 为用户站提供自定义域名访问；按现有 `/clay-portfolio/` 的路由方式，新项目应自动出现在 `/clay-portfolio-fun/`。最终以线上 HTTP 状态、素材和视频实测为准。

## 2026-11-19 年份、文案、alt 与彩蛋统一修正

### 年份核查

- 入学年份、履历起点和无 JS 骨架统一从 2023 改为 2024。
- 第二章定稿为：2024 考入大学（计算机科学与技术）/ 2025 开始正经做项目 / 2026 大三进行时。
- 第三章文件夹的年份区间改为 `ARCHIVE 2024-2026`。
- 全项目审计后仍保留的 `2023` 只有“31 省 2010–2023 人口数据可视化”。这里的 2023 是中国人口统计数据范围的终点，与入学年份无关，因此按需求保留。

### 项目文案核查

- 源码中实际标题已经是“粘土风简历站”，全项目未发现“煤炭风简历站”字符串；本轮增加了自动化断言，防止以后回退。
- 第三张项目卡链接确认仍为 `https://renbowen.qzz.io/clay-portfolio/`，不是 GitHub 仓库地址。
- 项目按钮及无 JS 链接文案统一为“访问线上简历站”，与线上目标一致。

### img alt 审计（改前 / 改后）

| 位置 | 改前 | 改后 |
| --- | --- | --- |
| `index.html` / 无 JS 首屏正面 | 任博文的定妆正面，戴着珊瑚红耳机 | 任博文正面笑脸，戴着珊瑚红耳机 |
| `index.html` / 无 JS 抱笔记本 | 任博文抱着珊瑚红笔记本 | 任博文抱着珊瑚红笔记本的黏土形象 |
| `index.html` / 无 JS 3/4 侧面 | 任博文的三分之四侧面头像 | 任博文四分之三侧面头像 |
| `index.html` / 无 JS 全侧面 | 任博文的全侧面头像 | 任博文全侧面头像 |
| `index.html` / 无 JS 惊讶 | 任博文惊讶地睁大眼睛 | 任博文惊讶地睁大眼睛的黏土形象 |
| `EndingChapter` / 惊讶大头像 | 任博文惊讶地睁大眼睛，戴着珊瑚红耳机 | 任博文惊讶地睁大眼睛的黏土形象 |
| `HeroChapter` / 正面表情 | 任博文正面笑脸，戴着珊瑚红耳机 | 保持不变 |
| `HeroChapter` / 大笑表情 | 任博文开怀大笑，露出牙齿 | 任博文开怀大笑的黏土形象 |
| `HeroChapter` / 惊讶表情 | 任博文惊讶地睁大眼睛 | 任博文惊讶地睁大眼睛的黏土形象 |
| `HeroChapter` / 视频下方正面底层 | 任博文正面笑脸，戴着珊瑚红耳机 | 保持不变 |
| `ProjectsChapter` / 抱笔记本 | 任博文抱着珊瑚红笔记本，笑得很得意 | 任博文抱着珊瑚红笔记本的黏土形象 |
| `ShopChapter` / 3/4 侧面 | 任博文的三分之四侧面头像 | 任博文四分之三侧面头像 |
| `ShopChapter` / 全侧面 | 任博文的全侧面头像 | 任博文全侧面头像 |
| `TimelineChapter` / 讲解姿势 | 任博文伸出手指，认真讲解的样子 | 任博文伸出手指讲解的黏土形象 |

审计同时覆盖了没有单独 `alt` 声明的动态头像：三张表情轮换图在验收脚本中逐次检查实际 `alt`，6 张首屏/章节静态图检查完整顺序，无 JS 骨架检查 5 张图片。所有 alt 均非空，旧的高风险片段“定妆正面 / 三分之四 / 摊上珊瑚红 / 煤炭风”为零。

### 彩蛋完成语核查结论

- 修复前视觉上未复现页面直接显示：`.found-line` 默认 `opacity: 0`，所以正常截图看不到。
- 但原实现把“好家伙，全被你找到了。”始终写在 DOM 中，并处于 `role="status"` / `aria-live="polite"` 区域，因此属于未完成时就已存在、可被辅助技术读取的语义泄漏。
- 修复方式：保留完成语占位高度与 live region，但集满前内容为空；只有 `eggs.size === 3` 时才渲染这句文字并添加可见类。
- 验收硬断言：0/3 时文本为空、无可见类、opacity 为 0；2/3 时仍为空且不可见；3/3 后文本精确为“好家伙，全被你找到了。”，opacity 为 1。

### 本轮验证

- `npm run build`：通过。
- `npm run verify:ui`：**88/88 checks passed**，无运行期错误。
- 新增断言覆盖 2024–2026 时间轴、ARCHIVE 年份、全站 alt、项目标题/线上链接/按钮文案，以及彩蛋 0/3、2/3、3/3 三个门槛。

## 2026-11-20 杂货铺分类改为真实筛选

### 实现方式

- 在 `ShopChapter` 中建立五张卡片的分类与标题元数据，由同一份数据派生当前可见集合和计数器分母，避免按钮、卡片与计数各自维护数量。
- 分类按钮现在直接驱动 React 状态；未被选中的卡片设置原生 `hidden` 属性，并增加 `.grocery-card[hidden] { display: none !important; }`，让卡片在桌面 flex、移动端 grid 和辅助技术中都真正退出展示，而不是只改变高亮。
- 计数器由当前可见集合计算：技能和工具为 `01/01`，爱好为 `01/03`，全部为 `01/05`；横滚或移动端滚动时当前序号随可见卡片递增。
- 筛选变化会清理旧的 ScrollTrigger 和 pin，再按当前可见卡片的实际宽度重建横滚 tween。单卡筛选宽度不足以产生位移时不创建 pin，避免为一张卡保留无意义的 pinned 滚动距离。
- 筛选重建后显式调用 `ScrollTrigger.refresh()`；如果切换发生在桌面 pinned 区间内，会回到该 pin 的起点，保证横滚进度和计数从 `01` 开始。爱好集合的终点断言同时检查最后一张卡贴近视口右缘，防止出现大片空白或滚不到底。
- 移动端和 reduced-motion 共用同一套 React 筛选状态；桌面正常动效使用 pinned 横滚，移动端保持纵向堆叠，reduced-motion 桌面保留原生横向滚动，三者均不依赖仅高亮的假筛选。
- 删除与实际行为不符的 `FILTER IS A LIE, SCROLL INSTEAD`，改为“点分类，只看这一种”；分类组件的无障碍名称同步改为“杂货分类筛选”。

### 验收方式

- `verify:ui` 依次在桌面 `1440x900`、移动端 `390x844` 和 reduced-motion 桌面环境中点击技能、工具、爱好、全部。
- 每个状态均断言可见卡片标题集合完全匹配预期、计数器分母正确、页面无横向溢出、隐藏卡片不占布局，并检查 pin 是否符合所选集合的卡片数量。
- 桌面爱好状态额外滚动到 pin 终点，断言计数到达 `03/03` 且最后一张卡右缘与视口右缘的间距不超过 40px；reduced-motion 的原生横向滚动也执行同一终点检查。
- 检查筛选文案、分类组无障碍名称和所有按钮的 pressed 状态，防止重新引入假筛选说明。

### 本轮验证结果

- `npm run build`：通过。
- `npm run verify:ui`：**148/148 checks passed**，无运行期错误。
