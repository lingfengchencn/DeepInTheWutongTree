# Change Proposal: 3D Map Conversational Homepage

## Why
- Align首页体验与 ingress/pokemon go 式地图交互，强化“AI 导游 + 城市探索”的沉浸感。
- 将梧桐导览员的语音介绍与对话脚本放在 AP 的第一印象，覆盖当前位置、活动、洋房与故事。
- 构建一个自动引导的语音脚本系统，让评委听完开场后可无缝跳转至指定洋房详情。

## What Changes
- 新增“系统首页”（Map Hub）视图：全屏 3D 地图，实时位置中心点、周边活动/洋房热点，以及底部圆形 AI 交互按钮。
- 机器人交互按钮：默认录音态（动画脉动），用户可点击切换为待机麦克风；播放语音脚本时显示波形或光圈。
- 扩展数据模型：在洋房 JSON 中增加 `script` 数组，描述对话角色、文本、音频、navigate_to 目标。
- 构建脚本执行器：按顺序播放音频，渲染对话气泡，遇到 `navigate_to` 时自动跳转对应详情页并继续播报。
- 首页语音脚本覆盖：当前位置、周边活动、周边洋房、周边故事 → 用户说某洋房 → AI确认 → 自动跳转洋房详情 → AI继续该洋房脚本。

## Success Metrics
- 首页脚本完整播放时间 ≤ 30 秒；音频播放、文字渲染与地图状态同步无卡顿。
- 圆形机器人按钮操作响应 < 200ms，同步显示录音/静音状态与脚本进度。
- 导航跳转成功率（脚本触发 navigate_to）= 100%，且详情页脚本无中断。

## Scope
- **In Scope**: 首页地图布局、脚本数据结构与执行器、音频播放逻辑、导航联动、机器人控件 UI。
- **Out of Scope**: 实时定位 API 接入、多用户共行、真实语音识别上传、地图上的 AR 效果。

## Dependencies
- three.js 地图视图 + 摄像机围绕（可扩展 current TourScene 或新建 MapScene）。
- Web Audio / HTMLAudioElement 播放器。
- 扩展 `data/houses/*.json` script 数据（预置音频 URL）。

## Key Decisions
- **地图渲染策略**：沿用 three.js + 自定义地理底图，以建筑模型/标记渲染 hotspots。
- **对话脚本模型**：采用 JSON 数组驱动，角色字段区分 AI / user，支持可选 navigate_to。
- **脚本执行器**：支持自动播放、用户打断与重播；在 navigate_to 发生时调用现有路由/状态切换。

## Open Questions
- 音频资源具体存放路径（`public/assets/audio`？）及格式（mp3/ogg）。
- 首页地图是否需要实时位置动效，或使用固定演示位置即可。

## Risks & Mitigations
- **音频加载延迟**：预加载脚本所需音频或在播放前提示 loading。
- **地图性能**：保证首页地图模型简化，仅保留必要热点。
- **脚本分支复杂度**：当前按线性脚本实现，若未来需要分支，需要额外状态图设计。

## Timeline (Target)
- T+2：地图首页与机器人按钮基本 UI。
- T+4：脚本执行器与音频联动完成。
- T+5：数据填充、navigate_to 跳转串联详情页。
- T+6：打磨 UI 动效与测试。

## Stakeholders
- 产品/体验：梧桐深处项目组
- 技术：前端 3D & 语音系统工程师
- 内容：音频录制、脚本编排负责人

## Approval
- Proposal Reviewer: 待指派
- Design Reviewer: 待指派
- Delivery Owner: 待指派
