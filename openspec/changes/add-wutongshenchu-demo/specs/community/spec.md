## ADDED Requirements

### Requirement: Community Engagement Layer
Demo MUST 提供面向游客和业主的互动入口，展示活动与用户生成内容。

#### Scenario: Activity Spotlight
- **GIVEN** 导览员提到某栋洋房的当期活动
- **WHEN** 用户打开社区面板
- **THEN** 面板列出活动详情、报名 CTA 与剩余名额（mock 数据）
- **AND** 用户报名操作返回成功提示（不需真实后端）

#### Scenario: Memory Wall
- **GIVEN** 用户浏览社区晒图/点评
- **WHEN** 滚动至用户故事
- **THEN** 应用展示最近的打卡内容、照片与简短评论
- **AND** 用户可点赞或收藏，操作即时反馈
