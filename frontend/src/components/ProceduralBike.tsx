import { useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useBikeStore } from '../stores/bikeStore';
import type { MaterialType } from '../types';

// Create material based on part state
function createMaterial(color: string, materialType: MaterialType, styleVariant: string | null, isSelected: boolean, isHovered: boolean): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({ color });

  if (styleVariant === 'race') {
    // Apply a stronger race livery tone to key parts
    const lower = color.toLowerCase();
    if (lower === '#c41e1e' || lower === '#ef4444' || lower === 'red') {
      mat.color.set('#b71c1c');
      mat.roughness = 0.10;
      mat.metalness = 0.15;
      mat.clearcoat = 1.0;
      mat.clearcoatRoughness = 0.03;
    } else if (lower === '#111827' || lower === '#1a1a1a' || lower === '#1f2937') {
      mat.color.set('#0a0a0a');
      mat.roughness = 0.18;
      mat.metalness = 0.1;
    } else if (lower === '#d4d4d8' || lower === '#f8fafc' || lower === '#f0f4f8') {
      mat.color.set('#f8fafc');
      mat.roughness = 0.14;
      mat.metalness = 0.3;
    } else {
      mat.color.set('#c41e1e');
      mat.roughness = 0.14;
      mat.metalness = 0.15;
    }
  }

  switch (materialType) {
    case 'gloss':
      mat.roughness = 0.12;
      mat.metalness = 0.08;
      mat.clearcoat = 1.0;
      mat.clearcoatRoughness = 0.03;
      break;
    case 'matte':
      mat.roughness = 0.75;
      mat.metalness = 0.0;
      break;
    case 'metallic':
      mat.roughness = 0.22;
      mat.metalness = 0.88;
      mat.clearcoat = 0.6;
      mat.clearcoatRoughness = 0.08;
      break;
    case 'chrome':
      mat.roughness = 0.04;
      mat.metalness = 1.0;
      mat.clearcoat = 1.0;
      mat.clearcoatRoughness = 0.01;
      mat.color.set('#e8e8e8');
      mat.reflectivity = 1.0;
      break;
    case 'carbon':
      mat.roughness = 0.35;
      mat.metalness = 0.25;
      mat.clearcoat = 0.9;
      mat.clearcoatRoughness = 0.06;
      break;
    case 'wrapped':
      mat.roughness = 0.55;
      mat.metalness = 0.0;
      break;
  }

  if (isSelected) {
    mat.emissive.set('#3b82f6');
    mat.emissiveIntensity = 0.18;
  } else if (isHovered) {
    mat.emissive.set('#8b5cf6');
    mat.emissiveIntensity = 0.12;
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

  // Dynamic geometry modifications based on active styleVariant or replacementPart
  const modifiedTransform = useMemo(() => {
    let mPos = [...position] as [number, number, number];
    let mRot = [...rotation] as [number, number, number];
    let mScl = [...scale] as [number, number, number];

    if (!part) return { position: mPos, rotation: mRot, scale: mScl };

    // --- Exhaust customizations ---
    if (partId === 'exhaust') {
      if (part.replacementPart === 'exhaust_akra_carbon' || part.replacementPart === 'exhaust_sc_crt') {
        // GP side slip-on muffler style
        mPos = [0.15, -0.05, 0.16];
        mRot = [0.15, 0, 0.38];
        mScl = [0.75, 0.75, 1.1];
      } else if (part.styleVariant === 'retro' || part.replacementPart === 'exhaust_yoshi') {
        // Classic retro twin pipes style
        mPos = [-0.1, -0.12, 0.15];
        mRot = [0.0, 0, 0.15];
        mScl = [1.25, 0.85, 0.85];
      }
    }

    // --- Seat customizations ---
    if (partId === 'seat') {
      if (part.styleVariant === 'retro' || part.replacementPart === 'seat_saddle') {
        // Thicker tracker/scrambler seat style
        mPos = [-0.36, 1.055, 0];
        mScl = [1.02, 1.45, 1.08];
      } else if (part.styleVariant === 'cafe' || part.replacementPart === 'seat_corbin') {
        // Sleek cafe racer solo cowl style
        mPos = [-0.36, 1.025, 0];
        mScl = [0.95, 0.82, 0.96];
      }
    }

    // --- Fuel Tank customizations ---
    if (partId === 'fuel_tank') {
      if (part.styleVariant === 'retro' || part.replacementPart === 'tank_unit_garage') {
        // Bulky scrambler tank style
        mScl = [1.08, 1.08, 1.14];
      } else if (part.styleVariant === 'cafe') {
        // Slim vintage clubman tank style
        mScl = [0.94, 0.88, 0.88];
      }
    }

    // --- Handlebar customizations ---
    if (partId === 'handlebar') {
      if (part.replacementPart === 'bar_renthal_twn') {
        // Wide motocross style handlebar
        mPos = [0.92, 1.29, 0];
        mScl = [1.0, 1.0, 1.25];
      } else if (part.replacementPart === 'bar_drag_low') {
        // Narrow retro flat drag bar
        mPos = [0.92, 1.23, 0];
        mScl = [0.85, 0.95, 0.85];
      }
    }

    return { position: mPos, rotation: mRot, scale: mScl };
  }, [part, partId, position, rotation, scale]);

  const material = useMemo(() => {
    if (!part) return new THREE.MeshPhysicalMaterial({ color: '#666' });
    return createMaterial(
      part.color,
      part.materialType,
      part.styleVariant,
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
      position={modifiedTransform.position}
      rotation={modifiedTransform.rotation}
      scale={modifiedTransform.scale}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      castShadow
      receiveShadow
      name={partId}
    />
  );
}

// ─── Helper: make a tube between multiple 3D points ───
function tube(pts: [number,number,number][], r: number, seg = 16): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
  return new THREE.TubeGeometry(curve, seg, r, 8, false);
}

// ─── Helper: make a straight tube between two points ───
function straightTube(a: [number,number,number], b: [number,number,number], r: number): THREE.TubeGeometry {
  const curve = new THREE.LineCurve3(new THREE.Vector3(...a), new THREE.Vector3(...b));
  return new THREE.TubeGeometry(curve, 4, r, 8, false);
}

// ─── Helper: merge multiple geometries ───
function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
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

// ─── Sport Y-spoke rim ───
function createSportRim(radius: number, width: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  // Outer rim ring (thicker for realism)
  const outerRim = new THREE.TorusGeometry(radius, 0.014, 10, 48);
  parts.push(outerRim);

  // Inner rim ring
  const innerRim = new THREE.TorusGeometry(radius * 0.92, 0.008, 8, 48);
  parts.push(innerRim);

  // Hub (wider, more detailed)
  const hub = new THREE.CylinderGeometry(0.045, 0.045, width, 20);
  hub.rotateX(Math.PI / 2);
  parts.push(hub);

  // Hub flange
  const hubFlange = new THREE.CylinderGeometry(0.06, 0.06, width * 0.3, 20);
  hubFlange.rotateX(Math.PI / 2);
  parts.push(hubFlange);

  // Y-spokes (6 sets for V4R)
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const nextAngle = angle + (Math.PI * 2 / 6) * 0.32;
    const prevAngle = angle - (Math.PI * 2 / 6) * 0.32;

    // Center spoke — thicker
    const spoke = new THREE.CylinderGeometry(0.008, 0.006, radius * 0.82, 4);
    spoke.translate(0, radius * 0.82 / 2 + 0.04, 0);
    spoke.rotateZ(angle);
    parts.push(spoke);

    // Y branch left
    const branchL = new THREE.CylinderGeometry(0.006, 0.004, radius * 0.42, 4);
    branchL.translate(0, radius * 0.42 / 2 + radius * 0.44, 0);
    branchL.rotateZ(nextAngle);
    parts.push(branchL);

    // Y branch right
    const branchR = new THREE.CylinderGeometry(0.006, 0.004, radius * 0.42, 4);
    branchR.translate(0, radius * 0.42 / 2 + radius * 0.44, 0);
    branchR.rotateZ(prevAngle);
    parts.push(branchR);
  }

  return mergeGeometries(parts);
}

