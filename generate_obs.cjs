const fs = require('fs');
const path = require('path');

const contractors = ['DK Electrical', 'NNE', 'Nordic Cranes', 'Give Steel', 'Bravida', 'Kemp & Lauritzen', 'Norisol'];
const statuses = ['open', 'closed', 'escalated'];
const types = ['Positive', 'Needs Attention'];
const categories = ["Housekeeping/Waste", "Electrical Hazards", "Working at Heights", "PPE", "Hot Works", "Working in Confined Spaces", "Lifting Operations", "Excavation", "Traffic Management", "Fire Prevention"];
const risks = ["Very high", "High", "Moderate", "Medium", "Low", "Very low", "-"];

let observations = [];
for (let i = 0; i < 150; i++) {
  // Generate a date within the last 8 weeks
  const now = new Date('2026-06-28T12:00:00'); // Assuming mid 2026 based on seed data
  const daysAgo = Math.floor(Math.random() * 56);
  now.setDate(now.getDate() - daysAgo);
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', 10:00';
  
  const type = Math.random() > 0.3 ? 'Needs Attention' : 'Positive';
  const risk = type === 'Positive' ? '-' : risks[Math.floor(Math.random() * 6)];
  
  observations.push({
    id: `SO-2026-${6427 + i}`,
    date: dateStr,
    obsType: type,
    subClass: type === 'Positive' ? 'Good Practice' : 'Unsafe Condition',
    risk: risk,
    category: categories[Math.floor(Math.random() * categories.length)],
    subject: `Observation related to ${categories[Math.floor(Math.random() * categories.length)]}`,
    description: "Generated description for this observation.",
    project: "m3-south",
    building: "M3 South",
    location: "Various",
    createdBy: "System",
    assignee: "User",
    contractor: contractors[Math.floor(Math.random() * contractors.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    linked: null,
    photo: Math.random() > 0.5
  });
}

const fileContent = `// ── Safety Observations — Static Sample Data ──
export const OBSERVATIONS = ${JSON.stringify(observations, null, 2)};

export const SAFETY_CATEGORIES = ${JSON.stringify(categories, null, 2)};

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

fs.writeFileSync(path.join(__dirname, 'src', 'modules', 'safety-observations', 'data', 'observations.js'), fileContent);
console.log('Observations generated.');
