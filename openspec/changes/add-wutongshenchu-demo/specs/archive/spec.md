## ADDED Requirements

### Requirement: One-House-One-File Archive
Demo MUST 为每栋洋房加载结构化档案，囊括故事、媒体与所有者信息，并与导览实时联动。

#### Scenario: Archive Sync
- **GIVEN** 导览进入某栋洋房的故事节点
- **WHEN** 用户展开档案抽屉
- **THEN** 系统展示该洋房的故事摘要、关键时间线、历史照片与现任业主
- **AND** 档案中的内容与导览语音描述保持一致

### Requirement: Asset Traceability Metadata
每条档案记录 MUST 记录素材来源与采集责任人，支持后续扩展。

#### Scenario: View Asset Provenance
- **GIVEN** 用户在档案中查看历史照片
- **WHEN** 点击“来源”或查看详情
- **THEN** 系统显示照片采集时间、提供者与引用许可说明