// ─── Brake disc (wave-cut rotor) ───
function createBrakeDisc(outerRadius: number, innerRadius: number, thickness: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  // Wave-cut outer edge
  const segments = 64;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const waveR = outerRadius + Math.sin(angle * 6) * 0.004; // subtle wave
    const x = Math.cos(angle) * waveR;
    const y = Math.sin(angle) * waveR;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  // Cooling holes
  const numHoles = 8;
  for (let i = 0; i < numHoles; i++) {
    const angle = (i / numHoles) * Math.PI * 2;
    const cx = Math.cos(angle) * (outerRadius * 0.65);
    const cy = Math.sin(angle) * (outerRadius * 0.65);
    const coolHole = new THREE.Path();
    coolHole.absarc(cx, cy, 0.012, 0, Math.PI * 2, true);
    shape.holes.push(coolHole);
  }

  const discGeo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
  });
  discGeo.translate(0, 0, -thickness / 2);
  return discGeo;
}

// ─── Brake caliper (Brembo-style) ───
function createCaliper(width: number, height: number, depth: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  
  // Main body
  const body = new THREE.BoxGeometry(width, height, depth, 2, 2, 2);
  const bPos = body.attributes.position;
  for (let i = 0; i < bPos.count; i++) {
    const x = bPos.getX(i);
    const y = bPos.getY(i);
    // Round the edges slightly
    if (Math.abs(x) > width * 0.4 && Math.abs(y) > height * 0.4) {
      bPos.setX(i, x * 0.92);
      bPos.setY(i, y * 0.92);
    }
  }
  bPos.needsUpdate = true;
  body.computeVertexNormals();
  parts.push(body);

  // Pistons (visible cylinders)
  const piston1 = new THREE.CylinderGeometry(0.008, 0.008, depth * 1.1, 8);
  piston1.rotateX(Math.PI / 2);
  piston1.translate(0, height * 0.15, 0);
  parts.push(piston1);

  const piston2 = new THREE.CylinderGeometry(0.008, 0.008, depth * 1.1, 8);
  piston2.rotateX(Math.PI / 2);
  piston2.translate(0, -height * 0.15, 0);
  parts.push(piston2);

  // Brake line banjo
  const banjo = new THREE.CylinderGeometry(0.005, 0.005, 0.03, 6);
  banjo.translate(0, height * 0.3, 0);
  parts.push(banjo);

  return mergeGeometries(parts);
}


