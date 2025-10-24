# 梧桐深处 · City Tour Demo

沉浸式的梧桐里城市漫游 Demo，使用 React、Vite 与 Three.js 呈现城市地图、洋房导览与室内故事。项目内置了武康大楼等洋房的 3D 模型、文字脚本与音频，可用于快速演示或二次创作。

## 主要功能
- **城市首页**：演示地图缩略图、热点气泡与 AI 引导脚本自动播放。
- **洋房导览视图**：加载指定洋房的 GLTF 模型、展示活动与故事气泡。
- **室内探索**：切换到室内场景，播放对应的故事与视频/图片资源。
- **AI 控制台**：模拟语音/文本指令，驱动导航、脚本与室内切换。

## 项目结构速览
- `src/home/MapHome.tsx`：Three.js 地图与洋房展示的核心逻辑。
- `data/houses/*.json`：每栋洋房的描述、脚本、模型路径等数据源。
- `src/shared/script/offlineScript.ts`：离线演示脚本步骤。
- `public/assets/gaolan/`：GLB 模型、封面图片与室内图片。
- `public/assets/audio/`：脚本引用的音频资源（默认是静音占位）。

## 如何修改展示内容

### 更改首页/导览文案
编辑 `data/houses/<house-id>.json`：
- `script.home` 控制首页自动播报的台词与导航指令。
- `script.detail` 描述洋房导览与室内场景的叙述。
- `timeline`、`activities`、`narratives` 控制展示的历史事件、活动与故事。

修改后保存即可，Vite 开发服务器会自动热更新。

### 调整洋房模型与图片
- `model.url` 指向的 GLB 文件放在 `public/assets/gaolan/`。
- `model.height`、`footprint` 会影响缩放与对齐。
- 图片资源（例如封面、故事插图）同样放在 `public/assets/gaolan/`，在 JSON 中引用对应路径。

### 替换音频
脚本中的 `audio` 字段引用 `public/assets/audio/` 下的文件：
```json
{
  "character": "AI",
  "text": "这里是武康大楼……",
  "audio": "/assets/audio/wukang-intro.mp3"
}
```
将新的音频文件放入该目录，并在 JSON 里替换路径即可。

### 更新 AI 控制台按钮文案
`src/presentation/AiControlPanel.tsx` 内定义了“返回首页”“洋房导览”“进入室内”等按钮与触发逻辑，可在这里调整提示语或行为。

## 本地开发

### 环境准备
- Node.js 20
- pnpm 8

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm dev
```
默认会在 `http://localhost:5173/` 启动 Vite 开发服务器，保存文件即热更新。

### 其他常用命令
- `pnpm build`：打包静态资源。
- `pnpm lint`：检查并格式化代码。
- `pnpm test`：运行 Vitest 单元测试。

## 进阶提示
- 如果需要在启动时加载新的洋房数据，确保在 `src/shared/data/loadHouses.ts` 中导入并加入数组。
- 室内场景的默认封面图在 `src/home/HomeInterior.tsx` (`heroImage`) 中配置，可按需替换。
- 线上/离线脚本共存：`useScriptRunner` 负责首页和导览自动播放；`useOfflineScript` 控制纯离线演示，修改 `offlineScript.ts` 即可。

欢迎根据自己的场景扩展更多洋房与互动体验。祝开发顺利！
