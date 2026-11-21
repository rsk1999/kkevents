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
}

export const ThreeCorridor: React.FC<ThreeCorridorProps> = ({
  currentZ,
  onZChange,
  onSelectProject,
  activeProject,
  onEnterLounge,
  onHoverProject
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetZRef = useRef<number>(currentZ);
  const currentZRef = useRef<number>(currentZ);
  const lastReportedZRef = useRef<number>(currentZ);
  const lastReportTimeRef = useRef<number>(0);
  const mousePosRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const targetMouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const hoveredMeshRef = useRef<THREE.Group | null>(null);
  const needsRaycastRef = useRef<boolean>(true);

  // Keep target in sync with external jumps (e.g. menu jump or return to corridor)
  useEffect(() => {
    targetZRef.current = currentZ;
  }, [currentZ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. OPTIMIZED HIGH-PERFORMANCE RENDERER ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F3F0E9');
    scene.fog = new THREE.FogExp2('#F3F0E9', 0.02);

    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, CORRIDOR_CONFIG.eyeHeight, currentZRef.current);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Cap pixel ratio to 1.5 to guarantee buttery 60-120fps on high-DPI screens
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    // Disabled heavy dynamic multi-spotlight shadow maps for solid 60fps
    renderer.shadowMap.enabled = false;

    container.appendChild(renderer.domElement);

    // --- 2. LUXURY GALLERY LIGHTING ---
    const ambientLight = new THREE.AmbientLight('#FFFBF5', 0.95);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#FFFFFF', '#D5CFBE', 0.7);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const mainLight = new THREE.DirectionalLight('#FFF8EB', 0.45);
    mainLight.position.set(0, 7, 5);
    scene.add(mainLight);

    // --- 3. ARCHITECTURE (FLOOR, CEILING, WALLS) ---
    const corridorLength = 80;
    const corridorCenterZ = -28;

    // A. Floor (Optimized Standard Material)
    const floorTexture = createFloorTexture();
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.3,
      metalness: 0.02,
      color: '#EAE6DC'
    });
    const floorGeo = new THREE.PlaneGeometry(CORRIDOR_CONFIG.width, corridorLength, 1, 1);
    const floor = new THREE.Mesh(floorGeo, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, corridorCenterZ);
    scene.add(floor);

    // B. Ceiling
    const ceilingMat = new THREE.MeshBasicMaterial({ color: '#FAF8F5' });
    const ceilingGeo = new THREE.PlaneGeometry(CORRIDOR_CONFIG.width, corridorLength, 1, 1);
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, CORRIDOR_CONFIG.height, corridorCenterZ);
    scene.add(ceiling);

    // Museum track light rails on ceiling
    const trackRailGeo = new THREE.BoxGeometry(0.1, 0.06, corridorLength);
    const trackRailMat = new THREE.MeshBasicMaterial({ color: '#222222' });
    const trackLeft = new THREE.Mesh(trackRailGeo, trackRailMat);
    trackLeft.position.set(-2.4, CORRIDOR_CONFIG.height - 0.03, corridorCenterZ);
    scene.add(trackLeft);

    const trackRight = new THREE.Mesh(trackRailGeo, trackRailMat);
    trackRight.position.set(2.4, CORRIDOR_CONFIG.height - 0.03, corridorCenterZ);
    scene.add(trackRight);

    // C. Walls
    const wallTexture = createWallTexture();
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: wallTexture,
      color: '#F3F0E9',
      roughness: 0.85,
      metalness: 0.0
    });

    // Left Wall
    const leftWallGeo = new THREE.PlaneGeometry(corridorLength, CORRIDOR_CONFIG.height, 1, 1);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(CORRIDOR_CONFIG.leftWallX, CORRIDOR_CONFIG.height / 2, corridorCenterZ);
    scene.add(leftWall);

    // Right Wall
    const rightWallGeo = new THREE.PlaneGeometry(corridorLength, CORRIDOR_CONFIG.height, 1, 1);
    const rightWall = new THREE.Mesh(rightWallGeo, wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(CORRIDOR_CONFIG.rightWallX, CORRIDOR_CONFIG.height / 2, corridorCenterZ);
    scene.add(rightWall);

    // D. Baseboards & Champagne Gold Reveal Trims
    const baseboardGeo = new THREE.BoxGeometry(0.06, 0.22, corridorLength);
    const baseboardMat = new THREE.MeshBasicMaterial({ color: '#2C2B29' });
    const baseboardLeft = new THREE.Mesh(baseboardGeo, baseboardMat);
    baseboardLeft.position.set(CORRIDOR_CONFIG.leftWallX + 0.03, 0.11, corridorCenterZ);
    scene.add(baseboardLeft);

    const baseboardRight = new THREE.Mesh(baseboardGeo, baseboardMat);
    baseboardRight.position.set(CORRIDOR_CONFIG.rightWallX - 0.03, 0.11, corridorCenterZ);
    scene.add(baseboardRight);

    const revealLineGeo = new THREE.BoxGeometry(0.04, 0.02, corridorLength);
    const revealLineMat = new THREE.MeshBasicMaterial({ color: '#B89A6A' });
    const revealLeft = new THREE.Mesh(revealLineGeo, revealLineMat);
    revealLeft.position.set(CORRIDOR_CONFIG.leftWallX + 0.02, 0.23, corridorCenterZ);
    scene.add(revealLeft);

    const revealRight = new THREE.Mesh(revealLineGeo, revealLineMat);
    revealRight.position.set(CORRIDOR_CONFIG.rightWallX - 0.02, 0.23, corridorCenterZ);
    scene.add(revealRight);

    // Entrance Arch
    const entranceArchGeo = new THREE.BoxGeometry(CORRIDOR_CONFIG.width, 0.4, 0.4);
    const entranceArch = new THREE.Mesh(entranceArchGeo, baseboardMat);
    entranceArch.position.set(0, CORRIDOR_CONFIG.height - 0.2, 11);
    scene.add(entranceArch);

    // --- 4. FINAL BOOKING ROOM & LOUNGE (Z = -60 to -78) ---
    const loungeWidth = 24;
    const loungeHeight = 9.5;
    const loungeDepth = 22;
    const loungeZ = -73;

    const loungeFloorGeo = new THREE.PlaneGeometry(loungeWidth, loungeDepth, 1, 1);
    const loungeFloor = new THREE.Mesh(loungeFloorGeo, floorMaterial);
    loungeFloor.rotation.x = -Math.PI / 2;
    loungeFloor.position.set(0, 0, loungeZ);
    scene.add(loungeFloor);

    const loungeCeilingGeo = new THREE.PlaneGeometry(loungeWidth, loungeDepth, 1, 1);
    const loungeCeiling = new THREE.Mesh(loungeCeilingGeo, ceilingMat);
    loungeCeiling.rotation.x = Math.PI / 2;
    loungeCeiling.position.set(0, loungeHeight, loungeZ);
    scene.add(loungeCeiling);

    // Glass Wall at far end of Lounge
    const glassWallMat = new THREE.MeshStandardMaterial({
      color: '#E8E4DA',
      roughness: 0.1,
      metalness: 0.1
    });
    const glassWallGeo = new THREE.PlaneGeometry(loungeWidth, loungeHeight, 1, 1);
    const glassWall = new THREE.Mesh(glassWallGeo, glassWallMat);
    glassWall.position.set(0, loungeHeight / 2, loungeZ - loungeDepth / 2);
    scene.add(glassWall);

    // Columns in Lounge
    const pillarGeo = new THREE.CylinderGeometry(0.42, 0.42, loungeHeight, 16);
    const pillarMat = new THREE.MeshStandardMaterial({ color: '#EAE6DD', roughness: 0.3 });
    const pillar1 = new THREE.Mesh(pillarGeo, pillarMat);
    pillar1.position.set(-6, loungeHeight / 2, -67);
    scene.add(pillar1);
    const pillar2 = new THREE.Mesh(pillarGeo, pillarMat);
    pillar2.position.set(6, loungeHeight / 2, -67);
    scene.add(pillar2);

    // Sculpture Plinth
    const plinthGeo = new THREE.BoxGeometry(2.2, 0.9, 2.2);
    const plinthMat = new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.3 });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.set(0, 0.45, -71);
    scene.add(plinth);

    // Champagne Gold Sculpture
    const sculptureGeo = new THREE.TorusKnotGeometry(0.65, 0.18, 64, 16, 2, 3);
    const sculptureMat = new THREE.MeshStandardMaterial({
      color: '#B89A6A',
      metalness: 0.9,
      roughness: 0.15
    });
    const sculpture = new THREE.Mesh(sculptureGeo, sculptureMat);
    sculpture.position.set(0, 1.6, -71);
    scene.add(sculpture);

    // --- 5. ARTWORK EXHIBITS & SPOTLIGHTS ---
    const interactiveMeshes: THREE.Mesh[] = [];
    const textureLoader = new THREE.TextureLoader();

    EXHIBITION_PROJECTS.forEach((project) => {
      const isLeft = project.side === 'left';
      const wallX = isLeft ? CORRIDOR_CONFIG.leftWallX : CORRIDOR_CONFIG.rightWallX;
      const normalSign = isLeft ? 1 : -1;

      const group = new THREE.Group();
      group.userData = { project, originalX: wallX + normalSign * 0.12, normalSign };
      group.position.set(wallX + normalSign * 0.12, CORRIDOR_CONFIG.eyeHeight + 0.3, project.wallZ);
      group.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;

      const w = project.width;
      const h = project.height;
      const frameDepth = 0.08;

      // Outer Bevel Frame (Champagne Gold)
      const frameGeo = new THREE.BoxGeometry(w + 0.16, h + 0.16, frameDepth);
      const frameMat = new THREE.MeshStandardMaterial({
        color: '#B89A6A',
        metalness: 0.85,
        roughness: 0.25
      });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      group.add(frameMesh);

      // Dark Inner Matte Reveal Border
      const innerMatGeo = new THREE.PlaneGeometry(w + 0.04, h + 0.04, 1, 1);
      const innerMat = new THREE.MeshBasicMaterial({ color: '#141414' });
      const innerMatMesh = new THREE.Mesh(innerMatGeo, innerMat);
      innerMatMesh.position.z = frameDepth / 2 + 0.005;
      group.add(innerMatMesh);

      // Artwork Plane (Mounted inside the frame on the wall)
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

      // Dedicated Focused Ceiling Spotlight with standalone target
      const spotLight = new THREE.SpotLight('#FFF5E4', 3.5, 14, Math.PI / 4.5, 0.45, 1.0);
      const trackX = isLeft ? -2.4 : 2.4;
      spotLight.position.set(trackX, CORRIDOR_CONFIG.height - 0.2, project.wallZ);

      // Separate target object to avoid re-parenting artMesh away from group!
      const spotTarget = new THREE.Object3D();
      spotTarget.position.set(wallX, CORRIDOR_CONFIG.eyeHeight + 0.3, project.wallZ);
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

    // --- 6. RAYCASTER & INTERACTION (EVENT-DRIVEN FOR SPEED) ---
    const raycaster = new THREE.Raycaster();
    const mouseNorm = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      mouseNorm.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseNorm.y = -(e.clientY / window.innerHeight) * 2 + 1;

      targetMouseRef.current.copy(mouseNorm);
      needsRaycastRef.current = true;
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
    window.addEventListener('click', onClick);

    // --- 7. FLUID SCROLLING WITH SILKY MOMENTUM ---
    const onWheel = (e: WheelEvent) => {
      if (activeProject) return;
      e.preventDefault();

      // Responsive, fluid scroll feel
      const sensitivity = 0.024;
      const delta = e.deltaY * sensitivity;
      const nextTarget = targetZRef.current - delta;

      targetZRef.current = Math.max(
        CORRIDOR_CONFIG.minScroll,
        Math.min(CORRIDOR_CONFIG.maxScroll, nextTarget)
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (activeProject) return;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S' || e.key === 'PageDown') {
        targetZRef.current = Math.max(CORRIDOR_CONFIG.minScroll, targetZRef.current - 4.2);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'PageUp') {
        targetZRef.current = Math.min(CORRIDOR_CONFIG.maxScroll, targetZRef.current + 4.2);
      }
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (activeProject) return;
      const touchY = e.touches[0].clientY;
      const deltaY = (touchStartY - touchY) * 0.045;
      touchStartY = touchY;

      targetZRef.current = Math.max(
        CORRIDOR_CONFIG.minScroll,
        Math.min(CORRIDOR_CONFIG.maxScroll, targetZRef.current - deltaY)
      );
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

    // --- 8. BUTTERY SMOOTH 60-120 FPS RENDER LOOP ---
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.08); // cap max delta to prevent jumps

      // Exponential smooth damping (frame-rate independent & ultra-responsive)
      const dampSpeed = 7.5;
      const zFactor = 1.0 - Math.exp(-dampSpeed * delta);
      currentZRef.current += (targetZRef.current - currentZRef.current) * zFactor;

      // Mouse Parallax smooth damping
      const mouseFactor = 1.0 - Math.exp(-5.0 * delta);
      mousePosRef.current.x += (targetMouseRef.current.x - mousePosRef.current.x) * mouseFactor;
      mousePosRef.current.y += (targetMouseRef.current.y - mousePosRef.current.y) * mouseFactor;

      // Check Lounge Trigger
      if (currentZRef.current <= -63) {
        onEnterLounge();
      }

      // THROTTLED React state update: only update React every 60ms or on significant move
      // This completely eliminates React re-render lag during fast scrolling!
      const now = performance.now();
      const zDiff = Math.abs(currentZRef.current - lastReportedZRef.current);
      if (zDiff > 0.18 && now - lastReportTimeRef.current > 50) {
        lastReportedZRef.current = currentZRef.current;
        lastReportTimeRef.current = now;
        onZChange(currentZRef.current);
      }

      // Gentle walking bob
      const walkDelta = targetZRef.current - currentZRef.current;
      const isMoving = Math.abs(walkDelta) > 0.01;
      const walkTime = clock.getElapsedTime() * 3.8;
      const bobY = isMoving ? Math.sin(walkTime) * 0.014 : 0;
      const swayX = isMoving ? Math.cos(walkTime * 0.5) * 0.008 : 0;

      camera.position.z = currentZRef.current;
      camera.position.y = CORRIDOR_CONFIG.eyeHeight + bobY;
      camera.position.x = swayX;

      // Smooth subtle parallax perspective look
      const lookTargetX = mousePosRef.current.x * 0.45;
      const lookTargetY = CORRIDOR_CONFIG.eyeHeight + mousePosRef.current.y * 0.25;
      const lookTargetZ = camera.position.z - 8.0;
      camera.lookAt(lookTargetX, lookTargetY, lookTargetZ);

      // Subtle sculpture rotation in lounge
      sculpture.rotation.y += delta * 0.2;

      // --- EVENT-DRIVEN RAYCASTING (runs only when mouse moved) ---
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
  }, [onZChange, onSelectProject, onEnterLounge, onHoverProject, activeProject]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
    />
  );
};
