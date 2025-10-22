## ADDED Requirements

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
