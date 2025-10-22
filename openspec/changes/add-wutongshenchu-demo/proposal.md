# Change Proposal: 梧桐深处 Mini App Demo

## Why
- Showcase the "有记忆、有温度的上海老洋房社区" vision as a competition-ready mini app demo that blends AI导览、数字档案、社区共创与投资评估 into one immersive journey.
- Deliver a magazine-like体验 that matches the Art Deco + 现代简约 design language and demonstrates how老洋房故事化、拟人化的内容能够驱动拉新与留存。
- Validate商业假设：以AI导览为引流入口，数字档案构建护城河，用户共创维持活跃，投资评估探索变现路径。

## What Changes
- Create an end-to-end H5 demo（模拟微信小程序容器）覆盖核心流：启动页 → 智能导览 → 数字档案 → 社区互动 → 投资评估 → 展示收尾。
- Stand up a统一AI中枢（Coze SDK mock）驱动语音/文字导览、房灵对话与活动推荐。
- 引入 three.js + 高德地图 WebGL 叠加方案呈现 3D 洋房模型，提供自动环绕、室内切换、故事触发等沉浸交互。
- 建立“一房一档”数据结构与 demo 资产（2-3 栋样板洋房），串联故事、照片、活动、交易信息。
- 实现社区打卡、活动报名与 UGC 展示的前端交互（使用 mock 数据）。
- 设计投资评估看板（AI 答疑 + 可视化指标）验证变现叙事。

## Success Metrics
- 评审演示全流程 ≤ 6 分钟，零人工干预，评委可通过语音指令完成导览。
- Demo 覆盖至少 2 栋洋房的 3D 模型、故事、活动与估值样例。
- 用户反馈（演示环节）对沉浸感与故事性评价平均 ≥ 4/5。

## Scope
- **In Scope**: H5 容器模拟、3D 导览场景、AI 导览语音链路、档案/社区/估值 UI、mock 数据与本地离线脚本。
- **Out of Scope**: 真实线上接口、真实 AI 模型接入、地图 LBS 精准定位、交易撮合功能、完整多语言支持。

## Dependencies
- three.js（渲染 3D 洋房模型）
- 高德地图 WebGL JS API（地图底板与城市信息）
- Coze SDK 或 mock 版本（语音/对话）
- 预制 3D 模型、历史照片、故事文本、活动与估值样例数据

## Key Decisions
- **3D 地图技术栈**: 采用 three.js + 高德地图 WebGL。three.js 提供自定义模型、高级动效与跨端控制；高德在国内 LBS 数据、POI 丰富度与移动端 WebGL 性能方面优于百度，且提供更精细的矢量底图与小程序兼容方案。Baidu Map WebGL 优势在于自研 3D 城市模型，但授权复杂、移动端帧率整体偏低且无法脱离其底层渲染 pipeline，自定义 3D 模型与交互自由度较低。因此，优先选用高德作为底板，保留录屏级别的备选降级方案。
- **离线演示保障**: 提供脚本化 Demo 模式（预录语音、相机路径、互动提示），确保弱网/无网环境可稳定播放。
- **视觉风格**: 全局遵循 Art Deco 几何框饰 + 深色主色调 + 哑光金点缀，关键交互加入优雅渐入/平移动画，模拟“电子杂志”体验。

## Open Questions
- 是否需要在 demo 阶段引入 Mapbox 以对比更多三方数据源或保留更国际化的展示（决策会影响 license 成本）。
- 3D 模型资产来源：是由内部手工建模、Photogrammetry 扫描还是第三方购买？不同来源成本与进度不同。
- 语音引擎最终选择（科大讯飞/腾讯语音等）是否需要在 demo 版就体现差异化？

## Risks & Mitigations
- **3D 性能瓶颈**：移动端帧率低 → 控制模型面数、懒加载贴图、提供录屏 fallback。
- **语音链路不稳定**：TTS/ASR 延迟 → demo 模式预录、多步交互设置超时提示。
- **数据准备不足**：故事、照片缺失 → 明确 2-3 栋试点洋房的资料范围，提前锁定采集负责人。
- **时间压力（比赛 Day-0）**：功能未完成 → 采用每天可演示的里程碑，关键路径优先完成导览主线。

## Timeline (Target)
- T+0 启动：确定 demo 范围与资产清单。
- T+3 天：完成地图 + 3D 模型集成与导览主线。
- T+5 天：补齐档案、社区、估值 UI 与数据。
- T+7 天：语音闭环 & 离线脚本完善，内部彩排。
- T+9 天：评审彩排、收口与录屏。

## Stakeholders
- 产品 & 策展：梧桐深处项目组
- 技术：前端 3D & 小程序团队、AI 平台同学
- 内容：故事采写、照片采集、估值模型顾问

## Approval
- Proposal Reviewer: 待指派
- Design Reviewer: 待指派
- Delivery Owner: 待指派
