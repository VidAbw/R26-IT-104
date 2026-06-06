import { LAWS_DATABASE, KEYWORDS, COUNSELLING_SUPPORT } from "../data/legalKnowledgeBase";

export interface ExtractedFacts {
  childAge: string | null;
  childGender: string | null;
  affectedChild: string | null;
  suspectedOffender: string | null;
  relationshipToChild: string | null;
  placeOfIncident: string | null;
  timeOfIncident: string | null;
  riskFactors: string[];
  evidenceMentioned: string[];
  witnessesMentioned: string[];
  medicalNeedMentioned: boolean;
  counsellingNeedMentioned: boolean;
  immediateDangerMentioned: boolean;
}

export interface RoadmapResult {
  id: string;
  language: "si" | "en";
  userDescription: string;
  incidentSummary: string;
  extractedFacts: ExtractedFacts;
  classification: {
    primaryCategory: string;
    secondaryCategories: string[];
    confidence: number;
    explanation: string;
  };
  riskAssessment: {
    riskLevel: "low" | "medium" | "high" | "emergency";
    reasons: string[];
    emergencyActions: string[];
  };
  signsAndImpacts: {
    physicalSigns: string[];
    behaviouralSigns: string[];
    emotionalSigns: string[];
    socialImpacts: string[];
  };
  legalGuidance: {
    relevantLaws: {
      lawName: string;
      section: string | null;
      category: string;
      whyRelevant: string;
      simpleExplanation: string;
      recommendedAction: string;
    }[];
    disclaimer: string;
  };
  medicalGuidance: {
    needed: boolean;
    urgency: "none" | "soon" | "urgent";
    reasons: string[];
    recommendations: string[];
  };
  medicoLegalGuidance: {
    needed: boolean;
    reasons: string[];
    evidenceChecklist: string[];
    chainOfCustodyMessage: string;
    recommendedProcedure: string[];
  };
  caseConference: {
    needed: boolean;
    reasons: string[];
    possibleAgencies: string[];
    purpose: string[];
  };
  counsellingSupport: {
    needed: boolean;
    reasons: string[];
    supportOptions: string[];
    supportiveMessage: string;
  };
  nextActions: {
    priority: "immediate" | "high" | "normal";
    label: string;
    description: string;
    icon: string;
  }[];
}

// 1. Detect language (Sinhala vs English)
export function detectLanguage(text: string): "si" | "en" {
  const isSinhala = /[\u0D80-\u0DFF]/.test(text);
  return isSinhala ? "si" : "en";
}

// Helper to count keyword matches
function countKeywords(text: string, keywords: string[]): number {
  let count = 0;
  const lowerText = text.toLowerCase();
  for (const word of keywords) {
    if (lowerText.includes(word.toLowerCase())) {
      count++;
    }
  }
  return count;
}

