import { useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useBikeStore } from '../stores/bikeStore';
import type { MaterialType } from '../types';

// Create material based on part state
function createMaterial(color: string, materialType: MaterialType, isSelected: boolean, isHovered: boolean): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({ color });

  switch (materialType) {
    case 'gloss':
      mat.roughness = 0.15;
      mat.metalness = 0.1;
      mat.clearcoat = 1.0;
      mat.clearcoatRoughness = 0.05;
      break;
    case 'matte':
      mat.roughness = 0.8;
      mat.metalness = 0.0;
      break;
    case 'metallic':
      mat.roughness = 0.25;
      mat.metalness = 0.85;
      mat.clearcoat = 0.5;
      mat.clearcoatRoughness = 0.1;
      break;
    case 'chrome':
      mat.roughness = 0.05;
      mat.metalness = 1.0;
      mat.clearcoat = 1.0;
      mat.clearcoatRoughness = 0.02;
      mat.color.set('#e0e0e0');
      mat.reflectivity = 1.0;
      break;
    case 'carbon':
      mat.roughness = 0.4;
      mat.metalness = 0.3;
      mat.clearcoat = 0.8;
      break;
    case 'wrapped':
      mat.roughness = 0.6;
      mat.metalness = 0.0;
      break;
  }

  if (isSelected) {
    mat.emissive.set('#3b82f6');
    mat.emissiveIntensity = 0.15;
  } else if (isHovered) {
    mat.emissive.set('#8b5cf6');
    mat.emissiveIntensity = 0.1;
  }

  return mat;
}

