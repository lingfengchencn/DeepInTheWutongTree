import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import type { HouseProfile, TranscriptEntry, Stage } from '../../shared/types';
import { useAppStore } from '../../shared/state/useAppStore';
import { useAiControlStore } from '../../shared/state/useAiControlStore';
import { useScriptRunner } from '../../shared/hooks/useScriptRunner';
import './TourScene.css';

interface TourSceneProps {
  house: HouseProfile | null;
  stage: Stage;
  offlineFallback: boolean;
  transcript: TranscriptEntry[];
}

export const TourScene = ({ house, stage, offlineFallback, transcript }: TourSceneProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const houseGroupRef = useRef<THREE.Group | null>(null);
  const orbitingRef = useRef(false);
  const view = useAppStore((state) => state.view);
  const activeVideo = useAppStore((state) => state.activeVideo);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const defaultCameraPos = useRef(new THREE.Vector3(0, 40, 65));
  const interruptToken = useAiControlStore((state) => state.interruptToken);
  const waitingForAi = useAiControlStore((state) => state.waitingForAi);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0d15');

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 40, 65);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    const directional = new THREE.DirectionalLight(0xffd199, 1.2);
    directional.position.set(-40, 60, 40);

    scene.add(ambient);
    scene.add(directional);

    // Map plane simulates the 高德地图 WebGL 底板，真实项目可换为 AMap JSAPI 纹理
    const mapPlane = new THREE.Mesh(
      new THREE.CircleGeometry(80, 64),
      new THREE.MeshStandardMaterial({
        color: '#1f2837',
        emissive: '#0f1320',
        metalness: 0.2,
        roughness: 0.9
      })
    );
    mapPlane.rotation.x = -Math.PI / 2;
    mapPlane.position.y = -0.5;
    scene.add(mapPlane);

    const orbitGroup = new THREE.Group();
    houseGroupRef.current = orbitGroup;
    scene.add(orbitGroup);

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    const animate = () => {
      if (orbitingRef.current && orbitGroup) {
        orbitGroup.rotation.y += 0.003;
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
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const orbitGroup = houseGroupRef.current;
    if (!orbitGroup) return;
    orbitGroup.clear();
    orbitingRef.current = false;

    if (!house) return;

    const addFallbackGeometry = () => {
      const baseGeometry = new THREE.BoxGeometry(
        house.model.footprint.width,
        house.model.height,
        house.model.footprint.depth
      );
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(house.model.color),
        metalness: 0.25,
        roughness: 0.4
      });

      const body = new THREE.Mesh(baseGeometry, baseMaterial);
      body.castShadow = true;
      body.receiveShadow = true;
      body.position.y = house.model.height / 2;

      const roof = new THREE.Mesh(
        new THREE.CylinderGeometry(0, house.model.footprint.width * 0.65, 8, 4),
        new THREE.MeshStandardMaterial({ color: '#1c2430' })
      );
      roof.rotation.y = Math.PI / 4;
      roof.position.y = house.model.height + 4;

      const plinth = new THREE.Mesh(
        new THREE.BoxGeometry(
          house.model.footprint.width * 1.2,
          2,
          house.model.footprint.depth * 1.2
        ),
        new THREE.MeshStandardMaterial({ color: '#2e374a', roughness: 0.7 })
      );
      plinth.position.y = 1;

      orbitGroup.add(plinth);
      orbitGroup.add(body);
      orbitGroup.add(roof);
      orbitGroup.position.set(0, 0, 0);
      orbitGroup.rotation.y = 0;
      orbitingRef.current = true;
    };

    if (house.model.url) {
      const loader = new GLTFLoader();
      const candidates = Array.from(
        new Set(
          [
            house.model.url,
            house.model.url.replace(/\.glft$/i, '.gltf'),
            house.model.url.replace(/\.gltf$/i, '.glb')
          ].filter((url) => url && url.length > 0)
        )
      );

      let cancelled = false;

      const tryLoad = (index: number) => {
        if (index >= candidates.length) {
          addFallbackGeometry();
          return;
        }

        loader.load(
          candidates[index],
          (gltf) => {
            if (cancelled) {
              return;
            }

            const model = gltf.scene;
            const baseScale = house.model.scale ?? 1;

            model.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
              }
            });

            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

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
            const derivedScale =
              ratios.length > 0 ? Math.min(...ratios.filter((value) => value > 0)) : baseScale;

            const sphere = new THREE.Sphere();
            box.getBoundingSphere(sphere);
            const targetRadius = 30;
            const fitScale =
              sphere.radius > 0 ? (targetRadius / sphere.radius) * baseScale : baseScale;

            const finalScale = Math.min(
              derivedScale > 0 ? derivedScale : baseScale,
              fitScale > 0 ? fitScale : baseScale
            );
            model.scale.set(finalScale, finalScale, finalScale);

            model.position.x -= center.x;
            model.position.z -= center.z;
            model.position.y -= box.min.y;

            if (size.y < house.model.height * 0.5) {
              model.position.y += (house.model.height - size.y) / 2;
            }

            orbitGroup.add(model);
            orbitGroup.position.set(0, 0, 0);
            orbitGroup.rotation.y = 0;
            orbitingRef.current = true;
          },
          undefined,
          () => {
            if (!cancelled) {
              tryLoad(index + 1);
            }
          }
        );
      };

      tryLoad(0);

      return () => {
        cancelled = true;
      };
    }

    addFallbackGeometry();
  }, [house]);

  useEffect(() => {
    orbitingRef.current = stage === 'touring' || stage === 'intro';
  }, [stage]);

  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;

    if (stage === 'interior') {
      camera.position.set(0, 12, 8);
      camera.lookAt(new THREE.Vector3(0, 12, 0));
    } else {
      camera.position.copy(defaultCameraPos.current);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
    }
  }, [stage]);

  const recentGuideEntry = transcript
    .slice()
    .reverse()
    .find((entry) => entry.speaker === 'guide');

  useScriptRunner(view === 'house' && house ? house.script.detail : [], {
    autoStart: view === 'house' && stage === 'touring' && !waitingForAi,
    resetKey: `${view === 'house' ? house?.id ?? 'none' : 'none'}-${interruptToken}`
  });

  return (
    <div className="tour-scene">
      <div className="three-container" ref={containerRef} />
      {house && (
        <div className="house-overlay">
          <div className="house-meta">
            <span className="badge">{stageLabel(stage)}</span>
            <h2>{house.name}</h2>
            <p>
              {house.address} · {house.style} · {house.yearBuilt} 年建
            </p>
          </div>
          <div className="floating-bubbles">
            {house.activities.slice(0, 1).map((activity) => (
              <div key={activity.id} className="floating-chip">
                <span className="icon">📅</span>
                <div>
                  <strong>{activity.title}</strong>
                  <small>{activity.date}</small>
                </div>
              </div>
            ))}
            {house.narratives.slice(0, 1).map((story) => (
              <div key={story.title} className="floating-chip">
                <span className="icon">💬</span>
                <div>
                  <strong>{story.title}</strong>
                  <small>{story.media[0]?.title ?? story.summary.slice(0, 22)}</small>
                </div>
              </div>
            ))}
          </div>
          <div className="story-bubbles">
            {house.narratives.map((story) => (
              <div key={story.title} className="bubble">
                <h3>💬 {story.title}</h3>
                <p>{story.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {stage === 'interior' && (
        <div className="interior-overlay">
          <div className="interior-card">
            <h3>室内复原影像</h3>
            {activeVideo ? (
              <video
                className="interior-video"
                src={activeVideo}
                autoPlay
                loop
                muted
                controls
              />
            ) : (
              <div className="interior-video-placeholder">
                正在载入 AI 复原视频...
              </div>
            )}
            <p>跟随光线穿过彩色玻璃，聆听武康大楼住户的百年故事。</p>
          </div>
        </div>
      )}
      <div className="status-bar">
        <span>{offlineFallback ? '离线脚本自动演示中' : '在线语音互动模式'}</span>
        {recentGuideEntry && <span className="status-text">{recentGuideEntry.text}</span>}
      </div>
    </div>
  );
};

const stageLabel = (stage: Stage) => {
  switch (stage) {
    case 'home':
      return '城市地图';
    case 'intro':
      return '欢迎';
    case 'touring':
      return '导览中';
    case 'interior':
      return '室内探索';
    case 'community':
      return '社区互动';
    case 'valuation':
      return '投资评估';
    default:
      return '待命';
  }
};