// 2. Extract Key Facts
export function extractFacts(description: string): ExtractedFacts {
  const text = description.toLowerCase();
  const lang = detectLanguage(description);

  // Age extraction
  let childAge: string | null = null;
  const ageRegex = /(?:vaysa|wiyasa|වයස|age)?\s*(\d{1,2})\s*(?:vasi|years|year|aurudu|අවුරුදු)/i;
  const simpleAgeRegex = /(?:age|වයස|අවුරුදු)\s*(\d{1,2})/i;
  const loneNumberRegex = /\b(\d{1,2})\b/;
  
  let ageMatch = description.match(ageRegex) || description.match(simpleAgeRegex);
  if (ageMatch) {
    childAge = ageMatch[1];
  } else {
    // Try to find any number between 1 and 18 that could be age
    const loneMatch = description.match(loneNumberRegex);
    if (loneMatch) {
      const num = parseInt(loneMatch[1], 10);
      if (num > 0 && num <= 18) {
        childAge = num.toString();
      }
    }
  }

  // Gender extraction
  let childGender: string | null = null;
  const femaleKeywords = ["girl", "daughter", "sister", "female", "she", "her", "දැරිය", "දුව", "ගැහැණු", "ඇය", "ඇයට"];
  const maleKeywords = ["boy", "son", "brother", "male", "he", "him", "his", "කොල්ලා", "පුතා", "පිරිමි", "ඔහු", "ඔහුට"];
  
  if (countKeywords(text, femaleKeywords) > countKeywords(text, maleKeywords)) {
    childGender = lang === "si" ? "ගැහැණු (Female)" : "Female";
  } else if (countKeywords(text, maleKeywords) > countKeywords(text, femaleKeywords)) {
    childGender = lang === "si" ? "පිරිමි (Male)" : "Male";
  }

  // Relationship and Offender
  let relationshipToChild: string | null = null;
  let suspectedOffender: string | null = null;

  const relationshipKeywordsMap = {
    father: { en: "Father", si: "පියා (Father)", words: ["father", "dad", "parent", "paternal", "පියා", "තාත්තා", "මව්පියන්", "සුළු පියා", "stepfather", "step-father"] },
    mother: { en: "Mother", si: "මව (Mother)", words: ["mother", "mom", "parent", "maternal", "මව", "අම්මා", "සුළු මව", "stepmother", "step-mother"] },
    relative: { en: "Relative", si: "ඥාතියා (Relative)", words: ["uncle", "aunt", "cousin", "grandfather", "grandmother", "relative", "close relative", "ඥාතියා", "ඥාතියෙක්", "ඥාති", "මාමා", "බාප්පා", "ලොකු අම්මා", "නෑදෑයා"] },
    guardian: { en: "Guardian", si: "භාරකරු (Guardian)", words: ["guardian", "caregiver", "boarding warden", "warden", "භාරකරු", "රැකබලාගන්නා"] },
    neighbor: { en: "Neighbor", si: "අසල්වැසියා (Neighbor)", words: ["neighbor", "neighbour", "next door", "අසල්වැසියා", "එහා ගෙදර"] },
    teacher: { en: "Teacher", si: "ගුරුවරයා (Teacher)", words: ["teacher", "coach", "principal", "tutor", "ගුරුවරයා", "ඉස්කෝලේ", "පන්තියේ"] },
    employer: { en: "Employer", si: "හාම්පුතා (Employer)", words: ["employer", "boss", "workplace", "house owner", "හාම්පුතා", "වැඩපල"] },
    religious: { en: "Religious Worker", si: "ආගමික සේවකයා (Religious)", words: ["priest", "monk", "clergyman", "religious", "සාදු", "පූජක", "පන්සලේ", "පල්ලියේ"] }
  };

  let maxRelCount = 0;
  for (const [, val] of Object.entries(relationshipKeywordsMap)) {
    const score = countKeywords(text, val.words);
    if (score > maxRelCount) {
      maxRelCount = score;
      relationshipToChild = lang === "si" ? val.si : val.en;
      suspectedOffender = lang === "si" ? val.si : val.en;
    }
  }

  // Place of Incident
  let placeOfIncident: string | null = null;
  const placesMap = {
    home: { en: "Home", si: "නිවස (Home)", words: ["home", "house", "room", "kitchen", "domestic", "ගෙදර", "නිවසේදී", "කාමරේ"] },
    school: { en: "School", si: "පාසල (School)", words: ["school", "class", "playground", "hostel", "boarding", "පාසල", "ඉස්කෝලේ", "පන්තිය", "නේවාසිකාගාරය"] },
    online: { en: "Online / Digital Space", si: "මාර්ගගත අවකාශය (Online)", words: ["online", "facebook", "whatsapp", "viber", "messenger", "phone", "chat", "අන්තර්ජාලය", "ෆේස්බුක්", "මැසේජ්"] },
    outside: { en: "Street / Public Space", si: "පොදු ස්ථානය (Public)", words: ["street", "road", "shop", "boutique", "jungle", "bus", "පාරේ", "කඩේ", "පොදු", "වීදියේ"] }
  };

  let maxPlaceCount = 0;
  for (const [, val] of Object.entries(placesMap)) {
    const score = countKeywords(text, val.words);
    if (score > maxPlaceCount) {
      maxPlaceCount = score;
      placeOfIncident = lang === "si" ? val.si : val.en;
    }
  }

  // Time of Incident
  let timeOfIncident: string | null = null;
  const timesMap = {
    recent: { en: "Recent (Immediate Action Required)", si: "මෑතකදී (ක්ෂණික ක්‍රියාමාර්ග අවශ්‍යයි)", words: ["today", "yesterday", "last night", "now", "just now", "hours ago", "තුවාල තියෙනවා", "අද", "ඊයේ", "දැන්", "තුවාල තියෙනවා", "bleeding"] },
    frequent: { en: "Repeated / Continuous", si: "නිතර සිදුවන / අඛණ්ඩව", words: ["often", "always", "every day", "repeated", "frequently", "nithara", "නිතර", "හැමදාම", "දිගටම"] },
    past: { en: "Past Incident", si: "පසුගිය සිද්ධියක්", words: ["months ago", "last year", "ago", "පෙර", "ඉස්සර", "කාලෙකට කලින්"] }
  };

  let maxTimeCount = 0;
  for (const [, val] of Object.entries(timesMap)) {
    const score = countKeywords(text, val.words);
    if (score > maxTimeCount) {
      maxTimeCount = score;
      timeOfIncident = lang === "si" ? val.si : val.en;
    }
  }

  // Indicators mapping
  const riskFactors = detectRiskFactorsList(description);
  
  // Evidence
  const evidenceMentioned: string[] = [];
  const evidenceKeywords = {
    screenshots: ["screenshot", "message", "chat", "photo", "video", "ස්ක්‍රීන්ෂොට්", "මැසේජ්", "පින්තූර", "වීඩියෝ"],
    medical: ["wound", "injury", "bleeding", "bruise", "hospital", "doctor", "තුවාල", "ලේ", "රෝහල", "වෛද්‍ය"],
    witness: ["saw", "witness", "someone saw", "දැක්කා", "සාක්ෂි"]
  };
  if (countKeywords(text, evidenceKeywords.screenshots) > 0) {
    evidenceMentioned.push(lang === "si" ? "සංවාද සටහන් / පින්තූර / ස්ක්‍රීන්ෂොට්" : "Screenshots / Chat Logs / Digital Media");
  }
  if (countKeywords(text, evidenceKeywords.medical) > 0) {
    evidenceMentioned.push(lang === "si" ? "ශාරීරික තුවාල පිළිබඳ සටහන් / වෛද්‍ය ලේඛන" : "Physical injuries / Medical documents");
  }
  if (countKeywords(text, evidenceKeywords.witness) > 0) {
    evidenceMentioned.push(lang === "si" ? "ඇසින් දුටු සාක්ෂි" : "Eyewitness statements");
  }

  // Witnesses
  const witnessesMentioned: string[] = [];
  if (countKeywords(text, ["saw", "witness", "friend", "mother saw", "දැක්කා", "යහළුවා", "අම්මා දැක්කා"]) > 0) {
    witnessesMentioned.push(lang === "si" ? "සිද්ධිය දුටු වෙනත් පුද්ගලයෙක් සිටී" : "Yes, witnesses are present or mentioned");
  }

  // Need Indicators
  const medicalNeedMentioned = countKeywords(text, ["hospital", "doctor", "pain", "injury", "injuries", "bleeding", "wound", "pregancy", "sti", "hiv", "තුවාල", "ලේ", "රෝහල", "ඩොක්ටර්", "අමාරුයි", "ගැබ් ගැනීම"]) > 0;
  const counsellingNeedMentioned = countKeywords(text, ["afraid", "crying", "scared", "fear", "sad", "nightmare", "silent", "withdrawal", "stress", "බය", "අඬනවා", "කනස්සල්ල", "දුක", "තනිවෙලා", "මානසික"]) > 0;
  const immediateDangerMentioned = countKeywords(text, ["unsafe", "danger", "running", "threatened", "perpetrator nearby", "kill", "අනතුරක්", "ආරක්ෂාවක් නැහැ", "මරනවා", "තර්ජනය", "දැන්ම"]) > 0;

  return {
    childAge,
    childGender,
    affectedChild: childAge ? (lang === "si" ? `වයස අවුරුදු ${childAge}ක දරුවා` : `Age ${childAge} child`) : (lang === "si" ? "දරුවා" : "Child"),
    suspectedOffender,
    relationshipToChild,
    placeOfIncident,
    timeOfIncident,
    riskFactors,
    evidenceMentioned,
    witnessesMentioned,
    medicalNeedMentioned,
    counsellingNeedMentioned,
    immediateDangerMentioned
  };
}

