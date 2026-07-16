import { Suspense, useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls, 
  Environment, 
  ContactShadows,
  PerspectiveCamera,
  useGLTF,
} from '@react-three/drei';
import * as THREE from 'three';
import { useBikeStore } from '../../../core/stores/bikeStore';

function CameraRig({ targetY = 0.8 }: { targetY?: number }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[4, 2.2, 4.8]} fov={45} />
      <OrbitControls
        makeDefault
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1.5}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2 - 0.05} // Keep camera above ground
        target={[0, targetY, 0]}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

function Ground() {
  return (
    <group position={[0, 0, 0]}>
      {/* Subtle floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial 
          color="#0f172a" 
          roughness={0.8} 
          metalness={0.2}
        />
      </mesh>
      
      {/* Soft floor shadow under the model */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.6}
        scale={12}
        blur={1.8}
        far={5}
        color="#000000"
      />

      {/* Cyber studio floor grid */}
      <gridHelper 
        args={[30, 60, '#38bdf8', '#1e293b']} 
        position={[0, 0.001, 0]} 
      />
    </group>
  );
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.8} color="#ffffff" />
      <directionalLight
        position={[6, 10, 6]}
        intensity={1.5}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={25}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <directionalLight
        position={[-5, 6, -4]}
        intensity={0.6}
        color="#38bdf8"
      />
      <pointLight position={[0, 6, 0]} intensity={0.7} color="#ffffff" />
      <pointLight position={[-4, 3, 2]} intensity={0.8} color="#818cf8" distance={10} />
      <pointLight position={[4, 3, -2]} intensity={0.8} color="#f43f5e" distance={10} />
    </>
  );
}

const CAMERA_PRESETS = [
  { label: '🎯 Front', position: [0, 1.2, 4.5] as [number, number, number] },
  { label: '👈 Left', position: [-4.5, 1.2, 0] as [number, number, number] },
  { label: '👉 Right', position: [4.5, 1.2, 0] as [number, number, number] },
  { label: '🔙 Rear', position: [0, 1.2, -4.5] as [number, number, number] },
  { label: '🔝 Top', position: [0, 5.5, 0.1] as [number, number, number] },
  { label: '🎬 3/4', position: [3.5, 2.0, 3.5] as [number, number, number] },
];

function CameraAnimator({ target, targetY = 0.8 }: { target: [number, number, number] | null; targetY?: number }) {
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

    camera.lookAt(0, targetY, 0);
  });

  return null;
}

/**
 * Maps generic or named meshes inside GLB model to bike part IDs
 */
function assignMeshToPart(mesh: THREE.Mesh, index: number, totalMeshes: number, modelBounds: { min: THREE.Vector3; max: THREE.Vector3; size: THREE.Vector3 }, availablePartIds: string[]): string {
  const meshName = mesh.name.toLowerCase();

  // 1. Exact name matching
  for (const partId of availablePartIds) {
    const cleanId = partId.replace('_', '');
    if (meshName.includes(partId) || meshName.includes(cleanId)) {
      return partId;
    }
  }

  // 2. Spatial heuristic matching if names are generic (e.g. mesh_0, node_1)
  const meshBox = new THREE.Box3().setFromObject(mesh);
  const meshCenter = new THREE.Vector3();
  meshBox.getCenter(meshCenter);

  // Compute normalized relative position inside model (0 to 1)
  const relX = modelBounds.size.x > 0 ? (meshCenter.x - modelBounds.min.x) / modelBounds.size.x : 0.5;
  const relY = modelBounds.size.y > 0 ? (meshCenter.y - modelBounds.min.y) / modelBounds.size.y : 0.5;
  const relZ = modelBounds.size.z > 0 ? (meshCenter.z - modelBounds.min.z) / modelBounds.size.z : 0.5;

  if (relY < 0.4) {
    if (relZ > 0.6) return availablePartIds.includes('front_wheel') ? 'front_wheel' : availablePartIds[0];
    if (relZ < 0.4) return availablePartIds.includes('rear_wheel') ? 'rear_wheel' : availablePartIds[0];
    if (Math.abs(relX - 0.5) > 0.25) return availablePartIds.includes('exhaust') ? 'exhaust' : availablePartIds[0];
    return availablePartIds.includes('engine') ? 'engine' : availablePartIds[0];
  } else if (relY > 0.6) {
    if (relZ > 0.65) return availablePartIds.includes('headlight') ? 'headlight' : availablePartIds[0];
    if (relZ < 0.35) return availablePartIds.includes('seat') ? 'seat' : availablePartIds[0];
    return availablePartIds.includes('fuel_tank') ? 'fuel_tank' : availablePartIds[0];
  } else {
    if (relZ > 0.7) return availablePartIds.includes('fairing') ? 'fairing' : availablePartIds[0];
    if (relZ < 0.3) return availablePartIds.includes('subframe') ? 'subframe' : availablePartIds[0];
    return availablePartIds.includes('frame') ? 'frame' : availablePartIds[0];
  }

  // Fallback round-robin allocation to available parts
  return availablePartIds[index % availablePartIds.length] || 'frame';
}

