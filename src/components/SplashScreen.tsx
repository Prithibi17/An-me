import React, { useEffect, useState, useRef } from 'react';
import splashLogo from '../assets/splash/splash-logo.png';
import cardBlue from '../assets/splash/card-blue.png';
import cardPink from '../assets/splash/card-pink.png';
import cardRed from '../assets/splash/card-red.png';
import bracketLeft from '../assets/splash/bracket-left.png';
import bracketRight from '../assets/splash/bracket-right.png';
import dashedPlaceholder from '../assets/splash/dashed-placeholder.png';

interface SplashScreenProps {
  isLoading: boolean;
  onFinished?: () => void;
}

export function SplashScreen({ isLoading, onFinished }: SplashScreenProps) {
  // Card animation phase:
  // 0: Reset / dashed slots ready
  // 1: Card 1 (Blue) slides in
  // 2: Card 2 (Pink) pops into center
  // 3: Card 3 (Red) completes the triad
  // 4: Full glow hold state (all 3 cards illuminated with master artwork match)
  // 5: Dissolve wave resetting for next loop
  const [cardPhase, setCardPhase] = useState<number>(1);
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [activeDotIndex, setActiveDotIndex] = useState<number>(0);
  const [isExiting, setIsExiting] = useState<boolean>(false);

  // Keep a ref to isLoading so loop closures always have the latest value
  const isLoadingRef = useRef(isLoading);
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // Dot rhythm cycle
  useEffect(() => {
    const dotTimer = setInterval(() => {
      setActiveDotIndex((prev) => (prev + 1) % 3);
    }, 400);
    return () => clearInterval(dotTimer);
  }, []);

  // Continuous Card Animation Loop:
  // Repeats continuously until isLoading is false AND at least 1 full triad has completed!
  useEffect(() => {
    let isCancelled = false;
    let timerIds: NodeJS.Timeout[] = [];

    const clearAllTimers = () => {
      timerIds.forEach(clearTimeout);
      timerIds = [];
    };

    const runCycle = () => {
      if (isCancelled) return;

      // Start cycle: Phase 1 (Blue card slides in)
      setCardPhase(1);

      // Phase 2: Pink card pops into center (at 500ms)
      timerIds.push(
        setTimeout(() => {
          if (!isCancelled) setCardPhase(2);
        }, 500)
      );

      // Phase 3: Red card completes the triad (at 1000ms)
      timerIds.push(
        setTimeout(() => {
          if (!isCancelled) setCardPhase(3);
        }, 1000)
      );

      // Phase 4: Full glowing state (at 1500ms)
      timerIds.push(
        setTimeout(() => {
          if (!isCancelled) {
            setCardPhase(4);
            setCycleCount((c) => c + 1);

            // Check if loading has finished
            if (!isLoadingRef.current) {
              // Hold the completed triad state briefly (700ms) so user sees the finished set, then exit
              timerIds.push(
                setTimeout(() => {
                  if (!isCancelled) {
                    setIsExiting(true);
                  }
                }, 700)
              );
              return;
            }

            // Still loading: hold full glow for 1200ms, then trigger dissolve wave to repeat loop
            timerIds.push(
              setTimeout(() => {
                if (isCancelled) return;

                if (!isLoadingRef.current) {
                  setIsExiting(true);
                  return;
                }

                // Phase 5: Soft fade-out wave
                setCardPhase(5);

                // Phase 0: Reset (after 350ms), then start next cycle
                timerIds.push(
                  setTimeout(() => {
                    if (isCancelled) return;
                    if (!isLoadingRef.current) {
                      setIsExiting(true);
                      return;
                    }
                    setCardPhase(0);
                    // Next cycle after 150ms reset
                    timerIds.push(
                      setTimeout(() => {
                        if (!isCancelled) runCycle();
                      }, 150)
                    );
                  }, 350)
                );
              }, 1200)
            );
          }
        }, 1500)
      );
    };

    runCycle();

    return () => {
      isCancelled = true;
      clearAllTimers();
    };
  }, []);

  // Exit trigger when loading finishes and we're in phase 4
  useEffect(() => {
    if (!isLoading && cycleCount >= 1 && cardPhase === 4 && !isExiting) {
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, 500);
      return () => clearTimeout(exitTimer);
    }
  }, [isLoading, cycleCount, cardPhase, isExiting]);

  // Handle exit transition finish
  useEffect(() => {
    if (isExiting) {
      const finishTimer = setTimeout(() => {
        if (onFinished) onFinished();
      }, 700);
      return () => clearTimeout(finishTimer);
    }
  }, [isExiting, onFinished]);

  const handleSkip = () => {
    if (!isExiting) {
      setIsExiting(true);
      setTimeout(() => {
        if (onFinished) onFinished();
      }, 350);
    }
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#000008] select-none cursor-default transition-all duration-700 ease-out ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient breathing neon aura */}
      <div
        className={`absolute w-[540px] h-[380px] rounded-full blur-[130px] pointer-events-none transition-all duration-1000 ${
          cardPhase >= 1
            ? 'opacity-40 bg-gradient-to-r from-cyan-500/25 via-pink-600/35 to-rose-600/30 scale-105'
            : 'opacity-20 bg-gradient-to-r from-cyan-500/15 via-pink-600/20 to-rose-600/15 scale-95'
        }`}
      />

      {/* 1024x576 Coordinate Aspect Ratio Container */}
      <div className="relative w-full max-w-[860px] aspect-[1024/576] flex items-center justify-center overflow-hidden">
        {/* Step 1 & 2: Central Logo */}
        <div
          style={{
            position: 'absolute',
            left: '41.01%',
            top: '19.10%',
            width: '18.07%',
            height: '19.44%',
          }}
          className="transition-all duration-700 transform opacity-100 translate-y-0 scale-100"
        >
          <img
            src={splashLogo}
            alt="An:me Logo"
            className="w-full h-full object-contain drop-shadow-[0_0_22px_rgba(236,72,153,0.75)]"
          />
        </div>

        {/* Step 2: Left Bracket Accent */}
        <div
          style={{
            position: 'absolute',
            left: '31.45%',
            top: '50.69%',
            width: '4.10%',
            height: '11.11%',
          }}
          className="transition-all duration-700 transform opacity-90 translate-x-0"
        >
          <img
            src={bracketLeft}
            alt="["
            className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.7)]"
          />
        </div>

        {/* Step 2: Right Bracket Accent */}
        <div
          style={{
            position: 'absolute',
            left: '64.06%',
            top: '50.69%',
            width: '4.10%',
            height: '11.11%',
          }}
          className="transition-all duration-700 transform opacity-90 translate-x-0"
        >
          <img
            src={bracketRight}
            alt="]"
            className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(244,63,94,0.7)]"
          />
        </div>


        {/* Dynamic Looping Cards Container */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Card 1: User's Blue Torii Card (Slot 1) */}
          <div
            style={{
              position: 'absolute',
              left: '35.74%',
              top: '43.75%',
              width: '9.67%',
              height: '25.69%',
              zIndex: 10,
            }}
            className="flex items-center justify-center"
          >
            {/* Dashed placeholder when card not yet entered */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
                cardPhase >= 1 && cardPhase <= 4 ? 'opacity-0' : 'opacity-40'
              }`}
            >
              <img
                src={dashedPlaceholder}
                alt=""
                className="w-full h-full object-contain"
              />
            </div>

            {/* Blue Card Image */}
            <div
              className={`w-full h-full transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) transform ${
                cardPhase >= 1 && cardPhase <= 4
                  ? 'opacity-100 translate-y-0 drop-shadow-[0_0_18px_rgba(56,189,248,0.7)]'
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <img
                src={cardBlue}
                alt="Blue Japanese Scenery"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Card 2: User's Pink Moon Torii Card (Slot 2 - Center Pop) */}
          <div
            style={{
              position: 'absolute',
              left: '44.92%',
              top: '43.40%',
              width: '10.06%',
              height: '26.74%',
              zIndex: 20,
            }}
            className="flex items-center justify-center"
          >
            {/* Dashed placeholder when card not yet entered */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
                cardPhase >= 2 && cardPhase <= 4 ? 'opacity-0' : 'opacity-40'
              }`}
            >
              <img
                src={dashedPlaceholder}
                alt=""
                className="w-full h-full object-contain"
              />
            </div>

            {/* Pink Card Image */}
            <div
              className={`w-full h-full transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) transform ${
                cardPhase >= 2 && cardPhase <= 4
                  ? 'opacity-100 translate-y-0 scale-105 drop-shadow-[0_0_24px_rgba(244,63,94,0.85)]'
                  : 'opacity-0 translate-y-10 scale-95'
              }`}
            >
              <img
                src={cardPink}
                alt="Pink Moon Torii"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Card 3: User's Red Fuji Sunset Card (Slot 3) */}
          <div
            style={{
              position: 'absolute',
              left: '53.71%',
              top: '44.10%',
              width: '9.86%',
              height: '26.39%',
              zIndex: 10,
            }}
            className="flex items-center justify-center"
          >
            {/* Dashed placeholder when card not yet entered */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
                cardPhase >= 3 && cardPhase <= 4 ? 'opacity-0' : 'opacity-40'
              }`}
            >
              <img
                src={dashedPlaceholder}
                alt=""
                className="w-full h-full object-contain"
              />
            </div>

            {/* Red Card Image */}
            <div
              className={`w-full h-full transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) transform ${
                cardPhase >= 3 && cardPhase <= 4
                  ? 'opacity-100 translate-y-0 drop-shadow-[0_0_18px_rgba(239,68,68,0.7)]'
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <img
                src={cardRed}
                alt="Red Sunset Fuji"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* 3 Progress Dots (Wave cycling in sync with card states) */}
        <div
          style={{
            position: 'absolute',
            left: '45.90%',
            top: '74.65%',
            width: '8.20%',
            height: '4.17%',
          }}
          className="flex items-center justify-between pointer-events-none"
        >
          {/* Dot 1 */}
          <div
            className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
              cardPhase === 4
                ? activeDotIndex === 0
                  ? 'bg-cyan-400 scale-135 shadow-[0_0_10px_rgba(56,189,248,1)]'
                  : 'bg-white/20 scale-100'
                : cardPhase === 1
                ? 'bg-cyan-400 scale-130 shadow-[0_0_8px_rgba(56,189,248,0.9)]'
                : 'bg-white/20'
            }`}
          />

          {/* Dot 2 */}
          <div
            className={`w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
              cardPhase === 4
                ? activeDotIndex === 1
                  ? 'bg-pink-500 scale-135 shadow-[0_0_12px_rgba(244,63,94,1)]'
                  : 'bg-white/20 scale-100'
                : cardPhase === 2
                ? 'bg-pink-500 scale-130 shadow-[0_0_10px_rgba(244,63,94,0.9)]'
                : 'bg-white/20'
            }`}
          />

          {/* Dot 3 */}
          <div
            className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
              cardPhase === 4
                ? activeDotIndex === 2
                  ? 'bg-rose-500 scale-135 shadow-[0_0_10px_rgba(244,63,94,1)]'
                  : 'bg-white/20 scale-100'
                : cardPhase >= 3
                ? 'bg-rose-500 scale-130 shadow-[0_0_8px_rgba(244,63,94,0.9)]'
                : 'bg-white/20'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