// Risk factors detection list helper
function detectRiskFactorsList(description: string): string[] {
  const text = description.toLowerCase();
  const lang = detectLanguage(description);
  const found: string[] = [];

  const rfKeywords = KEYWORDS.riskFactors;
  
  if (countKeywords(text, rfKeywords.absentParents) > 0) {
    found.push(lang === "si" ? "මව්පියන් නොමැතිව හෝ මව්පියන් විදේශගතව සිටීම" : "Child lives away from parents / parent abroad");
  }
  if (countKeywords(text, rfKeywords.offenderAccess) > 0) {
    found.push(lang === "si" ? "අපරාධකරු දරුවාට සමීප වැඩිහිටියෙකු වීම" : "Offender is a close adult or has easy access to child");
  }
  if (countKeywords(text, rfKeywords.childSilent) > 0) {
    found.push(lang === "si" ? "බිය හෝ ලැජ්ජාව නිසා දරුවා නිහඬව සිටීම" : "Child is silent due to shame or fear of retaliation");
  }
  if (countKeywords(text, ["repeated", "often", "always", "නිතර", "හැමදාම", "දිගටම"]) > 0) {
    found.push(lang === "si" ? "පෙර අපයෝජන ඉතිහාසය හෝ නිතර සිදුවීම" : "Repeated abuse pattern or previous abuse history");
  }
  if (countKeywords(text, ["threat", "threatened", "kill", "තර්ජන", "මරනවා"]) > 0) {
    found.push(lang === "si" ? "බිය ගැන්වීම් හෝ පීඩනයන් එල්ල වීම" : "Active threats or intimidation by offender");
  }

  return found;
}

// 3. Classify Abuse
export function classifyAbuse(description: string): {
  primaryCategory: string;
  secondaryCategories: string[];
  confidence: number;
  explanation: string;
} {
  const text = description.toLowerCase();
  const lang = detectLanguage(description);
  
  const scores: Record<string, number> = {};
  for (const [category, kwObj] of Object.entries(KEYWORDS.categories)) {
    const matchesEn = countKeywords(text, kwObj.en);
    const matchesSi = countKeywords(text, kwObj.si);
    scores[category] = matchesEn + matchesSi;
  }

  // Find primary
  let primaryCategory = "unknown";
  let maxScore = 0;
  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      primaryCategory = category;
    }
  }

  // Find secondary categories (any other score > 0)
  const secondaryCategories: string[] = [];
  for (const [category, score] of Object.entries(scores)) {
    if (score > 0 && category !== primaryCategory) {
      secondaryCategories.push(category);
    }
  }

  // Confidence calculation
  let confidence = 0.5;
  if (maxScore > 0) {
    confidence = Math.min(0.5 + maxScore * 0.1, 0.95);
  }

  // Explanation builder
  let explanation = "";
  if (lang === "si") {
    const categoryNames: Record<string, string> = {
      physical_abuse: "ශාරීරික අපයෝජනය",
      sexual_abuse: "ලිංගික අපයෝජනය",
      emotional_abuse: "මානසික අපයෝජනය",
      neglect: "නොසලකා හැරීම",
      online_abuse: "මාර්ගගත අපයෝජනය",
      domestic_violence_context: "ගෘහස්ථ හිංසන තත්ත්වය",
      child_exploitation: "ළමා සූරාකෑම / ජාවාරම",
      unknown: "නොදන්නා / මිශ්‍ර අපයෝජනය"
    };
    explanation = `පරිශීලක විස්තරයේ අඩංගු මූල පද පදනම් කරගෙන ප්‍රධාන වශයෙන් ${categoryNames[primaryCategory] || categoryNames.unknown} හඳුනාගෙන ඇත.`;
    if (secondaryCategories.length > 0) {
      explanation += ` මීට අමතරව ${secondaryCategories.map(c => categoryNames[c]).join(', ')} තත්ත්වයන්ද අදාළ විය හැක.`;
    }
  } else {
    const categoryNames: Record<string, string> = {
      physical_abuse: "Physical Abuse",
      sexual_abuse: "Sexual Abuse",
      emotional_abuse: "Emotional Abuse",
      neglect: "Neglect",
      online_abuse: "Online Abuse",
      domestic_violence_context: "Domestic Violence Context",
      child_exploitation: "Child Exploitation",
      unknown: "Unknown / Mixed Abuse"
    };
    explanation = `Based on the keywords in the description, the primary category is detected as ${categoryNames[primaryCategory] || categoryNames.unknown}.`;
    if (secondaryCategories.length > 0) {
      explanation += ` Secondary context includes: ${secondaryCategories.map(c => categoryNames[c]).join(', ')}.`;
    }
  }

  return {
    primaryCategory,
    secondaryCategories,
    confidence,
    explanation
  };
}