// ═══════════════════════════════════════════════════
// Build ALL enhanced Panigale V4R geometries
// ═══════════════════════════════════════════════════
function useMotorcycleGeometries() {
  return useMemo(() => {
    const geoms: Record<string, THREE.BufferGeometry> = {};
    const R = 0.022; // standard tube radius

    // ════════════════════════════════════════════════
    // FRAME — aggressive Panigale V4R trellis with tighter geometry
    // ════════════════════════════════════════════════
    const frameParts: THREE.BufferGeometry[] = [];

    // Main backbone (steering head → seat rail) — sharper angles
    frameParts.push(tube([
      [0.96, 1.04, 0], [0.72, 1.20, 0], [0.40, 1.24, 0],
      [0.10, 1.18, 0], [-0.18, 1.08, 0], [-0.60, 0.88, 0],
    ], R * 1.1, 28));

    // Downtube left/right — steeper angle, closer together
    frameParts.push(tube([
      [0.84, 0.96, 0.07], [0.60, 0.64, 0.09], [0.30, 0.38, 0.09], [0.14, 0.32, 0.08],
    ], R * 0.78, 18));
    frameParts.push(tube([
      [0.84, 0.96, -0.07], [0.60, 0.64, -0.09], [0.30, 0.38, -0.09], [0.14, 0.32, -0.08],
    ], R * 0.78, 18));

    // Upper trellis cross-braces (more of them, thinner)
    frameParts.push(straightTube([0.74, 1.12, 0.07], [0.46, 0.60, 0.08], R * 0.52));
    frameParts.push(straightTube([0.74, 1.12, -0.07], [0.46, 0.60, -0.08], R * 0.52));
    frameParts.push(straightTube([0.52, 1.18, 0.06], [0.34, 0.50, 0.07], R * 0.50));
    frameParts.push(straightTube([0.52, 1.18, -0.06], [0.34, 0.50, -0.07], R * 0.50));
    frameParts.push(straightTube([0.30, 1.22, 0.05], [0.18, 0.42, 0.06], R * 0.48));
    frameParts.push(straightTube([0.30, 1.22, -0.05], [0.18, 0.42, -0.06], R * 0.48));

    // Diagonal cross-braces
    frameParts.push(straightTube([0.64, 0.86, 0.08], [0.42, 0.86, -0.08], R * 0.35));
    frameParts.push(straightTube([0.40, 0.82, 0.07], [0.24, 0.82, -0.07], R * 0.35));

    // Seat sub-frame rails
    frameParts.push(tube([[-0.18, 1.08, 0.05], [-0.50, 1.00, 0.045], [-0.82, 0.74, 0.035], [-0.94, 0.68, 0.03]], R * 0.55, 16));
    frameParts.push(tube([[-0.18, 1.08, -0.05], [-0.50, 1.00, -0.045], [-0.82, 0.74, -0.035], [-0.94, 0.68, -0.03]], R * 0.55, 16));
    // Seat cross-brace
    frameParts.push(straightTube([-0.64, 0.86, 0.04], [-0.64, 0.86, -0.04], R * 0.42));
    frameParts.push(straightTube([-0.82, 0.76, 0.035], [-0.82, 0.76, -0.035], R * 0.42));

    // Pivot mount for swingarm
    const pivotBolt = new THREE.CylinderGeometry(0.03, 0.03, 0.18, 16);
    pivotBolt.rotateX(Math.PI / 2);
    pivotBolt.translate(0.12, 0.32, 0);
    frameParts.push(pivotBolt);

    geoms.frame = mergeGeometries(frameParts);

    // ════════════════════════════════════════════════
    // FUEL TANK — sculpted Panigale V4R tank with sharper nose & knee indents
    // ════════════════════════════════════════════════
    const tankProfile = new THREE.Shape();
    tankProfile.moveTo(-0.06, 0);
    tankProfile.bezierCurveTo(0.08, 0.22, 0.30, 0.34, 0.54, 0.20);
    tankProfile.bezierCurveTo(0.62, 0.10, 0.66, 0.02, 0.64, -0.06);
    tankProfile.bezierCurveTo(0.60, -0.16, 0.44, -0.26, 0.22, -0.22);
    tankProfile.bezierCurveTo(0.10, -0.20, -0.02, -0.12, -0.06, 0);

    const tankGeo = new THREE.ExtrudeGeometry(tankProfile, {
      depth: 0.40,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 8,
    });
    tankGeo.center();

    const tankPos = tankGeo.attributes.position;
    for (let i = 0; i < tankPos.count; i++) {
      const z = tankPos.getZ(i);
      const x = tankPos.getX(i);
      const y = tankPos.getY(i);

      // Deep knee indents on sides
      if (Math.abs(z) > 0.10) {
        const indent = Math.max(0, 0.055 - Math.abs(x - 0.06) * 0.14);
        tankPos.setZ(i, z > 0 ? z - indent : z + indent);
      }
      // Taper toward the nose
      if (x > 0.18) {
        const taper = 1 - (x - 0.18) * 0.15;
        tankPos.setZ(i, z * taper);
        tankPos.setY(i, y - Math.max(0, x - 0.20) * 0.10);
      }
      // Subtle center ridge
      if (Math.abs(z) < 0.04 && y > 0) {
        tankPos.setY(i, y + 0.012);
      }
    }
    tankPos.needsUpdate = true;
    tankGeo.computeVertexNormals();
    geoms.fuel_tank = tankGeo;

    // ════════════════════════════════════════════════
    // SEAT — slim Panigale V4R race seat & sharp tail cowl
    // ════════════════════════════════════════════════
    const seatParts: THREE.BufferGeometry[] = [];

    // Rider seat — thinner, sportier
    const riderSeatGeo = new THREE.BoxGeometry(0.30, 0.036, 0.17, 8, 1, 6);
    const riderPos = riderSeatGeo.attributes.position;
    for (let i = 0; i < riderPos.count; i++) {
      const x = riderPos.getX(i);
      const y = riderPos.getY(i);
      const z = riderPos.getZ(i);
      // Ergonomic dish
      if (y > 0) {
        riderPos.setY(i, y + Math.cos(x * 4.0) * 0.006 - 0.002);
      }
      // Taper toward the back
      const taper = 1 - Math.max(0, -x) * 0.35;
      riderPos.setZ(i, z * taper);
    }
    riderPos.needsUpdate = true;
    riderSeatGeo.computeVertexNormals();
    seatParts.push(riderSeatGeo);

    // Tail cowl — very sharp, aggressive taper
    const tailCowl = new THREE.BoxGeometry(0.32, 0.055, 0.18, 6, 1, 6);
    const tailPos = tailCowl.attributes.position;
    for (let i = 0; i < tailPos.count; i++) {
      const x = tailPos.getX(i);
      const z = tailPos.getZ(i);
      const y = tailPos.getY(i);
      // Aggressive rear taper
      const taperFactor = 1 - Math.max(0, (-x - 0.02)) * 1.4;
      tailPos.setZ(i, z * Math.max(0.15, taperFactor));
      // Slight upward kick at the very end
      if (x < -0.08) {
        tailPos.setY(i, y + Math.max(0, (-x - 0.08)) * 0.12);
      }
      // Sharper top edge
      if (y > 0) {
        tailPos.setY(i, y + 0.008);
      }
    }
    tailPos.needsUpdate = true;
    tailCowl.computeVertexNormals();
    tailCowl.translate(-0.28, 0.035, 0);
    seatParts.push(tailCowl);

    // Tail tip — pointed end cap
    const tailTip = new THREE.ConeGeometry(0.04, 0.10, 8);
    tailTip.rotateZ(-Math.PI / 2);
    tailTip.translate(-0.48, 0.058, 0);
    seatParts.push(tailTip);

    geoms.seat = mergeGeometries(seatParts);

    // ════════════════════════════════════════════════
    // FAIRING — aggressive Panigale V4R cowl with full side panels
    // ════════════════════════════════════════════════
    const fairingParts: THREE.BufferGeometry[] = [];

    // Upper cowl left — sculpted nose-to-radiator panel
    const cowlShape = new THREE.Shape();
    cowlShape.moveTo(0, 0);
    cowlShape.bezierCurveTo(0.08, 0.16, 0.26, 0.24, 0.46, 0.14);
    cowlShape.bezierCurveTo(0.54, 0.08, 0.56, 0.02, 0.54, -0.04);
    cowlShape.bezierCurveTo(0.50, -0.10, 0.36, -0.20, 0.14, -0.18);
    cowlShape.bezierCurveTo(0.06, -0.18, 0.02, -0.12, 0, 0);

    const cowlGeo = new THREE.ExtrudeGeometry(cowlShape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 4,
    });
    cowlGeo.center();

    // Left upper cowl
    const cowlL = cowlGeo.clone();
    cowlL.translate(0.88, 0.92, 0.22);
    fairingParts.push(cowlL);

    // Right upper cowl
    const cowlR = cowlGeo.clone();
    cowlR.translate(0.88, 0.92, -0.22);
    fairingParts.push(cowlR);

    // Mid-fairing side panels (larger, more coverage)
    const sidePanelGeo = new THREE.BoxGeometry(0.40, 0.22, 0.06, 4, 4, 1);
    const spPos = sidePanelGeo.attributes.position;
    for (let i = 0; i < spPos.count; i++) {
      const x = spPos.getX(i);
      const y = spPos.getY(i);
      // Curve the panel inward at top and bottom
      if (Math.abs(y) > 0.08) {
        spPos.setZ(i, spPos.getZ(i) * 0.85);
      }
      // Taper toward rear
      if (x < -0.06) {
        const t = 1 - (Math.abs(x + 0.06)) * 0.4;
        spPos.setY(i, y * Math.max(0.6, t));
      }
    }
    spPos.needsUpdate = true;
    sidePanelGeo.computeVertexNormals();

    const sidePanelL = sidePanelGeo.clone();
    sidePanelL.translate(0.36, 0.76, 0.24);
    fairingParts.push(sidePanelL);

    const sidePanelR = sidePanelGeo.clone();
    sidePanelR.translate(0.36, 0.76, -0.24);
    fairingParts.push(sidePanelR);

    // Vent slashes (cooling openings in the fairing)
    const ventShape = new THREE.Shape();
    ventShape.moveTo(0, 0);
    ventShape.lineTo(0.22, 0);
    ventShape.lineTo(0.22, -0.04);
    ventShape.lineTo(0, -0.06);
    ventShape.closePath();
    const ventGeo = new THREE.ExtrudeGeometry(ventShape, {
      depth: 0.015,
      bevelEnabled: false,
    });
    ventGeo.center();

    const ventL1 = ventGeo.clone();
    ventL1.translate(0.38, 0.82, 0.26);
    fairingParts.push(ventL1);
    const ventL2 = ventGeo.clone();
    ventL2.translate(0.38, 0.76, 0.26);
    fairingParts.push(ventL2);

    const ventR1 = ventGeo.clone();
    ventR1.translate(0.38, 0.82, -0.26);
    fairingParts.push(ventR1);
    const ventR2 = ventGeo.clone();
    ventR2.translate(0.38, 0.76, -0.26);
    fairingParts.push(ventR2);

    // Lower belly pan — deeper Panigale-style
    const bellyShape = new THREE.Shape();
    bellyShape.moveTo(0, 0);
    bellyShape.bezierCurveTo(0.04, 0.06, 0.28, 0.08, 0.36, 0.02);
    bellyShape.lineTo(0.36, -0.04);
    bellyShape.bezierCurveTo(0.28, -0.06, 0.08, -0.06, 0, 0);

    const bellyGeo = new THREE.ExtrudeGeometry(bellyShape, {
      depth: 0.24,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 3,
    });
    bellyGeo.center();
    bellyGeo.translate(0.08, 0.22, 0);
    fairingParts.push(bellyGeo);

    // Windscreen — thin curved panel
    const screenShape = new THREE.Shape();
    screenShape.moveTo(0, 0);
    screenShape.bezierCurveTo(0.02, 0.12, 0.10, 0.16, 0.18, 0.10);
    screenShape.lineTo(0.18, 0.08);
    screenShape.bezierCurveTo(0.10, 0.13, 0.04, 0.10, 0.02, 0);
    screenShape.closePath();
    const screenGeo = new THREE.ExtrudeGeometry(screenShape, {
      depth: 0.20,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.003,
      bevelSegments: 2,
    });
    screenGeo.center();
    screenGeo.translate(0.94, 1.06, 0);
    fairingParts.push(screenGeo);

    // Nose cone — pointed front
    const noseGeo = new THREE.BoxGeometry(0.12, 0.10, 0.20, 4, 4, 4);
    const nosePos = noseGeo.attributes.position;
    for (let i = 0; i < nosePos.count; i++) {
      const x = nosePos.getX(i);
      const y = nosePos.getY(i);
      const z = nosePos.getZ(i);
      if (x > 0.03) {
        const t = (x - 0.03) / 0.03;
        nosePos.setY(i, y * (1 - t * 0.3));
        nosePos.setZ(i, z * (1 - t * 0.3));
      }
    }
    nosePos.needsUpdate = true;
    noseGeo.computeVertexNormals();
    noseGeo.translate(0.98, 0.88, 0);
    fairingParts.push(noseGeo);

    geoms.fairing = mergeGeometries(fairingParts);

    // ════════════════════════════════════════════════
    // WINGLETS — Panigale V4R multi-element aero blades (stacked)
    // ════════════════════════════════════════════════
    const wingletPartsL: THREE.BufferGeometry[] = [];
    const wingletPartsR: THREE.BufferGeometry[] = [];

    // Each winglet: 2 stacked fins + endplate
    for (let fin = 0; fin < 2; fin++) {
      const finShape = new THREE.Shape();
      finShape.moveTo(0, 0);
      finShape.lineTo(0.16, 0);
      finShape.bezierCurveTo(0.18, 0.02, 0.20, 0.06, 0.18, 0.08);
      finShape.lineTo(0.04, 0.08);
      finShape.closePath();

      const finGeo = new THREE.ExtrudeGeometry(finShape, {
        depth: 0.015,
        bevelEnabled: true,
        bevelThickness: 0.003,
        bevelSize: 0.003,
        bevelSegments: 2,
      });

      const yOff = fin * 0.10;

      const finL = finGeo.clone();
      finL.translate(0.48, 0.80 + yOff, 0.26);
      finL.rotateY(-Math.PI / 14);
      wingletPartsL.push(finL);

      const finR = finGeo.clone();
      finR.translate(0.48, 0.80 + yOff, -0.26);
      finR.rotateY(Math.PI / 14);
      wingletPartsR.push(finR);
    }

    // Endplates connecting the two fins
    const endplateGeo = new THREE.BoxGeometry(0.14, 0.20, 0.008);
    const epL = endplateGeo.clone();
    epL.translate(0.60, 0.86, 0.28);
    wingletPartsL.push(epL);

    const epR = endplateGeo.clone();
    epR.translate(0.60, 0.86, -0.28);
    wingletPartsR.push(epR);

    // Mounting bracket
    const bracketGeo = new THREE.BoxGeometry(0.04, 0.08, 0.02);
    const brL = bracketGeo.clone();
    brL.translate(0.46, 0.86, 0.24);
    wingletPartsL.push(brL);

    const brR = bracketGeo.clone();
    brR.translate(0.46, 0.86, -0.24);
    wingletPartsR.push(brR);

    geoms.winglet_left = mergeGeometries(wingletPartsL);
    geoms.winglet_right = mergeGeometries(wingletPartsR);

    // ════════════════════════════════════════════════
    // ENGINE — V4 block with cylinder banks, clutch cover, ribbing
    // ════════════════════════════════════════════════
    const engineParts: THREE.BufferGeometry[] = [];

    // Main crankcase
    const crankcase = new THREE.BoxGeometry(0.30, 0.20, 0.26, 4, 3, 3);
    const ccPos = crankcase.attributes.position;
    for (let i = 0; i < ccPos.count; i++) {
      const x = ccPos.getX(i);
      const y = ccPos.getY(i);
      const z = ccPos.getZ(i);
      // Round the edges
      if (Math.abs(z) > 0.10 && Math.abs(y) > 0.08) {
        ccPos.setZ(i, z * 0.92);
      }
      // Taper bottom
      if (y < -0.06) {
        ccPos.setZ(i, z * 0.88);
        ccPos.setX(i, x * 0.92);
      }
    }
    ccPos.needsUpdate = true;
    crankcase.computeVertexNormals();
    engineParts.push(crankcase);

    // Front cylinder bank (angled forward ~45°)
    const frontCylinder = new THREE.BoxGeometry(0.18, 0.12, 0.22, 2, 2, 2);
    frontCylinder.rotateZ(0.7); // Angled forward
    frontCylinder.translate(0.16, 0.15, 0);
    engineParts.push(frontCylinder);

    // Rear cylinder bank (angled backward ~45°)
    const rearCylinder = new THREE.BoxGeometry(0.18, 0.12, 0.22, 2, 2, 2);
    rearCylinder.rotateZ(-0.7); // Angled backward
    rearCylinder.translate(-0.06, 0.15, 0);
    engineParts.push(rearCylinder);

    // Valve covers (on top of cylinder banks)
    const valveCoverF = new THREE.CylinderGeometry(0.08, 0.10, 0.04, 14);
    valveCoverF.rotateZ(Math.PI / 2 + 0.7);
    valveCoverF.translate(0.20, 0.22, 0);
    engineParts.push(valveCoverF);

    const valveCoverR = new THREE.CylinderGeometry(0.08, 0.10, 0.04, 14);
    valveCoverR.rotateZ(Math.PI / 2 - 0.7);
    valveCoverR.translate(-0.10, 0.22, 0);
    engineParts.push(valveCoverR);

    // Cooling fins on cylinder heads
    for (let bank = 0; bank < 2; bank++) {
      const bankAngle = bank === 0 ? 0.7 : -0.7;
      const bankX = bank === 0 ? 0.16 : -0.06;
      for (let i = 0; i < 6; i++) {
        const fin = new THREE.BoxGeometry(0.20, 0.005, 0.24);
        fin.rotateZ(bankAngle);
        fin.translate(bankX, 0.06 + i * 0.022, 0);
        engineParts.push(fin);
      }
    }

    // Clutch cover (right side — large disc)
    const clutchCover = new THREE.CylinderGeometry(0.065, 0.065, 0.025, 20);
    clutchCover.rotateX(Math.PI / 2);
    clutchCover.translate(0, 0.02, -0.14);
    engineParts.push(clutchCover);

    // Alternator cover (left side)
    const altCover = new THREE.CylinderGeometry(0.055, 0.055, 0.02, 18);
    altCover.rotateX(Math.PI / 2);
    altCover.translate(-0.02, -0.02, 0.14);
    engineParts.push(altCover);

    // Gearbox extension
    const gearbox = new THREE.BoxGeometry(0.16, 0.14, 0.22);
    gearbox.translate(-0.16, -0.03, 0);
    engineParts.push(gearbox);

    // Oil sump
    const sump = new THREE.BoxGeometry(0.24, 0.035, 0.22, 2, 1, 2);
    sump.translate(0, -0.12, 0);
    engineParts.push(sump);

    // Front sprocket cover
    const sprocketCover = new THREE.CylinderGeometry(0.055, 0.055, 0.025, 14);
    sprocketCover.rotateX(Math.PI / 2);
    sprocketCover.translate(-0.12, -0.02, -0.14);
    engineParts.push(sprocketCover);

    // Oil cooler lines
    engineParts.push(tube([[0.10, -0.08, 0.14], [0.16, -0.04, 0.18], [0.20, 0.04, 0.18]], 0.006, 8));
    engineParts.push(tube([[0.10, -0.08, -0.14], [0.16, -0.04, -0.18], [0.20, 0.04, -0.18]], 0.006, 8));

    geoms.engine = mergeGeometries(engineParts);

    // ════════════════════════════════════════════════
    // EXHAUST — Panigale V4R under-seat routing
    // ════════════════════════════════════════════════
    const exhaustParts: THREE.BufferGeometry[] = [];
    const headerR = 0.016;

    // Header 1 — front left cylinder
    exhaustParts.push(tube([
      [0.24, 0.54, 0.10], [0.32, 0.38, 0.14], [0.28, 0.22, 0.16], [0.14, 0.16, 0.18],
    ], headerR, 22));

    // Header 2 — front right cylinder
    exhaustParts.push(tube([
      [0.24, 0.54, -0.04], [0.30, 0.36, 0.04], [0.24, 0.20, 0.12], [0.14, 0.15, 0.18],
    ], headerR, 22));

    // Header 3 — rear left cylinder
    exhaustParts.push(tube([
      [0.10, 0.54, 0.06], [0.18, 0.34, 0.10], [0.16, 0.20, 0.14], [0.12, 0.14, 0.18],
    ], headerR, 22));

    // Header 4 — rear right cylinder (V4!)
    exhaustParts.push(tube([
      [0.06, 0.52, -0.06], [0.12, 0.32, 0.04], [0.12, 0.18, 0.14], [0.10, 0.14, 0.18],
    ], headerR, 22));

    // Collector — 4-into-2-into-1
    exhaustParts.push(tube([
      [0.12, 0.15, 0.18], [0.02, 0.14, 0.19], [-0.10, 0.14, 0.20],
    ], 0.022, 16));

    // Under-engine pipe routing toward rear
    exhaustParts.push(tube([
      [-0.10, 0.14, 0.20], [-0.30, 0.16, 0.20], [-0.52, 0.20, 0.18],
      [-0.68, 0.26, 0.16], [-0.78, 0.34, 0.14],
    ], 0.024, 28));

    // Catalytic converter box
    const catBox = new THREE.BoxGeometry(0.12, 0.06, 0.06, 2, 1, 1);
    const catPos = catBox.attributes.position;
    for (let i = 0; i < catPos.count; i++) {
      const x = catPos.getX(i);
      const z = catPos.getZ(i);
      if (Math.abs(x) > 0.04 && Math.abs(z) > 0.02) {
        catPos.setX(i, x * 0.88);
        catPos.setZ(i, z * 0.88);
      }
    }
    catPos.needsUpdate = true;
    catBox.computeVertexNormals();
    catBox.translate(-0.42, 0.18, 0.19);
    exhaustParts.push(catBox);

    // Muffler canister — short, stubby race can
    const mufflerBody = new THREE.CylinderGeometry(0.048, 0.044, 0.22, 18);
    mufflerBody.rotateZ(Math.PI / 2 + 0.15);
    mufflerBody.translate(-0.88, 0.38, 0.14);
    exhaustParts.push(mufflerBody);

    // Muffler end cap
    const mufflerCap = new THREE.CylinderGeometry(0.032, 0.022, 0.025, 14);
    mufflerCap.rotateZ(Math.PI / 2 + 0.15);
    mufflerCap.translate(-1.00, 0.40, 0.14);
    exhaustParts.push(mufflerCap);

    // Heat shield on muffler
    const heatShield = new THREE.CylinderGeometry(0.052, 0.048, 0.10, 18, 1, true);
    heatShield.rotateZ(Math.PI / 2 + 0.15);
    heatShield.translate(-0.84, 0.37, 0.14);
    exhaustParts.push(heatShield);

    geoms.exhaust = mergeGeometries(exhaustParts);

    // ════════════════════════════════════════════════
    // HANDLEBAR — low clip-on bars
    // ════════════════════════════════════════════════
    const handleParts: THREE.BufferGeometry[] = [];

    // Clip-on mounts (clamped to fork tubes)
    const clampL = new THREE.CylinderGeometry(0.018, 0.018, 0.04, 10);
    clampL.rotateX(Math.PI / 2);
    clampL.translate(-0.02, 0, 0.12);
    handleParts.push(clampL);

    const clampR = new THREE.CylinderGeometry(0.018, 0.018, 0.04, 10);
    clampR.rotateX(Math.PI / 2);
    clampR.translate(-0.02, 0, -0.12);
    handleParts.push(clampR);

    // Bars — swept back slightly
    handleParts.push(tube([
      [0, 0, -0.36], [0.01, 0.02, -0.22], [0.02, 0.03, -0.12],
    ], 0.012, 14));
    handleParts.push(tube([
      [0, 0, 0.36], [0.01, 0.02, 0.22], [0.02, 0.03, 0.12],
    ], 0.012, 14));

    // Grips (textured — thicker ends)
    const gripL = new THREE.CylinderGeometry(0.018, 0.018, 0.10, 12);
    gripL.rotateX(Math.PI / 2);
    gripL.translate(0, 0, 0.36);
    handleParts.push(gripL);

    const gripR = new THREE.CylinderGeometry(0.018, 0.018, 0.10, 12);
    gripR.rotateX(Math.PI / 2);
    gripR.translate(0, 0, -0.36);
    handleParts.push(gripR);

    // Bar end weights
    const barEndL = new THREE.SphereGeometry(0.016, 8, 8);
    barEndL.translate(0, 0, 0.42);
    handleParts.push(barEndL);

    const barEndR = new THREE.SphereGeometry(0.016, 8, 8);
    barEndR.translate(0, 0, -0.42);
    handleParts.push(barEndR);

    // Brake lever
    handleParts.push(tube([
      [0.01, -0.01, -0.28], [0.08, -0.04, -0.30], [0.12, -0.06, -0.28],
    ], 0.005, 8));

    // Clutch lever
    handleParts.push(tube([
      [0.01, -0.01, 0.28], [0.08, -0.04, 0.30], [0.12, -0.06, 0.28],
    ], 0.005, 8));

    geoms.handlebar = mergeGeometries(handleParts);

    // ════════════════════════════════════════════════
    // HEADLIGHT — compact Panigale V4R LED with DRL
    // ════════════════════════════════════════════════
    const headlightParts: THREE.BufferGeometry[] = [];

    // Housing — compact V-shaped
    const hlHousing = new THREE.BoxGeometry(0.08, 0.06, 0.10, 3, 3, 3);
    const hlPos = hlHousing.attributes.position;
    for (let i = 0; i < hlPos.count; i++) {
      const x = hlPos.getX(i);
      const y = hlPos.getY(i);
      // V-shape from the front
      if (x > 0.02) {
        hlPos.setY(i, y * (1 - (x - 0.02) * 1.5));
      }
    }
    hlPos.needsUpdate = true;
    hlHousing.computeVertexNormals();
    headlightParts.push(hlHousing);

    // LED projector pods
    const podL = new THREE.CylinderGeometry(0.014, 0.016, 0.025, 10);
    podL.rotateZ(Math.PI / 2);
    podL.translate(0.035, 0, 0.025);
    headlightParts.push(podL);

    const podR = new THREE.CylinderGeometry(0.014, 0.016, 0.025, 10);
    podR.rotateZ(Math.PI / 2);
    podR.translate(0.035, 0, -0.025);
    headlightParts.push(podR);

    // DRL strip
    const drl = new THREE.BoxGeometry(0.06, 0.006, 0.08);
    drl.translate(0.02, 0.02, 0);
    headlightParts.push(drl);

    geoms.headlight = mergeGeometries(headlightParts);

    // ════════════════════════════════════════════════
    // TAILLIGHT — slim Panigale V4R LED strip
    // ════════════════════════════════════════════════
    const tlParts: THREE.BufferGeometry[] = [];

    // Main LED bar — very slim
    const tlBar = new THREE.BoxGeometry(0.03, 0.015, 0.12);
    tlParts.push(tlBar);

    // Individual LED segments
    for (let i = 0; i < 5; i++) {
      const led = new THREE.BoxGeometry(0.015, 0.008, 0.018);
      led.translate(0.005, 0, -0.045 + i * 0.022);
      tlParts.push(led);
    }

    // License plate bracket
    const bracket = new THREE.BoxGeometry(0.005, 0.06, 0.06);
    bracket.translate(-0.01, -0.04, 0);
    tlParts.push(bracket);

    geoms.taillight = mergeGeometries(tlParts);

    // ════════════════════════════════════════════════
    // WHEELS — wider rear (190/55), narrower front (120/70)
    // ════════════════════════════════════════════════
    // Front: 120/70-17 profile
    geoms.front_wheel = new THREE.TorusGeometry(0.34, 0.068, 22, 48);
    // Rear: 200/60-17 profile (much wider!)
    geoms.rear_wheel = new THREE.TorusGeometry(0.36, 0.10, 22, 48);

    // ════════════════════════════════════════════════
    // RIMS — 6-spoke Y pattern (Panigale V4R style)
    // ════════════════════════════════════════════════
    geoms.front_rim = createSportRim(0.30, 0.065);
    geoms.rear_rim = createSportRim(0.30, 0.085);

    // ════════════════════════════════════════════════
    // BRAKE DISCS — dual front, single rear
    // ════════════════════════════════════════════════
    geoms.front_disc = createBrakeDisc(0.20, 0.045, 0.012);
    geoms.rear_disc = createBrakeDisc(0.16, 0.04, 0.010);

    // Front: second disc on the other side
    geoms._front_disc_inner = createBrakeDisc(0.20, 0.045, 0.012);

    // ════════════════════════════════════════════════
    // BRAKE CALIPERS — Brembo-style
    // ════════════════════════════════════════════════
    geoms.front_caliper = createCaliper(0.05, 0.055, 0.028);
    geoms.rear_caliper = createCaliper(0.04, 0.045, 0.024);
    geoms._front_caliper_inner = createCaliper(0.05, 0.055, 0.028);

    // ════════════════════════════════════════════════
    // RADIATOR — angled performance radiator + air scoops
    // ════════════════════════════════════════════════
    const radBody = new THREE.BoxGeometry(0.22, 0.28, 0.06, 3, 8, 2);
    const radPos = radBody.attributes.position;
    for (let i = 0; i < radPos.count; i++) {
      const y = radPos.getY(i);
      const x = radPos.getX(i);
      // Taper top
      if (y > 0.10) radPos.setX(i, x * 0.88);
      // Angle the radiator forward
      radPos.setX(i, radPos.getX(i) + y * 0.12);
    }
    radPos.needsUpdate = true;
    radBody.computeVertexNormals();
    geoms.radiator = radBody;

    // Air intake — ram-air duct
    const intakeParts: THREE.BufferGeometry[] = [];
    const intakeBody = new THREE.BoxGeometry(0.10, 0.08, 0.10, 2, 2, 2);
    const ibPos = intakeBody.attributes.position;
    for (let i = 0; i < ibPos.count; i++) {
      const x = ibPos.getX(i);
      if (x > 0.03) {
        ibPos.setY(i, ibPos.getY(i) * 1.2); // Flare at the opening
        ibPos.setZ(i, ibPos.getZ(i) * 1.2);
      }
    }
    ibPos.needsUpdate = true;
    intakeBody.computeVertexNormals();
    intakeParts.push(intakeBody);

    // Intake duct tube
    intakeParts.push(tube([
      [-0.05, 0, 0], [-0.12, -0.02, 0], [-0.18, -0.06, 0],
    ], 0.028, 10));

    geoms.air_intake = mergeGeometries(intakeParts);

    // ════════════════════════════════════════════════
    // SWINGARM — single-sided (Panigale V4R signature)
    // ════════════════════════════════════════════════
    const swingarmParts: THREE.BufferGeometry[] = [];

    // Main arm — only on the left side, thick aluminum look
    const armMain = new THREE.BoxGeometry(0.92, 0.09, 0.10, 4, 2, 2);
    const armPos = armMain.attributes.position;
    for (let i = 0; i < armPos.count; i++) {
      const x = armPos.getX(i);
      const y = armPos.getY(i);
      // Taper toward rear axle
      if (x < -0.20) {
        const t = (-x - 0.20) / 0.26;
        armPos.setY(i, y * (1 - t * 0.2));
      }
      // Slight upward curve
      armPos.setY(i, armPos.getY(i) + Math.abs(x) * 0.04);
    }
    armPos.needsUpdate = true;
    armMain.computeVertexNormals();
    armMain.translate(-0.36, 0, 0.10);
    swingarmParts.push(armMain);

    // Pivot point (clevis mount)
    const pivotMount = new THREE.CylinderGeometry(0.035, 0.035, 0.06, 14);
    pivotMount.rotateX(Math.PI / 2);
    pivotMount.translate(0.10, 0, 0.10);
    swingarmParts.push(pivotMount);

    // Rear axle hub plate
    const hubPlate = new THREE.CylinderGeometry(0.055, 0.055, 0.04, 18);
    hubPlate.rotateX(Math.PI / 2);
    hubPlate.translate(-0.82, 0.02, 0.10);
    swingarmParts.push(hubPlate);

    // Chain adjuster block
    const adjuster = new THREE.BoxGeometry(0.06, 0.04, 0.04);
    adjuster.translate(-0.78, -0.02, 0.10);
    swingarmParts.push(adjuster);

    geoms.swingarm = mergeGeometries(swingarmParts);

    // ════════════════════════════════════════════════
    // SUBFRAME — minimal support tubes
    // ════════════════════════════════════════════════
    const subframeParts: THREE.BufferGeometry[] = [];
    subframeParts.push(tube([[-0.14, 1.10, 0.05], [-0.28, 1.02, 0.05], [-0.48, 0.86, 0.045]], 0.012, 12));
    subframeParts.push(tube([[-0.14, 1.10, -0.05], [-0.28, 1.02, -0.05], [-0.48, 0.86, -0.045]], 0.012, 12));
    subframeParts.push(straightTube([-0.36, 0.92, 0.05], [-0.36, 0.92, -0.05], 0.008));
    subframeParts.push(straightTube([-0.48, 0.86, 0.045], [-0.48, 0.86, -0.045], 0.008));
    geoms.subframe = mergeGeometries(subframeParts);

    // ════════════════════════════════════════════════
    // FOOTPEGS — rearset racing pegs
    // ════════════════════════════════════════════════
    const pegParts: THREE.BufferGeometry[] = [];
    // Mounting plate
    const pegPlate = new THREE.BoxGeometry(0.04, 0.06, 0.015);
    pegParts.push(pegPlate);
    // Peg
    const pegBar = new THREE.CylinderGeometry(0.008, 0.008, 0.06, 8);
    pegBar.rotateX(Math.PI / 2);
    pegBar.translate(0, -0.02, 0.025);
    pegParts.push(pegBar);
    // Toe peg
    const toePeg = new THREE.CylinderGeometry(0.006, 0.006, 0.04, 6);
    toePeg.rotateZ(-Math.PI / 4);
    toePeg.translate(0.02, -0.03, 0.025);
    pegParts.push(toePeg);

    const pegGeoL = mergeGeometries(pegParts);
    pegGeoL.translate(-0.16, 0.28, 0.16);
    geoms.footpeg_left = pegGeoL;

    const pegGeoR = mergeGeometries(pegParts.map(g => g.clone()));
    pegGeoR.translate(-0.16, 0.28, -0.16);
    geoms.footpeg_right = pegGeoR;

    // ════════════════════════════════════════════════
    // MUDGUARDS
    // ════════════════════════════════════════════════
    // Front — low-profile hugger
    const fenderShape = new THREE.Shape();
    fenderShape.moveTo(0, 0);
    fenderShape.lineTo(0.36, 0);
    fenderShape.bezierCurveTo(0.36, -0.015, 0.34, -0.07, 0.18, -0.09);
    fenderShape.bezierCurveTo(0.10, -0.10, 0.02, -0.07, 0, 0);
    const fenderGeo = new THREE.ExtrudeGeometry(fenderShape, {
      depth: 0.07,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.006,
      bevelSegments: 2,
    });
    fenderGeo.center();
    fenderGeo.rotateX(Math.PI / 2);
    fenderGeo.translate(0.86, 0.38, 0);
    geoms.mudguard_front = fenderGeo;

    // Rear — short hugger (mounts to swingarm)
    const rMudguard = new THREE.TorusGeometry(0.36, 0.010, 8, 30, Math.PI * 0.38);
    geoms.mudguard_rear = rMudguard;

    // ════════════════════════════════════════════════
    // MIRRORS — bar-end style (tiny on Panigale)
    // ════════════════════════════════════════════════
    const mirrorParts: THREE.BufferGeometry[] = [];
    // Head — small oval
    const mirrorHead = new THREE.CylinderGeometry(0.028, 0.028, 0.006, 14);
    mirrorHead.rotateX(Math.PI / 2);
    mirrorParts.push(mirrorHead);
    // Stem
    const mirrorStem = new THREE.CylinderGeometry(0.005, 0.005, 0.08, 6);
    mirrorStem.rotateX(Math.PI / 2);
    mirrorStem.translate(0, 0, -0.048);
    mirrorParts.push(mirrorStem);
    // Glass
    const mirrorGlass = new THREE.CircleGeometry(0.026, 14);
    mirrorGlass.translate(0, 0, 0.004);
    mirrorParts.push(mirrorGlass);

    geoms.mirror_left = mergeGeometries(mirrorParts);
    geoms.mirror_right = mergeGeometries(mirrorParts.map(g => g.clone()));

    // ════════════════════════════════════════════════
    // CHAIN COVER — protective guard
    // ════════════════════════════════════════════════
    geoms.chain_cover = tube([
      [-0.76, 0.36, -0.10], [-0.44, 0.28, -0.10], [-0.16, 0.30, -0.10], [0.0, 0.33, -0.10],
    ], 0.016, 18);

    // ════════════════════════════════════════════════
    // FORKS — thick Öhlins-style USD forks
    // ════════════════════════════════════════════════
    const forkParts: THREE.BufferGeometry[] = [];

    // Triple clamp top
    const tripleTop = new THREE.BoxGeometry(0.05, 0.018, 0.24, 2, 1, 4);
    const ttPos = tripleTop.attributes.position;
    for (let i = 0; i < ttPos.count; i++) {
      const z = ttPos.getZ(i);
      // Round the ends
      if (Math.abs(z) > 0.09) {
        ttPos.setX(i, ttPos.getX(i) * 0.88);
      }
    }
    ttPos.needsUpdate = true;
    tripleTop.computeVertexNormals();
    tripleTop.translate(0.80, 1.00, 0);
    forkParts.push(tripleTop);

    // Triple clamp bottom
    const tripleBot = new THREE.BoxGeometry(0.05, 0.018, 0.26, 2, 1, 4);
    tripleBot.translate(0.83, 0.92, 0);
    forkParts.push(tripleBot);

    // Left stanchion — upper (gold, thick)
    forkParts.push(tube([[0.80, 1.00, 0.10], [0.88, 0.72, 0.10]], 0.030, 12));
    // Left stanchion — lower (silver, thinner)
    forkParts.push(tube([[0.88, 0.72, 0.10], [0.96, 0.34, 0.10]], 0.024, 12));

    // Right stanchion — upper (gold, thick)
    forkParts.push(tube([[0.80, 1.00, -0.10], [0.88, 0.72, -0.10]], 0.030, 12));
    // Right stanchion — lower (silver, thinner)
    forkParts.push(tube([[0.88, 0.72, -0.10], [0.96, 0.34, -0.10]], 0.024, 12));

    // Preload adjusters (top of forks)
    const adjL = new THREE.CylinderGeometry(0.014, 0.014, 0.03, 8);
    adjL.translate(0.79, 1.02, 0.10);
    forkParts.push(adjL);
    const adjR = new THREE.CylinderGeometry(0.014, 0.014, 0.03, 8);
    adjR.translate(0.79, 1.02, -0.10);
    forkParts.push(adjR);

    // Steering stem
    forkParts.push(straightTube([0.76, 0.98, 0], [0.78, 0.90, 0], 0.012));

    // Axle
    const axle = new THREE.CylinderGeometry(0.012, 0.012, 0.24, 8);
    axle.rotateX(Math.PI / 2);
    axle.translate(0.98, 0.30, 0);
    forkParts.push(axle);

    geoms._forks = mergeGeometries(forkParts);

    // ════════════════════════════════════════════════
    // REAR MONOSHOCK — Öhlins TTX with visible reservoir
    // ════════════════════════════════════════════════
    const shockParts: THREE.BufferGeometry[] = [];

    // Spring coils
    for (let i = 0; i < 10; i++) {
      const coil = new THREE.TorusGeometry(0.020, 0.0035, 6, 18);
      coil.translate(-0.20, 0.48 + i * 0.032, 0);
      shockParts.push(coil);
    }
    // Damper rod
    shockParts.push(straightTube([-0.20, 0.42, 0], [-0.20, 0.84, 0], 0.007));
    // Reservoir (piggyback)
    const reservoir = new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8);
    reservoir.translate(-0.16, 0.70, 0.04);
    shockParts.push(reservoir);
    // Hose to reservoir
    shockParts.push(tube([[-0.20, 0.76, 0], [-0.18, 0.78, 0.02], [-0.16, 0.76, 0.04]], 0.004, 8));

    geoms._shock = mergeGeometries(shockParts);

    // ════════════════════════════════════════════════
    // REAR SPROCKET — chain drive (new part)
    // ════════════════════════════════════════════════
    const sprocketParts: THREE.BufferGeometry[] = [];
    // Outer ring with teeth
    const sprocketRing = new THREE.TorusGeometry(0.08, 0.008, 6, 24);
    sprocketParts.push(sprocketRing);
    // Hub
    const sprocketHub = new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12);
    sprocketHub.rotateX(Math.PI / 2);
    sprocketParts.push(sprocketHub);
    // Spokes
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const spokeGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.05, 4);
      spokeGeo.translate(0, 0.025, 0);
      spokeGeo.rotateZ(angle);
      sprocketParts.push(spokeGeo);
    }
    geoms.rear_sprocket = mergeGeometries(sprocketParts);

    // ════════════════════════════════════════════════
    // DRIVE CHAIN (new part)
    // ════════════════════════════════════════════════
    geoms.chain = tube([
      [-0.82, 0.34, -0.10], [-0.50, 0.26, -0.10], [-0.20, 0.28, -0.10], [0.02, 0.32, -0.10],
    ], 0.010, 22);

    // ════════════════════════════════════════════════
    // FORK GUARDS (new parts)
    // ════════════════════════════════════════════════
    const fgShape = new THREE.Shape();
    fgShape.moveTo(0, 0);
    fgShape.lineTo(0.08, 0);
    fgShape.bezierCurveTo(0.08, -0.03, 0.06, -0.06, 0.03, -0.06);
    fgShape.bezierCurveTo(0, -0.06, -0.01, -0.03, 0, 0);
    const fgGeo = new THREE.ExtrudeGeometry(fgShape, {
      depth: 0.03,
      bevelEnabled: false,
    });
    fgGeo.center();

    const fgL = fgGeo.clone();
    fgL.translate(0.92, 0.46, 0.10);
    geoms.fork_guard_left = fgL;

    const fgR = fgGeo.clone();
    fgR.translate(0.92, 0.46, -0.10);
    geoms.fork_guard_right = fgR;

    // ════════════════════════════════════════════════
    // STEERING DAMPER (new part)
    // ════════════════════════════════════════════════
    const damperParts: THREE.BufferGeometry[] = [];
    // Cylinder
    const damperCyl = new THREE.CylinderGeometry(0.008, 0.008, 0.14, 8);
    damperCyl.rotateX(Math.PI / 2);
    damperParts.push(damperCyl);
    // Rod
    const damperRod = new THREE.CylinderGeometry(0.004, 0.004, 0.06, 6);
    damperRod.rotateX(Math.PI / 2);
    damperRod.translate(0, 0, 0.10);
    damperParts.push(damperRod);
    // Mounting eyes
    const eyeL = new THREE.TorusGeometry(0.008, 0.003, 6, 10);
    eyeL.translate(0, 0, -0.08);
    damperParts.push(eyeL);
    const eyeR = new THREE.TorusGeometry(0.008, 0.003, 6, 10);
    eyeR.translate(0, 0, 0.14);
    damperParts.push(eyeR);

    const damperGeo = mergeGeometries(damperParts);
    damperGeo.translate(0.76, 1.04, 0);
    geoms.steering_damper = damperGeo;

    return geoms;
  }, []);
}


