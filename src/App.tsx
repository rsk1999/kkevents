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
  // Spline Progress u: 0.04 (entrance) to 0.96 (booking lounge)
  const [currentProgress, setCurrentProgress] = useState(0.04);
  const [savedReturnProgress, setSavedReturnProgress] = useState(0.04);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isInLounge, setIsInLounge] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [isStreamMode, setIsStreamMode] = useState(false);
  const [isAutoTouring, setIsAutoTouring] = useState(false);

  // Toggle ambient audio
  const handleToggleAudio = useCallback(() => {
    const playing = soundscape.toggle();
    setIsAudioOn(playing);
  }, []);

  // Enter the 3D gallery from Scene 01
  const handleEnterExperience = useCallback(() => {
    setHasEntered(true);
    setCurrentProgress(0.07);
    if (!isAudioOn) {
      soundscape.play();
      setIsAudioOn(true);
    }
  }, [isAudioOn]);

  const handleSkipIntro = useCallback(() => {
    setHasEntered(true);
    setCurrentProgress(0.07);
  }, []);

  // Open Project Details (Scene 03)
  const handleSelectProject = useCallback((project: Project) => {
    setSavedReturnProgress(currentProgress);
    setActiveProject(project);
    soundscape.triggerChime(1.2);
  }, [currentProgress]);

  // Return to exact location on curved spline
  const handleCloseProject = useCallback(() => {
    setActiveProject(null);
    setCurrentProgress(savedReturnProgress);
  }, [savedReturnProgress]);

  // Jump from project page directly to booking room
  const handlePlanFromProject = useCallback(() => {
    setActiveProject(null);
    setCurrentProgress(0.95);
    setIsInLounge(true);
  }, []);

  // Jump directly to a project from Menu Directory along the curve
  const handleJumpToProject = useCallback((project: Project) => {
    // Position camera slightly ahead of the artwork on the curve
    setCurrentProgress(Math.max(0.04, project.pathU - 0.03));
    setIsInLounge(false);
  }, []);

  // Jump directly to the Booking Lounge
  const handleJumpToBooking = useCallback(() => {
    setCurrentProgress(0.95);
    setIsInLounge(true);
  }, []);

  // Enter Lounge
  const handleEnterLounge = useCallback(() => {
    setIsInLounge(true);
  }, []);

  // Return to corridor from Lounge
  const handleBackToCorridorFromLounge = useCallback(() => {
    setIsInLounge(false);
    setCurrentProgress(0.85); // Right in front of project 08
  }, []);

  // Find nearest project based on spline progress u
  const nearestProject: Project | null = useMemo(() => {
    if (currentProgress >= 0.92) return null;
    let closest: Project | null = null;
    let minDistance = 999;
    EXHIBITION_PROJECTS.forEach((proj) => {
      const dist = Math.abs(proj.pathU - currentProgress);
      if (dist < minDistance && dist < 0.08) {
        minDistance = dist;
        closest = proj;
      }
    });
    return closest;
  }, [currentProgress]);

  const hoveredProject = useMemo(() => {
    return EXHIBITION_PROJECTS.find((p) => p.id === hoveredProjectId) || null;
  }, [hoveredProjectId]);

  // Stepper navigation along the curved spline
  const handleNavigateNext = useCallback(() => {
    const nextProj = EXHIBITION_PROJECTS.find((p) => p.pathU > currentProgress + 0.035);
    if (nextProj) {
      setCurrentProgress(Math.max(0.04, nextProj.pathU - 0.025));
      setIsInLounge(false);
    } else {
      setCurrentProgress(0.95);
      setIsInLounge(true);
    }
  }, [currentProgress]);

  const handleNavigatePrev = useCallback(() => {
    const reversed = [...EXHIBITION_PROJECTS].reverse();
    const prevProj = reversed.find((p) => p.pathU < currentProgress - 0.035);
    if (prevProj) {
      setCurrentProgress(Math.max(0.04, prevProj.pathU - 0.025));
      setIsInLounge(false);
    } else {
      setCurrentProgress(0.06);
      setIsInLounge(false);
    }
  }, [currentProgress]);

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

      {/* 2. SCENE 02: 3D CURVED EXHIBITION CORRIDOR CANVAS */}
      <ThreeCorridor
        currentProgress={currentProgress}
        onProgressChange={setCurrentProgress}
        onSelectProject={handleSelectProject}
        activeProject={activeProject}
        isInLounge={isInLounge}
        onEnterLounge={handleEnterLounge}
        hoveredProjectId={hoveredProjectId}
        onHoverProject={setHoveredProjectId}
        isAutoTouring={isAutoTouring}
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
          currentProgress={currentProgress}
          nearestProject={nearestProject}
          onOpenMenu={() => setIsMenuOpen(true)}
          onToggleAudio={handleToggleAudio}
          isAudioOn={isAudioOn}
          onJumpToBooking={handleJumpToBooking}
          onNavigateNext={handleNavigateNext}
          onNavigatePrev={handleNavigatePrev}
          hoveredProject={hoveredProject}
          isInLounge={isInLounge}
          isAutoTouring={isAutoTouring}
          onToggleAutoTour={() => setIsAutoTouring(!isAutoTouring)}
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