// 4. Detect Risk Factors (standalone returning categorised fields)
export function detectRiskFactors(description: string) {
  return detectRiskFactorsList(description);
}

// 5. Detect Signs and Impact
export function detectSignsAndImpacts(description: string) {
  const text = description.toLowerCase();
  const lang = detectLanguage(description);
  
  const physicalSigns: string[] = [];
  const behaviouralSigns: string[] = [];
  const emotionalSigns: string[] = [];
  const socialImpacts: string[] = [];

  // Match physical signs
  if (countKeywords(text, ["wound", "injury", "cut", "bleeding", "තුවාල", "ලේ", "කැපීම්"]) > 0) {
    physicalSigns.push(lang === "si" ? "පැහැදිලි ශාරීරික තුවාල හෝ කැපුම් සලකුණු" : "Visible physical wounds, cuts, or bruises");
  }
  if (countKeywords(text, ["pain", "hurt", "slap", "beat", "වේදනාව", "පහරදීම"]) > 0) {
    physicalSigns.push(lang === "si" ? "ශාරීරික වේදනාව හෝ රිදීම්" : "Bodily pain or physical discomfort");
  }
  if (countKeywords(text, ["touch", "sexual", "pregnancy", "sti", "ලිංගික", "ස්පර්ශය", "ගැබ් ගැනීම"]) > 0) {
    physicalSigns.push(lang === "si" ? "ලිංගික අතවරයකින් හෝ ආසාදනයකින් සිදුවිය හැකි බලපෑම්" : "Potential effects of sexual assault or infection concern");
  }

  // Match behavioural signs
  if (countKeywords(text, ["sleep", "nightmare", "insomnia", "නින්ද", "සිහිනයෙන්"]) > 0) {
    behaviouralSigns.push(lang === "si" ? "නින්ද නොයාම හෝ සිහිනයෙන් බියවීම්" : "Sleep disturbances or frequent nightmares");
  }
  if (countKeywords(text, ["silent", "withdrawal", "isolation", "නිහඬ", "හුදකලා"]) > 0) {
    behaviouralSigns.push(lang === "si" ? "සමාජයෙන් ඈත්වීම හෝ අධික ලෙස නිහඬ වීම" : "Social withdrawal, quietness, or self-isolation");
  }
  if (countKeywords(text, ["avoid", "scared of him", "මඟහරිනවා", "බයයි"]) > 0) {
    behaviouralSigns.push(lang === "si" ? "යම් පුද්ගලයෙකු හෝ ස්ථානයක් මඟහැරීමට උත්සාහ කිරීම" : "Avoiding specific persons or locations");
  }

  // Match emotional signs
  if (countKeywords(text, ["fear", "scared", "afraid", "බය", "බිය"]) > 0) {
    emotionalSigns.push(lang === "si" ? "අධික බිය සහ අනාරක්ෂිත බව දැනීම" : "Intense fear, anxiety, and insecurity");
  }
  if (countKeywords(text, ["shame", "guilt", "crying", "ලැජ්ජාව", "වරදකාරිත්වය", "අඬනවා"]) > 0) {
    emotionalSigns.push(lang === "si" ? "ලැජ්ජාව, වරදකාරී හැඟීම හෝ නිරන්තරයෙන් හැඬීම" : "Feelings of shame, guilt, or emotional distress");
  }
  if (countKeywords(text, ["shock", "confused", "කම්පනය", "අවුල්"]) > 0) {
    emotionalSigns.push(lang === "si" ? "චිත්තවේගීය කම්පනය හෝ ව්‍යාකූලත්වය" : "Emotional shock or confusion");
  }

  // Match social impacts
  if (countKeywords(text, ["family", "home", "parent", "පවුල", "ගෙදර"]) > 0) {
    socialImpacts.push(lang === "si" ? "පවුල තුළ ආරවුල් හෝ අභ්‍යන්තර ආතතිය" : "Family conflict or domestic tension");
  }
  if (countKeywords(text, ["stigma", "blame", "shame", "කොන් කිරීම", "බැනුම්"]) > 0) {
    socialImpacts.push(lang === "si" ? "ප්‍රජාව හෝ සමාජය මඟින් කොන් කිරීමේ අවදානම" : "Risk of victim-blaming or community stigma");
  }
  if (countKeywords(text, ["threat", "threatened", "තර්ජන"]) > 0) {
    socialImpacts.push(lang === "si" ? "නිහඬව සිටීමට එල්ල වන සමාජීය පීඩනය" : "Social pressure or threats to maintain silence");
  }

  // Default distress statements if empty
  if (physicalSigns.length === 0 && behaviouralSigns.length === 0 && emotionalSigns.length === 0) {
    emotionalSigns.push(lang === "si" ? "දරුවා මානසික පීඩාවකින් පසුවිය හැක." : "The child may be experiencing distress.");
    behaviouralSigns.push(lang === "si" ? "සුදුසු වෘත්තීය සහාය ලබා ගැනීම ප්‍රයෝජනවත් විය හැක." : "Professional support may be helpful.");
  }

  return {
    physicalSigns,
    behaviouralSigns,
    emotionalSigns,
    socialImpacts
  };
}

