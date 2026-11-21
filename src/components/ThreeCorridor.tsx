import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Project } from '../types';
import { EXHIBITION_PROJECTS } from '../data/projects';
import {
  CURVED_CONFIG,
  getPathFrame,
  createCurvedFloorGeometry,
  createCurvedCeilingGeometry,
  createCurvedWallGeometry,
  createCurvedRibbonGeometry,
  getCurvedArtworkTransform
} from '../utils/curveCorridor';
import {
  createFloorTexture,
  createWallTexture,
  createPlacardTexture,
  createFallbackArtworkTexture
} from '../utils/textureGenerator';

interface ThreeCorridorProps {
  currentProgress: number; // 0.0 to 1.0 along the curved spline
  onProgressChange: (u: number) => void;
  onSelectProject: (project: Project) => void;
  activeProject: Project | null;
  isInLounge: boolean;
  onEnterLounge: () => void;
  hoveredProjectId: string | null;
  onHoverProject: (id: string | null) => void;
  isAutoTouring?: boolean;
}

export const ThreeCorridor: React.FC<ThreeCorridorProps> = ({
  currentProgress,
  onProgressChange,
  onSelectProject,
  activeProject,
  isInLounge,
  onEnterLounge,
  onHoverProject,
  isAutoTouring = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth Inertia Physics Engine References along Spline u
  const currentURef = useRef<number>(currentProgress);
  const targetURef = useRef<number>(currentProgress);
  const velocityURef = useRef<number>(0);
  const lastReportedURef = useRef<number>(currentProgress);
  const lastReportTimeRef = useRef<number>(0);

  // Mouse Parallax & Interaction References
  const mousePosRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const targetMouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const isDraggingRef = useRef<boolean>(false);
  const dragStartYRef = useRef<number>(0);
  const hoveredMeshRef = useRef<THREE.Group | null>(null);
  const needsRaycastRef = useRef<boolean>(true);

  // Prop Callbacks in Refs
  const onProgressChangeRef = useRef(onProgressChange);
  onProgressChangeRef.current = onProgressChange;

  const onSelectProjectRef = useRef(onSelectProject);
  onSelectProjectRef.current = onSelectProject;

  const onEnterLoungeRef = useRef(onEnterLounge);
  onEnterLoungeRef.current = onEnterLounge;

  const onHoverProjectRef = useRef(onHoverProject);
  onHoverProjectRef.current = onHoverProject;

  const activeProjectRef = useRef(activeProject);
  activeProjectRef.current = activeProject;

  const isInLoungeRef = useRef(isInLounge);
  isInLoungeRef.current = isInLounge;

  const isAutoTouringRef = useRef(isAutoTouring);
  isAutoTouringRef.current = isAutoTouring;

  // Sync external position jumps (Directory jump or return to exhibition)
  useEffect(() => {
    if (Math.abs(targetURef.current - currentProgress) > 0.03) {
      targetURef.current = currentProgress;
      velocityURef.current = 0;
    }
  }, [currentProgress]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. RENDERER & SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F3F0E9');
    scene.fog = new THREE.FogExp2('#F3F0E9', 0.018);

    const camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      130
    );

    // Initial camera position & orientation on curve
    const initialFrame = getPathFrame(currentURef.current);
    camera.position.copy(initialFrame.point).add(new THREE.Vector3(0, CURVED_CONFIG.eyeHeight, 0));
    const initialLook = initialFrame.point.clone()
      .add(initialFrame.tangent.clone().multiplyScalar(8.0))
      .add(new THREE.Vector3(0, CURVED_CONFIG.eyeHeight, 0));
    camera.lookAt(initialLook);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.appendChild(renderer.domElement);

    // --- 2. LUXURY ARCHITECTURAL LIGHTING ---
    const ambientLight = new THREE.AmbientLight('#FFFBF5', 1.05);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#FFFFFF', '#D9D2C2', 0.85);
    hemiLight.position.set(0, 15, 0);
    scene.add(hemiLight);

    // Directional light guiding soft contrast
    const dirLight = new THREE.DirectionalLight('#FFF5E4', 0.55);
    dirLight.position.set(2, 12, 10);
    scene.add(dirLight);

    // --- 3. CURVED ARCHITECTURE: FLOOR, CEILING, WALLS ---
    // A. Continuous Curved Floor (Stone / Microcement with repeating joints)
    const floorTexture = createFloorTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.26,
      metalness: 0.03,
      color: '#EAE6DC'
    });
    const floorGeo = createCurvedFloorGeometry();
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    scene.add(floorMesh);

    // B. Continuous Curved Ceiling
    const ceilingMat = new THREE.MeshBasicMaterial({ color: '#FAF8F5' });
    const ceilingGeo = createCurvedCeilingGeometry();
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    scene.add(ceilingMesh);

    // C. Continuous Curved Left & Right Walls
    const wallTexture = createWallTexture();
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTexture,
      color: '#F3F0E9',
      roughness: 0.88,
      metalness: 0.0
    });

    const leftWallGeo = createCurvedWallGeometry('left');
    const leftWallMesh = new THREE.Mesh(leftWallGeo, wallMat);
    scene.add(leftWallMesh);

    const rightWallGeo = createCurvedWallGeometry('right');
    const rightWallMesh = new THREE.Mesh(rightWallGeo, wallMat);
    scene.add(rightWallMesh);

    // D. Baseboards & Champagne Gold Reveal Strips along Curve
    const baseboardMat = new THREE.MeshBasicMaterial({ color: '#262524' });
    const leftBaseboardGeo = createCurvedRibbonGeometry(-0.99, 0.0, 0.22);
    const leftBaseboard = new THREE.Mesh(leftBaseboardGeo, baseboardMat);
    scene.add(leftBaseboard);

    const rightBaseboardGeo = createCurvedRibbonGeometry(0.99, 0.0, 0.22);
    const rightBaseboard = new THREE.Mesh(rightBaseboardGeo, baseboardMat);
    scene.add(rightBaseboard);

    const goldTrimMat = new THREE.MeshBasicMaterial({ color: '#B89A6A' });
    const leftGoldTrimGeo = createCurvedRibbonGeometry(-0.985, 0.22, 0.24);
    const leftGoldTrim = new THREE.Mesh(leftGoldTrimGeo, goldTrimMat);
    scene.add(leftGoldTrim);

    const rightGoldTrimGeo = createCurvedRibbonGeometry(0.985, 0.22, 0.24);
    const rightGoldTrim = new THREE.Mesh(rightGoldTrimGeo, goldTrimMat);
    scene.add(rightGoldTrim);

    // E. Ceiling Cove Light Strips (Warm glow ribbons following the curved spline)
    const coveLightMat = new THREE.MeshBasicMaterial({ color: '#FFF8EA' });
    const leftCoveGeo = createCurvedRibbonGeometry(-0.88, CURVED_CONFIG.height - 0.03, CURVED_CONFIG.height);
    const leftCove = new THREE.Mesh(leftCoveGeo, coveLightMat);
    scene.add(leftCove);

    const rightCoveGeo = createCurvedRibbonGeometry(0.88, CURVED_CONFIG.height - 0.03, CURVED_CONFIG.height);
    const rightCove = new THREE.Mesh(rightCoveGeo, coveLightMat);
    scene.add(rightCove);

    // F. ERCO Minimalist Ceiling Track Rails following the curve
    const trackMat = new THREE.MeshBasicMaterial({ color: '#222222' });
    const leftTrackGeo = createCurvedRibbonGeometry(-0.55, CURVED_CONFIG.height - 0.08, CURVED_CONFIG.height - 0.02);
    const leftTrack = new THREE.Mesh(leftTrackGeo, trackMat);
    scene.add(leftTrack);

    const rightTrackGeo = createCurvedRibbonGeometry(0.55, CURVED_CONFIG.height - 0.08, CURVED_CONFIG.height - 0.02);
    const rightTrack = new THREE.Mesh(rightTrackGeo, trackMat);
    scene.add(rightTrack);

    // --- 4. SCULPTURAL ARCHITECTURAL PORTAL ARCHES ALONG THE CURVE ---
    // Minimalist gallery arches oriented to local tangent at key curve thresholds
    const archUValues = [0.07, 0.28, 0.50, 0.72, 0.90];
    const archMat = new THREE.MeshStandardMaterial({
      color: '#EAE6DC',
      roughness: 0.45,
      metalness: 0.02
    });

    archUValues.forEach((archU) => {
      const { point, tangent, up, normal } = getPathFrame(archU);
      const archGroup = new THREE.Group();
      archGroup.position.copy(point);

      // Align arch group with local path tangent & normal
      const rotMat = new THREE.Matrix4().makeBasis(normal, up, tangent);
      archGroup.quaternion.setFromRotationMatrix(rotMat);

      const halfW = CURVED_CONFIG.width / 2;

      // Left Pillar
      const pillarL = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, CURVED_CONFIG.height, 0.55),
        archMat
      );
      pillarL.position.set(-halfW + 0.21, CURVED_CONFIG.height / 2, 0);
      archGroup.add(pillarL);

      // Right Pillar
      const pillarR = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, CURVED_CONFIG.height, 0.55),
        archMat
      );
      pillarR.position.set(halfW - 0.21, CURVED_CONFIG.height / 2, 0);
      archGroup.add(pillarR);

      // Top Lintel
      const lintel = new THREE.Mesh(
        new THREE.BoxGeometry(CURVED_CONFIG.width, 0.48, 0.55),
        archMat
      );
      lintel.position.set(0, CURVED_CONFIG.height - 0.24, 0);
      archGroup.add(lintel);

      // Gold Inset Accent Line
      const goldTrim = new THREE.Mesh(
        new THREE.BoxGeometry(CURVED_CONFIG.width - 0.84, 0.03, 0.58),
        goldTrimMat
      );
      goldTrim.position.set(0, CURVED_CONFIG.height - 0.48, 0);
      archGroup.add(goldTrim);

      scene.add(archGroup);
    });

    // --- 5. MINIMALIST GALLERY VIEWING BENCHES ALONG THE CURVE ---
    const benchUValues = [0.18, 0.39, 0.61, 0.82];
    const benchStoneMat = new THREE.MeshStandardMaterial({
      color: '#DFDBD1',
      roughness: 0.35
    });
    const benchBaseMat = new THREE.MeshBasicMaterial({ color: '#222222' });

    benchUValues.forEach((bu) => {
      const { point, tangent, up, normal } = getPathFrame(bu);
      const benchGroup = new THREE.Group();
      // Position slightly off center
      const lateralOffset = (bu > 0.5 ? -1 : 1) * 0.4;
      benchGroup.position.copy(point).add(normal.clone().multiplyScalar(lateralOffset));

      const rotMat = new THREE.Matrix4().makeBasis(normal, up, tangent);
      benchGroup.quaternion.setFromRotationMatrix(rotMat);

      const slab = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.12, 1.45), benchStoneMat);
      slab.position.set(0, 0.48, 0);
      benchGroup.add(slab);

      const base = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.42, 1.25), benchBaseMat);
      base.position.set(0, 0.21, 0);
      benchGroup.add(base);

      scene.add(benchGroup);
    });

    // --- 6. FLOATING GOLDEN ATMOSPHERIC DUST PARTICLES ---
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const { point, normal } = getPathFrame(u);
      const lateral = (Math.random() - 0.5) * (CURVED_CONFIG.width - 2.5);
      const p = point.clone().add(normal.clone().multiplyScalar(lateral));

      particlePositions[i * 3] = p.x;
      particlePositions[i * 3 + 1] = 0.6 + Math.random() * (CURVED_CONFIG.height - 1.6);
      particlePositions[i * 3 + 2] = p.z;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: '#DFC8A1',
      size: 0.045,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // --- 7. GRAND BOOKING LOUNGE PAVILION AT THE END (u >= 0.92) ---
    const loungeFrame = getPathFrame(0.96);
    const loungeCenter = loungeFrame.point.clone();
    const loungeRadius = 13.0;
    const loungeHeight = 9.8;

    // Circular/Oval Lounge Floor
    const loungeFloorGeo = new THREE.CylinderGeometry(loungeRadius, loungeRadius, 0.05, 48);
    const loungeFloor = new THREE.Mesh(loungeFloorGeo, floorMat);
    loungeFloor.position.set(loungeCenter.x, -0.02, loungeCenter.z);
    scene.add(loungeFloor);

    // Lounge Panoramic Architectural Wall
    const loungeWallGeo = new THREE.CylinderGeometry(
      loungeRadius,
      loungeRadius,
      loungeHeight,
      48,
      1,
      true,
      0,
      Math.PI * 1.6
    );
    const loungeWallMat = new THREE.MeshStandardMaterial({
      color: '#EAE5DB',
      roughness: 0.5,
      side: THREE.BackSide
    });
    const loungeWall = new THREE.Mesh(loungeWallGeo, loungeWallMat);
    loungeWall.position.set(loungeCenter.x, loungeHeight / 2, loungeCenter.z);
    loungeWall.rotation.y = Math.PI * 0.4;
    scene.add(loungeWall);

    // Lounge Columns
    const loungePillarGeo = new THREE.CylinderGeometry(0.42, 0.42, loungeHeight, 16);
    const p1 = new THREE.Mesh(loungePillarGeo, archMat);
    p1.position.set(loungeCenter.x - 5.5, loungeHeight / 2, loungeCenter.z - 4);
    scene.add(p1);

    const p2 = new THREE.Mesh(loungePillarGeo, archMat);
    p2.position.set(loungeCenter.x + 5.5, loungeHeight / 2, loungeCenter.z - 4);
    scene.add(p2);

    // Center Plinth
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.9, 2.4),
      new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.25 })
    );
    plinth.position.set(loungeCenter.x, 0.45, loungeCenter.z);
    scene.add(plinth);

    // Champagne Gold Sculpture
    const sculpture = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.72, 0.18, 64, 16, 2, 3),
      new THREE.MeshStandardMaterial({
        color: '#B89A6A',
        metalness: 0.92,
        roughness: 0.15
      })
    );
    sculpture.position.set(loungeCenter.x, 1.7, loungeCenter.z);
    scene.add(sculpture);

    // Lounge Ceiling
    const loungeCeilingGeo = new THREE.CylinderGeometry(loungeRadius, loungeRadius, 0.05, 48);
    const loungeCeiling = new THREE.Mesh(loungeCeilingGeo, ceilingMat);
    loungeCeiling.position.set(loungeCenter.x, loungeHeight, loungeCenter.z);
    scene.add(loungeCeiling);

    // --- 8. ARTWORK EXHIBITS MOUNTED FLUSH TO THE CURVED WALLS ---
    const interactiveMeshes: THREE.Mesh[] = [];
    const textureLoader = new THREE.TextureLoader();

    EXHIBITION_PROJECTS.forEach((project) => {
      // Calculate exact 3D position and orientation matching the curve
      const { position, quaternion, normal } = getCurvedArtworkTransform(
        project.pathU,
        project.side
      );

      const group = new THREE.Group();
      group.userData = { project, originalPos: position.clone(), normal: normal.clone() };
      group.position.copy(position);
      group.quaternion.copy(quaternion);

      const w = project.width;
      const h = project.height;
      const frameDepth = 0.09;

      // Outer Brushed Champagne Gold Bevel Frame
      const frameGeo = new THREE.BoxGeometry(w + 0.16, h + 0.16, frameDepth);
      const frameMat = new THREE.MeshStandardMaterial({
        color: '#B89A6A',
        metalness: 0.88,
        roughness: 0.22
      });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      group.add(frameMesh);

      // Dark Inner Matte Reveal Border
      const innerMatGeo = new THREE.PlaneGeometry(w + 0.04, h + 0.04, 1, 1);
      const innerMat = new THREE.MeshBasicMaterial({ color: '#161514' });
      const innerMatMesh = new THREE.Mesh(innerMatGeo, innerMat);
      innerMatMesh.position.z = frameDepth / 2 + 0.005;
      group.add(innerMatMesh);

      // High-Quality Artwork Plane
      const artGeo = new THREE.PlaneGeometry(w, h, 1, 1);
      const fallbackTexture = createFallbackArtworkTexture(project);
      const artMat = new THREE.MeshBasicMaterial({
        map: fallbackTexture
      });
      const artMesh = new THREE.Mesh(artGeo, artMat);
      artMesh.position.z = frameDepth / 2 + 0.015;
      artMesh.userData = { projectId: project.id, isArtwork: true, project };
      group.add(artMesh);
      interactiveMeshes.push(artMesh);

      // Asynchronously load real high-res photograph
      textureLoader.load(
        project.image,
        (loadedTex) => {
          loadedTex.minFilter = THREE.LinearFilter;
          loadedTex.generateMipmaps = true;
          artMat.map = loadedTex;
          artMat.needsUpdate = true;
        },
        undefined,
        (err) => {
          console.warn(`Fallback texture active for ${project.title}:`, err);
        }
      );

      // Museum Placard Underneath Frame
      const placardGeo = new THREE.PlaneGeometry(Math.min(w * 0.75, 2.4), 0.52, 1, 1);
      const placardTexture = createPlacardTexture(project);
      const placardMat = new THREE.MeshBasicMaterial({
        map: placardTexture,
        transparent: true
      });
      const placardMesh = new THREE.Mesh(placardGeo, placardMat);
      placardMesh.position.set(0, -(h / 2 + 0.42), frameDepth / 2 + 0.01);
      placardMesh.userData = { projectId: project.id, isArtwork: true, project };
      group.add(placardMesh);
      interactiveMeshes.push(placardMesh);

      // Subtle Floor Light Wash Pool along Curve
      const floorDiscGeo = new THREE.PlaneGeometry(w * 1.1, 1.8);
      const floorDiscMat = new THREE.MeshBasicMaterial({
        color: '#FFF6E0',
        transparent: true,
        opacity: 0.18
      });
      const floorDisc = new THREE.Mesh(floorDiscGeo, floorDiscMat);
      floorDisc.rotation.x = -Math.PI / 2;
      floorDisc.position.copy(position);
      floorDisc.position.y = 0.01;
      floorDisc.position.add(normal.clone().multiplyScalar(0.9));
      scene.add(floorDisc);

      // Dedicated Focused Ceiling Spotlight positioned along curved track
      const spotLight = new THREE.SpotLight('#FFF6E5', 3.4, 14, Math.PI / 4.5, 0.45, 1.0);
      const { point: pathPt, normal: pathNorm } = getPathFrame(project.pathU);
      const trackDist = (project.side === 'left' ? -1 : 1) * 2.3;
      const spotPos = pathPt.clone().add(pathNorm.clone().multiplyScalar(trackDist));
      spotPos.y = CURVED_CONFIG.height - 0.2;
      spotLight.position.copy(spotPos);

      // Standalone spotlight target
      const spotTarget = new THREE.Object3D();
      spotTarget.position.copy(position);
      scene.add(spotTarget);
      spotLight.target = spotTarget;
      scene.add(spotLight);

      // Ceiling Track Fixture Marker
      const fixtureGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.2, 8);
      const fixtureMat = new THREE.MeshBasicMaterial({ color: '#222222' });
      const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
      fixture.position.copy(spotPos);
      fixture.position.y = CURVED_CONFIG.height - 0.12;
      fixture.lookAt(position);
      scene.add(fixture);

      scene.add(group);
    });

    // --- 9. RAYCASTER & INTERACTION ---
    const raycaster = new THREE.Raycaster();
    const mouseNorm = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      mouseNorm.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseNorm.y = -(e.clientY / window.innerHeight) * 2 + 1;

      targetMouseRef.current.copy(mouseNorm);
      needsRaycastRef.current = true;

      // Drag to walk along the curved spline
      if (isDraggingRef.current && !activeProjectRef.current) {
        const deltaDragY = e.clientY - dragStartYRef.current;
        dragStartYRef.current = e.clientY;
        velocityURef.current += deltaDragY * 0.00032;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (activeProjectRef.current) return;
      isDraggingRef.current = true;
      dragStartYRef.current = e.clientY;
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onClick = (e: MouseEvent) => {
      mouseNorm.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseNorm.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouseNorm, camera);

      const intersects = raycaster.intersectObjects(interactiveMeshes);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData && hit.userData.project) {
          onSelectProjectRef.current(hit.userData.project);
        }
      }
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('click', onClick);

    // --- 10. FLUID INERTIA MOMENTUM SCROLL ENGINE ALONG SPLINE ---
    const onWheel = (e: WheelEvent) => {
      if (activeProjectRef.current) return;
      e.preventDefault();

      const rawDelta = e.deltaY;
      const normalized = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), 55);

      // Add to physical velocity accumulator along parameter u
      velocityURef.current += normalized * 0.000048;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (activeProjectRef.current) return;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S' || e.key === 'PageDown') {
        velocityURef.current += 0.0028;
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'PageUp') {
        velocityURef.current -= 0.0028;
      }
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (activeProjectRef.current) return;
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;
      touchStartY = touchY;

      velocityURef.current += deltaY * 0.00022;
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // --- 11. CINEMATIC RENDER & CURVED PATH TRAVERSAL LOOP ---
    let animationId: number;
    let lastTime = performance.now();
    let elapsedTime = 0;

    const animate = (timestamp: number) => {
      animationId = requestAnimationFrame(animate);
      const now = timestamp || performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      elapsedTime += delta;

      // Auto-Tour glide if active
      if (isAutoTouringRef.current && !activeProjectRef.current && !isDraggingRef.current) {
        if (targetURef.current < CURVED_CONFIG.maxU - 0.03) {
          velocityURef.current += 0.0001;
        }
      }

      // Physics Friction / Decay along the curve
      const friction = Math.pow(0.86, delta * 60);
      velocityURef.current *= friction;

      // Update target along u
      targetURef.current += velocityURef.current * delta * 60;

      // Soft clamp bounds along spline
      if (targetURef.current < CURVED_CONFIG.minU) {
        targetURef.current = CURVED_CONFIG.minU;
        velocityURef.current = 0;
      } else if (targetURef.current > CURVED_CONFIG.maxU) {
        targetURef.current = CURVED_CONFIG.maxU;
        velocityURef.current = 0;
      }

      // Smooth Parameter U Lerp
      const lerpFactor = 1.0 - Math.exp(-9.0 * delta);
      currentURef.current += (targetURef.current - currentURef.current) * lerpFactor;

      // Mouse Parallax Smooth Easing
      const mouseFactor = 1.0 - Math.exp(-5.5 * delta);
      mousePosRef.current.x += (targetMouseRef.current.x - mousePosRef.current.x) * mouseFactor;
      mousePosRef.current.y += (targetMouseRef.current.y - mousePosRef.current.y) * mouseFactor;

      // Check Lounge Transition
      if (currentURef.current >= CURVED_CONFIG.loungeU && !isInLoungeRef.current) {
        onEnterLoungeRef.current();
      }

      // Throttle React State Updates to keep main thread completely unblocked
      const uDiff = Math.abs(currentURef.current - lastReportedURef.current);
      if (uDiff > 0.005 && now - lastReportTimeRef.current > 45) {
        lastReportedURef.current = currentURef.current;
        lastReportTimeRef.current = now;
        onProgressChangeRef.current(currentURef.current);
      }

      // --- CALCULATE CAMERA POSITION & ORIENTATION ON CURVE ---
      const curFrame = getPathFrame(currentURef.current);
      const camPos = curFrame.point.clone().add(new THREE.Vector3(0, CURVED_CONFIG.eyeHeight, 0));
      // Subtle lateral mouse sway
      camPos.add(curFrame.normal.clone().multiplyScalar(mousePosRef.current.x * 0.14));
      camera.position.copy(camPos);

      // Natural Look-Ahead along the curve bend
      // Look forward along the curve tangent by ~0.055 of curve length
      const lookAheadU = Math.min(0.9999, currentURef.current + 0.055);
      const lookFrame = getPathFrame(lookAheadU);
      const lookTarget = lookFrame.point.clone().add(new THREE.Vector3(0, CURVED_CONFIG.eyeHeight, 0));
      // Apply subtle mouse look offset
      lookTarget.add(curFrame.normal.clone().multiplyScalar(mousePosRef.current.x * 0.7));
      lookTarget.y += mousePosRef.current.y * 0.35;
      camera.lookAt(lookTarget);

      // Floating dust particles animation
      const pPositions = particleGeo.attributes.position.array as Float32Array;
      const time = elapsedTime * 0.3;
      for (let i = 0; i < particleCount; i++) {
        pPositions[i * 3 + 1] += Math.sin(time + i) * 0.001;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Lounge sculpture rotation
      sculpture.rotation.y += delta * 0.18;

      // Event-driven raycasting
      if (needsRaycastRef.current) {
        needsRaycastRef.current = false;
        raycaster.setFromCamera(targetMouseRef.current, camera);
        const intersects = raycaster.intersectObjects(interactiveMeshes);

        if (intersects.length > 0) {
          const hit = intersects[0].object;
          const project = hit.userData.project as Project | undefined;
          if (project) {
            onHoverProjectRef.current(project.id);
            const parentGroup = hit.parent as THREE.Group;
            if (parentGroup && parentGroup.userData.originalPos !== undefined) {
              hoveredMeshRef.current = parentGroup;
            }
          }
        } else {
          onHoverProjectRef.current(null);
          hoveredMeshRef.current = null;
        }
      }

      // Smooth hover frame elevation along local normal vector
      if (hoveredMeshRef.current && hoveredMeshRef.current.userData.originalPos !== undefined) {
        const orig = hoveredMeshRef.current.userData.originalPos as THREE.Vector3;
        const norm = hoveredMeshRef.current.userData.normal as THREE.Vector3;
        const targetLift = orig.clone().add(norm.clone().multiplyScalar(0.18));
        hoveredMeshRef.current.position.lerp(targetLift, 0.15);
      }

      renderer.render(scene, camera);
    };

    animate(performance.now());

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('click', onClick);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', onResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
    />
  );
};
