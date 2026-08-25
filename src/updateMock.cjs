const fs = require('fs');
const file = 'd:/Projects/React/Beam/Development/Beam2.o_South_Incidents/src/modules/safety-observations/data/observations.js';

let content = `// ── Safety Observations — Static Sample Data ──
// Updated to match URS PDF / Prototype requirements

export const OBSERVATIONS = [
  {
    id: "SO-2026-6424",
    date: "24 Jun 2026, 09:15",
    obsType: "Needs Attention",
    subClass: "Unsafe Condition",
    risk: "Medium",
    category: "Housekeeping",
    subject: "Cables and hoses creating trip hazards across walkway in B-GF corridor",
    description: "Multiple extension cables and pneumatic hoses were found running unsecured across the main pedestrian walkway on the ground floor of Building JG. The cables were not ramped or covered, creating a significant trip hazard for workers transiting the area.",
    project: "m3-south",
    building: "JG",
    location: "Main Corridor B-GF",
    createdBy: "Mikkel Nielsen",
    assignee: "Thomas Berg",
    contractor: "DK Electrical",
    status: "open",
    linked: null,
    photo: true
  },
  {
    id: "SO-2026-6425",
    date: "25 Jun 2026, 11:30",
    obsType: "Needs Attention",
    subClass: "Unsafe Act",
    risk: "High",
    category: "Working at Heights",
    subject: "Worker not clipped on while on leading edge",
    description: "Worker observed working near the leading edge on Level 3 without clipping their harness to the static line.",
    project: "m3-south",
    building: "AB",
    location: "Level 3 East",
    createdBy: "Sarah Jensen",
    assignee: "Per Larsen",
    contractor: "NNE",
    status: "escalated",
    linked: "INC-2026-048",
    photo: true
  },
  {
    id: "SO-2026-6426",
    date: "26 Jun 2026, 14:00",
    obsType: "Positive",
    subClass: "Good Practice",
    risk: "-",
    category: "Lifting Operations",
    subject: "Excellent exclusion zone setup for crane lift",
    description: "The lifting crew set up a clear, fully barriered exclusion zone with a dedicated spotter during the chiller unit lift.",
    project: "m3-south",
    building: "CD",
    location: "Roof",
    createdBy: "Mikkel Nielsen",
    assignee: "",
    contractor: "Nordic Cranes",
    status: "closed",
    linked: null,
    photo: false
  }
];

export const SAFETY_CATEGORIES = [
  "Housekeeping/Waste",
  "Electrical Hazards",
  "Working at Heights",
  "PPE",
  "Hot Works",
  "Working in Confined Spaces",
  "Lifting Operations",
  "Excavation",
  "Traffic Management",
  "Lighting",
  "Hygiene",
  "Fire Prevention",
  "Scaffolding",
  "Health",
  "Utility Damage",
  "First Aid",
  "Environmental",
  "Storage",
  "Emergency Preparedness"
];

export const SO_STATS = {
  total: OBSERVATIONS.length,
  open: OBSERVATIONS.filter(o => o.status === "open").length,
  closed: OBSERVATIONS.filter(o => o.status === "closed").length,
  escalated: OBSERVATIONS.filter(o => o.status === "escalated").length,
  highRisk: OBSERVATIONS.filter(o => o.risk === "High" || o.risk === "Very high").length,
};

export const SO_RISK_LEVELS = ["Very high", "High", "Moderate", "Medium", "Low", "Very low"];
export const SO_STATUSES = ["open", "closed", "escalated"];
`;

fs.writeFileSync(file, content, 'utf8');
console.log("Mock data updated.");
