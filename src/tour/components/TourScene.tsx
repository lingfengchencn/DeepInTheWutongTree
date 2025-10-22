import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import type { HouseProfile, TranscriptEntry, Stage } from '../../shared/types';
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

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0d15');

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 40, 65);

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
      let cancelled = false;

      loader.load(
        house.model.url,
        (gltf) => {
          if (cancelled) {
            return;
          }

          const model = gltf.scene;
          const scale = house.model.scale ?? 1;
          model.scale.set(scale, scale, scale);

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
            addFallbackGeometry();
          }
        }
      );

      return () => {
        cancelled = true;
      };
    }

    addFallbackGeometry();
  }, [house]);

  useEffect(() => {
    orbitingRef.current = stage === 'touring' || stage === 'intro';
  }, [stage]);

  const recentGuideEntry = transcript
    .slice()
    .reverse()
    .find((entry) => entry.speaker === 'guide');

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
            <p>播放 1930 年的手绘楼梯间影片，展示墙面细节与住户生活片段。</p>
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
