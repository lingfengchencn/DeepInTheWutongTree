## ADDED Requirements

### Requirement: Ceremonial Splash Entrance
梧桐深处 Demo MUST 在进入主导览前展示 2-4 秒的仪式感启动页，呈现品牌视觉与加载进度。

#### Scenario: Guided Launch
- **GIVEN** 用户首次打开 Demo
- **WHEN** 应用开始加载核心资源
- **THEN** 启动页显示纸质纹理背景、Art Deco 线条动画汇聚 Logo 与 Slogan
- **AND** 底部黄铜细线进度条在最小展示时间内平滑推进，完成后自动过渡到导览主界面

### Requirement: Configurable Display Duration
启动页 MUST 支持配置最小展示时长与资源加载完成信号，避免过快或过慢的体验。

#### Scenario: Fast Load Guard
- **GIVEN** 资源在 500ms 内加载完成
- **WHEN** 启动页收到加载完成事件
- **THEN** 启动页继续展示至达到设定的最小展示时长（≥ 2 秒）
- **AND** 之后平滑过渡到导览界面而无突兀闪屏

#### Scenario: Slow Load Safeguard
- **GIVEN** 资源加载超过设定的最大展示时长
- **WHEN** 启动页计时达到上限（默认 6 秒）
- **THEN** 启动页展示结束动画并进入导览界面，同时以系统提示记录潜在性能异常