// 6. Assess Risk Level
export function assessRisk(
  description: string,
  facts: ExtractedFacts,
  category: string,
  riskFactors: string[]
): {
  riskLevel: "low" | "medium" | "high" | "emergency";
  reasons: string[];
  emergencyActions: string[];
} {
  const text = description.toLowerCase();
  const lang = detectLanguage(description);
  
  const reasons: string[] = [];
  const emergencyActions: string[] = [];
  let riskLevel: "low" | "medium" | "high" | "emergency" = "low";

  // Check emergency criteria
  const isEmergency = 
    facts.immediateDangerMentioned || 
    countKeywords(text, ["bleeding", "severe injury", "rape", "assaulted just now", "unconscious", "hospital", "dangerous weapon", "තුවාල තියෙනවා", "ලේ ගලනවා", "දැන්ම", "මරනවා"]) > 0;

  if (isEmergency) {
    riskLevel = "emergency";
    if (lang === "si") {
      reasons.push("දරුවාට ක්ෂණික අනතුරක් හෝ බරපතළ ශාරීරික හානියක් පවතී.");
      reasons.push("වෛද්‍ය ප්‍රතිකාර හෝ ක්ෂණික ආරක්ෂාව ලබා දිය යුතුය.");
      emergencyActions.push("වහාම 1929 ළමා උපකාරක අංකය අමතන්න.");
      emergencyActions.push("දරුවා වහාම ළඟම ඇති රජයේ රෝහලකට ඇතුළත් කරන්න.");
      emergencyActions.push("අපරාධකරු සමඟ සෘජුව ගැටීමට නොයන්න.");
    } else {
      reasons.push("Child faces immediate danger or severe physical/sexual injury requiring instant rescue.");
      reasons.push("Immediate medical care or safe placement is needed.");
      emergencyActions.push("Call 1929 NCPA Helpline immediately.");
      emergencyActions.push("Take the child to the nearest government hospital.");
      emergencyActions.push("Do not confront the suspected offender.");
    }
  } else {
    // Check high risk criteria
    const isHigh = 
      category === "sexual_abuse" || 
      text.includes("sexual") || text.includes("ලිංගික") ||
      category === "physical_abuse" || 
      category === "domestic_violence_context" || 
      riskFactors.length >= 2 || 
      facts.childAge !== null && parseInt(facts.childAge, 10) < 10;

    if (isHigh) {
      riskLevel = "high";
      if (lang === "si") {
        reasons.push("සිද්ධියෙහි බරපතළකම හෝ අපරාධකරු පවුලේ සාමාජිකයෙකු වීම නිසා අවදානම ඉහළ මට්ටමක පවතී.");
        reasons.push("සාක්ෂි විනාශ වීමේ අවදානමක් හෝ දරුවා දිගින් දිගටම පීඩනයට ලක්වීමේ හැකියාවක් ඇත.");
      } else {
        reasons.push("Severe abuse category or offender relationship creates high risk of repeat abuse.");
        reasons.push("High possibility of trauma, evidence loss, or coercion to stay silent.");
      }
    } else {
      // Check medium risk criteria
      const isMedium = 
        category !== "unknown" || 
        facts.counsellingNeedMentioned || 
        facts.medicalNeedMentioned;

      if (isMedium) {
        riskLevel = "medium";
        if (lang === "si") {
          reasons.push("සිද්ධිය වාර්තා කිරීම හෝ නීතිමය උපදෙස් ලබා ගැනීම අවශ්‍ය වේ.");
          reasons.push("දරුවාට මනෝ-සමාජීය සහාය හෝ රැකවරණ උපදෙස් අවශ්‍ය වේ.");
        } else {
          reasons.push("Abuse category identified, requiring legal reporting and guidance.");
          reasons.push("Psychosocial counselling or support is recommended for the child.");
        }
      } else {
        riskLevel = "low";
        if (lang === "si") {
          reasons.push("පොදු ළමා ආරක්ෂණ නීති පිළිබඳ දැනුවත් වීමේ අවශ්‍යතාවය.");
        } else {
          reasons.push("General legal awareness question; no child at immediate risk identified.");
        }
      }
    }
  }

  return {
    riskLevel,
    reasons,
    emergencyActions
  };
}

