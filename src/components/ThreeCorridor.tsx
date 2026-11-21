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
  const mousePosRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const targetMouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const isTransitioningRef = useRef<boolean>(false);
  const hoveredMeshRef = useRef<THREE.Group | null>(null);

  // Keep target in sync with external jumps (e.g. menu jump or return to corridor)
  useEffect(() => {
    targetZRef.current = currentZ;
  }, [currentZ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F3F0E9');
    scene.fog = new THREE.FogExp2('#F3F0E9', 0.022);

    const camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );
    camera.position.set(0, CORRIDOR_CONFIG.eyeHeight, currentZRef.current);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // --- 2. LIGHTING ---
    const ambientLight = new THREE.AmbientLight('#FFFBF5', 0.85);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#FFFFFF', '#D9D3C7', 0.65);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    // Subtle corridor axis guide light
    const axisLight = new THREE.DirectionalLight('#FFF7E6', 0.4);
    axisLight.position.set(0, 6, 10);
    scene.add(axisLight);

    // --- 3. ARCHITECTURE (FLOOR, CEILING, WALLS) ---
    const corridorLength = 80;
    const corridorCenterZ = -28;

    // A. Floor
    const floorTexture = createFloorTexture();
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.35,
      metalness: 0.05,
      color: '#EAE6DC'
    });
    const floorGeo = new THREE.PlaneGeometry(CORRIDOR_CONFIG.width, corridorLength);
    const floor = new THREE.Mesh(floorGeo, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, corridorCenterZ);
    floor.receiveShadow = true;
    scene.add(floor);

    // B. Ceiling
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      roughness: 0.9,
      metalness: 0.0
    });
    const ceilingGeo = new THREE.PlaneGeometry(CORRIDOR_CONFIG.width, corridorLength);
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, CORRIDOR_CONFIG.height, corridorCenterZ);
    scene.add(ceiling);

    // Museum track light rails on ceiling
    const trackRailGeo = new THREE.BoxGeometry(0.12, 0.08, corridorLength);
    const trackRailMat = new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.4 });
    const trackLeft = new THREE.Mesh(trackRailGeo, trackRailMat);
    trackLeft.position.set(-2.4, CORRIDOR_CONFIG.height - 0.04, corridorCenterZ);
    scene.add(trackLeft);

    const trackRight = new THREE.Mesh(trackRailGeo, trackRailMat);
    trackRight.position.set(2.4, CORRIDOR_CONFIG.height - 0.04, corridorCenterZ);
    scene.add(trackRight);

    // C. Walls
    const wallTexture = createWallTexture();
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: wallTexture,
      color: '#F3F0E9',
      roughness: 0.85,
      metalness: 0.02
    });

    // Left Wall
    const leftWallGeo = new THREE.PlaneGeometry(corridorLength, CORRIDOR_CONFIG.height);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(CORRIDOR_CONFIG.leftWallX, CORRIDOR_CONFIG.height / 2, corridorCenterZ);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right Wall
    const rightWallGeo = new THREE.PlaneGeometry(corridorLength, CORRIDOR_CONFIG.height);
    const rightWall = new THREE.Mesh(rightWallGeo, wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(CORRIDOR_CONFIG.rightWallX, CORRIDOR_CONFIG.height / 2, corridorCenterZ);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // D. Baseboards (Charcoal / Champagne Gold Trim)
    const baseboardGeo = new THREE.BoxGeometry(0.06, 0.22, corridorLength);
    const baseboardMat = new THREE.MeshStandardMaterial({ color: '#333333', roughness: 0.5 });
    const baseboardLeft = new THREE.Mesh(baseboardGeo, baseboardMat);
    baseboardLeft.position.set(CORRIDOR_CONFIG.leftWallX + 0.03, 0.11, corridorCenterZ);
    scene.add(baseboardLeft);

    const baseboardRight = new THREE.Mesh(baseboardGeo, baseboardMat);
    baseboardRight.position.set(CORRIDOR_CONFIG.rightWallX - 0.03, 0.11, corridorCenterZ);
    scene.add(baseboardRight);

    // Gold Reveal Line above baseboards
    const revealLineGeo = new THREE.BoxGeometry(0.04, 0.02, corridorLength);
    const revealLineMat = new THREE.MeshStandardMaterial({ color: '#B89A6A', metalness: 0.8, roughness: 0.2 });
    const revealLeft = new THREE.Mesh(revealLineGeo, revealLeftMat(revealLineMat));
    revealLeft.position.set(CORRIDOR_CONFIG.leftWallX + 0.02, 0.24, corridorCenterZ);
    scene.add(revealLeft);

    const revealRight = new THREE.Mesh(revealLineGeo, revealLineMat);
    revealRight.position.set(CORRIDOR_CONFIG.rightWallX - 0.02, 0.24, corridorCenterZ);
    scene.add(revealRight);

    function revealLeftMat(m: THREE.Material) {
      return m;
    }

    // --- 4. ENTRANCE ARCH & VESTIBULE (Z = 10 to 14) ---
    const entranceArchGeo = new THREE.BoxGeometry(CORRIDOR_CONFIG.width, 0.5, 0.5);
    const entranceArch = new THREE.Mesh(entranceArchGeo, baseboardMat);
    entranceArch.position.set(0, CORRIDOR_CONFIG.height - 0.25, 11);
    scene.add(entranceArch);

    // Entrance back wall with discreet museum sign
    const entranceWallGeo = new THREE.PlaneGeometry(CORRIDOR_CONFIG.width, CORRIDOR_CONFIG.height);
    const entranceWall = new THREE.Mesh(entranceWallGeo, wallMaterial);
    entranceWall.position.set(0, CORRIDOR_CONFIG.height / 2, 14);
    entranceWall.rotation.y = Math.PI;
    scene.add(entranceWall);

    // --- 5. FINAL BOOKING ROOM & LOUNGE (Z = -60 to -78) ---
    // The corridor opens into a wide, double-height grand gallery lounge
    const loungeWidth = 24;
    const loungeHeight = 9.5;
    const loungeDepth = 22;
    const loungeZ = -73;

    // Lounge Floor
    const loungeFloorGeo = new THREE.PlaneGeometry(loungeWidth, loungeDepth);
    const loungeFloor = new THREE.Mesh(loungeFloorGeo, floorMaterial);
    loungeFloor.rotation.x = -Math.PI / 2;
    loungeFloor.position.set(0, 0, loungeZ);
    loungeFloor.receiveShadow = true;
    scene.add(loungeFloor);

    // Lounge Ceiling
    const loungeCeilingGeo = new THREE.PlaneGeometry(loungeWidth, loungeDepth);
    const loungeCeiling = new THREE.Mesh(loungeCeilingGeo, ceilingMat);
    loungeCeiling.rotation.x = Math.PI / 2;
    loungeCeiling.position.set(0, loungeHeight, loungeZ);
    scene.add(loungeCeiling);

    // Lounge Back Glass / Architectural Wall
    const glassWallMat = new THREE.MeshStandardMaterial({
      color: '#E8E4DA',
      roughness: 0.1,
      metalness: 0.15
    });
    const glassWallGeo = new THREE.PlaneGeometry(loungeWidth, loungeHeight);
    const glassWall = new THREE.Mesh(glassWallGeo, glassWallMat);
    glassWall.position.set(0, loungeHeight / 2, loungeZ - loungeDepth / 2);
    scene.add(glassWall);

    // Architectural Pillars in Lounge
    const pillarGeo = new THREE.CylinderGeometry(0.45, 0.45, loungeHeight, 32);
    const pillarMat = new THREE.MeshStandardMaterial({ color: '#EAE6DD', roughness: 0.3 });
    const pillar1 = new THREE.Mesh(pillarGeo, pillarMat);
    pillar1.position.set(-6, loungeHeight / 2, -67);
    scene.add(pillar1);
    const pillar2 = new THREE.Mesh(pillarGeo, pillarMat);
    pillar2.position.set(6, loungeHeight / 2, -67);
    scene.add(pillar2);

    // Centerpiece Sculpture / Plinth in Lounge
    const plinthGeo = new THREE.BoxGeometry(2.4, 0.9, 2.4);
    const plinthMat = new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.2 });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.set(0, 0.45, -71);
    scene.add(plinth);

    // Champagne Gold Sculpture on plinth
    const sculptureGeo = new THREE.TorusKnotGeometry(0.65, 0.18, 120, 24, 2, 3);
    const sculptureMat = new THREE.MeshStandardMaterial({
      color: '#B89A6A',
      metalness: 0.9,
      roughness: 0.15
    });
    const sculpture = new THREE.Mesh(sculptureGeo, sculptureMat);
    sculpture.position.set(0, 1.6, -71);
    scene.add(sculpture);

    // Soft Spotlight on Sculpture
    const sculptureSpot = new THREE.SpotLight('#FFF2DE', 4.5, 14, Math.PI / 6, 0.4, 1.2);
    sculptureSpot.position.set(0, 8, -69);
    sculptureSpot.target = sculpture;
    scene.add(sculptureSpot);
    scene.add(sculptureSpot.target);

    // --- 6. ARTWORK DISPLAYS & SPOTLIGHTS ---
    const artworkGroups: THREE.Group[] = [];
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

      // Frame Dimensions
      const w = project.width;
      const h = project.height;
      const frameDepth = 0.08;

      // Outer Bevel Frame (Champagne Gold / Deep Charcoal)
      const frameGeo = new THREE.BoxGeometry(w + 0.14, h + 0.14, frameDepth);
      const frameMat = new THREE.MeshStandardMaterial({
        color: '#B89A6A',
        metalness: 0.85,
        roughness: 0.25
      });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.castShadow = true;
      group.add(frameMesh);

      // Inner Reveal (Dark Shadow)
      const innerGeo = new THREE.BoxGeometry(w + 0.02, h + 0.02, frameDepth + 0.01);
      const innerMat = new THREE.MeshStandardMaterial({ color: '#1A1A1A', roughness: 0.6 });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      group.add(innerMesh);

      // Artwork Plane with Canvas Fallback & Dynamic Image Loading
      const artGeo = new THREE.PlaneGeometry(w, h);
      const fallbackTexture = createFallbackArtworkTexture(project);
      const artMat = new THREE.MeshStandardMaterial({
        map: fallbackTexture,
        roughness: 0.25,
        metalness: 0.05
      });
      const artMesh = new THREE.Mesh(artGeo, artMat);
      artMesh.position.z = frameDepth / 2 + 0.01;
      artMesh.userData = { projectId: project.id, isArtwork: true, project };
      group.add(artMesh);
      interactiveMeshes.push(artMesh);

      // Attempt loading real high-res photography
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
          console.warn(`Could not load live photo for ${project.title}, keeping luxury canvas texture:`, err);
        }
      );

      // Museum Placard underneath frame
      const placardGeo = new THREE.PlaneGeometry(Math.min(w * 0.75, 2.4), 0.52);
      const placardTexture = createPlacardTexture(project);
      const placardMat = new THREE.MeshStandardMaterial({
        map: placardTexture,
        roughness: 0.4,
        transparent: true
      });
      const placardMesh = new THREE.Mesh(placardGeo, placardMat);
      placardMesh.position.set(0, -(h / 2 + 0.45), 0.01);
      placardMesh.userData = { projectId: project.id, isArtwork: true, project };
      group.add(placardMesh);
      interactiveMeshes.push(placardMesh);

      // Dedicated Ceiling Spotlight shining onto artwork
      const spotLight = new THREE.SpotLight('#FFF5E4', 4.8, 10, Math.PI / 5, 0.45, 1.2);
      const trackX = isLeft ? -2.4 : 2.4;
      spotLight.position.set(trackX, CORRIDOR_CONFIG.height - 0.2, project.wallZ);
      spotLight.target = artMesh;
      spotLight.castShadow = true;
      spotLight.shadow.bias = -0.0001;
      scene.add(spotLight);
      scene.add(spotLight.target);

      // Light Fixture Model on Ceiling Track
      const fixtureGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.22, 16);
      const fixtureMat = new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.3 });
      const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
      fixture.position.set(trackX, CORRIDOR_CONFIG.height - 0.15, project.wallZ);
      fixture.lookAt(group.position);
      scene.add(fixture);

      scene.add(group);
      artworkGroups.push(group);
    });

    // --- 7. RAYCASTER & INTERACTION ---
    const raycaster = new THREE.Raycaster();
    const mouseNorm = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      mouseNorm.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseNorm.y = -(e.clientY / window.innerHeight) * 2 + 1;

      targetMouseRef.current.x = mouseNorm.x;
      targetMouseRef.current.y = mouseNorm.y;
    };

    const onClick = (e: MouseEvent) => {
      // Raycast to check if an artwork was clicked
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

    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('click', onClick);

    // --- 8. SMOOTH SCROLL & INPUT HANDLING ---
    const onWheel = (e: WheelEvent) => {
      if (activeProject) return; // don't scroll while viewing project modal
      e.preventDefault();

      // Slow scroll vs Fast scroll momentum
      const delta = e.deltaY * 0.015;
      const nextTarget = targetZRef.current - delta;

      // Clamp target within corridor bounds
      targetZRef.current = Math.max(
        CORRIDOR_CONFIG.minScroll,
        Math.min(CORRIDOR_CONFIG.maxScroll, nextTarget)
      );
    };

    // Keyboard Arrow Keys / W / S
    const onKeyDown = (e: KeyboardEvent) => {
      if (activeProject) return;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S' || e.key === 'PageDown') {
        targetZRef.current = Math.max(CORRIDOR_CONFIG.minScroll, targetZRef.current - 3.5);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'PageUp') {
        targetZRef.current = Math.min(CORRIDOR_CONFIG.maxScroll, targetZRef.current + 3.5);
      }
    };

    // Touch Swipe Controls
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (activeProject) return;
      const touchY = e.touches[0].clientY;
      const deltaY = (touchStartY - touchY) * 0.035;
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

    // Window Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // --- 9. RENDER & PHYSICS LOOP ---
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Smooth camera Z lerp (Walking Physics)
      const lerpSpeed = 0.07;
      currentZRef.current += (targetZRef.current - currentZRef.current) * lerpSpeed;

      // Mouse Parallax lerp
      mousePosRef.current.x += (targetMouseRef.current.x - mousePosRef.current.x) * 0.05;
      mousePosRef.current.y += (targetMouseRef.current.y - mousePosRef.current.y) * 0.05;

      // Check if user is in or approaching the Final Booking Lounge
      if (currentZRef.current <= -63 && !isTransitioningRef.current) {
        onEnterLounge();
      }

      // Update external position periodically
      if (Math.abs(targetZRef.current - currentZRef.current) > 0.01) {
        onZChange(currentZRef.current);
      }

      // Walking subtle sway / head movement
      const walkDelta = targetZRef.current - currentZRef.current;
      const isMoving = Math.abs(walkDelta) > 0.01;
      const walkTime = clock.getElapsedTime() * 4;
      const bobY = isMoving ? Math.sin(walkTime) * 0.018 : 0;
      const swayX = isMoving ? Math.cos(walkTime * 0.5) * 0.012 : 0;

      // Camera Positioning
      camera.position.z = currentZRef.current;
      camera.position.y = CORRIDOR_CONFIG.eyeHeight + bobY;
      camera.position.x = swayX;

      // Parallax look direction
      const lookTargetX = mousePosRef.current.x * 0.6;
      const lookTargetY = CORRIDOR_CONFIG.eyeHeight + mousePosRef.current.y * 0.35;
      const lookTargetZ = camera.position.z - 8;
      camera.lookAt(lookTargetX, lookTargetY, lookTargetZ);

      // Rotate subtle sculpture in the lounge
      sculpture.rotation.y += delta * 0.25;
      sculpture.rotation.x += delta * 0.1;

      // --- Artwork Hover Detection & Lift Animation ---
      raycaster.setFromCamera(targetMouseRef.current, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const project = hit.userData.project as Project | undefined;
        if (project) {
          onHoverProject(project.id);
          // Find the parent group and elevate it slightly
          const parentGroup = hit.parent as THREE.Group;
          if (parentGroup && parentGroup.userData.originalX !== undefined) {
            hoveredMeshRef.current = parentGroup;
            const targetLiftX =
              parentGroup.userData.originalX + parentGroup.userData.normalSign * 0.16;
            parentGroup.position.x += (targetLiftX - parentGroup.position.x) * 0.1;
          }
        }
      } else {
        onHoverProject(null);
        if (hoveredMeshRef.current && hoveredMeshRef.current.userData.originalX !== undefined) {
          const orig = hoveredMeshRef.current.userData.originalX;
          hoveredMeshRef.current.position.x += (orig - hoveredMeshRef.current.position.x) * 0.1;
          if (Math.abs(orig - hoveredMeshRef.current.position.x) < 0.005) {
            hoveredMeshRef.current.position.x = orig;
            hoveredMeshRef.current = null;
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Clean up
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
