const fs = require('fs');

const penalJson = JSON.parse(fs.readFileSync('c:/Users/ASUS/Documents/GitHub/ChildSafety-Backend-API/legal-rag-backend/penal.json', 'utf8'));

const penalSections = new Set(penalJson.map(s => s.section_number || s.section));

console.log("Backend penal.json section count:", penalSections.size);
console.log("Backend sections:", Array.from(penalSections).sort().join(", "));

// Read legalKnowledgeBase.ts
const lkbContent = fs.readFileSync('c:/Users/ASUS/Documents/GitHub/Group104-ChildSafety-Ecosystem/src/data/legalKnowledgeBase.ts', 'utf8');
const sectionMatches = lkbContent.match(/section:\s*"([^"]+)"/g) || [];
const lkbSections = new Set(sectionMatches.map(m => m.replace(/section:\s*"/, '').replace('"', '')));

console.log("Frontend legalKnowledgeBase.ts section count:", lkbSections.size);
console.log("Frontend sections:", Array.from(lkbSections).sort().join(", "));

const missingInFrontend = Array.from(penalSections).filter(s => !lkbSections.has(s));
const extraInFrontend = Array.from(lkbSections).filter(s => !penalSections.has(s) && s !== "NCPA Act No. 50 of 1998" && s !== null);

console.log("\nBackend sections missing in Frontend legalKnowledgeBase.ts:", missingInFrontend);
console.log("Frontend sections not in Backend penal.json:", extraInFrontend);