// 7. Map Relevant Sri Lankan Laws
export function mapRelevantLaws(
  category: string,
  facts: ExtractedFacts,
  riskLevel: string
): {
  lawName: string;
  section: string | null;
  category: string;
  whyRelevant: string;
  simpleExplanation: string;
  recommendedAction: string;
}[] {
  const matchedLaws: {
    lawName: string;
    section: string | null;
    category: string;
    whyRelevant: string;
    simpleExplanation: string;
    recommendedAction: string;
  }[] = [];

  const lang = detectLanguage(facts.affectedChild || "");

  // Always include the NCPA Act if any abuse or protection need is indicated
  const ncpaAct = LAWS_DATABASE.find(l => l.id === "ncpa_1998");
  if (ncpaAct) {
    matchedLaws.push({
      lawName: lang === "si" ? ncpaAct.lawNameSi : ncpaAct.lawName,
      section: ncpaAct.section,
      category: ncpaAct.category,
      whyRelevant: lang === "si" ? ncpaAct.whyRelevantSi : ncpaAct.whyRelevant,
      simpleExplanation: lang === "si" ? ncpaAct.simpleExplanationSi : ncpaAct.simpleExplanation,
      recommendedAction: lang === "si" ? ncpaAct.recommendedActionSi : ncpaAct.recommendedAction
    });
  }

  // Category and keyword mapping
  for (const law of LAWS_DATABASE) {
    if (law.id === "ncpa_1998") continue;

    let isRelevant = false;

    // Check category matching
    if (law.category === category) {
      isRelevant = true;
    }

    // Special laws mapping
    if (law.id === "pc_308a" && (category === "physical_abuse" || category === "neglect")) {
      isRelevant = true;
    }
    if (law.id === "pdva_2005" && (category === "domestic_violence_context" || facts.riskFactors.some(f => f.includes("ගෘහ") || f.includes("domestic")))) {
      isRelevant = true;
    }
    if (law.id === "pc_364a" && category === "sexual_abuse" && (facts.relationshipToChild?.includes("Father") || facts.relationshipToChild?.includes("Relative") || facts.relationshipToChild?.includes("ඥාතියා") || facts.relationshipToChild?.includes("පියා"))) {
      isRelevant = true;
    }
    if (law.id === "cypo_1939" && (category === "neglect" || riskLevel === "high" || riskLevel === "emergency")) {
      isRelevant = true;
    }
    if (law.id === "espa_1999" && (category === "sexual_abuse" || category === "physical_abuse" || riskLevel === "high")) {
      isRelevant = true;
    }
    if (law.id === "apvwa_2015" && (riskLevel === "high" || riskLevel === "emergency" || facts.riskFactors.some(f => f.includes("තර්ජන") || f.includes("threat")))) {
      isRelevant = true;
    }

    if (isRelevant) {
      matchedLaws.push({
        lawName: lang === "si" ? law.lawNameSi : law.lawName,
        section: law.section,
        category: law.category,
        whyRelevant: lang === "si" ? law.whyRelevantSi : law.whyRelevant,
        simpleExplanation: lang === "si" ? law.simpleExplanationSi : law.simpleExplanation,
        recommendedAction: lang === "si" ? law.recommendedActionSi : law.recommendedAction
      });
    }
  }

  return matchedLaws;
}

// 8. Generate Medical Guidance
export function generateMedicalGuidance(
  category: string,
  facts: ExtractedFacts,
  riskLevel: string
) {
  const lang = detectLanguage(facts.affectedChild || "");
  const needed = category === "physical_abuse" || category === "sexual_abuse" || facts.medicalNeedMentioned;
  
  let urgency: "none" | "soon" | "urgent" = "none";
  if (needed) {
    urgency = (riskLevel === "emergency" || category === "sexual_abuse") ? "urgent" : "soon";
  }

  const reasons: string[] = [];
  const recommendations: string[] = [];

  if (needed) {
    if (lang === "si") {
      reasons.push("දරුවා ශාරීරික පහරදීමකට හෝ ලිංගික අපයෝජනයකට ලක්ව ඇති බවට සැක කෙරේ.");
      if (category === "sexual_abuse") {
        reasons.push("ලිංගික සංසර්ගයක් සිදුවී පැය 72ක් ඇතුළත වෛද්‍ය පරීක්ෂණයක් පැවැත්වීම ඉතා වැදගත් වේ.");
      }
      recommendations.push("වහාම දරුවා ළඟම ඇති රජයේ රෝහල වෙත හෝ දිස්ත්‍රික් මූලික රෝහල වෙත යොමු කරන්න.");
      recommendations.push("කිසිදු ඖෂධ වර්ගයක් වෛද්‍ය උපදෙස් රහිතව ලබා නොදෙන්න.");
    } else {
      reasons.push("The child is suspected to have experienced physical trauma or sexual assault.");
      if (category === "sexual_abuse") {
        reasons.push("Forensic examination within 72 hours is crucial for safety, health, and evidence collection.");
      }
      recommendations.push("Take the child immediately to the nearest government or base hospital.");
      recommendations.push("Do not administer any treatment or medication without qualified medical supervision.");
    }
  }

  return {
    needed,
    urgency,
    reasons,
    recommendations
  };
}

