import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useAppStore } from '../shared/state/useAppStore';
import { useScriptRunner } from '../shared/hooks/useScriptRunner';
import { useAiControlStore } from '../shared/state/useAiControlStore';
import type { HouseProfile } from '../shared/types';
import './MapHome.css';
import { HomeInterior } from './HomeInterior';

const GLOBAL_MODEL_SCALE = 2.3;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.6;

export const MapHome = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number>();
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const markerLayerRef = useRef<THREE.Group | null>(null);
  const showcaseLayerRef = useRef<THREE.Group | null>(null);
  const markerStoreRef = useRef<Record<string, { label: THREE.Mesh; texture: THREE.Texture }>>({});
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const showcaseHouseIdRef = useRef<string | null>(null);
  const billboardResourceRef = useRef<{ texture?: THREE.Texture } | null>(null);
  const billboardMeshRef = useRef<THREE.Mesh | null>(null);
  const highlightRef = useRef<THREE.Mesh | null>(null);
  const highlightPhaseRef = useRef(0);
  const rotationActiveRef = useRef(false);
  const rotationSpeedRef = useRef(0);
  const breathingPhaseRef = useRef(0);
  const cameraDestinationRef = useRef(new THREE.Vector3(0, 160, 210));
  const cameraLookAtRef = useRef(new THREE.Vector3(0, 0, 0));
  const cameraLookDestinationRef = useRef(new THREE.Vector3(0, 0, 0));
  const mapRotationSpeedRef = useRef(0.0008);
  const resumeMapRotationSpeedRef = useRef(0.0008);
  const contextLayerRef = useRef<THREE.Group | null>(null);
  const contextModelsRef = useRef<Record<string, THREE.Group>>({});
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const initialMapRotationRef = useRef(0);
  const resumeRotationTimerRef = useRef<number | null>(null);
  const zoomFactorRef = useRef(1);

  const houses = useAppStore((state) => state.houses);
  const highlightedHouseId = useAppStore((state) => state.highlightedHouseId);
  const setHighlightedHouse = useAppStore((state) => state.setHighlightedHouse);
  const guideRequest = useAppStore((state) => state.guideRequest);
  const userSpeak = useAppStore((state) => state.userSpeak);
  const recordNavigationIntent = useAppStore((state) => state.recordNavigationIntent);
  const currentHouse = useAppStore((state) => state.currentHouse);
  const stage = useAppStore((state) => state.stage);
  const view = useAppStore((state) => state.view);
  const isHouseView = view === 'house';
  const isInterior = stage === 'interior';

  const primaryHouse: HouseProfile | undefined = houses[0];
  const showcaseHouse = !isInterior && isHouseView ? currentHouse ?? null : null;
  const showcaseHouseId = showcaseHouse?.id ?? null;

  const interruptToken = useAiControlStore((state) => state.interruptToken);
  const waitingForAi = useAiControlStore((state) => state.waitingForAi);

  const shouldAutoPlayHomeScript = !waitingForAi && stage === 'home' && view === 'home';
  const { isPlaying, stop } = useScriptRunner(primaryHouse?.script.home ?? [], {
    autoStart: shouldAutoPlayHomeScript,
    resetKey: `${primaryHouse?.id ?? 'none'}-${interruptToken}-${stage}`
  });

  const computeMapCoordinates = useCallback(
    (house: HouseProfile) => {
      if (isHouseView && !isInterior && house.id !== showcaseHouseId) {
        return {
          x: house.mapPosition.x * 1.6,
          z: house.mapPosition.z * 1.6
        };
      }
      return house.mapPosition;
    },
    [isHouseView, isInterior, showcaseHouseId]
  );

  const updateCameraTargets = useCallback(
    (house: HouseProfile | null, houseView: boolean, zoomOverride?: number) => {
      const nextZoom = zoomOverride ?? zoomFactorRef.current;
      const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
      zoomFactorRef.current = clampedZoom;
      const zoomMultiplier = clampedZoom;

      if (houseView && house) {
        const baseY = Math.max(36, (house.model.height ?? 24) * 0.9);
        const baseOffsetZ = Math.max(120, baseY * 0.9);
        const lookBaseY = Math.max(14, (house.model.height ?? 24) * 0.6);

        cameraDestinationRef.current.copy(
          new THREE.Vector3(
            house.mapPosition.x,
            baseY * zoomMultiplier,
            house.mapPosition.z + baseOffsetZ * zoomMultiplier
          )
        );
        cameraLookDestinationRef.current.copy(
          new THREE.Vector3(
            house.mapPosition.x,
            Math.max(10, lookBaseY * Math.max(0.6, zoomMultiplier * 0.9)),
            house.mapPosition.z
          )
        );
      } else {
        const baseY = 160;
        const baseZ = 210;
        cameraDestinationRef.current.copy(new THREE.Vector3(0, baseY * zoomMultiplier, baseZ * zoomMultiplier));
        cameraLookDestinationRef.current.copy(new THREE.Vector3(0, 0, 0));
      }
    },
    []
  );

  const refreshMarkers = useCallback(() => {
    console.log('[MapHome] refreshMarkers invoked', {
      housesCount: houses.length,
      highlightedHouseId,
      isHouseView,
      showcaseHouseId
    });
    const markerLayer = markerLayerRef.current;
    if (!markerLayer) return;

    const disposeMaterial = (material: THREE.Material | THREE.Material[]) => {
      if (Array.isArray(material)) {
        material.forEach(disposeMaterial);
        return;
      }
      const anyMaterial = material as THREE.Material & { map?: THREE.Texture };
      if (anyMaterial.map) {
        anyMaterial.map.dispose();
      }
      material.dispose();
    };

    Object.values(markerStoreRef.current).forEach(({ label, texture }) => {
      markerLayer.remove(label);
      label.geometry.dispose();
      disposeMaterial(label.material as THREE.Material | THREE.Material[]);
      texture.dispose();
    });
    markerStoreRef.current = {};

    houses.forEach((house) => {
      const isHighlighted = house.id === highlightedHouseId;
      if (isHouseView && house.id === showcaseHouseId) {
        console.log('[MapHome] refreshMarkers skip showcase marker', house.id);
        return;
      }
      const coords = computeMapCoordinates(house);
      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = 256;
      labelCanvas.height = 128;
      const ctx = labelCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(8,11,18,0.75)';
        ctx.fillRect(0, 0, labelCanvas.width, labelCanvas.height);
        ctx.fillStyle = '#ffe8c8';
        ctx.font = '28px "Noto Serif SC", serif';
        ctx.fillText(house.name, 22, 54);
      }
      const texture = new THREE.CanvasTexture(labelCanvas);
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(28, 14),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true })
      );
      label.position.set(coords.x, isHouseView ? 28 : 34, coords.z);
      label.lookAt(new THREE.Vector3(0, 140, 160));
      markerLayer.add(label);

      markerStoreRef.current[house.id] = { label, texture };
      console.log('[MapHome] refreshMarkers added marker', {
        houseId: house.id,
        isHighlighted
      });
    });
  }, [computeMapCoordinates, houses, highlightedHouseId, isHouseView, showcaseHouseId]);

  useEffect(() => {
    console.log('[MapHome] highlightedHouse effect', {
      highlightedHouseId,
      primaryHouseId: primaryHouse?.id
    });
    if (!highlightedHouseId && primaryHouse) {
      setHighlightedHouse(primaryHouse.id);
    }
  }, [highlightedHouseId, primaryHouse, setHighlightedHouse]);

  useEffect(() => {
    const container = containerRef.current;
    console.log('[MapHome] scene effect triggered', {
      hasContainer: Boolean(container),
      isHouseView,
      isInterior,
      currentHouseId: currentHouse?.id
    });
    if (!container) {
      if (modelGroupRef.current) {
        console.log('[MapHome] scene effect: disposing lingering model due to missing container');
        disposeModelGroup();
      }
      return;
    }
    if (!isHouseView || isInterior) {
      console.log('[MapHome] scene effect: tearing down renderer', {
        isHouseView,
        isInterior
      });
      if (modelGroupRef.current) {
        console.log('[MapHome] scene effect: disposing model group during teardown');
        disposeModelGroup();
      }
      if (rendererRef.current) {
        const renderer = rendererRef.current;
        if (renderer.domElement.parentElement === container) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
        rendererRef.current = undefined;
      }
      sceneRef.current = undefined;
      cameraRef.current = undefined;
      markersGroupRef.current = null;
      markerLayerRef.current = null;
      showcaseLayerRef.current = null;
      contextLayerRef.current = null;
      return;
    }

    console.log('[MapHome] scene effect: initializing renderer');
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#080b12');
    scene.fog = new THREE.Fog('#080b12', 120, 320);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 800);
    camera.position.set(0, 160, 210);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    cameraRef.current = camera;
    cameraDestinationRef.current.copy(camera.position);
    cameraLookAtRef.current.set(0, 0, 0);
    cameraLookDestinationRef.current.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    const ambient = new THREE.AmbientLight(0xfef5da, 0.6);
    const directional = new THREE.DirectionalLight(0xffd8a8, 1.1);
    directional.position.set(-140, 220, 160);
    directional.castShadow = true;

    scene.add(ambient);
    scene.add(directional);

    const baseGeometry = new THREE.CircleGeometry(160, 64);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: '#1d2334',
      roughness: 0.9,
      metalness: 0.1
    });
    const basePlane = new THREE.Mesh(baseGeometry, baseMaterial);
    basePlane.rotation.x = -Math.PI / 2;
    basePlane.receiveShadow = true;
    scene.add(basePlane);

    const glowRing = new THREE.Mesh(
      new THREE.RingGeometry(115, 120, 64),
      new THREE.MeshBasicMaterial({ color: 0xffd199, side: THREE.DoubleSide, opacity: 0.2, transparent: true })
    );
    glowRing.rotation.x = -Math.PI / 2;
    scene.add(glowRing);

    const markersRoot = new THREE.Group();
    const markerLayer = new THREE.Group();
    const showcaseLayer = new THREE.Group();
    markersRoot.add(markerLayer);
    markersRoot.add(showcaseLayer);
    const contextLayer = new THREE.Group();
    markersRoot.add(contextLayer);
    markersGroupRef.current = markersRoot;
    markerLayerRef.current = markerLayer;
    showcaseLayerRef.current = showcaseLayer;
    contextLayerRef.current = contextLayer;
    scene.add(markersRoot);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    refreshMarkers();

    const animate = () => {
      if (markersGroupRef.current) {
        markersGroupRef.current.rotation.y += mapRotationSpeedRef.current;
      }

      camera.position.lerp(cameraDestinationRef.current, 0.035);
      cameraLookAtRef.current.lerp(cameraLookDestinationRef.current, 0.035);
      camera.lookAt(cameraLookAtRef.current);

      const showcaseGroup = modelGroupRef.current;
      if (showcaseGroup) {
        if (rotationActiveRef.current) {
          showcaseGroup.rotation.y += rotationSpeedRef.current;
          breathingPhaseRef.current += 0.02;
          const breath = 1 + Math.sin(breathingPhaseRef.current) * 0.006;
          showcaseGroup.scale.set(breath, breath, breath);
        } else if (breathingPhaseRef.current !== 0) {
          breathingPhaseRef.current = 0;
          showcaseGroup.scale.set(1, 1, 1);
        }
        const billboard = billboardMeshRef.current;
        if (billboard) {
          billboard.lookAt(camera.position.x, billboard.position.y, camera.position.z);
        }
      }

      const highlight = highlightRef.current;
      if (highlight) {
        highlightPhaseRef.current += 0.025;
        const pulse = 1 + Math.sin(highlightPhaseRef.current) * 0.08;
        highlight.scale.set(pulse, 1, pulse);
        const material = highlight.material as THREE.MeshBasicMaterial;
        material.opacity = 0.2 + (Math.sin(highlightPhaseRef.current) + 1) * 0.15;
      }

      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      renderer.setSize(newWidth, newHeight);
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      console.log('[MapHome] scene effect cleanup begin');
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      baseGeometry.dispose();
      glowRing.geometry.dispose();
      if (markersRoot.parent) {
        markersRoot.parent.remove(markersRoot);
      }
      const disposeMaterial = (material: THREE.Material | THREE.Material[]) => {
        if (Array.isArray(material)) {
          material.forEach(disposeMaterial);
          return;
        }
        const anyMaterial = material as THREE.Material & { map?: THREE.Texture };
        if (anyMaterial.map) {
          anyMaterial.map.dispose();
        }
        material.dispose();
      };
      Object.values(markerStoreRef.current).forEach(({ label, texture }) => {
        label.geometry.dispose();
        disposeMaterial(label.material as THREE.Material | THREE.Material[]);
        texture.dispose();
      });
      markerStoreRef.current = {};
      sceneRef.current = undefined;
      cameraRef.current = undefined;
      rendererRef.current = undefined;
      markersGroupRef.current = null;
      markerLayerRef.current = null;
      showcaseLayerRef.current = null;
      contextLayerRef.current = null;
      contextModelsRef.current = {};
      console.log('[MapHome] scene effect cleanup end');
    };
  }, [isHouseView, isInterior, refreshMarkers]);

  const disposeModelGroup = useCallback(() => {
    const group = modelGroupRef.current;
    if (!group) return;
    console.log('[MapHome] disposeModelGroup', {
      groupName: group.name,
      showcaseHouseId: showcaseHouseIdRef.current
    });

    const disposeMaterial = (material: THREE.Material | THREE.Material[]) => {
      if (Array.isArray(material)) {
        material.forEach(disposeMaterial);
        return;
      }
      const anyMaterial = material as THREE.Material & { map?: THREE.Texture; emissiveMap?: THREE.Texture };
      if (anyMaterial.map) {
        anyMaterial.map.dispose();
      }
      if (anyMaterial.emissiveMap) {
        anyMaterial.emissiveMap.dispose();
      }
      material.dispose();
    };

    group.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        if (mesh.material) {
          disposeMaterial(mesh.material);
        }
      }
      if ((object as THREE.Light).isLight) {
        const light = object as THREE.Light;
        if (light.shadow && light.shadow.map) {
          light.shadow.map.dispose();
        }
      }
    });

    if (group.parent) {
      group.parent.remove(group);
    }

    modelGroupRef.current = null;
    showcaseHouseIdRef.current = null;
    highlightRef.current = null;
    highlightPhaseRef.current = 0;
    if (billboardResourceRef.current?.texture) {
      billboardResourceRef.current.texture.dispose();
    }
    billboardResourceRef.current = null;
    billboardMeshRef.current = null;
    console.log('[MapHome] disposeModelGroup complete');
  }, []);

  const prepareHouseModel = useCallback((model: THREE.Object3D, house: HouseProfile) => {
    console.log('准备处理模型:', house.name);
    
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          const material = mesh.material as THREE.Material & { side?: THREE.Side };
          material.side = THREE.DoubleSide;
        }
      }
    });

    const baseScale = house.model.scale ?? GLOBAL_MODEL_SCALE;
    const boundingBox = new THREE.Box3().setFromObject(model);
    const size = boundingBox.getSize(new THREE.Vector3());
    const center = boundingBox.getCenter(new THREE.Vector3());
    
    console.log('原始模型信息:', {
      size: { x: size.x, y: size.y, z: size.z },
      center: { x: center.x, y: center.y, z: center.z },
      baseScale,
      targetHeight: house.model.height,
      targetWidth: house.model.footprint.width,
      targetDepth: house.model.footprint.depth
    });
    
    // 重置模型位置到原点
    model.position.set(0, 0, 0);

    // 计算适合界面大小的缩放比例
    const ratios: number[] = [];
    if (house.model.height && size.y > 0) {
      ratios.push((house.model.height / size.y) * baseScale);
    }
    if (house.model.footprint.width && size.x > 0) {
      ratios.push((house.model.footprint.width / size.x) * baseScale);
    }
    if (house.model.footprint.depth && size.z > 0) {
      ratios.push((house.model.footprint.depth / size.z) * baseScale);
    }
    
    // 使用最小比例确保模型完全适合界面，但设置最小缩放值
    let finalScale = baseScale;
    if (ratios.length) {
      finalScale = Math.max(0.3, Math.min(...ratios)); // 最小缩放0.3，确保模型不会太小
    }
    
    console.log('缩放计算:', { ratios, finalScale });
    model.scale.setScalar(finalScale);

    // 重新计算边界框并调整位置
    const adjustedBox = new THREE.Box3().setFromObject(model);
    const adjustedSize = adjustedBox.getSize(new THREE.Vector3());
    const adjustedCenter = adjustedBox.getCenter(new THREE.Vector3());
    
    // 将模型中心移到原点，底部对齐地面
    model.position.x = -adjustedCenter.x;
    model.position.z = -adjustedCenter.z;
    model.position.y = -adjustedBox.min.y + 3; // 确保模型在地面上方3个单位
    
    console.log('最终模型位置:', {
      position: { x: model.position.x, y: model.position.y, z: model.position.z },
      scale: finalScale,
      adjustedSize: { x: adjustedSize.x, y: adjustedSize.y, z: adjustedSize.z }
    });

    return model;
  }, []);

  const createFallbackHouse = useCallback((house: HouseProfile) => {
    const group = new THREE.Group();

    const bodyGeometry = new THREE.BoxGeometry(
      house.model.footprint.width * 0.85,
      house.model.height,
      house.model.footprint.depth * 0.85
    );
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(house.model.color),
      metalness: 0.3,
      roughness: 0.45
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.y = house.model.height / 2 + 3;

    const roof = new THREE.Mesh(
      new THREE.CylinderGeometry(0, house.model.footprint.width * 0.6, 8, 4),
      new THREE.MeshStandardMaterial({ color: '#1d2432', roughness: 0.6 })
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = house.model.height + 7;

    const windows = new THREE.Mesh(
      new THREE.BoxGeometry(house.model.footprint.width * 0.75, house.model.height * 0.9, 2),
      new THREE.MeshBasicMaterial({ color: '#ffe3ba', transparent: true, opacity: 0.12 })
    );
    windows.position.y = house.model.height / 2 + 3;
    windows.position.z = bodyGeometry.parameters.depth / 2 + 0.2;

    group.add(body);
    group.add(roof);
    group.add(windows);

    return group;
  }, []);

  const createNameBillboard = useCallback((house: HouseProfile) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    ctx.fillStyle = 'rgba(12,16,26,0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,215,153,0.3)';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
    ctx.fillStyle = '#ffe7ba';
    ctx.font = 'bold 64px "Noto Serif SC", serif';
    ctx.fillText(house.name, 48, 128);
    ctx.fillStyle = 'rgba(225,232,255,0.75)';
    ctx.font = '36px "Noto Serif SC", serif';
    ctx.fillText(`${house.style} · ${house.yearBuilt} 年`, 48, 188);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), material);
    plane.position.set(0, (house.model.height ?? 16) + 18, -10);
    return { mesh: plane, texture };
  }, []);

  useEffect(() => {
    refreshMarkers();
  }, [refreshMarkers]);

  useEffect(() => {
    console.log('[MapHome] context models effect trigger', {
      isHouseView,
      isInterior,
      showcaseHouseId: showcaseHouse?.id,
      housesCount: houses.length
    });
    const contextLayer = contextLayerRef.current;
    if (!contextLayer) return;

    const disposeContextModels = () => {
      Object.entries(contextModelsRef.current).forEach(([, group]) => {
        contextLayer.remove(group);
        group.traverse((object) => {
          if ((object as THREE.Mesh).isMesh) {
            const mesh = object as THREE.Mesh;
            mesh.geometry?.dispose();
            if (mesh.material) {
              const material = mesh.material as THREE.Material & { map?: THREE.Texture; emissiveMap?: THREE.Texture };
              if (material.map) {
                material.map.dispose();
              }
              if (material.emissiveMap) {
                material.emissiveMap.dispose();
              }
              material.dispose();
            }
          }
          if ((object as THREE.Light).isLight) {
            const light = object as THREE.Light;
            if (light.shadow && light.shadow.map) {
              light.shadow.map.dispose();
            }
          }
        });
      });
      contextModelsRef.current = {};
    };

    disposeContextModels();

    if (!isHouseView || !showcaseHouse) {
      console.log('[MapHome] context models effect: skip', {
        isHouseView,
        showcaseHouse: showcaseHouse?.id
      });
      return () => {
        disposeContextModels();
      };
    }

    let cancelled = false;
    const loader = new GLTFLoader();

    houses.forEach((house) => {
      if (house.id === showcaseHouse.id) {
        console.log('[MapHome] context models effect: skip showcase', house.id);
        return;
      }

      const miniatureRoot = new THREE.Group();
      const coords = computeMapCoordinates(house);
      miniatureRoot.position.set(coords.x, 0, coords.z);
      contextLayer.add(miniatureRoot);
      contextModelsRef.current[house.id] = miniatureRoot;

      const attachModel = (model: THREE.Object3D) => {
        if (cancelled) {
          model.traverse((object) => {
            if ((object as THREE.Mesh).isMesh) {
              const mesh = object as THREE.Mesh;
              mesh.geometry?.dispose();
              if (mesh.material) {
                const material = mesh.material as THREE.Material;
                material.dispose();
              }
            }
          });
          return;
        }

        miniatureRoot.add(model);
        console.log('[MapHome] context miniature attached', {
          houseId: house.id,
          childCount: miniatureRoot.children.length
        });
      };

      const buildFallback = () => {
        const hasModelAsset = Boolean(house.model?.url);
        if (!hasModelAsset) {
          const billboard = createNameBillboard(house);
          if (billboard) {
            billboard.mesh.scale.setScalar(0.42);
            miniatureRoot.add(billboard.mesh);
          }
          return;
        }
        const fallback = createFallbackHouse(house);
        fallback.scale.setScalar(0.55);
        attachModel(fallback);
      };

      const url = house.model?.url;
      if (!url) {
        buildFallback();
        return;
      }

      const candidates = Array.from(
        new Set(
          [
            url,
            url.replace(/\.glb$/i, '.gltf'),
            url.replace(/\.gltf$/i, '.glb')
          ].filter((item) => item && item.length > 0)
        )
      );

      const tryLoad = (index: number) => {
        if (index >= candidates.length) {
          buildFallback();
          return;
        }

        loader.load(
          candidates[index],
          (gltf) => {
            if (cancelled) {
              return;
            }
            const prepared = prepareHouseModel(gltf.scene, house);
            prepared.scale.multiplyScalar(0.55);
            attachModel(prepared);
            console.log('[MapHome] context miniature GLTF loaded', {
              houseId: house.id,
              url: candidates[index]
            });
          },
          undefined,
          () => {
            if (!cancelled) {
              console.warn('[MapHome] context miniature load failed', {
                houseId: house.id,
                url: candidates[index]
              });
              tryLoad(index + 1);
            }
          }
        );
      };

      tryLoad(0);
    });

    return () => {
      cancelled = true;
      disposeContextModels();
    };
  }, [computeMapCoordinates, createFallbackHouse, createNameBillboard, houses, isHouseView, prepareHouseModel, showcaseHouse]);

  useEffect(() => {
    if (!isHouseView) {
      return;
    }
    const renderer = rendererRef.current;
    const dom = renderer?.domElement;
    if (!dom) {
      return;
    }

    const clearResumeTimer = () => {
      if (resumeRotationTimerRef.current !== null) {
        window.clearTimeout(resumeRotationTimerRef.current);
        resumeRotationTimerRef.current = null;
      }
    };

    const scheduleResume = () => {
      clearResumeTimer();
      resumeRotationTimerRef.current = window.setTimeout(() => {
        mapRotationSpeedRef.current = resumeMapRotationSpeedRef.current;
        rotationActiveRef.current = true;
        resumeRotationTimerRef.current = null;
      }, 1800);
    };

    const handlePointerDown = (event: PointerEvent) => {
      const markersGroup = markersGroupRef.current;
      if (!markersGroup) {
        return;
      }
      isDraggingRef.current = true;
      dragStartXRef.current = event.clientX;
      initialMapRotationRef.current = markersGroup.rotation.y;
      rotationActiveRef.current = false;
      clearResumeTimer();
      mapRotationSpeedRef.current = 0;
      dom.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current || !markersGroupRef.current) {
        return;
      }
      const deltaX = event.clientX - dragStartXRef.current;
      const rotationDelta = deltaX * 0.005;
      markersGroupRef.current.rotation.y = initialMapRotationRef.current + rotationDelta;
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!isDraggingRef.current) {
        return;
      }
      isDraggingRef.current = false;
      dom.releasePointerCapture(event.pointerId);
      scheduleResume();
    };

    dom.addEventListener('pointerdown', handlePointerDown);
    dom.addEventListener('pointermove', handlePointerMove);
    dom.addEventListener('pointerup', handlePointerUp);
    dom.addEventListener('pointercancel', handlePointerUp);

    return () => {
      dom.removeEventListener('pointerdown', handlePointerDown);
      dom.removeEventListener('pointermove', handlePointerMove);
      dom.removeEventListener('pointerup', handlePointerUp);
      dom.removeEventListener('pointercancel', handlePointerUp);
      clearResumeTimer();
      isDraggingRef.current = false;
    };
  }, [isHouseView, showcaseHouseId]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const dom = renderer?.domElement;
    if (!dom) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY * 0.0015;
      const nextZoom = zoomFactorRef.current + delta;
      updateCameraTargets(showcaseHouse ?? null, isHouseView && !isInterior, nextZoom);
    };

    dom.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      dom.removeEventListener('wheel', handleWheel);
    };
  }, [isHouseView, isInterior, showcaseHouse, updateCameraTargets]);

  useEffect(() => {
    if (isInterior) {
      return;
    }
    const markers = markerStoreRef.current;
    Object.entries(markers).forEach(([id, entry]) => {
      const label = entry.label;
      if (id === highlightedHouseId) {
        label.scale.set(1.12, 1.12, 1.12);
      } else {
        label.scale.set(1, 1, 1);
      }
    });
  }, [highlightedHouseId, isInterior]);

  const banners = useMemo(
    () => [
      { id: 'banner-1', src: '/assets/images/image1.png', alt: '梧桐深处晨光路线' },
      { id: 'banner-2', src: '/assets/images/image2.png', alt: '历史洋房沉浸导览' },
      { id: 'banner-3', src: '/assets/images/image3.png', alt: '夜色城市光影' }
    ],
    []
  );

  const quickActions = useMemo(
    () => [
      { id: 'events', label: '附近活动', description: '今日导览与快闪' },
      { id: 'food', label: '周边美食', description: '法租界午后推荐' },
      { id: 'houses', label: '洋房参观', description: '精选路线指引' },
      { id: 'culture', label: '文化沙龙', description: '社区讲座与沙龙' },
      { id: 'archives', label: '故事档案', description: 'AI 修复影像' },
      { id: 'night-tour', label: '夜行漫步', description: '灯光故事路线' }
    ],
    []
  );

  const [activeBanner, setActiveBanner] = useState(0);
  const [activeShowcaseBubble, setActiveShowcaseBubble] = useState(0);

  const showcaseBubbles = useMemo(() => {
    if (!showcaseHouse) {
      return [];
    }
    const items: Array<{ id: string; label: string; title: string; subtitle?: string }> = [];
    showcaseHouse.activities?.forEach((activity, index) => {
      items.push({
        id: `activity-${activity.id ?? index}`,
        label: '活动',
        title: activity.title,
        subtitle: activity.date ?? ''
      });
    });
    showcaseHouse.narratives?.forEach((story, index) => {
      const summary = story.summary ?? '';
      items.push({
        id: `story-${index}`,
        label: '故事',
        title: story.title,
        subtitle: story.media?.[0]?.title ?? summary.slice(0, 28)
      });
    });
    showcaseHouse.timeline
      ?.slice(-2)
      .forEach((event, index) => {
        const description = event.event ?? '';
        items.push({
          id: `timeline-${event.year}-${index}`,
          label: '事件',
          title: event.year.toString(),
          subtitle: description.slice(0, 32)
        });
      });
    return items.slice(0, 6);
  }, [showcaseHouse]);
  const bubbleClassName = useMemo(() => {
    if (!showcaseHouse) return 'showcase-bubbles';
    return `showcase-bubbles showcase-bubbles--${showcaseHouse.id}`;
  }, [showcaseHouse?.id]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    if (!showcaseHouse || showcaseBubbles.length === 0) {
      setActiveShowcaseBubble(0);
      return;
    }
    setActiveShowcaseBubble(0);
    const timer = window.setInterval(() => {
      setActiveShowcaseBubble((prev) => (prev + 1) % showcaseBubbles.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [showcaseHouse?.id, showcaseBubbles.length]);

  useEffect(() => {
    if (activeShowcaseBubble >= showcaseBubbles.length) {
      setActiveShowcaseBubble(0);
    }
  }, [activeShowcaseBubble, showcaseBubbles.length]);

  const handleQuickAction = useCallback(
    (actionId: string) => {
      let triggered = false;
      switch (actionId) {
        case 'events':
          userSpeak('附近有什么活动推荐？', { mode: 'online' });
          guideRequest('请求 Coze：推送附近活动推荐');
          triggered = true;
          break;
        case 'food':
          userSpeak('想找一间周边的特色餐厅。', { mode: 'online' });
          guideRequest('请求 Coze：推荐周边美食');
          triggered = true;
          break;
        case 'houses': {
          const target = houses[0];
          if (target) {
            userSpeak(`带我参观${target.name}`, { mode: 'online' });
            recordNavigationIntent(target.id);
            guideRequest(`请求 Coze：安排参观${target.name}`, target.name);
            triggered = true;
          }
          break;
        }
        case 'culture':
          userSpeak('附近有哪些文化沙龙？', { mode: 'online' });
          guideRequest('请求 Coze：列出文化沙龙日程');
          triggered = true;
          break;
        case 'archives':
          userSpeak('想看历史档案。', { mode: 'online' });
          guideRequest('请求 Coze：打开梧桐故事档案');
          triggered = true;
          break;
        case 'night-tour':
          userSpeak('安排一条夜行漫步路线。', { mode: 'online' });
          guideRequest('请求 Coze：规划夜行漫步路线');
          triggered = true;
          break;
        default:
          break;
      }

      if (triggered) {
        useAiControlStore.setState({ waitingForAi: true });
      }
    },
    [guideRequest, houses, recordNavigationIntent, userSpeak]
  );

  useEffect(() => {
    const showcaseLayer = showcaseLayerRef.current;
    if (!showcaseLayer) {
      console.warn('[MapHome] showcase effect skipped: missing showcase layer');
      return;
    }

    const targetHouse = showcaseHouse ?? null;
    console.log('[MapHome] showcase effect run', {
      isHouseView,
      isInterior,
      targetHouseId: targetHouse?.id,
      previousShowcaseId: showcaseHouseIdRef.current,
      hasModelGroup: Boolean(modelGroupRef.current)
    });

    updateCameraTargets(targetHouse, isHouseView && !isInterior);

    if (targetHouse) {
      mapRotationSpeedRef.current = 0.0002;
      resumeMapRotationSpeedRef.current = 0.0002;
    } else {
      mapRotationSpeedRef.current = 0.0008;
      resumeMapRotationSpeedRef.current = 0.0008;
    }

    if (!isHouseView || !targetHouse) {
      console.log('[MapHome] showcase effect: exiting due to view or missing target', {
        isHouseView,
        targetHouseId: targetHouse?.id
      });
      rotationActiveRef.current = false;
      rotationSpeedRef.current = 0;
      breathingPhaseRef.current = 0;
      highlightPhaseRef.current = 0;
      if (modelGroupRef.current) {
        console.log('[MapHome] showcase effect: disposing existing model before exit');
        disposeModelGroup();
      }
      return;
    }

    if (showcaseHouseIdRef.current && showcaseHouseIdRef.current !== targetHouse.id) {
      console.log('[MapHome] showcase effect: target changed', {
        previous: showcaseHouseIdRef.current,
        next: targetHouse.id
      });
      disposeModelGroup();
    }

    if (modelGroupRef.current) {
      console.log('[MapHome] showcase effect: reusing existing model', {
        groupName: modelGroupRef.current.name
      });
      rotationActiveRef.current = true;
      rotationSpeedRef.current = mapRotationSpeedRef.current;
      return;
    }

    console.log('[MapHome] showcase effect: preparing new showcase group', {
      targetHouseId: targetHouse.id,
      hasModelAsset: Boolean(targetHouse.model?.url)
    });
    rotationActiveRef.current = false;
    rotationSpeedRef.current = mapRotationSpeedRef.current;
    breathingPhaseRef.current = 0;
    highlightPhaseRef.current = 0;

    const showcaseGroup = new THREE.Group();
    showcaseGroup.name = `${targetHouse.id}-showcase`;
    showcaseGroup.position.set(targetHouse.mapPosition.x, 0, targetHouse.mapPosition.z);

    const hasModelAsset = Boolean(targetHouse.model?.url);
    if (hasModelAsset) {
      const highlight = new THREE.Mesh(
        new THREE.RingGeometry(
          (targetHouse.model.footprint.width ?? 24) * 0.45,
          (targetHouse.model.footprint.width ?? 24) * 0.74,
          64
        ),
        new THREE.MeshBasicMaterial({
          color: 0xffd9a6,
          transparent: true,
          opacity: 0.32,
          side: THREE.DoubleSide
        })
      );
      highlight.rotation.x = -Math.PI / 2;
      highlight.position.y = 0.2;
      showcaseGroup.add(highlight);
      highlightRef.current = highlight;
    } else {
      highlightRef.current = null;
    }

    let cancelled = false;

    const attachBillboard = () => {
      const billboard = createNameBillboard(targetHouse);
      if (!billboard) {
        return;
      }
      billboard.mesh.lookAt(
        cameraRef.current?.position.x ?? 0,
        billboard.mesh.position.y,
        cameraRef.current?.position.z ?? 0
      );
      showcaseGroup.add(billboard.mesh);
      billboardMeshRef.current = billboard.mesh;
      billboardResourceRef.current = { texture: billboard.texture };
    };

    const finalizeShowcase = (status: 'ready' | 'fallback', model?: THREE.Object3D) => {
      if (cancelled) {
        if (model) {
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.geometry?.dispose();
              if (mesh.material) {
                const material = mesh.material as THREE.Material;
                material.dispose();
              }
            }
          });
        }
        return;
      }

      if (model) {
        showcaseGroup.add(model);
        if (billboardResourceRef.current?.texture) {
          billboardResourceRef.current.texture.dispose();
        }
        billboardResourceRef.current = null;
        billboardMeshRef.current = null;
        console.log('[MapHome] showcase effect: model attached', {
          targetHouseId: targetHouse.id,
          status
        });
      }
      if (!model && !hasModelAsset) {
        attachBillboard();
      }

      showcaseLayer.add(showcaseGroup);
      modelGroupRef.current = showcaseGroup;
      showcaseHouseIdRef.current = targetHouse.id;
      rotationActiveRef.current = true;
      rotationSpeedRef.current = mapRotationSpeedRef.current;
      breathingPhaseRef.current = 0;
      const highlight = highlightRef.current;
      if (highlight) {
        const highlightMaterial = highlight.material as THREE.MeshBasicMaterial;
        if (status === 'ready') {
          highlightMaterial.color.set('#ffd9a6');
        } else {
          highlightMaterial.color.set(status === 'fallback' ? '#7fb3ff' : '#ffd166');
        }
      }
      console.log('[MapHome] showcase effect: finalized', {
        status,
        targetHouseId: targetHouse.id,
        groupChildren: showcaseGroup.children.length
      });
    };

    const attachFallback = () => {
      if (!hasModelAsset) {
        finalizeShowcase('fallback');
        return;
      }
      const fallbackGroup = createFallbackHouse(targetHouse);
      finalizeShowcase('fallback', fallbackGroup);
    };

    const modelUrl = targetHouse.model?.url;
    if (modelUrl) {
      console.log('[MapHome] showcase effect: loading GLTF', {
        targetHouseId: targetHouse.id,
        modelUrl
      });
      const loader = new GLTFLoader();
      const candidates = Array.from(
        new Set(
          [
            modelUrl,
            modelUrl.replace(/\.glb$/i, '.gltf'),
            modelUrl.replace(/\.gltf$/i, '.glb')
          ].filter((item) => item && item.length > 0)
        )
      );

      const tryLoad = (index: number) => {
        if (index >= candidates.length) {
          attachFallback();
          return;
        }

        loader.load(
          candidates[index],
          (gltf) => {
            if (cancelled) {
              return;
            }
            console.log('[MapHome] showcase effect: GLTF loaded', {
              targetHouseId: targetHouse.id,
              url: candidates[index]
            });
            const prepared = prepareHouseModel(gltf.scene, targetHouse);
            finalizeShowcase('ready', prepared);
          },
          undefined,
          () => {
            if (cancelled) {
              return;
            }
            console.warn('[MapHome] showcase effect: GLTF load failed, retry', {
              targetHouseId: targetHouse.id,
              url: candidates[index]
            });
            tryLoad(index + 1);
          }
        );
      };

      tryLoad(0);

      return () => {
        cancelled = true;
        highlightRef.current = null;
        console.log('[MapHome] showcase effect cleanup after GLTF load', {
          targetHouseId: targetHouse?.id
        });
      };
    }

    attachFallback();

    return () => {
      cancelled = true;
      highlightRef.current = null;
      console.log('[MapHome] showcase effect cleanup (fallback path)', {
        targetHouseId: targetHouse?.id
      });
    };
  }, [
    createFallbackHouse,
    createNameBillboard,
    disposeModelGroup,
    isHouseView,
    isInterior,
    prepareHouseModel,
    showcaseHouse,
    updateCameraTargets
  ]);

  if (isInterior) {
    if (!currentHouse) {
      return null;
    }
    return <HomeInterior house={currentHouse} />;
  }

  return (
    <div className={`map-home ${isHouseView ? 'map-home-scene' : 'map-home-static'}`}>
      <div className={`map-canvas ${isHouseView ? 'map-canvas-three' : 'map-canvas-static'}`} ref={containerRef} />
      {showcaseHouse && showcaseBubbles.length > 0 ? (
        <div className={bubbleClassName} aria-live="polite">
          {showcaseBubbles.map((bubble, index) => (
            <div
              key={bubble.id}
              className={`showcase-bubble ${index === activeShowcaseBubble ? 'showcase-bubble-visible' : ''}`}
            >
              <span className="showcase-bubble-tag">{bubble.label}</span>
              <strong>{bubble.title}</strong>
              {bubble.subtitle ? <small>{bubble.subtitle}</small> : null}
            </div>
          ))}
        </div>
      ) : null}
      <div className={`map-overlay ${isHouseView ? 'map-overlay-house' : ''}`}>
        <div className="mini-app-header">
          <span className="mini-app-tag">梧桐深处 · Mini</span>
          <h1>{view === 'home' ? '梧桐里城市漫游' : currentHouse?.name ?? '梧桐里城市漫游'}</h1>
          <p>
            {view === 'home'
              ? 'AI 导览员随行，实时发现周边灵感'
              : currentHouse
                ? `${currentHouse.style} · 建于 ${currentHouse.yearBuilt} 年`
                : '探索梧桐深处的历史洋房'}
          </p>
        </div>
        {view === 'home' ? (
          <>
            <div className="mini-app-banner">
              <div className="banner-track" style={{ transform: `translateX(-${activeBanner * 100}%)` }}>
                {banners.map((banner) => (
                  <figure key={banner.id} className="banner-card">
                    <img src={banner.src} alt={banner.alt} />
                  </figure>
                ))}
              </div>
              <div className="banner-dots">
                {banners.map((banner, index) => (
                  <button
                    key={banner.id}
                    type="button"
                    className={`banner-dot ${index === activeBanner ? 'banner-dot-active' : ''}`}
                    onClick={() => setActiveBanner(index)}
                    aria-label={`切换到 ${banner.alt}`}
                  />
                ))}
              </div>
            </div>
            <div className="mini-app-actions">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="mini-app-action"
                  onClick={() => handleQuickAction(action.id)}
                >
                  <span className="action-label">{action.label}</span>
                  <span className="action-desc">{action.description}</span>
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
      <div className="robot-floating">
        <button
          type="button"
          className={`robot-button ${
            isPlaying ? 'robot-button-active' : waitingForAi ? 'robot-button-waiting' : 'robot-button-idle'
          }`}
          onClick={() => {
            if (isPlaying) {
              stop();
            } else {
              useAiControlStore.setState({ waitingForAi: true });
            }
          }}
        >
          <span className="robot-core" />
          <span className="robot-ring" />
          <span className="robot-label">
            {isPlaying ? '停止播放' : waitingForAi ? '等待 AI' : '继续导览'}
          </span>
        </button>
      </div>
    </div>
  );
};
