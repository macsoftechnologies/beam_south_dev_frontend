import React from 'react';

export default function BodyMap({ data, view = 'front' }) {
  // Find count for a specific part
  const getCount = (partNames) => {
    if (!Array.isArray(partNames)) partNames = [partNames];
    let count = 0;
    partNames.forEach(name => {
      const p = data.find(d => d.part.toLowerCase() === name.toLowerCase());
      if (p) count += p.count;
    });
    return count;
  };

  const getColor = (count) => {
    if (count >= 5) return '#E32B50'; // High - Red
    if (count >= 3) return '#C07D10'; // Medium - Orange
    if (count >= 1) return '#7BBE97'; // Low - Green
    return 'var(--bg-dark, #EAE6DE)'; // Default neutral
  };

  const c = (names) => getColor(getCount(names));
  
  // Using transform to flip for back view
  const isBack = view === 'back';
  
  // For back view, the chest becomes upper back, abdomen becomes lower back, etc.
  const coreUpper = isBack ? c(['Upper Back', 'Back']) : c(['Chest', 'Torso']);
  const coreLower = isBack ? c(['Lower Back']) : c(['Lower Abdomen', 'Abdomen', 'Pelvis']);
  const headColor = c(['Head', 'Face']);
  const neckColor = c(['Neck']);
  
  const rArm = c(['R. Arm', 'Right Arm', 'R. Upper Arm']);
  const rForearm = c(['R. Forearm', 'Right Forearm']);
  const rHand = c(['R. Hand', 'Right Hand']);
  
  const lArm = c(['L. Arm', 'Left Arm', 'L. Upper Arm']);
  const lForearm = c(['L. Forearm', 'Left Forearm']);
  const lHand = c(['L. Hand', 'Left Hand']);
  
  const rLeg = c(['R. Leg', 'Right Leg', 'R. Thigh']);
  const rLowerLeg = c(['R. Lower Leg', 'Right Lower Leg', 'R. Calf']);
  const rFoot = c(['R. Foot', 'Right Foot']);
  
  const lLeg = c(['L. Leg', 'Left Leg', 'L. Thigh']);
  const lLowerLeg = c(['L. Lower Leg', 'Left Lower Leg', 'L. Calf']);
  const lFoot = c(['L. Foot', 'Left Foot']);

  return (
    <svg width="100%" height="280" viewBox="0 0 200 350" style={{ overflow: 'visible' }}>
      <g transform={isBack ? "translate(200, 0) scale(-1, 1)" : ""}>
        {/* Head */}
        <circle cx="100" cy="35" r="22" fill={headColor} stroke="var(--border-color, rgba(0,0,0,0.08))" strokeWidth="2" />
        
        {/* Neck */}
        <path d="M 92 50 L 108 50 L 112 75 L 88 75 Z" fill={neckColor} stroke="var(--border-color, rgba(0,0,0,0.08))" strokeWidth="2" />
        
        {/* Chest / Upper Back */}
        <path d="M 70 75 Q 100 65 130 75 L 125 130 Q 100 140 75 130 Z" fill={coreUpper} stroke="var(--border-color, rgba(0,0,0,0.08))" strokeWidth="2" strokeLinejoin="round"/>
        
        {/* Lower Abdomen / Lower Back */}
        <path d="M 75 130 Q 100 140 125 130 L 120 180 Q 100 200 80 180 Z" fill={coreLower} stroke="var(--border-color, rgba(0,0,0,0.08))" strokeWidth="2" strokeLinejoin="round"/>
        
        {/* RIGHT ARM (Viewer's Left) */}
        <g stroke="var(--border-color, rgba(0,0,0,0.08))" strokeWidth="2">
          {/* Upper Arm */}
          <rect x="50" y="75" width="20" height="65" rx="10" transform="rotate(15 60 85)" fill={rArm} />
          {/* Forearm */}
          <rect x="29" y="135" width="16" height="55" rx="8" transform="rotate(10 37 145)" fill={rForearm} />
          {/* Hand */}
          <rect x="24" y="190" width="14" height="25" rx="6" transform="rotate(10 31 200)" fill={rHand} />
        </g>

        {/* LEFT ARM (Viewer's Right) */}
        <g stroke="var(--border-color, rgba(0,0,0,0.08))" strokeWidth="2">
          {/* Upper Arm */}
          <rect x="130" y="75" width="20" height="65" rx="10" transform="rotate(-15 140 85)" fill={lArm} />
          {/* Forearm */}
          <rect x="155" y="135" width="16" height="55" rx="8" transform="rotate(-10 163 145)" fill={lForearm} />
          {/* Hand */}
          <rect x="162" y="190" width="14" height="25" rx="6" transform="rotate(-10 169 200)" fill={lHand} />
        </g>

        {/* RIGHT LEG (Viewer's Left) */}
        <g stroke="var(--border-color, rgba(0,0,0,0.08))" strokeWidth="2">
          {/* Thigh */}
          <rect x="76" y="185" width="22" height="70" rx="10" fill={rLeg} />
          {/* Calf */}
          <rect x="78" y="255" width="18" height="65" rx="8" fill={rLowerLeg} />
          {/* Foot */}
          <path d="M74,320 Q70,335 80,335 L96,335 Q98,335 96,320 Z" fill={rFoot} />
        </g>

        {/* LEFT LEG (Viewer's Right) */}
        <g stroke="var(--border-color, rgba(0,0,0,0.08))" strokeWidth="2">
          {/* Thigh */}
          <rect x="102" y="185" width="22" height="70" rx="10" fill={lLeg} />
          {/* Calf */}
          <rect x="104" y="255" width="18" height="65" rx="8" fill={lLowerLeg} />
          {/* Foot */}
          <path d="M104,320 Q102,335 110,335 L126,335 Q130,335 126,320 Z" fill={lFoot} />
        </g>
      </g>
    </svg>
  );
}
