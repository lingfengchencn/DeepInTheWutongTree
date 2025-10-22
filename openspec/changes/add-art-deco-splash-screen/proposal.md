# Change Proposal: Art Deco Splash Launch Sequence

## Why
- Elevate首次触达体验，让梧桐深处 Demo 在启动时即传达“有记忆、有温度”的品牌调性。
- 呼应 `docs/epic.md` 中的 Magazine 式视觉要求，用 Art Deco 动画与复古材质为后续导览做铺垫。
- 为后续比赛演示提供稳定的 loading 过渡，隐藏资源加载延迟并营造仪式感。

## What Changes
- 增加独立启动页视图，覆盖背景纹理、Art Deco 线条动画、品牌 Slogan 与细线黄铜色进度条。
- 建立动画状态机：线条绘制 → Logo 汇聚 → Slogan 渐显 → 进度条推进 → 自动进入主界面。
- 提供可配置的最小展示时长与资源加载完成后自动收起机制。
- 产出纹理素材（旧羊皮纸/老照片纸质感）与矢量 Logo 动画资产。

## Success Metrics
- 启动页展示时间 2-4 秒，可通过配置覆盖演示节奏。
- 动画整个过程帧率 ≥ 50fps（桌面 Chrome），过渡后主界面渲染无白屏闪烁。
- 观众测试中（内测）品牌沉浸感评分 ≥ 4/5。

## Scope
- **In Scope**: React 组件与动画逻辑、SVG/CSS/Canvas 动画实现、纹理与进度条 UI、配置化过渡时长。
- **Out of Scope**: 多语言 Slogan 切换、音效设计、真实资源加载队列管理、可交互跳过按钮。

## Dependencies
- 现有 Vite + React + three.js 技术栈。
- 设计同学提供 Logo 几何或 SVG；若缺失则使用程序化线条动画占位。
- 纹理素材（老照片纸张）来源于品牌库或免版权资源。

## Key Decisions
- **动画技术路线**：优先使用 SVG + CSS + React Spring（或纯 CSS keyframes）实现线条绘制与 Logo 汇聚，保证体积小且易迭代；必要时借助 Canvas 绘制噪点纹理。
- **进度反馈**：基于资源加载 Promise 与最小展示时长的组合，确保既有真实进度，又不会瞬间闪过。
- **可重用性**: 将启动页封装为独立状态容器，可在离线脚本/在线模式下复用并支持未来扩展（如加入语音问候）。

## Open Questions
- Logo 动画所需的矢量路径是否已有？若无需不需要临时设计？
- 进度条是否需要与实际资源加载挂钩（例如模型/音频预加载），还是固定时间演进即可？

## Risks & Mitigations
- **素材缺失**：若短期内无 Logo SVG，可先使用几何线条动画与文字替代。
- **性能问题**：动画过多导致掉帧 → 控制元素数量，使用 GPU 友好的 transforms。
- **展示节奏**：加载过快或过慢 → 通过 `minimumDisplayMs` 配置和 `maxDisplayMs` 兜底。

## Timeline (Target)
- T+1：确定素材、动画稿与实现方式。
- T+3：完成静态画面 + 纹理 + 基础动画。
- T+5：接入进度控制、完成与主应用的切换逻辑。
- T+6：内测并优化动效节奏。

## Stakeholders
- 产品/品牌：梧桐深处项目组
- 设计：视觉/动效设计师
- 前端：体验工程师

## Approval
- Proposal Reviewer: 待指派
- Design Reviewer: 待指派
- Delivery Owner: 待指派
