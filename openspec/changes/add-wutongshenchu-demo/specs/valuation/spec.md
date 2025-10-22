## ADDED Requirements

### Requirement: Investment Guidance Panel
Demo MUST 呈现针对洋房的估值指标，并允许评委通过对话获取投资建议。

#### Scenario: Valuation Overview
- **GIVEN** 导览员引导用户查看投资评估
- **WHEN** 用户打开估值面板
- **THEN** 面板展示收藏评级、保值指数、交易趋势等可视化指标（基于 mock 数据）
- **AND** 指标附带简短解读说明其意义与来源

#### Scenario: AI Investment Q&A
- **GIVEN** 用户在估值面板中提出投资问题（语音或按钮）
- **WHEN** AI 响应请求
- **THEN** 提供上下文相关的建议或风险提示，并引用档案或市场数据来源
