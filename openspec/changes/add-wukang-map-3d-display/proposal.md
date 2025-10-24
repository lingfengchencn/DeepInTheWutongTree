# Change Proposal: Wukang Building 3D Map Showcase

## Why
- Showcase the signature Wukang Building as the hero asset on the洋房详情页, reinforcing the demo narrative with a distinctive 3D experience.
- Align with the new双列首页体验 by providing a coherent follow-up view where navigation from AI 控制台 lands on an immersive 3D map scene.
- Demonstrate continuous motion and precision by loading the洋房模型 inside the map canvas, rotating it to highlight architectural details and signal loading success.

## What Changes
- Embed the Wukang Building GLTF/GLB model directly onto the Three.js home map scene when the view switches to该洋房, positioning it accurately relative to the base map.
- Add a rotation showcase mode: on进入洋房页面 the model performs a smooth slow spin with easing, then settles into an idle breathing animation.
- Introduce a contextual UI overlay (badge + caption) near the model describing key metadata (year, style) without blocking the map camera.
- Update导航逻辑 so when AI 导览触发“洋房导览” the map centers, zooms slightly, and begins the rotation presentation.
- Provide fallback copy/placeholder when模型缺失 or fails to load, keeping the page functional.

## Success Metrics
- Model loads and begins rotation within 1.5s on modern laptops; fallback displays within 800ms if asset missing.
- Frame rate remains ≥ 45fps during the rotation showcase on the demo hardware.
- AI 导览导航→洋房展示流程成功率 100% during demo rehearsal.

## Scope
- **In scope**: Three.js scene updates, new animation loop, UI overlay additions, glue code in状态管理 to trigger rotation, asset loading tweaks for武康大楼.
- **Out of scope**: Photoreal material rework, lighting overhaul for other houses, mobile responsiveness beyond existing baseline.

## Dependencies
- Existing `MapHome` Three.js infrastructure and脚本执行器.
- Wukang Building GLTF/texture assets stored under `public/assets/`.
- Zustand store for导航状态和导览脚本.

## Risks & Mitigations
- **Asset size**: Large GLTF could delay loading → compress textures, use DRACO/glTF KTX.
- **Animation jitter**: Additional rotation may conflict with existing scene rotation → gate new animation with dedicated group and easing.
- **Navigation regression**: Centering logic might fight with other hot spots → isolate to house view and reset on返回首页.

## Approvals
- Proposal Reviewer: 待定
- Design Reviewer: 待定
- Delivery Owner: 待定