// ═══════════════════════════════════════════════════
// Main component — assemble the Ducati Panigale V4R
// ═══════════════════════════════════════════════════
export default function ProceduralBike() {
  const geometries = useMotorcycleGeometries();
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Frame — trellis */}
      <BikePart partId="frame" geometry={geometries.frame} />
      
      {/* USD Forks (non-selectable — gold Öhlins) */}
      <mesh geometry={geometries._forks} castShadow>
        <meshPhysicalMaterial color="#c8a832" roughness={0.10} metalness={0.95} clearcoat={0.9} clearcoatRoughness={0.04} />
      </mesh>

      {/* Rear monoshock (non-selectable — yellow spring) */}
      <mesh geometry={geometries._shock} castShadow>
        <meshPhysicalMaterial color="#e0c020" roughness={0.25} metalness={0.75} clearcoat={0.5} />
      </mesh>

      {/* Fuel Tank */}
      <BikePart 
        partId="fuel_tank" 
        geometry={geometries.fuel_tank} 
        position={[0.28, 1.16, 0]}
        rotation={[0, 0, -0.06]}
      />
      
      {/* Seat */}
      <BikePart 
        partId="seat" 
        geometry={geometries.seat} 
        position={[-0.36, 1.04, 0]}
      />
      
      {/* Fairing */}
      <BikePart 
        partId="fairing" 
        geometry={geometries.fairing} 
      />

      {/* Winglets */}
      <BikePart 
        partId="winglet_left" 
        geometry={geometries.winglet_left} 
      />
      <BikePart 
        partId="winglet_right" 
        geometry={geometries.winglet_right} 
      />
      
      {/* Exhaust — V4 under-seat system */}
      <BikePart 
        partId="exhaust" 
        geometry={geometries.exhaust} 
      />
      
      {/* Handlebar — clip-ons */}
      <BikePart 
        partId="handlebar" 
        geometry={geometries.handlebar} 
        position={[0.92, 1.26, 0]}
      />
      
      {/* Headlight */}
      <BikePart 
        partId="headlight" 
        geometry={geometries.headlight} 
        position={[0.98, 0.90, 0]}
        rotation={[-0.10, 0, 0]}
      />
      
      {/* Taillight */}
      <BikePart 
        partId="taillight" 
        geometry={geometries.taillight} 
        position={[-0.94, 0.76, 0]}
      />

      {/* Front Wheel */}
      <BikePart 
        partId="front_wheel" 
        geometry={geometries.front_wheel} 
        position={[0.98, 0.30, 0]}
      />
      
      {/* Rear Wheel */}
      <BikePart 
        partId="rear_wheel" 
        geometry={geometries.rear_wheel} 
        position={[-0.92, 0.30, 0]}
      />

      {/* Front Brake — dual discs */}
      <BikePart 
        partId="front_disc" 
        geometry={geometries.front_disc} 
        position={[0.98, 0.30, 0.04]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      {/* Inner disc (non-selectable, paired with front_disc) */}
      <mesh geometry={geometries._front_disc_inner} position={[0.98, 0.30, -0.04]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <meshPhysicalMaterial color="#a0a0a0" roughness={0.3} metalness={0.8} />
      </mesh>

      <BikePart 
        partId="front_caliper" 
        geometry={geometries.front_caliper} 
        position={[0.98, 0.26, 0.06]}
        rotation={[0, 0, -0.18]}
      />
      {/* Inner caliper (non-selectable) */}
      <mesh geometry={geometries._front_caliper_inner} position={[0.98, 0.26, -0.06]} rotation={[0, 0, -0.18]} castShadow>
        <meshPhysicalMaterial color="#c41e1e" roughness={0.3} metalness={0.7} clearcoat={0.5} />
      </mesh>

      {/* Rear Disc + Caliper */}
      <BikePart 
        partId="rear_disc" 
        geometry={geometries.rear_disc} 
        position={[-0.92, 0.30, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <BikePart 
        partId="rear_caliper" 
        geometry={geometries.rear_caliper} 
        position={[-0.92, 0.28, 0.04]}
        rotation={[0, 0, 0.18]}
      />

      {/* Front Rim */}
      <BikePart 
        partId="front_rim" 
        geometry={geometries.front_rim} 
        position={[0.98, 0.30, 0]}
      />
      
      {/* Rear Rim */}
      <BikePart 
        partId="rear_rim" 
        geometry={geometries.rear_rim} 
        position={[-0.92, 0.30, 0]}
      />

      {/* Radiator */}
      <BikePart 
        partId="radiator" 
        geometry={geometries.radiator} 
        position={[0.36, 0.76, 0]} 
      />

      {/* Air Intake — ram-air */}
      <BikePart 
        partId="air_intake" 
        geometry={geometries.air_intake} 
        position={[0.82, 0.92, 0]} 
      />
      
      {/* Swingarm — single-sided */}
      <BikePart 
        partId="swingarm" 
        geometry={geometries.swingarm}
        position={[0, 0.30, 0]}
      />
      
      {/* Subframe */}
      <BikePart 
        partId="subframe" 
        geometry={geometries.subframe} 
      />
      
      {/* Footpegs — rearsets */}
      <BikePart 
        partId="footpeg_left" 
        geometry={geometries.footpeg_left} 
      />
      <BikePart 
        partId="footpeg_right" 
        geometry={geometries.footpeg_right} 
      />

      {/* Front Mudguard */}
      <BikePart 
        partId="mudguard_front" 
        geometry={geometries.mudguard_front} 
        position={[0.98, 0.30, 0]}
        rotation={[0, 0, 0.48]}
      />
      
      {/* Rear Mudguard */}
      <BikePart 
        partId="mudguard_rear" 
        geometry={geometries.mudguard_rear} 
        position={[-0.96, 0.30, 0]}
        rotation={[0, 0, -0.28]}
      />

      {/* Mirrors — bar-end */}
      <BikePart 
        partId="mirror_left" 
        geometry={geometries.mirror_left} 
        position={[0.84, 1.28, 0.44]}
      />
      <BikePart 
        partId="mirror_right" 
        geometry={geometries.mirror_right} 
        position={[0.84, 1.28, -0.44]}
      />

      {/* Engine — V4 */}
      <BikePart 
        partId="engine" 
        geometry={geometries.engine} 
        position={[0.14, 0.42, 0]}
      />

      {/* Chain Cover */}
      <BikePart 
        partId="chain_cover" 
        geometry={geometries.chain_cover} 
      />

      {/* ─── NEW PARTS ─── */}

      {/* Rear Sprocket */}
      <BikePart 
        partId="rear_sprocket" 
        geometry={geometries.rear_sprocket} 
        position={[-0.92, 0.30, -0.12]}
      />

      {/* Drive Chain */}
      <BikePart 
        partId="chain" 
        geometry={geometries.chain} 
      />

      {/* Fork Guards */}
      <BikePart 
        partId="fork_guard_left" 
        geometry={geometries.fork_guard_left} 
      />
      <BikePart 
        partId="fork_guard_right" 
        geometry={geometries.fork_guard_right} 
      />

      {/* Steering Damper */}
      <BikePart 
        partId="steering_damper" 
        geometry={geometries.steering_damper} 
      />
    </group>
  );
}