// 9. Generate Medico-Legal Guidance
export function generateMedicoLegalGuidance(
  category: string,
  facts: ExtractedFacts,
  riskLevel: string
) {
  const lang = detectLanguage(facts.affectedChild || "");
  const needed = category === "sexual_abuse" || category === "physical_abuse" || facts.evidenceMentioned.length > 0;
  
  const reasons: string[] = [];
  const evidenceChecklist: string[] = [];
  const recommendedProcedure: string[] = [];

  if (needed) {
    if (lang === "si") {
      reasons.push("අධිකරණ වෛද්‍ය පරීක්ෂණයක් (JMO Report) නීතිමය සාක්ෂි සඳහා අත්‍යවශ්‍ය වේ.");
      reasons.push("අපරාධ ක්‍රියාව සනාථ කිරීමට ශාරීරික සාක්ෂි සංරක්ෂණය කළ යුතුය.");
      
      evidenceChecklist.push("දරුවා සේදීම හෝ පිරිසිදු කිරීම නොකළ යුතුය (DNA සාක්ෂි සඳහා)");
      evidenceChecklist.push("සිද්ධිය වූ අවස්ථාවේ දරුවා ඇඳ සිටි ඇඳුම් ප්ලාස්ටික් බෑගයක නොදමා කඩදාසි බෑගයක බහා තබන්න");
      evidenceChecklist.push("වට්ස්ඇප්/ෆේස්බුක් මැසේජ් වල ස්ක්‍රීන්ෂොට් සුරක්ෂිත කරන්න");
      
      recommendedProcedure.push("පොලිසිය වෙත සිද්ධිය වාර්තා කර අධිකරණ වෛද්‍යවරයා (JMO) වෙත යොමු කරන ලෙස ඉල්ලා සිටින්න.");
      recommendedProcedure.push("සෑම සාක්ෂි හුවමාරුවකදීම ලිඛිත වාර්තාවක් (Chain of Custody) තබා ගන්න.");
    } else {
      reasons.push("Forensic JMO report is critical for securing visual and physical evidence in court.");
      reasons.push("Preservation of biological and digital evidence is necessary to establish facts.");
      
      evidenceChecklist.push("Do not wash, bathe, or clean the child before examination to preserve DNA.");
      evidenceChecklist.push("Store the child's worn clothes in a clean paper bag (avoid airtight plastic).");
      evidenceChecklist.push("Take screenshots of online communications and block suspects.");
      
      recommendedProcedure.push("Submit a police complaint and request the officer to issue a medical examination form (MLEF).");
      recommendedProcedure.push("Ensure a detailed log of everyone handling evidence is maintained (Chain of Custody).");
    }
  }

  const chainOfCustodyMessage = lang === "si" 
    ? "සාක්ෂි භාර දීමේ දාමය (Chain of Custody) ආරක්ෂා කළ යුතුය: සෑම සාක්ෂි හුවමාරුවක්ම සටහන් කරගන්න."
    : "Chain of custody must be preserved: Keep a chronological record of everyone who handles physical or digital evidence.";

  return {
    needed,
    reasons,
    evidenceChecklist,
    chainOfCustodyMessage,
    recommendedProcedure
  };
}

// 10. Generate Case Conference Guidance
export function generateCaseConferenceGuidance(
  category: string,
  facts: ExtractedFacts,
  riskLevel: string
) {
  const lang = detectLanguage(facts.affectedChild || "");
  const needed = riskLevel === "emergency" || riskLevel === "high" || category === "domestic_violence_context";
  
  const reasons: string[] = [];
  const possibleAgencies: string[] = [];
  const purpose: string[] = [];

  if (needed) {
    if (lang === "si") {
      reasons.push("දරුවාට පවුල තුළින්ම තර්ජනයක් පවතින බැවින් බහු-ආයතනික මැදිහත්වීමක් අවශ්‍ය වේ.");
      reasons.push("දිගුකාලීන ආරක්ෂාව සහ පුනරුත්ථාපනය සැලසුම් කළ යුතුය.");
      
      possibleAgencies.push("පරිවාස නිලධාරී (Probation Officer)");
      possibleAgencies.push("ළමා අයිතිවාසිකම් ප්‍රවර්ධන නිලධාරී (CRPO)");
      possibleAgencies.push("පොලිස් ළමා හා කාන්තා කාර්යාංශය");
      possibleAgencies.push("NCPA නිලධාරීන්");
      
      purpose.push("දරුවාගේ ආරක්ෂිත නවාතැන්/පරිසරය තීරණය කිරීම.");
      purpose.push("නැවත අපයෝජනය වැළැක්වීම සඳහා නීතිමය හා සමාජයීය සැලසුම් සකස් කිරීම.");
    } else {
      reasons.push("The offender resides in close proximity, or the abuse is chronic, making multi-agency support vital.");
      reasons.push("Long-term security, legal protection, and rehabilitation planning are required.");
      
      possibleAgencies.push("Probation Officer");
      possibleAgencies.push("Child Rights Promotion Officer (CRPO)");
      possibleAgencies.push("Police Women and Children Bureau");
      possibleAgencies.push("National Child Protection Authority (NCPA)");
      
      purpose.push("Coordinate a safe alternative care placement for the child if the home is unsafe.");
      purpose.push("Establish a joint monitoring plan to prevent further abuse and prepare court reports.");
    }
  }

  return {
    needed,
    reasons,
    possibleAgencies,
    purpose
  };
}

// 11. Generate Counselling Support
export function generateCounsellingSupport(
  category: string,
  facts: ExtractedFacts,
  riskLevel: string,
  signsAndImpacts: any
) {
  const lang = detectLanguage(facts.affectedChild || "");
  const needed = riskLevel !== "low" || facts.counsellingNeedMentioned || signsAndImpacts.emotionalSigns.length > 0;
  
  const reasons: string[] = [];
  if (needed) {
    if (lang === "si") {
      reasons.push("දරුවා දැඩි චිත්තවේගීය කම්පනයකින්, බියකින් හෝ ආතතියකින් පසුවේ.");
      reasons.push("මනෝ-සමාජීය සහාය දරුවාගේ මානසික සුවයට උපකාරී වේ.");
    } else {
      reasons.push("The child shows signs of psychological trauma, fear, or emotional withdrawal.");
      reasons.push("Professional intervention is required to avoid long-term psychological impacts.");
    }
  }

  const supportData = COUNSELLING_SUPPORT[lang];

  return {
    needed,
    reasons,
    supportOptions: needed ? supportData.options : [],
    supportiveMessage: supportData.supportiveMessage
  };
}