// Individual bike part component
function BikePart({ 
  partId, 
  geometry, 
  position = [0, 0, 0] as [number, number, number],
  rotation = [0, 0, 0] as [number, number, number],
  scale = [1, 1, 1] as [number, number, number],
}: {
  partId: string;
  geometry: THREE.BufferGeometry;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { parts, selectedPart, hoveredPart, selectPart, hoverPart } = useBikeStore();
  const part = parts[partId];

  const material = useMemo(() => {
    if (!part) return new THREE.MeshPhysicalMaterial({ color: '#666' });
    return createMaterial(
      part.color,
      part.materialType,
      selectedPart === partId,
      hoveredPart === partId
    );
  }, [part, selectedPart, hoveredPart, partId]);

  const handleClick = useCallback((e: THREE.Event & { stopPropagation: () => void }) => {
    e.stopPropagation();
    selectPart(selectedPart === partId ? null : partId);
  }, [selectPart, selectedPart, partId]);

  const handlePointerOver = useCallback((e: THREE.Event & { stopPropagation: () => void }) => {
    e.stopPropagation();
    hoverPart(partId);
    document.body.style.cursor = 'pointer';
  }, [hoverPart, partId]);

  const handlePointerOut = useCallback(() => {
    hoverPart(null);
    document.body.style.cursor = 'auto';
  }, [hoverPart]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      castShadow
      receiveShadow
      name={partId}
    />
  );
}

// Build all geometries for the motorcycle parts
function useMotorcycleGeometries() {
  return useMemo(() => {
    const geoms: Record<string, THREE.BufferGeometry> = {};

    // === FRAME ===
    // Main tube (backbone)
    const framePath = new THREE.CurvePath<THREE.Vector3>();
    const frameCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.8, 0.6, 0),
      new THREE.Vector3(-0.3, 1.1, 0),
      new THREE.Vector3(0.3, 1.15, 0),
      new THREE.Vector3(0.7, 0.9, 0),
    ]);
    framePath.add(frameCurve);
    const frameGeo = new THREE.TubeGeometry(frameCurve, 20, 0.04, 8, false);
    
    // Down tube
    const downCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.5, 1.0, 0),
      new THREE.Vector3(0.3, 0.5, 0),
      new THREE.Vector3(-0.1, 0.35, 0),
    ]);
    const downTubeGeo = new THREE.TubeGeometry(downCurve, 16, 0.035, 8, false);
    
    // Swing arm
    const swingCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.1, 0.35, 0),
      new THREE.Vector3(-0.7, 0.35, 0),
    ]);
    const swingGeo = new THREE.TubeGeometry(swingCurve, 10, 0.04, 8, false);
    
    // Merge frame parts
    const frameMerged = mergeGeometries([frameGeo, downTubeGeo, swingGeo]);
    geoms.frame = frameMerged;

    // === FUEL TANK ===
    const tankShape = new THREE.Shape();
    tankShape.moveTo(0, 0);
    tankShape.bezierCurveTo(0.3, 0.15, 0.5, 0.15, 0.55, 0);
    tankShape.bezierCurveTo(0.5, -0.15, 0.3, -0.15, 0, 0);
    
    const tankGeo = new THREE.ExtrudeGeometry(tankShape, {
      depth: 0.35,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 6,
    });
    tankGeo.center();
    geoms.fuel_tank = tankGeo;

    // === SEAT ===
    const seatGeo = new THREE.BoxGeometry(0.5, 0.06, 0.25, 4, 1, 4);
    // Taper the seat
    const seatPos = seatGeo.attributes.position;
    for (let i = 0; i < seatPos.count; i++) {
      const x = seatPos.getX(i);
      const z = seatPos.getZ(i);
      const taper = 1 - Math.max(0, -x) * 0.5;
      seatPos.setZ(i, z * taper);
      // Round the top slightly
      if (seatPos.getY(i) > 0) {
        seatPos.setY(i, seatPos.getY(i) + Math.cos(x * 3) * 0.02);
      }
    }
    seatPos.needsUpdate = true;
    seatGeo.computeVertexNormals();
    geoms.seat = seatGeo;

    // === EXHAUST ===
    const exhaustCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.2, 0.35, -0.2),
      new THREE.Vector3(-0.1, 0.2, -0.25),
      new THREE.Vector3(-0.5, 0.2, -0.25),
      new THREE.Vector3(-0.85, 0.25, -0.22),
    ]);
    const exhaustGeo = new THREE.TubeGeometry(exhaustCurve, 24, 0.04, 12, false);
    // Muffler end cap
    const mufflerGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.2, 16);
    mufflerGeo.rotateZ(Math.PI / 2);
    mufflerGeo.translate(-0.9, 0.25, -0.22);
    geoms.exhaust = mergeGeometries([exhaustGeo, mufflerGeo]);

    // === FAIRING (side panels) ===
    const fairingShape = new THREE.Shape();
    fairingShape.moveTo(0, 0);
    fairingShape.bezierCurveTo(0.15, 0.2, 0.35, 0.2, 0.4, 0);
    fairingShape.bezierCurveTo(0.35, -0.15, 0.15, -0.2, 0, 0);
    const fairingGeo = new THREE.ExtrudeGeometry(fairingShape, {
      depth: 0.02,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 3,
    });
    fairingGeo.center();
    // Create both sides
    const fairingRight = fairingGeo.clone();
    fairingRight.translate(0.15, 0.65, 0.18);
    const fairingLeft = fairingGeo.clone();
    fairingLeft.translate(0.15, 0.65, -0.18);
    geoms.fairing = mergeGeometries([fairingRight, fairingLeft]);

    // === HANDLEBAR ===
    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, -0.35),
      new THREE.Vector3(0, 0.05, -0.2),
      new THREE.Vector3(0, 0.05, 0.2),
      new THREE.Vector3(0, 0, 0.35),
    ]);
    geoms.handlebar = new THREE.TubeGeometry(handleCurve, 16, 0.02, 8, false);

    // === HEADLIGHT ===
    const headlightGeo = new THREE.SphereGeometry(0.1, 16, 16, 0, Math.PI);
    const headlightLens = new THREE.CircleGeometry(0.1, 16);
    headlightLens.rotateY(-Math.PI / 2);
    geoms.headlight = mergeGeometries([headlightGeo, headlightLens]);

    // === TAILLIGHT ===
    const taillightGeo = new THREE.BoxGeometry(0.05, 0.06, 0.12, 1, 1, 1);
    // Round it
    geoms.taillight = taillightGeo;

    // === WHEELS ===
    const wheelGeo = createWheelGeometry(0.3, 0.08);
    geoms.front_wheel = wheelGeo;
    geoms.rear_wheel = wheelGeo.clone();

    // === RIMS ===
    const rimGeo = createRimGeometry(0.28, 0.06);
    geoms.front_rim = rimGeo;
    geoms.rear_rim = rimGeo.clone();

    // === MUDGUARDS ===
    const mudguardGeo = createMudguardGeometry(0.32, 0.08);
    geoms.mudguard_front = mudguardGeo;
    geoms.mudguard_rear = mudguardGeo.clone();

    // === MIRRORS ===
    const mirrorGeo = new THREE.SphereGeometry(0.04, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const mirrorStem = new THREE.CylinderGeometry(0.008, 0.008, 0.15, 6);
    mirrorStem.translate(0, -0.075, 0);
    geoms.mirror_left = mergeGeometries([mirrorGeo, mirrorStem]);
    geoms.mirror_right = mergeGeometries([mirrorGeo.clone(), mirrorStem.clone()]);

    // === ENGINE ===
    const engineBlock = new THREE.BoxGeometry(0.25, 0.2, 0.22, 2, 2, 2);
    const cylinder1 = new THREE.CylinderGeometry(0.06, 0.06, 0.15, 12);
    cylinder1.rotateX(Math.PI / 2);
    cylinder1.translate(0.05, 0.08, 0.15);
    const cylinder2 = cylinder1.clone();
    cylinder2.translate(0, 0, -0.3);
    geoms.engine = mergeGeometries([engineBlock, cylinder1, cylinder2]);

    // === CHAIN COVER ===
    const chainCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.7, 0.35, -0.15),
      new THREE.Vector3(-0.3, 0.25, -0.15),
      new THREE.Vector3(0, 0.3, -0.15),
    ]);
    geoms.chain_cover = new THREE.TubeGeometry(chainCurve, 12, 0.025, 6, false);

    // Fork tubes (front suspension) — not a selectable part, just visual
    const forkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.7, 0.9, 0.08),
      new THREE.Vector3(0.82, 0.35, 0.08),
    ]);
    const forkGeo1 = new THREE.TubeGeometry(forkCurve, 10, 0.02, 8, false);
    const forkCurve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.7, 0.9, -0.08),
      new THREE.Vector3(0.82, 0.35, -0.08),
    ]);
    const forkGeo2 = new THREE.TubeGeometry(forkCurve2, 10, 0.02, 8, false);
    geoms._forks = mergeGeometries([forkGeo1, forkGeo2]);

    return geoms;
  }, []);
}

