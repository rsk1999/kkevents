import React, { useState, useCallback, useMemo } from 'react';
import { ThreeCorridor } from './components/ThreeCorridor';
import { EntranceScreen } from './components/EntranceScreen';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { BookingLoungeOverlay } from './components/BookingLoungeOverlay';
import { GalleryHUD } from './components/GalleryHUD';
import { GalleryIndexDrawer } from './components/GalleryIndexDrawer';
import { MobileGalleryFallback } from './components/MobileGalleryFallback';
import { EXHIBITION_PROJECTS } from './data/projects';
import type { Project } from './types';
import { soundscape } from './audio/soundscape';

export const App: React.FC = () => {
  const [hasEntered, setHasEntered] = useState(false);
  const [currentZ, setCurrentZ] = useState(10.0);
  const [savedReturnZ, setSavedReturnZ] = useState(8.0);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isInLounge, setIsInLounge] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [isStreamMode, setIsStreamMode] = useState(false);

  // Toggle ambient audio
  const handleToggleAudio = useCallback(() => {
    const playing = soundscape.toggle();
    setIsAudioOn(playing);
  }, []);

  // Enter the 3D gallery from Scene 01
  const handleEnterExperience = useCallback(() => {
    setHasEntered(true);
    setCurrentZ(7.5);
    // User interacted with page, safe to start sound if not already running
    if (!isAudioOn) {
      soundscape.play();
      setIsAudioOn(true);
    }
  }, [isAudioOn]);

  const handleSkipIntro = useCallback(() => {
    setHasEntered(true);
    setCurrentZ(7.5);
  }, []);

  // Open Project Details (Scene 03)
  const handleSelectProject = useCallback((project: Project) => {
    setSavedReturnZ(currentZ);
    setActiveProject(project);
    soundscape.triggerChime(1.2);
  }, [currentZ]);

  // Return to exact location in corridor
  const handleCloseProject = useCallback(() => {
    setActiveProject(null);
    setCurrentZ(savedReturnZ);
  }, [savedReturnZ]);

  // Jump from project page directly to booking room
  const handlePlanFromProject = useCallback(() => {
    setActiveProject(null);
    setCurrentZ(-71.0);
    setIsInLounge(true);
  }, []);

  // Jump directly to a project from Menu Directory
  const handleJumpToProject = useCallback((project: Project) => {
    // Position camera just slightly in front of the artwork
    setCurrentZ(project.wallZ + 3.8);
    setIsInLounge(false);
  }, []);

  // Jump directly to the Booking Lounge
  const handleJumpToBooking = useCallback(() => {
    setCurrentZ(-71.0);
    setIsInLounge(true);
  }, []);

  // Return to corridor from Lounge
  const handleBackToCorridorFromLounge = useCallback(() => {
    setIsInLounge(false);
    setCurrentZ(-52.0); // Right before project 08
  }, []);

  // Find nearest project based on camera Z
  const nearestProject: Project | null = useMemo(() => {
    if (currentZ < -62) return null;
    let closest: Project | null = null;
    let minDistance = 999;
    EXHIBITION_PROJECTS.forEach((proj) => {
      const dist = Math.abs(proj.wallZ - currentZ);
      if (dist < minDistance && dist < 7.0) {
        minDistance = dist;
        closest = proj;
      }
    });
    return closest;
  }, [currentZ]);

  const hoveredProject = useMemo(() => {
    return EXHIBITION_PROJECTS.find((p) => p.id === hoveredProjectId) || null;
  }, [hoveredProjectId]);

  // Stepper navigation
  const handleNavigateNext = useCallback(() => {
    // Find next project with wallZ < currentZ
    const nextProj = EXHIBITION_PROJECTS.find((p) => p.wallZ < currentZ - 2.0);
    if (nextProj) {
      setCurrentZ(nextProj.wallZ + 3.5);
      setIsInLounge(false);
    } else {
      // Reached end, enter lounge
      setCurrentZ(-71.0);
      setIsInLounge(true);
    }
  }, [currentZ]);

  const handleNavigatePrev = useCallback(() => {
    // Find previous project with wallZ > currentZ
    const reversed = [...EXHIBITION_PROJECTS].reverse();
    const prevProj = reversed.find((p) => p.wallZ > currentZ + 2.0);
    if (prevProj) {
      setCurrentZ(prevProj.wallZ + 3.5);
      setIsInLounge(false);
    } else {
      setCurrentZ(7.5);
      setIsInLounge(false);
    }
  }, [currentZ]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#F3F0E9] font-sans-clean select-none">
      {/* 1. SCENE 01: THE ENTRANCE SCREEN */}
      {!hasEntered && (
        <EntranceScreen
          onEnter={handleEnterExperience}
          onSkip={handleSkipIntro}
          onToggleAudio={handleToggleAudio}
          isAudioOn={isAudioOn}
        />
      )}

      {/* 2. SCENE 02: 3D EXHIBITION CORRIDOR CANVAS */}
      <ThreeCorridor
        currentZ={currentZ}
        onZChange={setCurrentZ}
        onSelectProject={handleSelectProject}
        activeProject={activeProject}
        isInLounge={isInLounge}
        onEnterLounge={() => setIsInLounge(true)}
        hoveredProjectId={hoveredProjectId}
        onHoverProject={setHoveredProjectId}
      />

      {/* 3. SCENE 04: THE BOOKING LOUNGE OVERLAY (When in Lounge) */}
      {isInLounge && hasEntered && !activeProject && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-[#F3F0E9]/90 backdrop-blur-md transition-all duration-700 animate-fadeIn">
          <BookingLoungeOverlay onBackToCorridor={handleBackToCorridorFromLounge} />
        </div>
      )}

      {/* 4. SCENE 03: PROJECT DETAIL VIEW MODAL */}
      {activeProject && (
        <ProjectDetailModal
          project={activeProject}
          onClose={handleCloseProject}
          onPlanEvent={handlePlanFromProject}
        />
      )}

      {/* 5. HUD CONTROLS & NAVIGATION */}
      {hasEntered && !activeProject && (
        <GalleryHUD
          currentZ={currentZ}
          nearestProject={nearestProject}
          onOpenMenu={() => setIsMenuOpen(true)}
          onToggleAudio={handleToggleAudio}
          isAudioOn={isAudioOn}
          onJumpToBooking={handleJumpToBooking}
          onNavigateNext={handleNavigateNext}
          onNavigatePrev={handleNavigatePrev}
          hoveredProject={hoveredProject}
          isInLounge={isInLounge}
        />
      )}

      {/* 6. EXHIBITION DIRECTORY DRAWER */}
      <GalleryIndexDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onJumpToProject={handleJumpToProject}
        onJumpToBooking={handleJumpToBooking}
        currentProjectId={(nearestProject as Project | null)?.id ?? null}
      />

      {/* 7. OPTIONAL STREAM / FALLBACK MODE FOR ACCESSIBILITY */}
      {isStreamMode && (
        <MobileGalleryFallback
          onSelectProject={(proj) => {
            setActiveProject(proj);
          }}
          onGoToBooking={handleJumpToBooking}
          onSwitchTo3D={() => setIsStreamMode(false)}
        />
      )}
    </div>
  );
};

export default App;
