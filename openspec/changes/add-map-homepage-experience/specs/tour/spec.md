## ADDED Requirements

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
