## MODIFIED Requirements

### Requirement: Immersive AI-Led Tour Loop
梧桐深处 Demo MUST deliver a单次体验串联启动页、3D 导览、语音交互与故事播放，支持零点击语音驱动。

#### Scenario: Voice-Driven Route
- **GIVEN** 评审进入 Demo 的导览主页面
- **WHEN** 评审说出如“开始导览”或点击导览员提示
- **THEN** three.js 相机自动围绕当前洋房旋转，并播放导览员的语音介绍
- **AND** 导览员在故事节点展示提示气泡与下一步语音指令

#### Scenario: Interior Deep Dive
- **GIVEN** 导览进行中且存在室内视角
- **WHEN** 用户发出“看看里面”或点击入口热点
- **THEN** 镜头切换至预设室内视角并加载对应故事或复原视频
- **AND** 导览员继续语音讲解并提供返回室外选项

### Requirement: Offline Demo Safeguard
Demo MUST 在弱网或无网环境保持可演示性，保障现场展示稳定。

#### Scenario: Connectivity Drop
- **GIVEN** 演示设备失去网络连接
- **WHEN** 操作人员启动 Demo 的离线模式
- **THEN** 应用自动播放预录的语音、镜头路径与交互提示
- **AND** 所有关键信息（故事、活动、估值）仍可从本地缓存呈现

### Requirement: Map-Centric Conversational Homepage
Demo MUST 提供 3D 地图首页，中心展示用户位置与周边洋房、活动热点，并通过语音脚本介绍整体概况。

#### Scenario: Auto Narrative on Load
- **GIVEN** 用户进入系统首页
- **WHEN** 首页加载完成
- **THEN** 梧桐导览员自动播放脚本，描述当前位置、周边活动、洋房与故事，并在地图上高亮对应热点

### Requirement: Conversational Robot Control
首页 MUST 提供圆形机器人交互按钮，默认录音态，支持切换静音并与脚本播放状态同步。

#### Scenario: Toggle Listening State
- **GIVEN** 首页脚本正在播放
- **WHEN** 用户点击机器人按钮
- **THEN** 按钮切换为静音/待机态，暂停或恢复脚本音频及对话渲染，麦克风图标随状态更新

### Requirement: Script-Driven Navigation
脚本节点 MAY 指定 `navigate_to`，系统 MUST 在音频播放完成后自动跳转至对应洋房详情并继续脚本。

#### Scenario: Guided Jump
- **GIVEN** 脚本节点包含 `navigate_to: house/wukang-building`
- **WHEN** 该节点音频播放结束
- **THEN** 应用导航至武康大楼详情视图并继续播放该洋房的脚本

## ADDED Requirements

### Requirement: Split Presentation Shell
演示界面 MUST 拥有左右两栏：左侧展示小程序导览视图，右侧展示 AI 后端状态与控制按钮。

#### Scenario: Dual Panel Layout
- **GIVEN** 演示开始
- **WHEN** 页面渲染完成
- **THEN** 左栏显示地图/洋房视图，右栏展示脚本队列、当前状态与快捷按钮

### Requirement: Manual Navigation Controls
右栏 MUST 提供刷新、首页、洋房详情、室内四个按钮，点击后立即更新左侧视图并停止脚本。

#### Scenario: Manual Override
- **GIVEN** AI 正在播放脚本
- **WHEN** 演示者点击“洋房详情”
- **THEN** 系统切换到当前洋房详情视图，脚本暂停，等待后续 AI 指令

### Requirement: AI Event-Driven Switching
视图切换 MUST 依赖 AI 推送的 `navigateTo` 事件；若没有收到导航事件则保持当前视图。

#### Scenario: Await Navigation
- **GIVEN** 当前脚本没有 `navigateTo`
- **WHEN** 音频播放结束
- **THEN** 左侧视图保持不变，状态面板提示“等待 AI 控制”