function ReconstructedBike({ url, onCenterCalculated }: { url: string; onCenterCalculated?: (height: number) => void }) {
  const { scene } = useGLTF(url);
  const { selectedPart, hoveredPart, selectPart, hoverPart, parts } = useBikeStore();
  const meshMaterialsRef = useRef<Map<string, THREE.MeshStandardMaterial[]>>(new Map());

  // Deep clone scene to prevent mutating shared GLTF cache
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Compute exact bounding box, scaling, and elevation to place model fully visible above ground plane
  const transform = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    // Normalize target scale so model fits conveniently (~3.2 units wide)
    const fitScale = 3.2 / maxDim;

    // Calculate Y offset so bottom of bounding box sits cleanly at y = 0.02 above floor
    const offsetY = (-box.min.y * fitScale) + 0.02;
    const modelCenterY = (size.y * fitScale) / 2 + 0.02;

    return {
      scale: fitScale,
      position: [-center.x * fitScale, offsetY, -center.z * fitScale] as [number, number, number],
      centerHeight: modelCenterY,
      bounds: { min: box.min, max: box.max, size },
    };
  }, [clonedScene]);

  useEffect(() => {
    if (onCenterCalculated) {
      onCenterCalculated(transform.centerHeight);
    }
  }, [transform.centerHeight, onCenterCalculated]);

  const partIds = useMemo(() => Object.keys(parts), [parts]);

  // Store original materials and attach part tags to meshes
  useEffect(() => {
    const meshes: THREE.Mesh[] = [];
    clonedScene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        meshes.push(node as THREE.Mesh);
      }
    });

    meshes.forEach((mesh, index) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Assign partId dynamically if not already tagged
      const partId = assignMeshToPart(mesh, index, meshes.length, transform.bounds, partIds);
      mesh.userData.partId = partId;

      if (!meshMaterialsRef.current.has(mesh.uuid)) {
        const rawMats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const clonedMats = rawMats.map((m) => (m as THREE.MeshStandardMaterial).clone());
        meshMaterialsRef.current.set(mesh.uuid, clonedMats);
      }
    });
  }, [clonedScene, transform.bounds, partIds]);

  // Apply colors, finishes, and glow highlights on selection / hover
  useEffect(() => {
    clonedScene.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;

      const originalMats = meshMaterialsRef.current.get(mesh.uuid);
      if (!originalMats) return;

      const meshPartId = mesh.userData.partId as string | undefined;
      const partState = meshPartId ? parts[meshPartId] : null;

      const updatedMats = originalMats.map((origMat) => {
        const newMat = origMat.clone();

        if (partState) {
          newMat.color.set(partState.color);
          switch (partState.materialType) {
            case 'metallic':
              newMat.metalness = 0.9;
              newMat.roughness = 0.2;
              break;
            case 'chrome':
              newMat.metalness = 1.0;
              newMat.roughness = 0.05;
              break;
            case 'matte':
              newMat.metalness = 0.1;
              newMat.roughness = 0.95;
              break;
            case 'carbon':
              newMat.metalness = 0.4;
              newMat.roughness = 0.5;
              break;
            case 'wrapped':
              newMat.metalness = 0.2;
              newMat.roughness = 0.4;
              break;
            default: // gloss
              newMat.metalness = 0.2;
              newMat.roughness = 0.25;
              break;
          }
        }

        if (meshPartId && selectedPart === meshPartId) {
          newMat.emissive.set('#6366f1');
          newMat.emissiveIntensity = 0.45;
        } else if (meshPartId && hoveredPart === meshPartId) {
          newMat.emissive.set('#8b5cf6');
          newMat.emissiveIntensity = 0.3;
        } else {
          newMat.emissive.set('#000000');
          newMat.emissiveIntensity = 0;
        }

        newMat.needsUpdate = true;
        return newMat;
      });

      mesh.material = Array.isArray(mesh.material) ? updatedMats : updatedMats[0];
    });
  }, [clonedScene, selectedPart, hoveredPart, parts]);

  // Touch / Pointer selection handler
  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    const clickedPartId = mesh.userData.partId;
    if (clickedPartId && parts[clickedPartId]) {
      selectPart(selectedPart === clickedPartId ? null : clickedPartId);
    } else {
      // Fallback selection if direct tag is missing
      const firstId = Object.keys(parts)[0];
      if (firstId) selectPart(selectedPart === firstId ? null : firstId);
    }
  }, [parts, selectedPart, selectPart]);

  const handlePointerOver = useCallback((e: any) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    const targetPartId = mesh.userData.partId;
    if (targetPartId && parts[targetPartId]) {
      hoverPart(targetPartId);
      document.body.style.cursor = 'pointer';
    }
  }, [parts, hoverPart]);

  const handlePointerOut = useCallback((e: any) => {
    e.stopPropagation();
    hoverPart(null);
    document.body.style.cursor = 'default';
  }, [hoverPart]);

  return (
    <primitive
      object={clonedScene}
      position={transform.position}
      scale={transform.scale}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      renderOrder={1}
    />
  );
}

