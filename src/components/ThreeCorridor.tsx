import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Project } from '../types';
import { EXHIBITION_PROJECTS, CORRIDOR_CONFIG } from '../data/projects';
import {
  createFloorTexture,
  createWallTexture,
  createPlacardTexture,
  createFallbackArtworkTexture
} from '../utils/textureGenerator';

interface ThreeCorridorProps {
  currentZ: number;
  onZChange: (z: number) => void;
  onSelectProject: (project: Project) => void;
  activeProject: Project | null;
  isInLounge: boolean;
  onEnterLounge: () => void;
  hoveredProjectId: string | null;
  onHoverProject: (id: string | null) => void;
  isAutoTouring?: boolean;
}

export const ThreeCorridor: React.FC<ThreeCorridorProps> = ({
  currentZ,
  onZChange,
  onSelectProject,
  activeProject,
  onEnterLounge,
  onHoverProject,
  isAutoTouring = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth Inertia Physics Engine References
  const currentZRef = useRef<number>(currentZ);
  const targetZRef = useRef<number>(currentZ);
  const velocityZRef = useRef<number>(0);
  const lastReportedZRef = useRef<number>(currentZ);
  const lastReportTimeRef = useRef<number>(0);

  // Mouse Parallax & Interaction References
  const mousePosRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const targetMouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const isDraggingRef = useRef<boolean>(false);
  const dragStartYRef = useRef<number>(0);
  const hoveredMeshRef = useRef<THREE.Group | null>(null);
  const needsRaycastRef = useRef<boolean>(true);

  // Sync external position jumps
  useEffect(() => {
    targetZRef.current = currentZ;
    velocityZRef.current = 0;
  }, [currentZ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. RENDERER & SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F3F0E9');
    scene.fog = new THREE.FogExp2('#F3F0E9', 0.016);

    const camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );
    camera.position.set(0, CORRIDOR_CONFIG.eyeHeight, currentZRef.current);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    container.appendChild(renderer.domElement);

    // --- 2. LUXURY ARCHITECTURAL LIGHTING ---
    const ambientLight = new THREE.AmbientLight('#FFFBF5', 1.05);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#FFFFFF', '#D9D2C2', 0.85);
    hemiLight.position.set(0, 12, 0);
    scene.add(hemiLight);

    // Soft axial warm glow down the corridor
    const axisLight = new THREE.DirectionalLight('#FFF5E4', 0.5);
    axisLight.position.set(0, 8, 8);
    scene.add(axisLight);

    // --- 3. ARCHITECTURE: FLOOR, CEILING, WALLS ---
    const corridorLength = 84;
    const corridorCenterZ = -28;

    // A. Polished Gallery Stone Floor
    const floorTexture = createFloorTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.28,
      metalness: 0.04,
      color: '#ECE8DF'
    });
    const floorGeo = new THREE.PlaneGeometry(CORRIDOR_CONFIG.width, corridorLength, 1, 1);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, corridorCenterZ);
    scene.add(floor);

    // B. Architectural Ceiling with Recessed Light Coves
    const ceilingMat = new THREE.MeshBasicMaterial({ color: '#FAF8F5' });
    const ceilingGeo = new THREE.PlaneGeometry(CORRIDOR_CONFIG.width, corridorLength, 1, 1);
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, CORRIDOR_CONFIG.height, corridorCenterZ);
    scene.add(ceiling);

    // Architectural Cove Light Troughs (glowing linear recessed strips)
    const coveLightMat = new THREE.MeshBasicMaterial({ color: '#FFF8EB' });
    const coveLeftGeo = new THREE.PlaneGeometry(0.35, corridorLength);
    const coveLeft = new THREE.Mesh(coveLeftGeo, coveLightMat);
    coveLeft.rotation.x = Math.PI / 2;
    coveLeft.position.set(-3.2, CORRIDOR_CONFIG.height - 0.01, corridorCenterZ);
    scene.add(coveLeft);

    const coveRightGeo = new THREE.PlaneGeometry(0.35, corridorLength);
    const coveRight = new THREE.Mesh(coveRightGeo, coveLightMat);
    coveRight.rotation.x = Math.PI / 2;
    coveRight.position.set(3.2, CORRIDOR_CONFIG.height - 0.01, corridorCenterZ);
    scene.add(coveRight);

    // ERCO-style Museum Track Rails
    const trackRailGeo = new THREE.BoxGeometry(0.08, 0.06, corridorLength);
    const trackRailMat = new THREE.MeshBasicMaterial({ color: '#222222' });
    const trackLeft = new THREE.Mesh(trackRailGeo, trackRailMat);
    trackLeft.position.set(-2.4, CORRIDOR_CONFIG.height - 0.04, corridorCenterZ);
    scene.add(trackLeft);

    const trackRight = new THREE.Mesh(trackRailGeo, trackRailMat);
    trackRight.position.set(2.4, CORRIDOR_CONFIG.height - 0.04, corridorCenterZ);
    scene.add(trackRight);

    // C. Gallery Walls
    const wallTexture = createWallTexture();
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: wallTexture,
      color: '#F3F0E9',
      roughness: 0.88,
      metalness: 0.0
    });

    const leftWallGeo = new THREE.PlaneGeometry(corridorLength, CORRIDOR_CONFIG.height, 1, 1);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(CORRIDOR_CONFIG.leftWallX, CORRIDOR_CONFIG.height / 2, corridorCenterZ);
    scene.add(leftWall);

    const rightWallGeo = new THREE.PlaneGeometry(corridorLength, CORRIDOR_CONFIG.height, 1, 1);
    const rightWall = new THREE.Mesh(rightWallGeo, wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(CORRIDOR_CONFIG.rightWallX, CORRIDOR_CONFIG.height / 2, corridorCenterZ);
    scene.add(rightWall);

    // Baseboards & Champagne Gold Reveal Lines
    const baseboardGeo = new THREE.BoxGeometry(0.06, 0.22, corridorLength);
    const baseboardMat = new THREE.MeshBasicMaterial({ color: '#282725' });
    const baseboardLeft = new THREE.Mesh(baseboardGeo, baseboardMat);
    baseboardLeft.position.set(CORRIDOR_CONFIG.leftWallX + 0.03, 0.11, corridorCenterZ);
    scene.add(baseboardLeft);

    const baseboardRight = new THREE.Mesh(baseboardGeo, baseboardMat);
    baseboardRight.position.set(CORRIDOR_CONFIG.rightWallX - 0.03, 0.11, corridorCenterZ);
    scene.add(baseboardRight);

    const revealLineGeo = new THREE.BoxGeometry(0.03, 0.02, corridorLength);
    const revealLineMat = new THREE.MeshBasicMaterial({ color: '#B89A6A' });
    const revealLeft = new THREE.Mesh(revealLineGeo, revealLineMat);
    revealLeft.position.set(CORRIDOR_CONFIG.leftWallX + 0.02, 0.23, corridorCenterZ);
    scene.add(revealLeft);

    const revealRight = new THREE.Mesh(revealLineGeo, revealLineMat);
    revealRight.position.set(CORRIDOR_CONFIG.rightWallX - 0.02, 0.23, corridorCenterZ);
    scene.add(revealRight);

    // --- 4. ARCHITECTURAL PORTAL ARCHES (Depth, Rhythm & Parallax) ---
    // Sculptural minimalist portals spaced down the corridor
    const archPositions = [8.0, -8.0, -24.0, -40.0, -56.0];
    const archMat = new THREE.MeshStandardMaterial({
      color: '#EAE6DC',
      roughness: 0.5,
      metalness: 0.02
    });

    archPositions.forEach((archZ) => {
      const archGroup = new THREE.Group();
      archGroup.position.set(0, 0, archZ);

      // Left Pillar
      const pillarL = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, CORRIDOR_CONFIG.height, 0.5),
        archMat
      );
      pillarL.position.set(CORRIDOR_CONFIG.leftWallX + 0.2, CORRIDOR_CONFIG.height / 2, 0);
      archGroup.add(pillarL);

      // Right Pillar
      const pillarR = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, CORRIDOR_CONFIG.height, 0.5),
        archMat
      );
      pillarR.position.set(CORRIDOR_CONFIG.rightWallX - 0.2, CORRIDOR_CONFIG.height / 2, 0);
      archGroup.add(pillarR);

      // Top Beam / Lintel
      const lintel = new THREE.Mesh(
        new THREE.BoxGeometry(CORRIDOR_CONFIG.width, 0.45, 0.5),
        archMat
      );
      lintel.position.set(0, CORRIDOR_CONFIG.height - 0.225, 0);
      archGroup.add(lintel);

      // Subtle Gold Inset Trim along portal arch
      const trimMat = new THREE.MeshBasicMaterial({ color: '#B89A6A' });
      const trimTop = new THREE.Mesh(new THREE.BoxGeometry(CORRIDOR_CONFIG.width - 0.8, 0.03, 0.52), trimMat);
      trimTop.position.set(0, CORRIDOR_CONFIG.height - 0.46, 0);
      archGroup.add(trimTop);

      scene.add(archGroup);
    });

    // --- 5. MINIMALIST GALLERY BENCHES ---
    // Travertine & bronze benches along the center aisle between bays
    const benchPositions = [-1.0, -17.0, -33.0, -49.0];
    const benchStoneMat = new THREE.MeshStandardMaterial({
      color: '#E0DBD0',
      roughness: 0.35
    });
    const benchLegMat = new THREE.MeshBasicMaterial({ color: '#222222' });

    benchPositions.forEach((bz) => {
      const benchGroup = new THREE.Group();
      benchGroup.position.set(0, 0, bz);

      // Top Slab
      const slab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.6), benchStoneMat);
      slab.position.set(0, 0.48, 0);
      benchGroup.add(slab);

      // Minimalist Block Legs
      const leg1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.42, 0.4), benchLegMat);
      leg1.position.set(0, 0.21, 0);
      benchGroup.add(leg1);

      scene.add(benchGroup);
    });

    // --- 6. FLOATING GOLDEN ATMOSPHERIC DUST PARTICLES ---
    // Drifting luminous motes that catch light beams for cinematic depth
    const particleCount = 160;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * (CORRIDOR_CONFIG.width - 2);
      particlePositions[i + 1] = 0.5 + Math.random() * (CORRIDOR_CONFIG.height - 1.5);
      particlePositions[i + 2] = 10 - Math.random() * 75;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: '#DFC8A1',
      size: 0.045,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // --- 7. FINAL BOOKING ROOM & LOUNGE (Z = -60 to -80) ---
    const loungeWidth = 24;
    const loungeHeight = 9.8;
    const loungeDepth = 24;
    const loungeZ = -74;

    const loungeFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(loungeWidth, loungeDepth, 1, 1),
      floorMat
    );
    loungeFloor.rotation.x = -Math.PI / 2;
    loungeFloor.position.set(0, 0, loungeZ);
    scene.add(loungeFloor);

    const loungeCeiling = new THREE.Mesh(
      new THREE.PlaneGeometry(loungeWidth, loungeDepth, 1, 1),
      ceilingMat
    );
    loungeCeiling.rotation.x = Math.PI / 2;
    loungeCeiling.position.set(0, loungeHeight, loungeZ);
    scene.add(loungeCeiling);

    // Back Architectural Wall with soft ambient illumination
    const glassWallMat = new THREE.MeshStandardMaterial({
      color: '#E8E3D8',
      roughness: 0.1,
      metalness: 0.08
    });
    const glassWall = new THREE.Mesh(
      new THREE.PlaneGeometry(loungeWidth, loungeHeight, 1, 1),
      glassWallMat
    );
    glassWall.position.set(0, loungeHeight / 2, loungeZ - loungeDepth / 2);
    scene.add(glassWall);

    // Grand Columns in Lounge
    const pillarGeo = new THREE.CylinderGeometry(0.42, 0.42, loungeHeight, 16);
    const pillarMat = new THREE.MeshStandardMaterial({ color: '#EAE6DD', roughness: 0.3 });
    const p1 = new THREE.Mesh(pillarGeo, pillarMat);
    p1.position.set(-6, loungeHeight / 2, -67);
    scene.add(p1);
    const p2 = new THREE.Mesh(pillarGeo, pillarMat);
    p2.position.set(6, loungeHeight / 2, -67);
    scene.add(p2);

    // Center Plinth
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.9, 2.4),
      new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.25 })
    );
    plinth.position.set(0, 0.45, -71);
    scene.add(plinth);

    // Glowing Champagne Gold Sculpture
    const sculpture = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.68, 0.18, 64, 16, 2, 3),
      new THREE.MeshStandardMaterial({
        color: '#B89A6A',
        metalness: 0.9,
        roughness: 0.15
      })
    );
    sculpture.position.set(0, 1.65, -71);
    scene.add(sculpture);

    // --- 8. ARTWORK EXHIBITS & SPOTLIGHTS ---
    const interactiveMeshes: THREE.Mesh[] = [];
    const textureLoader = new THREE.TextureLoader();

    EXHIBITION_PROJECTS.forEach((project) => {
      const isLeft = project.side === 'left';
      const wallX = isLeft ? CORRIDOR_CONFIG.leftWallX : CORRIDOR_CONFIG.rightWallX;
      const normalSign = isLeft ? 1 : -1;

      // Group attached to the gallery wall
      const group = new THREE.Group();
      group.userData = { project, originalX: wallX + normalSign * 0.12, normalSign };
      group.position.set(wallX + normalSign * 0.12, CORRIDOR_CONFIG.eyeHeight + 0.32, project.wallZ);
      group.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;

      const w = project.width;
      const h = project.height;
      const frameDepth = 0.09;

      // Outer Brushed Champagne Gold Frame
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

      // Artwork Plane
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

      // Museum Placard underneath frame
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

      // Floor Warm Light Wash Disc (subtle illuminated pool under each artwork)
      const floorDiscGeo = new THREE.PlaneGeometry(w * 1.1, 1.8);
      const floorDiscMat = new THREE.MeshBasicMaterial({
        color: '#FFF5E0',
        transparent: true,
        opacity: 0.16
      });
      const floorDisc = new THREE.Mesh(floorDiscGeo, floorDiscMat);
      floorDisc.rotation.x = -Math.PI / 2;
      floorDisc.position.set(wallX + normalSign * 0.9, 0.01, project.wallZ);
      scene.add(floorDisc);

      // Dedicated Focused Ceiling Spotlight with standalone target
      const spotLight = new THREE.SpotLight('#FFF6E5', 3.4, 14, Math.PI / 4.5, 0.45, 1.0);
      const trackX = isLeft ? -2.4 : 2.4;
      spotLight.position.set(trackX, CORRIDOR_CONFIG.height - 0.2, project.wallZ);

      // Standalone target object on wall
      const spotTarget = new THREE.Object3D();
      spotTarget.position.set(wallX, CORRIDOR_CONFIG.eyeHeight + 0.32, project.wallZ);
      scene.add(spotTarget);
      spotLight.target = spotTarget;
      scene.add(spotLight);

      // Ceiling fixture marker
      const fixtureGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.2, 8);
      const fixtureMat = new THREE.MeshBasicMaterial({ color: '#222222' });
      const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
      fixture.position.set(trackX, CORRIDOR_CONFIG.height - 0.15, project.wallZ);
      fixture.lookAt(group.position);
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

      // Handle Drag Navigation
      if (isDraggingRef.current && !activeProject) {
        const deltaDragY = e.clientY - dragStartYRef.current;
        dragStartYRef.current = e.clientY;
        velocityZRef.current -= deltaDragY * 0.025;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (activeProject) return;
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
          onSelectProject(hit.userData.project);
        }
      }
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('click', onClick);

    // --- 10. FLUID INERTIA MOMENTUM SCROLL ENGINE ---
    const onWheel = (e: WheelEvent) => {
      if (activeProject) return;
      e.preventDefault();

      // Normalize wheel delta across varying mice & trackpads
      const rawDelta = e.deltaY;
      const normalized = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), 55);

      // Add to physical velocity accumulator
      velocityZRef.current -= normalized * 0.0038;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (activeProject) return;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S' || e.key === 'PageDown') {
        velocityZRef.current -= 0.22;
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'PageUp') {
        velocityZRef.current += 0.22;
      }
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (activeProject) return;
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;
      touchStartY = touchY;

      velocityZRef.current -= deltaY * 0.018;
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

    // --- 11. LUXURY 60-120 FPS CINEMATIC RENDER & PHYSICS LOOP ---
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.06);

      // Auto-Tour glide if active
      if (isAutoTouring && !activeProject && !isDraggingRef.current) {
        if (targetZRef.current > CORRIDOR_CONFIG.minScroll + 3.0) {
          velocityZRef.current -= 0.008;
        }
      }

      // Physics Friction / Decay (Silky exponential decay)
      const friction = Math.pow(0.86, delta * 60);
      velocityZRef.current *= friction;

      // Update target based on velocity
      targetZRef.current += velocityZRef.current * delta * 60;

      // Soft clamp bounds with gentle bumper
      if (targetZRef.current < CORRIDOR_CONFIG.minScroll) {
        targetZRef.current = CORRIDOR_CONFIG.minScroll;
        velocityZRef.current = 0;
      } else if (targetZRef.current > CORRIDOR_CONFIG.maxScroll) {
        targetZRef.current = CORRIDOR_CONFIG.maxScroll;
        velocityZRef.current = 0;
      }

      // Smooth Camera Z Lerp (Steadycam Glide)
      const lerpFactor = 1.0 - Math.exp(-9.0 * delta);
      currentZRef.current += (targetZRef.current - currentZRef.current) * lerpFactor;

      // Mouse Parallax Smooth Easing
      const mouseFactor = 1.0 - Math.exp(-5.5 * delta);
      mousePosRef.current.x += (targetMouseRef.current.x - mousePosRef.current.x) * mouseFactor;
      mousePosRef.current.y += (targetMouseRef.current.y - mousePosRef.current.y) * mouseFactor;

      // Check Lounge Transition
      if (currentZRef.current <= -63) {
        onEnterLounge();
      }

      // Throttle React State Updates to keep main thread completely unblocked
      const now = performance.now();
      const zDiff = Math.abs(currentZRef.current - lastReportedZRef.current);
      if (zDiff > 0.16 && now - lastReportTimeRef.current > 45) {
        lastReportedZRef.current = currentZRef.current;
        lastReportTimeRef.current = now;
        onZChange(currentZRef.current);
      }

      // Steadycam Camera Positioning (Smooth glide without jitter)
      camera.position.z = currentZRef.current;
      camera.position.y = CORRIDOR_CONFIG.eyeHeight;
      camera.position.x = mousePosRef.current.x * 0.08;

      // Look Direction with subtle head tilt
      const lookTargetX = mousePosRef.current.x * 0.42;
      const lookTargetY = CORRIDOR_CONFIG.eyeHeight + mousePosRef.current.y * 0.22;
      const lookTargetZ = camera.position.z - 8.5;
      camera.lookAt(lookTargetX, lookTargetY, lookTargetZ);

      // Subtle atmospheric dust animation
      const pPositions = particleGeo.attributes.position.array as Float32Array;
      const time = clock.getElapsedTime() * 0.3;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        pPositions[i3 + 1] += Math.sin(time + i) * 0.001; // subtle float
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Sculpture Rotation
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
            onHoverProject(project.id);
            const parentGroup = hit.parent as THREE.Group;
            if (parentGroup && parentGroup.userData.originalX !== undefined) {
              hoveredMeshRef.current = parentGroup;
            }
          }
        } else {
          onHoverProject(null);
          hoveredMeshRef.current = null;
        }
      }

      // Smooth hover frame elevation
      if (hoveredMeshRef.current && hoveredMeshRef.current.userData.originalX !== undefined) {
        const targetLift =
          hoveredMeshRef.current.userData.originalX +
          hoveredMeshRef.current.userData.normalSign * 0.15;
        hoveredMeshRef.current.position.x +=
          (targetLift - hoveredMeshRef.current.position.x) * 0.15;
      }

      renderer.render(scene, camera);
    };

    animate();

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
  }, [onZChange, onSelectProject, onEnterLounge, onHoverProject, activeProject, isAutoTouring]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
    />
  );
};