// Helper: create tire (torus)
function createWheelGeometry(radius: number, tube: number): THREE.TorusGeometry {
  return new THREE.TorusGeometry(radius, tube, 16, 32);
}

// Helper: create rim (thinner torus + spokes)
function createRimGeometry(radius: number, width: number): THREE.BufferGeometry {
  const rim = new THREE.TorusGeometry(radius, 0.015, 8, 32);
  const hub = new THREE.CylinderGeometry(0.04, 0.04, width, 12);
  hub.rotateX(Math.PI / 2);
  
  const spokes: THREE.BufferGeometry[] = [rim, hub];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const spokeGeo = new THREE.CylinderGeometry(0.005, 0.005, radius - 0.04, 4);
    spokeGeo.translate(0, (radius - 0.04) / 2, 0);
    spokeGeo.rotateZ(angle);
    spokes.push(spokeGeo);
  }
  
  return mergeGeometries(spokes);
}

// Helper: create mudguard (partial torus)
function createMudguardGeometry(radius: number, _width: number): THREE.BufferGeometry {
  const geo = new THREE.TorusGeometry(radius, 0.01, 8, 24, Math.PI);
  return geo;
}

// Helper: merge multiple geometries
function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  // Simple merge — concatenate all position, normal buffers
  let totalVertices = 0;
  let totalIndices = 0;
  
  for (const geo of geometries) {
    totalVertices += geo.attributes.position.count;
    if (geo.index) totalIndices += geo.index.count;
    else totalIndices += geo.attributes.position.count;
  }

  const positions = new Float32Array(totalVertices * 3);
  const normals = new Float32Array(totalVertices * 3);
  const indices: number[] = [];
  
  let vertexOffset = 0;
  
  for (const geo of geometries) {
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    
    for (let i = 0; i < pos.count; i++) {
      positions[(vertexOffset + i) * 3] = pos.getX(i);
      positions[(vertexOffset + i) * 3 + 1] = pos.getY(i);
      positions[(vertexOffset + i) * 3 + 2] = pos.getZ(i);
      
      if (norm) {
        normals[(vertexOffset + i) * 3] = norm.getX(i);
        normals[(vertexOffset + i) * 3 + 1] = norm.getY(i);
        normals[(vertexOffset + i) * 3 + 2] = norm.getZ(i);
      }
    }
    
    if (geo.index) {
      for (let i = 0; i < geo.index.count; i++) {
        indices.push(geo.index.getX(i) + vertexOffset);
      }
    } else {
      for (let i = 0; i < pos.count; i++) {
        indices.push(i + vertexOffset);
      }
    }
    
    vertexOffset += pos.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setIndex(indices);
  merged.computeVertexNormals();
  
  return merged;
}

