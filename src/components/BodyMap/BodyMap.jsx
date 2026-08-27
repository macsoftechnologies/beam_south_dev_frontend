import React from 'react';

export default function BodyMap({ data = [], view = 'front' }) {
  // Find count for a specific part by matching names or aliases
  const getCount = (partNames) => {
    if (!Array.isArray(partNames)) partNames = [partNames];
    let count = 0;
    if (!data || !Array.isArray(data)) return 0;

    partNames.forEach(name => {
      const lowerName = name.toLowerCase();
      data.forEach(d => {
        if (!d || !d.part) return;
        const dPart = String(d.part).toLowerCase();
        if (dPart === lowerName || dPart.includes(lowerName) || lowerName.includes(dPart)) {
          count += (d.count || 0);
        }
      });
    });
    return count;
  };

  // Dynamic Color Mapping based on High/Medium/Low Stages
  const getColor = (count) => {
    if (count >= 5) return '#E32B50'; // High Stage (5 or more) - Red
    if (count >= 3) return '#C07D10'; // Medium Stage (3 - 4) - Orange
    if (count >= 1) return '#7BBE97'; // Low Stage (1 - 2) - Green
    return '#b4c6e7'; // Neutral default from Initial Incident Report Form
  };

  const c = (names) => getColor(getCount(names));
  const isBack = view === 'back';

  if (!isBack) {
    // FRONT VIEW - exact figure shape matching Initial Incident Report Form
    const headCol = c(['Head', 'Cranium']);
    const facialCnt = getCount(['Facial area', 'Teeth', 'Eye', 'Face']);
    const facialCol = facialCnt > 0 ? getColor(facialCnt) : '#ffffff';
    const neckCol = c(['Neck']);
    const rShoulderCol = c(['R. Shoulder', 'Shoulder (R)', 'Shoulder, Right', 'Right Shoulder']);
    const lShoulderCol = c(['L. Shoulder', 'Shoulder (L)', 'Shoulder, Left', 'Left Shoulder']);
    const chestCol = c(['Chest', 'Ribs', 'Torso']);
    const abdomenCol = c(['Lower Abdomen', 'Abdomen', 'Pelvis', 'Pelvis or abdomen']);
    const rArmCol = c(['R. Forearm', 'R. Arm', 'Right Arm', 'Arm, Elbow (R)', 'R. Upper Arm']);
    const lArmCol = c(['L. Forearm', 'L. Arm', 'Left Arm', 'Arm, Elbow (L)', 'L. Upper Arm']);
    const rWristCol = c(['R. Wrist', 'Wrist (R)', 'R. Hand', 'Right Hand']);
    const lWristCol = c(['L. Wrist', 'Wrist (L)', 'L. Hand', 'Left Hand']);
    const rHandCol = c(['R. Hand', 'Right Hand', 'Hand (R)', 'Finger(s) (R)', 'Finger (R)']);
    const lHandCol = c(['L. Hand', 'Left Hand', 'Hand (L)', 'Finger(s) (L)', 'Finger (L)']);
    const rLegCol = c(['R. Thigh', 'R. Leg', 'Right Leg', 'Legs, Knee (R)']);
    const lLegCol = c(['L. Thigh', 'L. Leg', 'Left Leg', 'Legs, Knee (L)']);
    const rKneeCol = c(['R. Knee', 'Knee (R)', 'Legs, Knee (R)']);
    const lKneeCol = c(['L. Knee', 'Knee (L)', 'Legs, Knee (L)']);
    const rCalfCol = c(['R. Calf', 'R. Lower Leg', 'Legs, Knee (R)']);
    const lCalfCol = c(['L. Calf', 'L. Lower Leg', 'Legs, Knee (L)']);
    const rAnkleCol = c(['R. Ankle', 'Ankle (R)', 'R. Foot', 'Right Foot']);
    const lAnkleCol = c(['L. Ankle', 'Ankle (L)', 'L. Foot', 'Left Foot']);
    const rFootCol = c(['R. Foot', 'Right Foot', 'Foot (R)', 'Toe(s) (R)', 'Toe (R)']);
    const lFootCol = c(['L. Foot', 'Left Foot', 'Foot (L)', 'Toe(s) (L)', 'Toe (L)']);

    return (
      <svg width="140" height="280" viewBox="0 0 140 280">
        <circle cx="70" cy="24" r="16" fill={headCol} stroke="#ffffff" strokeWidth="2" />
        <circle cx="70" cy="24" r="9" fill={facialCol} stroke="#ffffff" strokeWidth="1" />
        <rect x="61" y="42" width="18" height="9" rx="3" fill={neckCol} stroke="#ffffff" strokeWidth="2" />
        <circle cx="42" cy="59" r="8" fill={rShoulderCol} stroke="#ffffff" strokeWidth="2" />
        <circle cx="98" cy="59" r="8" fill={lShoulderCol} stroke="#ffffff" strokeWidth="2" />
        <rect x="52" y="53" width="36" height="26" rx="4" fill={chestCol} stroke="#ffffff" strokeWidth="2" />
        <rect x="54" y="81" width="32" height="18" rx="3" fill={abdomenCol} stroke="#ffffff" strokeWidth="2" />
        <rect x="52" y="101" width="36" height="24" rx="4" fill={abdomenCol} stroke="#ffffff" strokeWidth="2" />
        <rect x="36" y="69" width="12" height="38" rx="5" fill={rArmCol} stroke="#ffffff" strokeWidth="2" />
        <rect x="92" y="69" width="12" height="38" rx="5" fill={lArmCol} stroke="#ffffff" strokeWidth="2" />
        <circle cx="36" cy="112" r="5" fill={rWristCol} stroke="#ffffff" strokeWidth="2" />
        <circle cx="104" cy="112" r="5" fill={lWristCol} stroke="#ffffff" strokeWidth="2" />
        <rect x="30" y="119" width="12" height="18" rx="6" fill={rHandCol} stroke="#ffffff" strokeWidth="2" />
        <rect x="98" y="119" width="12" height="18" rx="6" fill={lHandCol} stroke="#ffffff" strokeWidth="2" />
        <rect x="52" y="127" width="14" height="48" rx="6" fill={rLegCol} stroke="#ffffff" strokeWidth="2" />
        <rect x="74" y="127" width="14" height="48" rx="6" fill={lLegCol} stroke="#ffffff" strokeWidth="2" />
        <circle cx="59" cy="179" r="5" fill={rKneeCol} stroke="#ffffff" strokeWidth="2" />
        <circle cx="81" cy="179" r="5" fill={lKneeCol} stroke="#ffffff" strokeWidth="2" />
        <rect x="53" y="186" width="12" height="44" rx="5" fill={rCalfCol} stroke="#ffffff" strokeWidth="2" />
        <rect x="75" y="186" width="12" height="44" rx="5" fill={lCalfCol} stroke="#ffffff" strokeWidth="2" />
        <circle cx="59" cy="234" r="4" fill={rAnkleCol} stroke="#ffffff" strokeWidth="2" />
        <circle cx="81" cy="234" r="4" fill={lAnkleCol} stroke="#ffffff" strokeWidth="2" />
        <ellipse cx="53" cy="244" rx="10" ry="5" fill={rFootCol} stroke="#ffffff" strokeWidth="2" />
        <ellipse cx="87" cy="244" rx="10" ry="5" fill={lFootCol} stroke="#ffffff" strokeWidth="2" />
      </svg>
    );
  }

  // BACK VIEW - exact figure shape matching Initial Incident Report Form
  const headCol = c(['Head', 'Cranium']);
  const lEarCnt = getCount(['Ear (L)', 'Ear', 'L. Ear']);
  const lEarCol = lEarCnt > 0 ? getColor(lEarCnt) : '#ffffff';
  const rEarCnt = getCount(['Ear (R)', 'Ear', 'R. Ear']);
  const rEarCol = rEarCnt > 0 ? getColor(rEarCnt) : '#ffffff';
  const neckCol = c(['Neck']);
  const lShoulderCol = c(['L. Shoulder', 'Shoulder (L)', 'Shoulder, Left', 'Left Shoulder']);
  const rShoulderCol = c(['R. Shoulder', 'Shoulder (R)', 'Shoulder, Right', 'Right Shoulder']);
  const upperBackCol = c(['Upper Back', 'Back incl. spine', 'Back', 'Spine']);
  const lowerBackCol = c(['Lower Back', 'Back incl. spine', 'Back', 'Spine']);
  const lArmCol = c(['L. Forearm', 'L. Arm', 'Left Arm', 'Arm, Elbow (L)', 'L. Upper Arm']);
  const rArmCol = c(['R. Forearm', 'R. Arm', 'Right Arm', 'Arm, Elbow (R)', 'R. Upper Arm']);
  const lWristCol = c(['L. Wrist', 'Wrist (L)', 'L. Hand', 'Left Hand']);
  const rWristCol = c(['R. Wrist', 'Wrist (R)', 'R. Hand', 'Right Hand']);
  const lHandCol = c(['L. Hand', 'Left Hand', 'Hand (L)', 'Finger(s) (L)', 'Finger (L)']);
  const rHandCol = c(['R. Hand', 'Right Hand', 'Hand (R)', 'Finger(s) (R)', 'Finger (R)']);
  const lLegCol = c(['L. Thigh', 'L. Leg', 'Left Leg', 'Legs, Knee (L)']);
  const rLegCol = c(['R. Thigh', 'R. Leg', 'Right Leg', 'Legs, Knee (R)']);
  const lKneeCol = c(['L. Knee', 'Knee (L)', 'Legs, Knee (L)']);
  const rKneeCol = c(['R. Knee', 'Knee (R)', 'Legs, Knee (R)']);
  const lCalfCol = c(['L. Calf', 'L. Lower Leg', 'Legs, Knee (L)']);
  const rCalfCol = c(['R. Calf', 'R. Lower Leg', 'Legs, Knee (R)']);
  const lAnkleCol = c(['L. Ankle', 'Ankle (L)', 'L. Foot', 'Left Foot']);
  const rAnkleCol = c(['R. Ankle', 'Ankle (R)', 'R. Foot', 'Right Foot']);
  const lFootCol = c(['L. Foot', 'Left Foot', 'Foot (L)', 'Toe(s) (L)', 'Toe (L)']);
  const rFootCol = c(['R. Foot', 'Right Foot', 'Foot (R)', 'Toe(s) (R)', 'Toe (R)']);

  return (
    <svg width="140" height="280" viewBox="0 0 140 280">
      <circle cx="70" cy="24" r="16" fill={headCol} stroke="#ffffff" strokeWidth="2" />
      <circle cx="52" cy="24" r="4" fill={lEarCol} stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="88" cy="24" r="4" fill={rEarCol} stroke="#ffffff" strokeWidth="1.5" />
      <rect x="61" y="42" width="18" height="9" rx="3" fill={neckCol} stroke="#ffffff" strokeWidth="2" />
      <circle cx="42" cy="59" r="8" fill={lShoulderCol} stroke="#ffffff" strokeWidth="2" />
      <circle cx="98" cy="59" r="8" fill={rShoulderCol} stroke="#ffffff" strokeWidth="2" />
      <rect x="52" y="53" width="36" height="46" rx="4" fill={upperBackCol} stroke="#ffffff" strokeWidth="2" />
      <rect x="52" y="101" width="36" height="24" rx="4" fill={lowerBackCol} stroke="#ffffff" strokeWidth="2" />
      <rect x="36" y="69" width="12" height="38" rx="5" fill={lArmCol} stroke="#ffffff" strokeWidth="2" />
      <rect x="92" y="69" width="12" height="38" rx="5" fill={rArmCol} stroke="#ffffff" strokeWidth="2" />
      <circle cx="36" cy="112" r="5" fill={lWristCol} stroke="#ffffff" strokeWidth="2" />
      <circle cx="104" cy="112" r="5" fill={rWristCol} stroke="#ffffff" strokeWidth="2" />
      <circle cx="30" cy="125" r="9" fill={lHandCol} stroke="#ffffff" strokeWidth="2" />
      <circle cx="110" cy="125" r="9" fill={rHandCol} stroke="#ffffff" strokeWidth="2" />
      <rect x="52" y="127" width="14" height="48" rx="6" fill={lLegCol} stroke="#ffffff" strokeWidth="2" />
      <rect x="74" y="127" width="14" height="48" rx="6" fill={rLegCol} stroke="#ffffff" strokeWidth="2" />
      <circle cx="59" cy="179" r="5" fill={lKneeCol} stroke="#ffffff" strokeWidth="2" />
      <circle cx="81" cy="179" r="5" fill={rKneeCol} stroke="#ffffff" strokeWidth="2" />
      <rect x="53" y="186" width="12" height="44" rx="5" fill={lCalfCol} stroke="#ffffff" strokeWidth="2" />
      <rect x="75" y="186" width="12" height="44" rx="5" fill={rCalfCol} stroke="#ffffff" strokeWidth="2" />
      <circle cx="59" cy="234" r="4" fill={lAnkleCol} stroke="#ffffff" strokeWidth="2" />
      <circle cx="81" cy="234" r="4" fill={rAnkleCol} stroke="#ffffff" strokeWidth="2" />
      <ellipse cx="53" cy="244" rx="10" ry="5" fill={lFootCol} stroke="#ffffff" strokeWidth="2" />
      <ellipse cx="87" cy="244" rx="10" ry="5" fill={rFootCol} stroke="#ffffff" strokeWidth="2" />
    </svg>
  );
}

