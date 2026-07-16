import { Suspense, useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls, 
  Environment, 
  ContactShadows,
  PerspectiveCamera,
  useGLTF,
} from '@react-three/drei';
import * as THREE from 'three';
import { useBikeStore } from '../stores/bikeStore';

function CameraRig() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[4, 2.5, 5]} fov={45} />
      <OrbitControls
        makeDefault
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={15}
        maxPolarAngle={Math.PI / 1.8}
        target={[0, 0.8, 0]}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial 
          color="#f8fafc" 
          roughness={0.9} 
          metalness={0.1}
        />
      </mesh>
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
        far={4}
        color="#0f172a"
      />
      <gridHelper 
        args={[20, 40, '#cbd5e1', '#e2e8f0']} 
        position={[0, 0.01, 0]} 
      />
    </>
  );
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.5} color="#ffffff" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <directionalLight
        position={[-3, 4, -3]}
        intensity={0.4}
        color="#6080ff"
      />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#e2e8f0" />
      <pointLight position={[-4, 2, 0]} intensity={0.6} color="#cbd5e1" distance={8} />
      <pointLight position={[4, 2, 0]} intensity={0.6} color="#f8fafc" distance={8} />
    </>
  );
}

const CAMERA_PRESETS = [
  { label: '🎯 Front', position: [0, 1.5, 5] as [number, number, number] },
  { label: '👈 Left', position: [-5, 1.5, 0] as [number, number, number] },
  { label: '👉 Right', position: [5, 1.5, 0] as [number, number, number] },
  { label: '🔙 Rear', position: [0, 1.5, -5] as [number, number, number] },
  { label: '🔝 Top', position: [0, 6, 0.1] as [number, number, number] },
  { label: '🎬 3/4', position: [4, 2.5, 4] as [number, number, number] },
];

function CameraAnimator({ target }: { target: [number, number, number] | null }) {
  const { camera } = useThree();
  const targetRef = useRef<[number, number, number] | null>(null);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useFrame(() => {
    if (!targetRef.current) return;
    const [tx, ty, tz] = targetRef.current;
    camera.position.x += (tx - camera.position.x) * 0.08;
    camera.position.y += (ty - camera.position.y) * 0.08;
    camera.position.z += (tz - camera.position.z) * 0.08;

    camera.lookAt(0, 0.8, 0);
  });

  return null;
}