// 12. Generate Next Actions
export function generateNextActions(result: Partial<RoadmapResult>): RoadmapResult["nextActions"] {
  const actions: RoadmapResult["nextActions"] = [];
  const lang = result.language || "en";
  const risk = result.riskAssessment?.riskLevel || "low";

  if (risk === "emergency") {
    actions.push({
      priority: "immediate",
      label: lang === "si" ? "1929 ඇමතීම" : "Call 1929 NCPA Helpline",
      description: lang === "si" ? "වහාම 1929 අමතා දරුවා බේරා ගැනීමට මැදිහත් වන ලෙස දන්වන්න." : "Report immediately to the National Child Protection Authority 24/7 hotline.",
      icon: "call"
    });
    actions.push({
      priority: "immediate",
      label: lang === "si" ? "රෝහල් ගත කිරීම" : "Take to Government Hospital",
      description: lang === "si" ? "දරුවාට බරපතළ තුවාල ඇත්නම් වහාම රෝහලකට ඇතුළත් කරන්න." : "Seek urgent medical treatment for serious injuries or sexual assault.",
      icon: "medkit"
    });
    actions.push({
      priority: "high",
      label: lang === "si" ? "පොලිසිය දැනුවත් කිරීම" : "Notify Police child desk",
      description: lang === "si" ? "ළඟම ඇති පොලිසියේ ළමා හා කාන්තා කාර්යාංශයට පැමිණිල්ලක් කරන්න." : "Report the incident to the local police Women & Children Desk.",
      icon: "shield"
    });
  } else if (risk === "high") {
    actions.push({
      priority: "immediate",
      label: lang === "si" ? "1929 ළමා ඇමතුම" : "Contact 1929 Helpline",
      description: lang === "si" ? "නම නොකියා වුවද සිද්ධිය NCPA වෙත වාර්තා කළ හැක." : "File an official complaint with the NCPA. Anonymity option is available.",
      icon: "call"
    });
    actions.push({
      priority: "high",
      label: lang === "si" ? "සාක්ෂි සුරක්ෂිත කිරීම" : "Preserve Digital/Physical Evidence",
      description: lang === "si" ? "මැසේජ්, ස්ක්‍රීන්ෂොට් හෝ ඇඳුම් වැනි සාක්ෂි ප්‍රවේශමෙන් තබා ගන්න." : "Keep all digital chat logs, screenshots, and physical evidence untouched.",
      icon: "folder"
    });
    actions.push({
      priority: "normal",
      label: lang === "si" ? "මනෝවිද්‍යාත්මක සහාය" : "Arrange Psychological support",
      description: lang === "si" ? "දරුවාගේ මානසික කම්පනය සමනය කිරීමට උපදේශකයෙකු හමුවන්න." : "Connect the child and caregiver with supportive counseling services.",
      icon: "heart"
    });
  } else {
    actions.push({
      priority: "normal",
      label: lang === "si" ? "නීතිමය උපදෙස් ලබා ගැනීම" : "Consult Legal Aid Commission",
      description: lang === "si" ? "වැඩිදුර නීති ආධාර සඳහා ශ්‍රී ලංකා නීති ආධාර කොමිෂන් සභාව අමතන්න." : "Reach out to Sri Lanka Legal Aid Commission for formal legal consultation.",
      icon: "book"
    });
    actions.push({
      priority: "normal",
      label: lang === "si" ? "දැනුවත් කිරීම් කියවීම" : "Read Child Rights Information",
      description: lang === "si" ? "ළමා ආරක්ෂණ නීති හා වැළැක්වීමේ ක්‍රම පිළිබඳ ලිපි කියවන්න." : "Educate yourself on child safety rights, laws, and prevention articles.",
      icon: "information-circle"
    });
  }

  return actions;
}

// 13. Build Roadmap Result Object
export function buildRoadmapResult(description: string, language?: "si" | "en"): RoadmapResult {
  const detectedLang = language || detectLanguage(description);
  const facts = extractFacts(description);
  const classification = classifyAbuse(description);
  const riskAssessment = assessRisk(description, facts, classification.primaryCategory, facts.riskFactors);
  const signsAndImpacts = detectSignsAndImpacts(description);
  const legalGuidance = {
    relevantLaws: mapRelevantLaws(classification.primaryCategory, facts, riskAssessment.riskLevel),
    disclaimer: detectedLang === "si" 
      ? "මෙය පොදු නීතිමය තොරතුරු පමණි. නිල උපදෙස් සඳහා කරුණාකර අදාළ බලධාරීන් හෝ සුදුසුකම් ලත් නීතිඥයෙකු සම්බන්ධ කර ගන්න."
      : "This is general legal guidance only. Please contact relevant authorities or a qualified legal professional for formal advice."
  };
  const medicalGuidance = generateMedicalGuidance(classification.primaryCategory, facts, riskAssessment.riskLevel);
  const medicoLegalGuidance = generateMedicoLegalGuidance(classification.primaryCategory, facts, riskAssessment.riskLevel);
  const caseConference = generateCaseConferenceGuidance(classification.primaryCategory, facts, riskAssessment.riskLevel);
  const counsellingSupport = generateCounsellingSupport(classification.primaryCategory, facts, riskAssessment.riskLevel, signsAndImpacts);

  // Combine into result structure
  const result: Partial<RoadmapResult> = {
    id: Math.random().toString(36).substring(7),
    language: detectedLang,
    userDescription: description,
    incidentSummary: detectedLang === "si" 
      ? `පරිශීලකයා විසින් දරුවෙකුට සිදුවූ බවට වාර්තා කළ සිද්ධිය: ${description.substring(0, 50)}...`
      : `User reported incident concerning child: ${description.substring(0, 50)}...`,
    extractedFacts: facts,
    classification,
    riskAssessment,
    signsAndImpacts,
    legalGuidance,
    medicalGuidance,
    medicoLegalGuidance,
    caseConference,
    counsellingSupport
  };

  result.nextActions = generateNextActions(result);

  return result as RoadmapResult;
}
