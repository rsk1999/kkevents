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
  onFrameTap: (project: Project) => void;
  onBackgroundTap: () => void;
  selectedProjectId: string | null;
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
  onFrameTap,
  onBackgroundTap,
  selectedProjectId,
  activeProject,
  isInLounge,
  onEnterLounge,
  hoveredProjectId,
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

  // Mouse Interaction References
  const targetMouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const isDraggingRef = useRef<boolean>(false);
  const dragStartYRef = useRef<number>(0);
  const dragStartXRef = useRef<number>(0);
  const hoveredMeshRef = useRef<THREE.Group | null>(null);
  const needsRaycastRef = useRef<boolean>(true);

  // Look Around (Yaw & Pitch) References
  const lookYawRef = useRef<number>(0);
  const targetYawRef = useRef<number>(0);
  const lookPitchRef = useRef<number>(0);
  const targetPitchRef = useRef<number>(0);
  const currentLookFocusRef = useRef<THREE.Vector3 | null>(null);

  // Prop Callbacks in Refs
  const onProgressChangeRef = useRef(onProgressChange);
  onProgressChangeRef.current = onProgressChange;

  const onFrameTapRef = useRef(onFrameTap);
  onFrameTapRef.current = onFrameTap;

  const onBackgroundTapRef = useRef(onBackgroundTap);
  onBackgroundTapRef.current = onBackgroundTap;

  const selectedProjectIdRef = useRef(selectedProjectId);
  selectedProjectIdRef.current = selectedProjectId;

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
    const projectMap = new Map<
      string,
      {
        group: THREE.Group;
        frameMesh: THREE.Mesh;
        frameMat: THREE.MeshStandardMaterial;
        spotLight: THREE.SpotLight;
        originalPos: THREE.Vector3;
        normal: THREE.Vector3;
        project: Project;
      }
    >();

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
        roughness: 0.22,
        emissive: new THREE.Color('#000000'),
        emissiveIntensity: 0
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

      projectMap.set(project.id, {
        group,
        frameMesh,
        frameMat,
        spotLight,
        originalPos: position.clone(),
        normal: normal.clone(),
        project
      });
    });

    // --- 9. RAYCASTER & CLICK-AND-DRAG CAMERA CONTROLS (NO PASSIVE MOUSE LOOK) ---
    const raycaster = new THREE.Raycaster();
    const mouseNorm = new THREE.Vector2();

    let pointerDownTime = 0;
    let pointerTotalDrag = 0;

    const onPointerMove = (e: PointerEvent) => {
      if (activeProjectRef.current || isInLoungeRef.current) return;
      mouseNorm.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseNorm.y = -(e.clientY / window.innerHeight) * 2 + 1;

      targetMouseRef.current.copy(mouseNorm);
      needsRaycastRef.current = true;

      // CAMERA LOOK ACTIVATES ONLY ON ACTIVE LEFT-BUTTON CLICK & DRAG
      if (isDraggingRef.current && e.pointerType !== 'touch') {
        const deltaX = e.clientX - dragStartXRef.current;
        const deltaY = e.clientY - dragStartYRef.current;
        dragStartXRef.current = e.clientX;
        dragStartYRef.current = e.clientY;
        pointerTotalDrag += Math.hypot(deltaX, deltaY);

        // Hold left mouse button + drag left = turn left; drag right = turn right
        targetYawRef.current -= deltaX * 0.0032;
        targetYawRef.current = Math.max(-1.35, Math.min(1.35, targetYawRef.current));

        // Hold left mouse button + drag up = look up; drag down = look down
        targetPitchRef.current -= deltaY * 0.0016;
        targetPitchRef.current = Math.max(-0.35, Math.min(0.35, targetPitchRef.current));
      }
      // PASSIVE MOUSE MOVEMENT (WITHOUT HOLDING LEFT CLICK) DOES ABSOLUTELY NOTHING TO THE CAMERA.
    };

    const onPointerDown = (e: PointerEvent) => {
      if (activeProjectRef.current || isInLoungeRef.current) return;
      // ONLY respond to Left Mouse Button (button 0) for camera looking & frame interaction
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      if (e.pointerType !== 'touch') {
        isDraggingRef.current = true;
        dragStartXRef.current = e.clientX;
        dragStartYRef.current = e.clientY;
        pointerDownTime = performance.now();
        pointerTotalDrag = 0;
      }
    };

    const executeDeliberateTap = (clientX: number, clientY: number) => {
      if (isInLoungeRef.current) return;
      mouseNorm.x = (clientX / window.innerWidth) * 2 - 1;
      mouseNorm.y = -(clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouseNorm, camera);

      const intersects = raycaster.intersectObjects(interactiveMeshes);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData && hit.userData.project) {
          onFrameTapRef.current(hit.userData.project);
          return;
        }
      }

      // If user tapped empty space or wall
      onBackgroundTapRef.current();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (isInLoungeRef.current) {
        isDraggingRef.current = false;
        return;
      }
      if (isDraggingRef.current && e.pointerType !== 'touch') {
        isDraggingRef.current = false;
        const duration = performance.now() - pointerDownTime;
        // Deliberate tap check: minimal movement (< 7px) and short duration (< 350ms)
        if (pointerTotalDrag < 7 && duration < 350) {
          executeDeliberateTap(e.clientX, e.clientY);
        }
        // When left mouse is released: camera look stops immediately and PRESERVES current view direction!
      }
    };

    const onPointerCancel = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('pointerleave', onPointerCancel);

    // --- 10. FLUID INERTIA MOMENTUM SCROLL ENGINE ALONG SPLINE ---
    const onWheel = (e: WheelEvent) => {
      if (activeProjectRef.current || selectedProjectIdRef.current || isInLoungeRef.current) return;
      e.preventDefault();

      const rawDelta = e.deltaY;
      const normalized = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), 55);

      // Add to physical velocity accumulator along parameter u
      velocityURef.current += normalized * 0.000048;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (activeProjectRef.current || isInLoungeRef.current) return;
      if (e.key === 'Escape') {
        onBackgroundTapRef.current();
        return;
      }
      if (selectedProjectIdRef.current) return; // Walking paused while frame is selected

      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S' || e.key === 'PageDown') {
        velocityURef.current += 0.0028;
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'PageUp') {
        velocityURef.current -= 0.0028;
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        targetYawRef.current = Math.min(1.2, targetYawRef.current + 0.18);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        targetYawRef.current = Math.max(-1.2, targetYawRef.current - 0.18);
      }
    };

    let touchStartY = 0;
    let touchStartX = 0;
    let touchStartTime = 0;
    let touchTotalDist = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (activeProjectRef.current || isInLoungeRef.current) return;
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        touchStartTime = performance.now();
        touchTotalDist = 0;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (activeProjectRef.current || isInLoungeRef.current || e.touches.length === 0) return;
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = touchStartX - touchX;
      const deltaY = touchStartY - touchY;
      touchTotalDist += Math.hypot(deltaX, deltaY);
      touchStartX = touchX;
      touchStartY = touchY;

      // Direction detection to distinguish walking from looking on mobile:
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        // Vertical swipe = Walk forward / backward along the curved corridor
        if (!selectedProjectIdRef.current) {
          velocityURef.current += deltaY * 0.00024;
        }
      } else {
        // Horizontal swipe = Look left / right
        targetYawRef.current += deltaX * 0.004;
        targetYawRef.current = Math.max(-1.35, Math.min(1.35, targetYawRef.current));
      }
    };

    const onTouchEnd = () => {
      if (activeProjectRef.current || isInLoungeRef.current) return;
      const touchDuration = performance.now() - touchStartTime;
      // ONLY trigger tap if user touched cleanly without swiping (< 8px movement and < 350ms)
      if (touchTotalDist < 8 && touchDuration < 350) {
        executeDeliberateTap(touchStartX, touchStartY);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

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

      // Smooth camera look damping (yaw & pitch)
      const lookFactor = 1.0 - Math.exp(-9.0 * delta);
      lookYawRef.current += (targetYawRef.current - lookYawRef.current) * lookFactor;
      lookPitchRef.current += (targetPitchRef.current - lookPitchRef.current) * lookFactor;

      // Note: We DO NOT auto-decay yaw toward center on mouse release.
      // The current viewing direction is strictly preserved where the user leaves it.

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
      // Camera position on curved spline (no passive lateral mouse sway)
      const curFrame = getPathFrame(currentURef.current);
      const camPos = curFrame.point.clone().add(new THREE.Vector3(0, CURVED_CONFIG.eyeHeight, 0));
      camera.position.copy(camPos);

      // Natural Look-Ahead along the curve bend
      const lookAheadU = Math.min(0.9999, currentURef.current + 0.055);
      const lookFrame = getPathFrame(lookAheadU);
      const forwardDir = lookFrame.point.clone().sub(curFrame.point).normalize();

      // Rotate forward look direction around world Y strictly by active lookYawRef
      const rotatedLookDir = forwardDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), lookYawRef.current);

      // Calculate normal look target ahead of camera along the curve bend
      const defaultLookTarget = camPos.clone().add(rotatedLookDir.multiplyScalar(4.5));
      defaultLookTarget.y += lookPitchRef.current * 2.2;

      if (!currentLookFocusRef.current) {
        currentLookFocusRef.current = defaultLookTarget.clone();
      }

      if (selectedProjectIdRef.current) {
        const selEntry = projectMap.get(selectedProjectIdRef.current);
        if (selEntry) {
          // Frame target centered at the artwork
          const frameTarget = selEntry.originalPos.clone();
          frameTarget.y = CURVED_CONFIG.eyeHeight * 0.98;
          // Smooth focus toward the selected frame
          currentLookFocusRef.current.lerp(frameTarget, 1.0 - Math.exp(-6.0 * delta));
          camera.lookAt(currentLookFocusRef.current);
        } else {
          camera.lookAt(defaultLookTarget);
        }
      } else {
        currentLookFocusRef.current.lerp(defaultLookTarget, 1.0 - Math.exp(-7.0 * delta));
        camera.lookAt(currentLookFocusRef.current);
      }

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

      // Smooth frame state transitions: NORMAL vs HOVER vs SELECTED
      projectMap.forEach(({ group, originalPos, normal, frameMat, spotLight }, pid) => {
        let targetPos = originalPos;
        let targetScale = 1.0;

        if (pid === selectedProjectIdRef.current) {
          // SELECTED: Move forward from the wall, slightly enlarge, intensify spotlight & frame glow
          targetPos = originalPos.clone().add(normal.clone().multiplyScalar(0.22));
          targetScale = 1.045;
          frameMat.emissive.set('#B89A6A');
          frameMat.emissiveIntensity = 0.35;
          spotLight.intensity = 4.2;
        } else if (pid === hoveredProjectId && !selectedProjectIdRef.current) {
          // HOVER: Subtle desktop hover lift
          targetPos = originalPos.clone().add(normal.clone().multiplyScalar(0.06));
          targetScale = 1.01;
          frameMat.emissive.set('#000000');
          frameMat.emissiveIntensity = 0;
          spotLight.intensity = 3.4;
        } else {
          // NORMAL: Resting on wall
          targetPos = originalPos;
          targetScale = 1.0;
          frameMat.emissive.set('#000000');
          frameMat.emissiveIntensity = 0;
          spotLight.intensity = 2.8;
        }

        group.position.lerp(targetPos, 1.0 - Math.exp(-8.0 * delta));
        const curScale = group.scale.x;
        const newScale = curScale + (targetScale - curScale) * (1.0 - Math.exp(-8.0 * delta));
        group.scale.set(newScale, newScale, newScale);
      });

      renderer.render(scene, camera);
    };

    animate(performance.now());

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('pointerleave', onPointerCancel);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
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
