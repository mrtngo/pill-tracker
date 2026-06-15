import React, { useState, useEffect, useRef } from 'react';

export default function DashboardPet({ isTakenToday, isDue }) {
  const [isTilted, setIsTilted] = useState(false);
  const [isNight] = useState(() => {
    const hour = new Date().getHours();
    return hour >= 19 || hour < 6;
  });

  const [positionX, setPositionX] = useState(75); // Default more to the right
  const [facingRight, setFacingRight] = useState(false); // Face left (towards card center) by default
  const [isWalking, setIsWalking] = useState(false);
  const [walkDuration, setWalkDuration] = useState(0);
  const [isNapping, setIsNapping] = useState(false);
  const [isTempAwake, setIsTempAwake] = useState(false); // Temporarily wake up when asleep (dose taken)

  const positionXRef = useRef(75);
  const timerRef = useRef(null);
  const walkTimeoutRef = useRef(null);
  const napTimerRef = useRef(null);

  const dogState = isTakenToday ? 'asleep' : (isDue ? 'waiting' : 'awake');
  const isSleeping = (isTakenToday && !isTempAwake) || (!isTakenToday && isNapping);

  // Walk trigger functions (hoisted so they can reference each other cleanly)
  function rescheduleWalk() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (isTakenToday) return; // Do not schedule automatic walks if dose is completed

    // Schedule next walk after a random delay between 8 and 18 seconds
    const delay = Math.random() * 10000 + 8000;
    timerRef.current = setTimeout(() => {
      triggerWalk();
    }, delay);
  }

  function triggerWalk() {
    if (isTakenToday && !isTempAwake) return; // Only walk if awake

    const currentPos = positionXRef.current;
    // Choose a random position between 15% and 85% of card width
    let targetX = Math.floor(Math.random() * 70) + 15;
    let distance = Math.abs(targetX - currentPos);
    
    // Ensure the target is far enough from Doggo's current spot
    let attempts = 0;
    while (distance < 15 && attempts < 5) {
      targetX = Math.floor(Math.random() * 70) + 15;
      distance = Math.abs(targetX - currentPos);
      attempts++;
    }

    const speed = 12; // 12% of card width per second
    const duration = distance / speed;

    // Wake up if napping
    setIsNapping(false);

    setFacingRight(targetX > currentPos);
    setWalkDuration(duration);
    setIsWalking(true);
    
    positionXRef.current = targetX;
    setPositionX(targetX);

    if (walkTimeoutRef.current) {
      clearTimeout(walkTimeoutRef.current);
    }
    walkTimeoutRef.current = setTimeout(() => {
      setIsWalking(false);
      // Reschedule the next random walk
      rescheduleWalk();
    }, duration * 1000);
  }

  // Walk scheduling effect
  useEffect(() => {
    if (isTakenToday) {
      setIsWalking(false);
      setIsTempAwake(false); // Reset temp awake when pill completed
      return;
    }

    // Schedule the first walk
    rescheduleWalk();

    return () => {
      clearTimeout(timerRef.current);
      if (walkTimeoutRef.current) {
        clearTimeout(walkTimeoutRef.current);
      }
    };
  }, [isTakenToday]);

  // Sleep scheduler effect (handles both napping when awake, and temp-awake timeout when asleep)
  useEffect(() => {
    if (isWalking) {
      if (napTimerRef.current) {
        clearTimeout(napTimerRef.current);
      }
      return;
    }

    // Schedule sleeping/napping after 6 seconds of idleness
    napTimerRef.current = setTimeout(() => {
      if (isWalking) return;
      if (isTakenToday) {
        setIsTempAwake(false);
      } else {
        setIsNapping(true);
      }
    }, 6000);

    return () => {
      if (napTimerRef.current) {
        clearTimeout(napTimerRef.current);
      }
    };
  }, [isWalking, isTakenToday]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (walkTimeoutRef.current) clearTimeout(walkTimeoutRef.current);
      if (napTimerRef.current) clearTimeout(napTimerRef.current);
    };
  }, []);

  const handleDogClick = () => {
    if (isSleeping) {
      // Wake up from sleep/nap
      if (isTakenToday) {
        setIsTempAwake(true);
      } else {
        setIsNapping(false);
      }
      
      // Wobble head
      setIsTilted(true);
      setTimeout(() => setIsTilted(false), 1200);
      return;
    }

    // If already awake: make him walk!
    if (!isWalking) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      triggerWalk();
    }
  };

  return (
    <div className={`dog-container-wrapper ${isWalking ? 'walking' : ''}`} style={{
      position: 'absolute',
      bottom: '-3px', // Rest exactly on top of the card bottom border
      left: `${positionX}%`,
      transform: 'translateX(-50%)',
      transition: isWalking ? `left ${walkDuration}s linear` : 'none',
      width: '64px',
      height: '64px',
      zIndex: 20,
      cursor: 'pointer',
      userSelect: 'none'
    }} onClick={handleDogClick}>
      
      {/* Dog SVG */}
      <svg 
        viewBox="126 112 52 60" 
        style={{ 
          width: '100%', 
          height: '100%', 
          overflow: 'visible',
          transform: `scaleX(${isSleeping ? 1 : (facingRight ? 1 : -1)})`,
          transition: 'transform 0.3s ease'
        }}
      >
        {isSleeping ? (
          <g>
            {/* Sleeping/Napping Dog Group */}
            <g transform="translate(152, 165)">
              <g className="dog-sleeping">
                {/* Curled Body (Black back, white chest) */}
                <path d="M -14 -6 C -18 -16, 14 -16, 15 -6 C 16 0, -10 2, -14 -6 Z" fill="#1e1e1e" />
                
                {/* White Chest / Collar wrapped around neck */}
                <path d="M -11 -11 C -6 -13, -2 -10, -5 -5 C -8 -2, -12 -5, -11 -11 Z" fill="#ffffff" />
                
                {/* Tail wrapped around (black with white tip) */}
                <path d="M 11 -7 C 15 -8, 14 0, 7.5 -1 C 4 -1, 10 -6, 11 -7 Z" fill="#1e1e1e" />
                <path d="M 8 -1 C 5 -1, 4 0, 6.5 -0.5 Z" fill="#ffffff" />
                
                {/* Head curled down/resting */}
                <g transform="translate(-10, -8)">
                  <circle cx="0" cy="0" r="5" fill="#1e1e1e" />
                  {/* White face blaze */}
                  <path d="M -1.5 -5 L 1.5 -5 L 1 -1 Q 0 1 -1 -1 Z" fill="#ffffff" />
                  {/* Pointy Muzzle (white) */}
                  <path d="M -1.2 0.8 Q 1 3 1 3 Q 1 3 3.2 0.8 Q 1 -0.5 -1.2 0.8 Z" fill="#ffffff" />
                  {/* Nose (black) */}
                  <circle cx="1" cy="2.3" r="0.65" fill="#1e1e1e" />
                  
                  {/* Closed eyes */}
                  <path d="M -2.5 -1.5 Q -1.5 -0.5 -0.5 -1.5" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" fill="none" />
                  <path d="M 1.5 -1.5 Q 2.5 -0.5 3.5 -1.5" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" fill="none" />
                  
                  {/* Ears flat/sleeping */}
                  <path d="M -4 -3 Q -7 -5 -6 -1 Q -5 2 -3 -1" fill="#1e1e1e" />
                  <path d="M 4 -3 Q 7 -5 6 -1 Q 5 2 3 -1" fill="#1e1e1e" />
                </g>
              </g>
            </g>

            {/* Floating zZZ text particles */}
            <text x="0" y="0" className="zzz-particle zzz-1">z</text>
            <text x="0" y="0" className="zzz-particle zzz-2">Z</text>
            <text x="0" y="0" className="zzz-particle zzz-3">Z</text>
          </g>
        ) : isWalking ? (
          /* Running/Walking Profile Dog (4 legs) */
          <g transform="translate(152, 165)">
            {/* Background Legs (drawn behind body) */}
            <g className="dog-run-hind-right">
              <rect x="-10" y="-8" width="3" height="9" rx="1.5" fill="#151515" />
              <ellipse cx="-8.5" cy="1" rx="2.2" ry="1.2" fill="#e5e5e5" />
            </g>
            <g className="dog-run-front-right">
              <rect x="6" y="-8" width="3" height="9" rx="1.5" fill="#151515" />
              <ellipse cx="7.5" cy="1" rx="2.2" ry="1.2" fill="#e5e5e5" />
            </g>

            {/* Bobbing Body Group */}
            <g className="dog-running-body">
              {/* Tail extended behind */}
              <g className="dog-running-tail">
                <path d="M -14 -13 Q -20 -17 -27 -15 Q -21 -8 -14 -11 Z" fill="#1e1e1e" />
                <path d="M -23 -12.5 Q -25.5 -14.5 -27 -15 Q -22.5 -9.5 -21 -10.5 Z" fill="#ffffff" /> {/* Pointy white tip */}
              </g>

              {/* Unified Body & Neck (black) */}
              <path d="M -13 -6 C -16 -10 -15 -15 -15 -15 Q 0 -19 6 -16 L 10 -24 Q 13 -26 15 -22 L 11 -12 Q 14 -10 11 -5 Q -3 -4 -13 -6 Z" fill="#1e1e1e" />
              
              {/* Chest & Throat (white) */}
              <path d="M 10 -23 L 13 -22 Q 13 -18 11 -11 L 8 -5 Q 4 -10 3 -16 Q 7 -18 10 -23 Z" fill="#ffffff" />

              {/* Head Group */}
              <g transform="translate(13, -25)">
                {/* Head base */}
                <circle cx="0" cy="0" r="5.5" fill="#1e1e1e" />
                {/* Face blaze */}
                <path d="M -3 -5 Q 0 -3 2 -4 L 0 -1 Z" fill="#ffffff" />
                {/* Muzzle (white) */}
                <ellipse cx="4" cy="1" rx="3.5" ry="2.5" fill="#ffffff" />
                {/* Nose (black) */}
                <circle cx="7.5" cy="0.5" r="0.8" fill="#1e1e1e" />

                {/* Eye */}
                <circle cx="1" cy="-1.5" r="0.9" fill="#8b5a2b" />
                <circle cx="1.2" cy="-1.7" r="0.4" fill="#ffffff" />
                {/* Ears */}
                {/* Background ear */}
                <path d="M -3 -3 L -7 -9 L -2 -6 Z" fill="#121212" />
                {/* Foreground ear */}
                <path d="M -1 -4 L -3 -11 L 1 -7 Z" fill="#1e1e1e" />
                <path d="M -0.8 -4.5 L -2.2 -9.5 L 0.5 -7.5 Z" fill="#ffc0cb" opacity="0.3" />
              </g>
            </g>

            {/* Foreground Legs (drawn in front of body) */}
            <g className="dog-run-hind-left">
              <rect x="-14" y="-8" width="3" height="9" rx="1.5" fill="#1e1e1e" />
              <ellipse cx="-12.5" cy="1" rx="2.2" ry="1.2" fill="#ffffff" />
            </g>
            <g className="dog-run-front-left">
              <rect x="10" y="-8" width="3" height="9" rx="1.5" fill="#1e1e1e" />
              <ellipse cx="11.5" cy="1" rx="2.2" ry="1.2" fill="#ffffff" />
            </g>
          </g>
        ) : (
          /* Sitting Dog (Awake & Waiting states) */
          <g transform="translate(152, 165)">
            <g className="dog-sitting">
              {/* Tail (animated wagging in Awake state) */}
              <g className={(dogState === 'awake' || isTakenToday) ? "dog-tail-wag" : ""}>
                <path d="M 10 -4 Q 14 -12 18 -12 Q 13 -2 10 -4 Z" fill="#1e1e1e" />
                <path d="M 15 -9 Q 16.5 -11 18 -12 Q 15.5 -5 14 -7 Z" fill="#ffffff" /> {/* Pointy white tip */}
              </g>
              
              {/* Back/Hind leg */}
              <g className="dog-hind-leg">
                <path d="M -8 -4 Q -16 -6 -10 -18 Q -4 -16 -8 -4" fill="#1e1e1e" />
              </g>
              
              {/* Body/Back (black) */}
              <path d="M -10 -18 Q -12 -30 -4 -30 L 4 -30 Q 8 -24 6 -4 L -8 -4 Z" fill="#1e1e1e" />
              
              {/* Chest/Collar (white) */}
              <path d="M -6 -28 Q 0 -24 6 -28 Q 8 -16 0 -10 Q -8 -16 -6 -28 Z" fill="#ffffff" />
              
              {/* Front Legs (black with white paws) */}
              {/* Left Front Leg */}
              <g className="dog-front-leg-left">
                <rect x="-6" y="-16" width="3" height="16" rx="1.5" fill="#1e1e1e" />
                <ellipse cx="-4.5" cy="0" rx="2.5" ry="1.5" fill="#ffffff" />
              </g>
              {/* Right Front Leg */}
              <g className="dog-front-leg-right">
                <rect x="3" y="-16" width="3" height="16" rx="1.5" fill="#1e1e1e" />
                <ellipse cx="4.5" cy="0" rx="2.5" ry="1.5" fill="#ffffff" />
              </g>
              
              {/* Head Group (can wobble or tilt on tap) */}
              <g className={`dog-head-group ${isTilted ? 'tilted' : ''}`}>
                {/* Neck */}
                <path d="M -4 -28 L 4 -28 L 2 -32 L -2 -32 Z" fill="#ffffff" />
                
                {/* Head Base (black, tapered Collie shape) */}
                <path d="M -6.5 -35 Q 0 -42.5 6.5 -35 Q 6.5 -30 3.2 -28.5 L -3.2 -28.5 Q -6.5 -30 -6.5 -35 Z" fill="#1e1e1e" />
                
                {/* Face White Blaze (white stripe) */}
                <path d="M -2.5 -42 Q 0 -38 0 -33 Q 0 -38 2.5 -42 Q 1.5 -31 0 -29 Q -1.5 -31 -2.5 -42 Z" fill="#ffffff" />
                
                {/* Pointy Muzzle (white) */}
                <path d="M -4.5 -34 C -4.5 -31, -2.5 -29.2, 0 -29.2 C 2.5 -29.2, 4.5 -31, 4.5 -34 Q 0 -36 -4.5 -34 Z" fill="#ffffff" />
                {/* Nose (black, pointy) */}
                <polygon points="-1,-32 1,-32 0,-30.2" fill="#1e1e1e" />
                <line x1="0" y1="-30.2" x2="0" y2="-29.3" stroke="#1e1e1e" strokeWidth="0.5" />
                <path d="M -1 -29.3 Q 0 -28.7 0 -29.3 Q 0 -28.7 1 -29.3" stroke="#1e1e1e" strokeWidth="0.5" fill="none" />
                
                {/* Eyes */}
                {/* Left Eye */}
                <circle cx="-3" cy="-36.5" r="1.2" fill="#8b5a2b" /> {/* Brown iris */}
                <circle cx="-3" cy="-36.5" r="0.6" fill="#000000" />
                <circle cx="-3.3" cy="-36.8" r="0.3" fill="#ffffff" />
                {/* Right Eye */}
                <circle cx="3" cy="-36.5" r="1.2" fill="#8b5a2b" />
                <circle cx="3" cy="-36.5" r="0.6" fill="#000000" />
                <circle cx="3.3" cy="-36.8" r="0.3" fill="#ffffff" />
                
                {/* Ears (Alert state vs folded state) */}
                {/* Left Ear */}
                <g style={{
                  transformOrigin: '-5px -39px',
                  transform: dogState === 'waiting' ? 'rotate(-25deg) translate(-1px, 1px)' : 'none',
                  transition: 'transform 0.3s ease'
                }}>
                  <path d="M -5 -39 L -10 -48 L -1 -41 Z" fill="#1e1e1e" />
                  <path d="M -4 -40 L -8 -46 L -2 -41 Z" fill="#ffc0cb" opacity="0.3" />
                </g>
                {/* Right Ear */}
                <g style={{
                  transformOrigin: '5px -39px',
                  transform: dogState === 'waiting' ? 'rotate(25deg) translate(1px, 1px)' : 'none',
                  transition: 'transform 0.3s ease'
                }}>
                  <path d="M 5 -39 L 10 -48 L 1 -41 Z" fill="#1e1e1e" />
                  <path d="M 4 -40 L 8 -46 L 2 -41 Z" fill="#ffc0cb" opacity="0.3" />
                </g>
              </g>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