export default function ProceduralBike() {
  const geometries = useMotorcycleGeometries();
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Frame */}
      <BikePart partId="frame" geometry={geometries.frame} />
      
      {/* Fork tubes (non-selectable decoration) */}
      <mesh geometry={geometries._forks} castShadow>
        <meshPhysicalMaterial color="#888" roughness={0.15} metalness={0.9} />
      </mesh>

      {/* Fuel Tank */}
      <BikePart 
        partId="fuel_tank" 
        geometry={geometries.fuel_tank} 
        position={[0.15, 1.15, 0]}
        rotation={[0, 0, -0.15]}
      />
      
      {/* Seat */}
      <BikePart 
        partId="seat" 
        geometry={geometries.seat} 
        position={[-0.35, 1.08, 0]}
      />
      
      {/* Fairing */}
      <BikePart 
        partId="fairing" 
        geometry={geometries.fairing} 
      />
      
      {/* Exhaust */}
      <BikePart 
        partId="exhaust" 
        geometry={geometries.exhaust} 
      />
      
      {/* Handlebar */}
      <BikePart 
        partId="handlebar" 
        geometry={geometries.handlebar} 
        position={[0.7, 1.2, 0]}
      />
      
      {/* Headlight */}
      <BikePart 
        partId="headlight" 
        geometry={geometries.headlight} 
        position={[0.85, 0.9, 0]}
        rotation={[0, 0, -0.1]}
      />
      
      {/* Taillight */}
      <BikePart 
        partId="taillight" 
        geometry={geometries.taillight} 
        position={[-0.82, 0.85, 0]}
      />

      {/* Front Wheel */}
      <BikePart 
        partId="front_wheel" 
        geometry={geometries.front_wheel} 
        position={[0.85, 0.35, 0]}
      />
      
      {/* Rear Wheel */}
      <BikePart 
        partId="rear_wheel" 
        geometry={geometries.rear_wheel} 
        position={[-0.7, 0.35, 0]}
      />

      {/* Front Rim */}
      <BikePart 
        partId="front_rim" 
        geometry={geometries.front_rim} 
        position={[0.85, 0.35, 0]}
      />
      
      {/* Rear Rim */}
      <BikePart 
        partId="rear_rim" 
        geometry={geometries.rear_rim} 
        position={[-0.7, 0.35, 0]}
      />

      {/* Front Mudguard */}
      <BikePart 
        partId="mudguard_front" 
        geometry={geometries.mudguard_front} 
        position={[0.85, 0.35, 0]}
        rotation={[0, 0, 0.3]}
      />
      
      {/* Rear Mudguard */}
      <BikePart 
        partId="mudguard_rear" 
        geometry={geometries.mudguard_rear} 
        position={[-0.7, 0.35, 0]}
        rotation={[0, 0, -0.2]}
      />

      {/* Mirrors */}
      <BikePart 
        partId="mirror_left" 
        geometry={geometries.mirror_left} 
        position={[0.65, 1.3, 0.35]}
      />
      <BikePart 
        partId="mirror_right" 
        geometry={geometries.mirror_right} 
        position={[0.65, 1.3, -0.35]}
      />

      {/* Engine */}
      <BikePart 
        partId="engine" 
        geometry={geometries.engine} 
        position={[0.1, 0.4, 0]}
      />

      {/* Chain Cover */}
      <BikePart 
        partId="chain_cover" 
        geometry={geometries.chain_cover} 
      />
    </group>
  );
}