export default function BikeViewer() {
  const { modelUrl, hoveredPart, parts } = useBikeStore();
  const [cameraTarget, setCameraTarget] = useState<[number, number, number] | null>(null);
  const [targetY, setTargetY] = useState<number>(0.8);
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
          toneMappingExposure: 1.25,
          preserveDrawingBuffer: true,
        }}
        dpr={[1, 2]}
        onPointerMissed={() => useBikeStore.getState().selectPart(null)}
      >
        <Suspense fallback={null}>
          <CameraRig targetY={targetY} />
          <CameraAnimator target={cameraTarget} targetY={targetY} />
          <SceneLighting />
          <Environment preset="city" background={false} />
          {modelUrl && (
            <ReconstructedBike 
              url={modelUrl} 
              onCenterCalculated={(height) => setTargetY(height)}
            />
          )}
          <Ground />
        </Suspense>
      </Canvas>

      {hoveredPartData && tooltipPos && (
        <div
          className="part-tooltip"
          style={{ left: tooltipPos.x, top: tooltipPos.y - 12 }}
        >
          {hoveredPartData.icon} {hoveredPartData.displayName}
        </div>
      )}

      <div className="viewer-info">
        <div className="viewer-info__badge">
          <span className="viewer-info__dot" />
          <span>MotoForge 3D Studio</span>
        </div>
        <div className="viewer-info__badge">
          🏍️ {Object.keys(parts).length} parts detected
        </div>
        <div className="viewer-info__badge" style={{ color: '#34d399' }}>
          🎯 Tap any 3D part to select & change color
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

