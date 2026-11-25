import React, { useState, useCallback, useMemo } from 'react';
import { ThreeCorridor } from './components/ThreeCorridor';
import { EntranceScreen } from './components/EntranceScreen';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { ProjectPreviewPanel } from './components/ProjectPreviewPanel';
import { BookingLoungeOverlay } from './components/BookingLoungeOverlay';
import { GalleryHUD } from './components/GalleryHUD';
import { GalleryIndexDrawer } from './components/GalleryIndexDrawer';
import { MobileGalleryFallback } from './components/MobileGalleryFallback';
import { EXHIBITION_PROJECTS } from './data/projects';
import type { Project } from './types';

export const App: React.FC = () => {
  const [hasEntered, setHasEntered] = useState(false);
  // Spline Progress u: 0.04 (entrance) to 0.96 (booking lounge)
  const [currentProgress, setCurrentProgress] = useState(0.04);
  const [savedReturnProgress, setSavedReturnProgress] = useState(0.04);
  // Two-Step Interaction States:
  // Step 1: Selected Frame (preview panel open, frame highlighted, camera focused)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  // Step 2: Open Project Modal (full case study view)
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isInLounge, setIsInLounge] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [isStreamMode, setIsStreamMode] = useState(false);
  const [isAutoTouring, setIsAutoTouring] = useState(false);

  // Enter the 3D gallery from Scene 01
  const handleEnterExperience = useCallback(() => {
    setHasEntered(true);
    setCurrentProgress(0.07);
  }, []);

  const handleSkipIntro = useCallback(() => {
    setHasEntered(true);
    setCurrentProgress(0.07);
  }, []);

  // STEP 1 & STEP 2 INTENTIONAL TAP HANDLER:
  // First tap selects frame and shows preview.
  // Second tap on the same selected frame opens the full project!
  const handleFrameTap = useCallback((project: Project) => {
    if (selectedProject?.id === project.id) {
      // Step 2: Second intentional tap on already-selected frame -> Open full project modal!
      setSavedReturnProgress(currentProgress);
      setActiveProject(project);
      setSelectedProject(null);
    } else {
      // Step 1: First intentional tap -> Select frame & display preview
      setSelectedProject(project);
    }
  }, [selectedProject, currentProgress]);

  // Tap on background / empty corridor space -> Deselect & close preview
  const handleBackgroundTap = useCallback(() => {
    if (selectedProject) {
      setSelectedProject(null);
    }
  }, [selectedProject]);

  // STEP 2 ALTERNATIVE: Tap "VIEW PROJECT" inside Preview Panel
  const handleViewProjectFromPreview = useCallback((project: Project) => {
    setSavedReturnProgress(currentProgress);
    setActiveProject(project);
    setSelectedProject(null);
  }, [currentProgress]);

  // Close preview panel
  const handleClosePreview = useCallback(() => {
    setSelectedProject(null);
  }, []);

  // Return to exact location on curved spline when closing full modal
  const handleCloseProject = useCallback(() => {
    setActiveProject(null);
    setSelectedProject(null);
    setCurrentProgress(savedReturnProgress);
  }, [savedReturnProgress]);

  // Jump from project page directly to booking room
  const handlePlanFromProject = useCallback(() => {
    setActiveProject(null);
    setSelectedProject(null);
    setCurrentProgress(0.95);
    setIsInLounge(true);
  }, []);

  // Jump directly to a project from Menu Directory along the curve
  const handleJumpToProject = useCallback((project: Project) => {
    setCurrentProgress(Math.max(0.04, project.pathU - 0.03));
    setSelectedProject(project); // Select the frame when navigated from directory
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
        />
      )}

      {/* 2. SCENE 02: 3D CURVED EXHIBITION CORRIDOR CANVAS */}
      <ThreeCorridor
        currentProgress={currentProgress}
        onProgressChange={setCurrentProgress}
        onFrameTap={handleFrameTap}
        onBackgroundTap={handleBackgroundTap}
        selectedProjectId={selectedProject?.id ?? null}
        activeProject={activeProject}
        isInLounge={isInLounge}
        onEnterLounge={handleEnterLounge}
        hoveredProjectId={hoveredProjectId}
        onHoverProject={setHoveredProjectId}
        isAutoTouring={isAutoTouring}
      />

      {/* 3. HUD CONTROLS & NAVIGATION (Active only during corridor exploration) */}
      {hasEntered && !activeProject && !isInLounge && (
        <GalleryHUD
          currentProgress={currentProgress}
          nearestProject={nearestProject}
          selectedProject={selectedProject}
          onOpenMenu={() => setIsMenuOpen(true)}
          onJumpToBooking={handleJumpToBooking}
          onNavigateNext={handleNavigateNext}
          onNavigatePrev={handleNavigatePrev}
          isInLounge={isInLounge}
          isAutoTouring={isAutoTouring}
          onToggleAutoTour={() => setIsAutoTouring(!isAutoTouring)}
        />
      )}

      {/* 4. STEP 1: PREVIEW PANEL (When a frame is selected, displayed prominently above HUD) */}
      {selectedProject && !activeProject && !isInLounge && (
        <ProjectPreviewPanel
          project={selectedProject}
          onViewProject={handleViewProjectFromPreview}
          onClose={handleClosePreview}
        />
      )}

      {/* 5. SCENE 04: THE BOOKING LOUNGE OVERLAY (When in Lounge) */}
      {isInLounge && hasEntered && !activeProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F3F0E9]/95 backdrop-blur-md transition-all duration-700 animate-fadeIn pointer-events-auto">
          <BookingLoungeOverlay onBackToCorridor={handleBackToCorridorFromLounge} />
        </div>
      )}

      {/* 6. SCENE 03: PROJECT DETAIL VIEW MODAL (Step 2: Full View) */}
      {activeProject && (
        <ProjectDetailModal
          project={activeProject}
          onClose={handleCloseProject}
          onPlanEvent={handlePlanFromProject}
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