// ─── Interactive GLB Model with per-mesh highlighting ───
function ReconstructedBike({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const { selectedPart, hoveredPart, selectPart, hoverPart, parts } = useBikeStore();
  const meshMaterialsRef = useRef<Map<string, THREE.MeshStandardMaterial>>(new Map());
  const clonedScene = useRef(scene.clone(true)).current;

  useEffect(() => {
    clonedScene.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (!meshMaterialsRef.current.has(mesh.uuid)) {
          const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          meshMaterialsRef.current.set(mesh.uuid, (mat as THREE.MeshStandardMaterial).clone());
        }
      }
    });
  }, [clonedScene]);

  useEffect(() => {
    clonedScene.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      const originalMat = meshMaterialsRef.current.get(mesh.uuid);
      if (!originalMat) return;

      const meshName = mesh.name.toLowerCase();
      let matchedPartId: string | null = null;
      for (const partId of Object.keys(parts)) {
        if (meshName.includes(partId) || meshName.includes(partId.replace('_', ''))) {
          matchedPartId = partId;
          break;
        }
      }

      const newMat = originalMat.clone();
      const partState = matchedPartId ? parts[matchedPartId] : null;

      if (partState) {
        newMat.color.set(partState.color);
        switch (partState.materialType) {
          case 'metallic': newMat.metalness = 0.9; newMat.roughness = 0.2; break;
          case 'chrome':   newMat.metalness = 1.0; newMat.roughness = 0.05; break;
          case 'matte':    newMat.metalness = 0.1; newMat.roughness = 0.9; break;
          case 'carbon':   newMat.metalness = 0.3; newMat.roughness = 0.6; break;
          default:         newMat.metalness = 0.2; newMat.roughness = 0.3; break;
        }
      }

      if (matchedPartId && selectedPart === matchedPartId) {
        newMat.emissive.set('#4f46e5');
        newMat.emissiveIntensity = 0.5;
      } else if (matchedPartId && hoveredPart === matchedPartId) {
        newMat.emissive.set('#7c3aed');
        newMat.emissiveIntensity = 0.3;
      } else {
        newMat.emissive.set('#000000');
        newMat.emissiveIntensity = 0;
      }

      mesh.material = newMat;
    });
  }, [clonedScene, selectedPart, hoveredPart, parts]);

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    const meshName = (e.object as THREE.Mesh).name.toLowerCase();
    for (const partId of Object.keys(parts)) {
      if (meshName.includes(partId) || meshName.includes(partId.replace('_', ''))) {
        selectPart(selectedPart === partId ? null : partId);
        return;
      }
    }
    const firstId = Object.keys(parts)[0];
    if (firstId) selectPart(firstId);
  }, [parts, selectedPart, selectPart]);

  const handlePointerOver = useCallback((e: any) => {
    e.stopPropagation();
    const meshName = (e.object as THREE.Mesh).name.toLowerCase();
    for (const partId of Object.keys(parts)) {
      if (meshName.includes(partId) || meshName.includes(partId.replace('_', ''))) {
        hoverPart(partId);
        document.body.style.cursor = 'pointer';
        return;
      }
    }
    document.body.style.cursor = 'default';
  }, [parts, hoverPart]);

  const handlePointerOut = useCallback(() => {
    hoverPart(null);
    document.body.style.cursor = 'default';
  }, [hoverPart]);

  return (
    <primitive
      object={clonedScene}
      position={[0, 0.25, 0]}
      scale={2.4}
      rotation={[0, -Math.PI / 2, 0]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    />
  );
}

export default function BikeViewer() {
  const { modelUrl, hoveredPart, parts } = useBikeStore();
  const [cameraTarget, setCameraTarget] = useState<[number, number, number] | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const handlePointerMove = useCallback((e: React.MouseEvent) => {
    if (hoveredPart) setTooltipPos({ x: e.clientX, y: e.clientY });
  }, [hoveredPart]);

  const hoveredPartData = hoveredPart ? parts[hoveredPart] : null;

  return (
    <div className="viewer-container" onMouseMove={handlePointerMove}>
      <Canvas
        className="viewer-canvas"
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          preserveDrawingBuffer: true,
        }}
        dpr={[1, 2]}
        onPointerMissed={() => useBikeStore.getState().selectPart(null)}
      >
        <Suspense fallback={null}>
          <CameraRig />
          <CameraAnimator target={cameraTarget} />
          <SceneLighting />
          <Environment preset="studio" background={false} />
          {modelUrl && <ReconstructedBike url={modelUrl} />}
          <Ground />
        </Suspense>
      </Canvas>

      {hoveredPartData && tooltipPos && (
        <div
          className="part-tooltip"
          style={{ left: tooltipPos.x, top: tooltipPos.y - 10 }}
        >
          {hoveredPartData.icon} {hoveredPartData.displayName}
        </div>
      )}

      <div className="viewer-info">
        <div className="viewer-info__badge">
          <span className="viewer-info__dot" />
          <span>TRELLIS AI Model</span>
        </div>
        <div className="viewer-info__badge">
          🏍️ {Object.keys(parts).length} parts
        </div>
        <div className="viewer-info__badge" style={{ color: '#10b981' }}>
          ✅ Click parts to select
        </div>
      </div>

      <div className="viewer-controls">
        {CAMERA_PRESETS.map((preset) => (
          <button
            key={preset.label}
            className={`viewer-controls__btn ${activePreset === preset.label ? 'viewer-controls__btn--active' : ''}`}
            title={preset.label}
            onClick={() => {
              setCameraTarget(preset.position);
              setActivePreset(preset.label);
              setTimeout(() => setActivePreset(null), 1200);
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
