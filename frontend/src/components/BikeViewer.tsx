import { Suspense, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  ContactShadows,
  PerspectiveCamera,
} from '@react-three/drei';
import * as THREE from 'three';
import { useBikeStore } from '../stores/bikeStore';
import ProceduralBike from './ProceduralBike';

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
      {/* Grid lines */}
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
      {/* Rim lights for soft bright effect */}
      <pointLight position={[-4, 2, 0]} intensity={0.6} color="#cbd5e1" distance={8} />
      <pointLight position={[4, 2, 0]} intensity={0.6} color="#f8fafc" distance={8} />
    </>
  );
}

// Camera preset buttons
const CAMERA_PRESETS = [
  { label: '🎯 Front', position: [0, 1.5, 5] as [number, number, number] },
  { label: '👈 Left', position: [-5, 1.5, 0] as [number, number, number] },
  { label: '👉 Right', position: [5, 1.5, 0] as [number, number, number] },
  { label: '🔙 Rear', position: [0, 1.5, -5] as [number, number, number] },
  { label: '🔝 Top', position: [0, 6, 0.1] as [number, number, number] },
  { label: '🎬 3/4', position: [4, 2.5, 4] as [number, number, number] },
];

export default function BikeViewer() {
  const { hoveredPart, parts } = useBikeStore();
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const handlePointerMove = useCallback((e: React.MouseEvent) => {
    if (hoveredPart) {
      setTooltipPos({ x: e.clientX, y: e.clientY });
    }
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
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <CameraRig />
          <SceneLighting />
          <Environment preset="studio" background={false} />
          <ProceduralBike />
          <Ground />
        </Suspense>
      </Canvas>

      {/* Part tooltip */}
      {hoveredPartData && tooltipPos && (
        <div
          className="part-tooltip"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 10,
          }}
        >
          {hoveredPartData.icon} {hoveredPartData.displayName}
        </div>
      )}

      {/* Viewer info badges */}
      <div className="viewer-info">
        <div className="viewer-info__badge">
          <span className="viewer-info__dot" />
          <span>Interactive 3D</span>
        </div>
        <div className="viewer-info__badge">
          🏍️ {Object.keys(parts).length} parts detected
        </div>
      </div>

      {/* Camera controls */}
      <div className="viewer-controls">
        {CAMERA_PRESETS.map((preset) => (
          <button
            key={preset.label}
            className="viewer-controls__btn"
            title={preset.label}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
