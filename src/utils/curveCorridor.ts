import * as THREE from 'three';

/**
 * Mathematical S-Shaped Spline Architecture for KK Events
 */

export const CORRIDOR_CURVE_POINTS = [
  new THREE.Vector3(0.0, 0, 16.0),   // P0: Entrance vestibule
  new THREE.Vector3(0.0, 0, 6.0),    // P1: Straight entry path
  new THREE.Vector3(-2.0, 0, -8.0),  // P2: Begins gradual left turn
  new THREE.Vector3(-6.2, 0, -24.0), // P3: Sweeping elegant left curve
  new THREE.Vector3(-6.8, 0, -38.0), // P4: Apex of left curve
  new THREE.Vector3(-2.8, 0, -54.0), // P5: Gentle S-curve transition
  new THREE.Vector3(3.8, 0, -70.0),  // P6: Sweeping gentle right curve
  new THREE.Vector3(5.8, 0, -84.0),  // P7: Straightening toward lounge
  new THREE.Vector3(5.0, 0, -98.0)   // P8: Grand Booking Lounge Center
];

export const corridorSpline = new THREE.CatmullRomCurve3(
  CORRIDOR_CURVE_POINTS,
  false,
  'centripetal',
  0.5
);

export const CURVED_CONFIG = {
  width: 9.2,
  height: 7.2,
  eyeHeight: 1.7,
  samples: 220,
  minU: 0.02,
  maxU: 0.97,
  loungeU: 0.92,
  walkStartU: 0.06
};

// Compute local orthonormal frame (T, U, N) at parameter u
export function getPathFrame(u: number, curve: THREE.CatmullRomCurve3 = corridorSpline) {
  const clampedU = Math.max(0.0001, Math.min(0.9999, u));
  const point = curve.getPointAt(clampedU);
  const tangent = curve.getTangentAt(clampedU).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

  return { point, tangent, up, normal };
}

// Generate continuous seamless curved floor
export function createCurvedFloorGeometry(
  curve: THREE.CatmullRomCurve3 = corridorSpline,
  width: number = CURVED_CONFIG.width,
  samples: number = CURVED_CONFIG.samples
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const halfW = width / 2;

  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const { point, normal } = getPathFrame(u, curve);

    const left = point.clone().sub(normal.clone().multiplyScalar(halfW));
    const right = point.clone().add(normal.clone().multiplyScalar(halfW));

    positions.push(left.x, 0, left.z);
    positions.push(right.x, 0, right.z);

    const uvV = u * 24; // tile along length
    uvs.push(0, uvV);
    uvs.push(1, uvV);

    if (i < samples) {
      const idx = i * 2;
      // Two triangles per segment
      indices.push(idx, idx + 2, idx + 1);
      indices.push(idx + 1, idx + 2, idx + 3);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Generate continuous seamless curved ceiling
export function createCurvedCeilingGeometry(
  curve: THREE.CatmullRomCurve3 = corridorSpline,
  width: number = CURVED_CONFIG.width,
  height: number = CURVED_CONFIG.height,
  samples: number = CURVED_CONFIG.samples
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const halfW = width / 2;

  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const { point, normal } = getPathFrame(u, curve);

    const left = point.clone().sub(normal.clone().multiplyScalar(halfW));
    const right = point.clone().add(normal.clone().multiplyScalar(halfW));

    positions.push(left.x, height, left.z);
    positions.push(right.x, height, right.z);

    const uvV = u * 24;
    uvs.push(0, uvV);
    uvs.push(1, uvV);

    if (i < samples) {
      const idx = i * 2;
      // Facing downward into corridor
      indices.push(idx, idx + 1, idx + 2);
      indices.push(idx + 1, idx + 3, idx + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Generate continuous seamless curved wall (left or right)
export function createCurvedWallGeometry(
  side: 'left' | 'right',
  curve: THREE.CatmullRomCurve3 = corridorSpline,
  width: number = CURVED_CONFIG.width,
  height: number = CURVED_CONFIG.height,
  samples: number = CURVED_CONFIG.samples
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const sign = side === 'left' ? -1 : 1;
  const halfW = (width / 2) * sign;

  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const { point, normal } = getPathFrame(u, curve);

    const base = point.clone().add(normal.clone().multiplyScalar(halfW));

    positions.push(base.x, 0, base.z);       // bottom
    positions.push(base.x, height, base.z);  // top

    const uvU = u * 20;
    uvs.push(uvU, 0);
    uvs.push(uvU, 1);

    if (i < samples) {
      const idx = i * 2;
      if (side === 'left') {
        indices.push(idx, idx + 2, idx + 1);
        indices.push(idx + 1, idx + 2, idx + 3);
      } else {
        indices.push(idx, idx + 1, idx + 2);
        indices.push(idx + 1, idx + 3, idx + 2);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Generate curved ribbon strip (for baseboards, reveal lines, cove lighting, and rails)
export function createCurvedRibbonGeometry(
  offsetMultiplier: number,
  yBottom: number,
  yTop: number,
  curve: THREE.CatmullRomCurve3 = corridorSpline,
  width: number = CURVED_CONFIG.width,
  samples: number = CURVED_CONFIG.samples
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const { point, normal } = getPathFrame(u, curve);

    const base = point.clone().add(normal.clone().multiplyScalar(offsetMultiplier * (width / 2)));

    positions.push(base.x, yBottom, base.z);
    positions.push(base.x, yTop, base.z);

    if (i < samples) {
      const idx = i * 2;
      indices.push(idx, idx + 2, idx + 1);
      indices.push(idx + 1, idx + 2, idx + 3);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Generate transform matrix for an artwork mounted on the curved wall
export function getCurvedArtworkTransform(
  pathU: number,
  side: 'left' | 'right',
  width: number = CURVED_CONFIG.width,
  yOffset: number = CURVED_CONFIG.eyeHeight + 0.32
) {
  const { point, tangent, up, normal } = getPathFrame(pathU);

  const isLeft = side === 'left';
  const sign = isLeft ? -1 : 1;
  const wallDist = (width / 2 - 0.12) * sign;

  // Artwork center position on the curved wall
  const position = point.clone().add(normal.clone().multiplyScalar(wallDist));
  position.y = yOffset;

  // Coordinate axes for the artwork:
  // Z axis: normal pointing into corridor
  const zAxis = isLeft ? normal.clone() : normal.clone().negate();
  // Y axis: world up
  const yAxis = up.clone();
  // X axis: along corridor tangent
  const xAxis = isLeft ? tangent.clone() : tangent.clone().negate();

  const rotMatrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);

  return { position, quaternion, normal: zAxis, forward: tangent };
}
