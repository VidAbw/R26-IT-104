import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RoadmapResult } from "../utils/legalRoadmapLogic";

interface Props {
  result: RoadmapResult | null;
  language: "en" | "si";
}

interface ChecklistItem {
  id: string;
  labelEn: string;
  labelSi: string;
}

export default function LegalDecisionRoadmap({ result, language }: Props) {

  // Track which checklist item is selected for detail display
  const [selectedItem, setSelectedItem] = useState<{ step: number; id: string }>({
    step: 3,
    id: "abuse_def",
  });

  // Track state for bottom counseling option clicks
  const [counselingTab, setCounselingTab] = useState<string | null>(null);

  if (!result) return null;

  const t = language === "si" ? {
    step1Title: "1. User Question / ඔබේ ප්‍රශ්නය",
    step1Prompt: "ඔබ විස්තර කරන ලද සිද්ධිය:",
    step2Title: "2. Detect Abuse Category / අදාළ කාණ්ඩය හඳුනාගැනීම",
    step2Prompt: "ඔබගේ විස්තරය අනුව පද්ධතිය අදාළ අපයෝජන වර්ගය හඳුනාගෙන ඇත.",
    categoriesLabel: "Abuse Categories / අපයෝජන කාණ්ඩ",
    guidanceTitle: "3. Get Personalized Guidance / පුද්ගලික මඟපෙන්වීම",
    actionsTitle: "4. Step-by-Step Actions / පියවරෙන් පියවර",
    legalTitle: "5. Legal Information / නීතිමය තොරතුරු",
    supportTitle: "6. Counseling & Support / උපදේශනය සහ සහාය",
    escalateTitle: "7. Escalate / Take Action / ක්‍රියාමාර්ග ගැනීම",
    notAloneTitle: "ඔබ තනිවම නොවේ. සහාය ලබාගත හැක.",
    notAloneSub: "කලින් ක්‍රියා කරන්න. ආරක්ෂිතව සිටින්න. ඔබේ දරුවා ආරක්ෂා කරන්න.",
    counselingOptionsTitle: "Counseling Options / උපදේශන විකල්ප",
    counselingTabs: {
      chat: "Chat with Counselor\n(Anonymous)",
      call: "Audio Call\n(If comfortable)",
      resources: "Self Help Resources",
      wellness: "Wellness Tips",
    },
    emergencyTitle: "Emergency? ඉක්මන් සහාය අවශ්‍යද?",
    emergencyCall: "Call 1929",
    emergencySub: "NCPA 24/7 Helpline\nජාතික ළමා ආරක්ෂක අධිකාරිය",
    trustBar: {
      bilingual: "Bilingual Support\nසිංහල | English",
      verified: "Verified Legal Info\nNCPA Verified Sources",
      offline: "Offline Access\nWorks without internet",
      childFriendly: "Child Friendly\nEasy to understand",
      confidential: "Secure & Confidential\nYour privacy is protected"
    },
    disclaimer: "නීතිමය වගකීම් සහතිකය: මෙම තොරතුරු මාර්ගෝපදේශ සඳහා පමණක් වන අතර වෘත්තීය නීති, වෛද්‍ය හෝ පොලිස් උපදෙස් සඳහා ආදේශකයක් නොවේ."
  } : {
    step1Title: "1. User Question / ඔබේ ප්‍රශ්නය",
    step1Prompt: "The incident description you provided:",
    step2Title: "2. Detect Abuse Category / අදාළ කාණ්ඩය හඳුනාගැනීම",
    step2Prompt: "System has identified the primary type of abuse based on your description.",
    categoriesLabel: "Abuse Categories / අපයෝජන කාණ්ඩ",
    guidanceTitle: "3. Get Personalized Guidance / පුද්ගලික මඟපෙන්වීම",
    actionsTitle: "4. Step-by-Step Actions / පියවරෙන් පියවර",
    legalTitle: "5. Legal Information / නීතිමය තොරතුරු",
    supportTitle: "6. Counseling & Support / උපදේශනය සහ සහාය",
    escalateTitle: "7. Escalate / Take Action / ක්‍රියාමාර්ග ගැනීම",
    notAloneTitle: "You are not alone. Help is available.",
    notAloneSub: "Act early. Stay safe. Protect your child.",
    counselingOptionsTitle: "Counseling Options / උපදේශන විකල්ප",
    counselingTabs: {
      chat: "Chat with Counselor\n(Anonymous)",
      call: "Audio Call\n(If comfortable)",
      resources: "Self Help Resources",
      wellness: "Wellness Tips",
    },
    emergencyTitle: "Emergency? ඉක්මන් සහාය අවශ්‍යද?",
    emergencyCall: "Call 1929",
    emergencySub: "NCPA 24/7 Helpline\nජාතික ළමා ආරක්ෂක අධිකාරිය",
    trustBar: {
      bilingual: "Bilingual Support\nසිංහල | English",
      verified: "Verified Legal Info\nNCPA Verified Sources",
      offline: "Offline Access\nWorks without internet",
      childFriendly: "Child Friendly\nEasy to understand",
      confidential: "Secure & Confidential\nYour privacy is protected"
    },
    disclaimer: "Legal Disclaimer: This information is for guidance only and not a substitute for professional legal, medical, or police advice."
  };

  // Abuse categories setup matching the mockup color scheme
  const categories = [
    { id: "physical_abuse", labelEn: "Physical Abuse", labelSi: "ශාරීරික අපයෝජනය", color: "#f97316", icon: "hand-left" },
    { id: "emotional_abuse", labelEn: "Emotional/Psychological Abuse", labelSi: "මානසික/චිත්තවේගීය අපයෝජනය", color: "#8b5cf6", icon: "brain" },
    { id: "sexual_abuse", labelEn: "Sexual Abuse", labelSi: "ලිංගික අපයෝජනය", color: "#ef4444", icon: "people" },
    { id: "neglect", labelEn: "Neglect", labelSi: "නොසලකා හැරීම", color: "#10b981", icon: "heart-dislike" },
    { id: "online_abuse", labelEn: "Online Abuse", labelSi: "මාර්ගගත අපයෝජනය", color: "#3b82f6", icon: "globe" },
    { id: "unknown", labelEn: "Other / Unknown", labelSi: "වෙනත් / නොදන්නා", color: "#64748b", icon: "help-circle" }
  ];

  // Checklist items for steps 3 to 7
  const step3Items: ChecklistItem[] = [
    { id: "abuse_def", labelEn: "What is this abuse?", labelSi: "මෙය කුමක්ද?" },
    { id: "child_rights", labelEn: "Your child's rights", labelSi: "දරුවාගේ අයිතිවාසිකම්" },
    { id: "related_laws", labelEn: "Related laws & articles", labelSi: "අදාළ නීති හා ව්‍යවස්ථා" },
    { id: "what_to_do", labelEn: "What you can do", labelSi: "ඔබට කළ හැකි දේ" },
    { id: "evidence_collect", labelEn: "Evidence you can collect", labelSi: "සාක්ෂි එකතු කළ හැකි දේ" }
  ];

  const step4Items: ChecklistItem[] = [
    { id: "what_first", labelEn: "What to do first", labelSi: "මුලින්ම කළ යුතු දේ" },
    { id: "who_inform", labelEn: "Who to inform", labelSi: "කවුරුන්ව දැනුවත් කළ යුතුද" },
    { id: "where_go", labelEn: "Where to go", labelSi: "කොහේද යන්න ඕන" },
    { id: "how_file", labelEn: "How to file a complaint", labelSi: "පැමිණිල්ලක් කරන්නේ කෙසේද" },
    { id: "imp_docs", labelEn: "Important documents", labelSi: "අවශ්‍ය ලේඛන" }
  ];

  const step5Items: ChecklistItem[] = [
    { id: "relevant_laws_info", labelEn: "Relevant laws", labelSi: "අදාළ නීති" },
    { id: "penalties_offender", labelEn: "Penalties for the offender", labelSi: "අපරාධකරුට දඬුවම්" },
    { id: "protection_orders", labelEn: "Protection orders", labelSi: "ආරක්ෂක නියෝග" },
    { id: "protection_mechanisms", labelEn: "Child protection mechanisms", labelSi: "ළමා ආරක්ෂණ යාන්ත්‍රණ" },
    { id: "legal_rights", labelEn: "Your legal rights", labelSi: "ඔබගේ නීතිමය අයිතිවාසිකම්" }
  ];

  const step6Items: ChecklistItem[] = [
    { id: "talk_counselor", labelEn: "Talk to a counselor", labelSi: "උපදේශකයෙකු සමඟ කතා කරන්න" },
    { id: "emotional_support", labelEn: "Emotional support for child & caregiver", labelSi: "දරුවාට හා රැකබලාගන්නාට මානසික සහාය" },
    { id: "coping_tips", labelEn: "Coping tips", labelSi: "සහනය ලබා ගන්නා මාර්ගෝපදේශ" },
    { id: "safe_space_building", labelEn: "Safe space & confidence building", labelSi: "ආරක්ෂිත වටපිටාව හා විශ්වාසය ගොඩනැගීම" }
  ];

  const step7Items: ChecklistItem[] = [
    { id: "file_complaint_action", labelEn: "File a complaint", labelSi: "පැමිණිල්ලක් කරන්න" },
    { id: "inform_authorities_action", labelEn: "Inform authorities", labelSi: "අදාළ නිලධාරීන්ට දැනුම් දීම" },
    { id: "get_legal_aid", labelEn: "Get legal aid", labelSi: "නීතිමය සහාය ලබාගන්න" },
    { id: "safety_measures", labelEn: "Protection & safety measures", labelSi: "ආරක්ෂාව හා ආරක්ෂණ විධිවිධාන" }
  ];

  const getStepTheme = (stepNum: number) => {
    switch (stepNum) {
      case 3: return { color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0", name: language === "si" ? "පුද්ගලික මඟපෙන්වීම" : "Personalized Guidance", icon: "book-outline" };
      case 4: return { color: "#3b82f6", bg: "#f0f7ff", border: "#bfdbfe", name: language === "si" ? "පියවරෙන් පියවර" : "Step-by-Step Actions", icon: "footsteps-outline" };
      case 5: return { color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe", name: language === "si" ? "නීතිමය තොරතුරු" : "Legal Information", icon: "hammer-outline" };
      case 6: return { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", name: language === "si" ? "උපදේශනය සහ සහාය" : "Counseling & Support", icon: "heart-outline" };
      case 7: return { color: "#ef4444", bg: "#fef2f2", border: "#fca5a5", name: language === "si" ? "ක්‍රියාමාර්ග ගැනීම" : "Escalate / Take Action", icon: "business-outline" };
      default: return { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", name: "Info", icon: "information-circle-outline" };
    }
  };

  const currentTheme = getStepTheme(selectedItem.step);

  const getDetailContent = () => {
    const isSinhala = language === "si";

    switch (selectedItem.id) {
      case "abuse_def":
        return {
          title: isSinhala ? "මෙය කුමක්ද? / Abuse Classification" : "What is this abuse?",
          description: result.classification.explanation,
          bullets: [
            isSinhala ? `ප්‍රධාන අපයෝජන වර්ගය: ${result.classification.primaryCategory.toUpperCase().replace("_", " ")}` : `Primary Category: ${result.classification.primaryCategory.toUpperCase().replace("_", " ")}`,
            isSinhala ? `අදාළ අමතර තත්ත්වයන්: ${result.classification.secondaryCategories.map(c => c.replace("_", " ")).join(", ") || "නැත"}` : `Secondary Context: ${result.classification.secondaryCategories.map(c => c.replace("_", " ")).join(", ") || "None"}`,
            isSinhala ? `පද්ධතිමය තහවුරුභාවය: ${(result.classification.confidence * 100).toFixed(0)}%` : `System Classification Confidence: ${(result.classification.confidence * 100).toFixed(0)}%`,
          ]
        };
      case "child_rights":
        return {
          title: isSinhala ? "දරුවාගේ අයිතිවාසිකම් / Your Child's Rights" : "Your Child's Rights",
          description: isSinhala 
            ? "ශ්‍රී ලංකා නීතිය සහ එක්සත් ජාතීන්ගේ ළමා අයිතිවාසිකම් ප්‍රඥප්තිය යටතේ දරුවා සතු අයිතිවාසිකම්:"
            : "Under Sri Lankan Law and the UN Convention on the Rights of the Child, the child has:",
          bullets: isSinhala ? [
            "කෲරත්වයෙන්, නොසලකා හැරීමෙන් සහ අපයෝජනයෙන් ආරක්ෂා වීමේ අයිතිය (ආණ්ඩුක්‍රම ව්‍යවස්ථාව සහ NCPA පනත).",
            "විමර්ශන සහ නඩු විභාග අතරතුර සියලු තොරතුරු රහසිගතව තබා ගැනීමේ අයිතිය (Victims and Witnesses Act).",
            "නඩු විභාගවලදී දරුවාට හිතකාමී සහ පීඩාකාරී නොවන පරිසරයක සාක්ෂි දීමේ අයිතිය (වීඩියෝ පටිගත කිරීම් මඟින්).",
            "විශේෂඥ වෛද්‍ය රැකවරණය සහ මානසික සුවතාවය සඳහා අවශ්‍ය උපදේශන පහසුකම් ලබාගැනීමේ අයිතිය."
          ] : [
            "Right to protection from all forms of cruelty, neglect, and exploitation (Constitution & NCPA Act).",
            "Right to privacy and absolute confidentiality during investigations and trial (Victims & Witnesses Protection Act).",
            "Right to give evidence in a safe, child-friendly environment (via video link under Evidence Special Provisions Act).",
            "Right to receive free specialized medical examinations and trauma-informed psychological counseling."
          ]
        };
      case "related_laws":
      case "relevant_laws_info":
        return {
          title: isSinhala ? "අදාළ නීති හා ව්‍යවස්ථා / Relevant Laws" : "Relevant Laws & Sections",
          description: isSinhala 
            ? "මෙම සිද්ධියට සෘජුවම අදාළ වන ශ්‍රී ලංකාවේ නීති සහ දණ්ඩ නීති සංග්‍රහයේ වගන්ති:"
            : "Laws and sections under Sri Lankan Penal Code and Acts applicable to this case:",
          customRender: (
            <View style={{ gap: 10, marginTop: 10 }}>
              {result.legalGuidance.relevantLaws.map((law, idx) => (
                <View key={idx} style={styles.lawDetailCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.lawDetailTitle}>{law.lawName}</Text>
                    {law.section && <Text style={styles.lawSectionBadge}>Section {law.section}</Text>}
                  </View>
                  <Text style={styles.lawDetailText}><Text style={{ fontWeight: "700" }}>Relevance:</Text> {law.whyRelevant}</Text>
                  <Text style={styles.lawDetailText}><Text style={{ fontWeight: "700" }}>Explanation:</Text> {law.simpleExplanation}</Text>
                  <Text style={[styles.lawDetailText, { color: "#1e3a8a", fontWeight: "600" }]}><Text style={{ fontWeight: "700" }}>Action:</Text> {law.recommendedAction}</Text>
                </View>
              ))}
              <Text style={styles.disclaimerMini}>{result.legalGuidance.disclaimer}</Text>
            </View>
          )
        };
      case "what_to_do":
        return {
          title: isSinhala ? "ඔබට කළ හැකි දේ / What You Can Do" : "What You Can Do",
          description: isSinhala 
            ? "දරුවාගේ උපරිම ආරක්ෂාව තහවුරු කිරීම සඳහා ඔබ වහාම කළ යුතු දේ:"
            : "Key actions you should take to ensure safety and start the formal process:",
          bullets: isSinhala ? [
            "දරුවා වහාම අනාරක්ෂිත වටපිටාවෙන් සහ සැකකරුගෙන් ඈත් කරන්න.",
            "දරුවාගේ ප්‍රකාශවලට සන්සුන්ව ඇහුම්කන් දෙන්න, කිසිවිටෙක දොස් නොකියන්න.",
            "ශාරීරික හෝ ලිංගික ප්‍රහාරයකදී, වෛද්‍ය සාක්ෂි සුරක්ෂිත කිරීමට දරුවා සේදීම හෝ පිරිසිදු කිරීම නොකරන්න.",
            "1929 උපකාරක අංකයට හෝ ප්‍රාදේශීය පොලිස් ළමා අංශයට සිද්ධිය වාර්තා කරන්න.",
            "සිද්ධියට අදාළ ඡායාරූප, පණිවිඩ සටහන්, හෝ සාක්ෂිකරුවන්ගේ තොරතුරු ලියා තබන්න."
          ] : [
            "Evacuate the child immediately from the threat environment and keep them away from the suspect.",
            "Listen to the child patiently, validate their experience, and assure them it is not their fault.",
            "Do not wash the child or change/wash their clothes in assault cases to preserve forensic physical evidence.",
            "Report the details immediately to the 1929 Child Helpline or the local Police Child and Women Desk.",
            "Preserve and store all digital evidence (screenshots, messages, call histories) securely."
          ]
        };
      case "evidence_collect":
        return {
          title: isSinhala ? "සාක්ෂි සුරක්ෂිත කිරීමේ ලැයිස්තුව / Evidence Collection" : "Evidence Preservation Checklist",
          description: result.medicoLegalGuidance.chainOfCustodyMessage,
          bullets: result.medicoLegalGuidance.evidenceChecklist.length > 0
            ? result.medicoLegalGuidance.evidenceChecklist
            : (isSinhala ? ["සිද්ධියට අදාළ ඡායාරූප, වීඩියෝ හෝ පණිවිඩ සටහන්.", "දරුවා පැළඳ සිටි ඇඳුම් පිරිසිදු නොකර මුද්‍රා තැබූ බෑගයක තැබීම.", "ඇසින් දුටු සාක්ෂිකරුවන් සිටී නම් ඔවුන්ගේ විස්තර."] : ["Digital evidence (screenshots, photos, chat records).", "Unwashed clothes in a sealed paper bag (for forensic testing).", "List of eyewitnesses and dates/times of the incident."])
        };
      case "what_first":
        return {
          title: isSinhala ? "මුලින්ම කළ යුතු දේ / First Priority Actions" : "What to Do First",
          description: isSinhala 
            ? "හඳුනාගත් අවදානම් මට්ටම අනුව ක්ෂණිකව ක්‍රියාත්මක කළ යුතු පියවර:"
            : "High priority safety actions generated from risk assessment:",
          customRender: (
            <View style={{ gap: 8, marginTop: 8 }}>
              {result.nextActions.map((act, idx) => (
                <View key={idx} style={[styles.actionCardInline, { borderLeftColor: act.priority === "immediate" ? "#ef4444" : "#3b82f6" }]}>
                  <Text style={styles.actionCardLabel}>{act.label}</Text>
                  <Text style={styles.actionCardDesc}>{act.description}</Text>
                </View>
              ))}
            </View>
          )
        };
      case "who_inform":
        return {
          title: isSinhala ? "කවුරුන්ව දැනුවත් කළ යුතුද / Who to Inform" : "Who to Inform",
          description: isSinhala
            ? "ළමා ආරක්ෂාව පිළිබඳව වගකීම පැවරී ඇති නිල ආයතන සහ සම්බන්ධීකරණ නිලධාරීන්:"
            : "Authorized agencies responsible for child protection and case conference handling in Sri Lanka:",
          bullets: isSinhala ? [
            "ජාතික ළමා ආරක්ෂක අධිකාරිය (NCPA): 1929 උපකාරක අංකය ඔස්සේ 24/7 සම්බන්ධ වන්න.",
            "ශ්‍රී ලංකා පොලිසිය: 119 හදිසි ඇමතුම් හෝ ආසන්නතම පොලිස් ස්ථානයේ ළමා හා කාන්තා කාර්යාංශය (Women & Children Desk).",
            "පරිවාස හා ළමාරක්ෂක සේවා දෙපාර්තමේන්තුව: ප්‍රාදේශීය පරිවාස නිලධාරියා (Shelter & Welfare placement සඳහා).",
            "Divisional Secretariat (Divi. Sec.): ළමා අයිතිවාසිකම් ප්‍රවර්ධන නිලධාරීන් (CRPO) සහ ළමා ආරක්ෂක නිලධාරීන්."
          ] : [
            "National Child Protection Authority (NCPA): Call 1929 Child Helpline (confidential, 24/7).",
            "Sri Lanka Police: Call 119 or report to the Children & Women Bureau desk at the nearest police station.",
            "Department of Probation and Child Care Services: Contact local Probation Officer for child protection/shelter.",
            "Divisional Secretariat: Contact Child Rights Promotion Officer (CRPO) for psychosocial and legal follow-up."
          ]
        };
      case "where_go":
        return {
          title: isSinhala ? "කොහේද යන්න ඕන / Medical & Reporting Venues" : "Where to Go",
          description: result.medicalGuidance.needed 
            ? (isSinhala ? "වෛද්‍ය සහ අධිකරණ වෛද්‍ය සහාය සඳහා වහාම යොමුවිය යුතු ස්ථාන:" : "Identified venues for emergency medical and forensic protection:")
            : (isSinhala ? "සිද්ධිය වාර්තා කිරීමට සහ මූලික උපදෙස් ලබාගැනීමට යා යුතු ස්ථාන:" : "Standard locations to visit for child abuse reporting and guidance:"),
          bullets: result.medicalGuidance.needed ? (
            isSinhala ? [
              "ආසන්නතම රජයේ රෝහල (Government Hospital) - ළමා වාට්ටුව හෝ හදිසි අංශය (OPD).",
              "රෝහල් අධිකරණ වෛද්‍ය නිලධාරී (JMO) කාර්යාලය (forensic examination සඳහා).",
              "පොලිස් ස්ථානයේ ළමා හා කාන්තා අංශය (පැමිණිල්ල සටහන් කර JMO වෙත යොමු කරන MLEF පත්‍රිකාව ලබාගැනීමට)."
            ] : [
              "Emergency/Outpatient Department (OPD) of the nearest Government Hospital.",
              "Judicial Medical Officer (JMO) division at the provincial/base hospital for formal forensic evaluation.",
              "The local Police Station's Child and Women Desk to file the report and obtain the Medico-Legal Entry Form (MLEF)."
            ]
          ) : (
            isSinhala ? [
              "ප්‍රාදේශීය පොලිස් ස්ථානයේ ළමා හා කාන්තා කාර්යාංශය.",
              "Division Secretariat හි ළමා අයිතිවාසිකම් ප්‍රවර්ධන කාර්යාලය.",
              "Sumithrayo හෝ Shanthi Maargam වැනි සහන සේවා ආයතන (උපදේශනය සඳහා)."
            ] : [
              "The local Police Station child help desk.",
              "The nearest Divisional Secretariat Office to contact a CRPO/CPO.",
              "Psychosocial support centers (Sumithrayo or Shanthi Maargam) for counseling."
            ]
          )
        };
      case "how_file":
        return {
          title: isSinhala ? "පැමිණිල්ලක් කරන්නේ කෙසේද / Filing a Complaint" : "How to File a Complaint",
          description: isSinhala 
            ? "පොලිසියේ පැමිණිල්ලක් සටහන් කිරීමේ නිවැරදි පියවර මාලාව:"
            : "Correct procedure steps to file a formal child abuse complaint with the police:",
          bullets: isSinhala ? [
            "ළමා හා කාන්තා කාර්යාංශයේ (Women & Children Desk) නිලධාරියෙකු ඉදිරියේ ප්‍රකාශය ලබා දෙන්න.",
            "දරුවාට හිතකාමී සහ පීඩනයක් නොමැති වටපිටාවක statement එක සටහන් කිරීමට ඉල්ලා සිටින්න.",
            "ශාරීරික හෝ ලිංගික හානි ඇත්නම්, පොලිසියෙන් 'Medico-Legal Entry Form' (MLEF) පත්‍රිකාව නිකුත් කරන ලෙස ඉල්ලා සිටින්න (එය JMO වෙත ඉදිරිපත් කළ යුතුය).",
            "පැමිණිල්ලේ අංකය (Complaint Reference Number) සහ සටහන් කරගත් නිලධාරියාගේ නම ලියා තබා ගන්න.",
            "ප්‍රකාශයේ පිටපතක් හෝ අංකයක් ලබා දෙන තුරු ස්ථානයෙන් පිටවීමෙන් වළකින්න."
          ] : [
            "Request to speak with a dedicated officer from the Children & Women Bureau desk.",
            "Ensure the statement is recorded in a calm, non-threatening, child-friendly setting.",
            "In physical/sexual abuse cases, request a Medico-Legal Entry Form (MLEF) to authorize JMO forensic testing.",
            "Record the Complaint Reference Number and the name/badge number of the recording officer.",
            "Request a copy of the recorded statement or a formal reference receipt before leaving."
          ]
        };
      case "imp_docs":
        return {
          title: isSinhala ? "අවශ්‍ය ලේඛන / Important Documents" : "Important Documents Checklist",
          description: isSinhala
            ? "පැමිණිල්ලක් ඉදිරිපත් කිරීමේදී හෝ වෛද්‍ය පරීක්ෂණවලට යාමේදී සූදානම් කරගත යුතු ලේඛන:"
            : "Documents to prepare for hospital admission, forensic tests, and police investigations:",
          bullets: isSinhala ? [
            "දරුවාගේ උප්පැන්න සහතිකය (Birth Certificate) - වයස තීරණාත්මක සාධකයකි.",
            "රෝහල් OPD කාඩ්පත, වෛද්‍ය වාර්තා හෝ ඖෂධ සටහන්.",
            "පොලිසිය විසින් නිකුත් කරන ලද MLEF පත්‍රිකාව.",
            "මාර්ගගත අපයෝජනයකදී අදාළ වන පරිගණක පිටපත්, screenshots, හෝ දුරකථන සටහන්."
          ] : [
            "Child's Birth Certificate (essential to verify minor age).",
            "Medical files, prescription sheets, or hospital admission cards.",
            "The Medico-Legal Entry Form (MLEF) issued by the police.",
            "Printed screenshots, text logs, photos, or digital message reports (for online abuse)."
          ]
        };
      case "penalties_offender":
        return {
          title: isSinhala ? "අපරාධකරුට දඬුවම් / Offender Penalties" : "Penalties for the Offender",
          description: isSinhala 
            ? "දණ්ඩ නීති සංග්‍රහය යටතේ අපරාධ වැරදි සඳහා පනවා ඇති දඬුවම්:"
            : "Sentences prescribed by Sri Lankan penal statutes for the offences:",
          bullets: isSinhala ? [
            "308A වගන්තිය (ළමා කෲරත්වය): අවම 2 සිට උපරිම 10 දක්වා බරපතළ වැඩ සහිත සිර දඬුවම්, දඩය සහ වන්දි.",
            "363 වගන්තිය (ස්ත්‍රී දූෂණය): අවම 10 සිට උපරිම 20 දක්වා සිර දඬුවම්, දඩය සහ වන්දි.",
            "365B වගන්තිය (බරපතළ ලිංගික අපයෝජනය): අවම 7 සිට උපරිම 20 දක්වා සිර දඬුවම් සහ දඩ.",
            "286A වගන්තිය (අසභ්‍ය ප්‍රකාශන): වසර 2 සිට 5 දක්වා සිර දඬුවම් සහ දඩ."
          ] : [
            "Section 308A (Cruelty to Children): Imprisonment for 2 to 10 years, fine, and compensation.",
            "Section 363 (Rape): Mandatory minimum 10 years up to 20 years imprisonment, fine, and compensation.",
            "Section 365B (Grave Sexual Abuse): Imprisonment for 7 to 20 years, fine, and compensation.",
            "Section 286A (Obscene publication of minors): Imprisonment for 2 to 5 years and fine."
          ]
        };
      case "protection_orders":
        return {
          title: isSinhala ? "ආරක්ෂක නියෝග / Protection Orders" : "Magistrate Protection Orders",
          description: isSinhala
            ? "2005 අංක 34 දරන ගෘහස්ථ ප්‍රචණ්ඩත්වය වැළැක්වීමේ පනත යටතේ ආරක්ෂක නියෝග:"
            : "Safety measures available under the Prevention of Domestic Violence Act No. 34 of 2005:",
          bullets: isSinhala ? [
            "මහේස්ත්‍රාත් අධිකරණයෙන් තාවකාලික ආරක්ෂක නියෝගයක් (Interim Protection Order) ලබා ගැනීමට අයදුම් කළ හැකිය.",
            "මෙම නියෝගය මඟින් අපරාධකරුට දරුවා සිටින නිවසට, පාසලට හෝ ක්‍රීඩා පිටියට ඇතුළු වීම අධිකරණයෙන් තහනම් කරයි.",
            "සන්නිවේදනය හෝ දුරකථන සම්බන්ධතා පැවැත්වීම සපුරා තහනම් කරනු ලැබේ."
          ] : [
            "An application can be filed in the Magistrate's Court for a Protection Order.",
            "The order legally bars the perpetrator from entering the child's residence, school, or safe care area.",
            "It prohibits the suspect from contacting, calling, or messaging the child in any form."
          ]
        };
      case "protection_mechanisms":
        return {
          title: isSinhala ? "ළමා ආරක්ෂණ යාන්ත්‍රණ / Protection Support Networks" : "Child Protection Mechanisms",
          description: isSinhala
            ? "දරුවා ආරක්ෂා කිරීමට ක්‍රියා කරන ප්‍රධාන රාජ්‍ය යාන්ත්‍රණයන්:"
            : "State infrastructure coordinating child care, protection, and legal support in Sri Lanka:",
          bullets: isSinhala ? [
            "ජාතික ළමා ආරක්ෂක අධිකාරිය (NCPA): 1929 උපකාරක සේවය සහ සිද්ධි අධීක්ෂණය.",
            "පරිවාස හා ළමාරක්ෂක සේවා දෙපාර්තමේන්තුව: තාවකාලික නවාතැන් හා පරිවාස රැකවරණය.",
            "ළමා අයිතිවාසිකම් ප්‍රවර්ධන නිලධාරීන් (CRPO) සහ ළමා ආරක්ෂක නිලධාරීන්.",
            "රෝහල් අධිකරණ වෛද්‍ය නිලධාරී (JMO): වෛද්‍ය සහ අධිකරණ වෛද්‍ය සාක්ෂි ලේඛනගත කිරීම."
          ] : [
            "NCPA: Coordinates child abuse investigation monitoring and running the 1929 helpline.",
            "Department of Probation: Coordinates safe houses and shelter placements.",
            "Child Rights Promotion Officers (CRPOs) at the Divisional Secretariats.",
            "JMO: Provides formal medico-legal expert evidence."
          ]
        };
      case "legal_rights":
        return {
          title: isSinhala ? "ඔබගේ නීතිමය අයිතිවාසිකම් / Core Legal Rights" : "Your Legal Rights",
          description: isSinhala
            ? "විමර්ශන සහ නඩු විභාග අතරතුර දරුවා සහ භාරකරුවන් සතු අයිතිවාසිකම්:"
            : "Core rights guaranteed to child victims and witnesses during investigation and trial:",
          bullets: isSinhala ? [
            "රහස්‍යභාවය රැකීම: දරුවාගේ තොරතුරු හෝ ඡායාරූප මාධ්‍ය මඟින් හෙළි කිරීම සපුරා තහනම් වේ.",
            "නොමිලේ නීති සහාය: නීති ආධාර කොමිෂන් සභාව (Legal Aid Commission) මඟින් ලබාගත හැකිය.",
            "ළමා හිතකාමී සාක්ෂි දීම: උසාවියේදී වීඩියෝ සම්බන්ධතා හෝ රහස් තිර භාවිතා කිරීමේ අයිතිය."
          ] : [
            "Confidentiality: Publishing the child's identity or school in media is strictly prohibited.",
            "Free Legal Counsel: Available through the Legal Aid Commission of Sri Lanka.",
            "Child-sensitive evidence recording: Right to give testimony via live video link."
          ]
        };
      case "talk_counselor":
        return {
          title: isSinhala ? "උපදේශකයෙකු සමඟ කතා කරන්න / Psychological Support" : "Psychological Counseling Support",
          description: result.counsellingSupport.supportiveMessage,
          bullets: result.counsellingSupport.supportOptions.length > 0
            ? result.counsellingSupport.supportOptions
            : (isSinhala ? ["1929 NCPA මනෝ-සමාජීය අංශයෙන් නොමිලේ උපදේශනය.", "Shanthi Maargam ආයතනය සම්බන්ධ කර ගැනීම (077 722 2888).", "Sumithrayo සහන සේවය (011 2 682535)."] : ["NCPA Psychosocial Division direct referral.", "Shanthi Maargam Youth Line (077 722 2888).", "Sumithrayo Mental Health Support (011 2 682535)."])
        };
      case "emotional_support":
        return {
          title: isSinhala ? "දරුවාට හා රැකබලාගන්නාට මානසික සහාය / Caregiver Reassurance" : "Psychosocial Support Guidelines",
          description: isSinhala 
            ? "දරුවා කම්පනයෙන් මුදවා ගැනීමට පවුලේ සාමාජිකයන් වශයෙන් ලබා දිය හැකි සහාය:"
            : "Crucial emotional guidance for caregivers to protect the child's recovery:",
          bullets: isSinhala ? [
            "දරුවාට සවන් දෙන්න: දරුවා පවසන දේ අවිශ්වාස නොකර, සන්සුන්ව අසා සිටින්න.",
            "වරද පැටවීමෙන් වළකින්න: සිදු වූ දෙයට දරුවා කිසිසේත් වගකිව යුතු නොවන බව පවසන්න.",
            "භාරකරුගේ මානසික ස්ථාවරත්වය: දරුවා ඉදිරියේ භාරකරුවන් කලබල වීම පාලනය කරගන්න."
          ] : [
            "Reassure safety: Remind the child that they did nothing wrong and are safe now.",
            "Avoid repetitive questioning: Do not force the child to recount details of the incident.",
            "Maintain caregiver calm: Ensure parents manage their own stress in front of the child."
          ]
        };
      case "coping_tips":
        return {
          title: isSinhala ? "සහනය ලබා ගන්නා මාර්ගෝපදේශ / Coping and Self-Regulation" : "Coping Tips for the Child",
          description: isSinhala
            ? "කම්පනකාරී අවස්ථාවලදී දරුවාගේ මනස සන්සුන් කිරීමට භාවිතා කළ හැකි අභ්‍යාස:"
            : "Evidence-based coping strategies to manage panic or fear episodes:",
          bullets: isSinhala ? [
            "දීර්ඝ හුස්ම ගැනීමේ අභ්‍යාසය: තත්පර 4ක් හුස්ම ගන්න, තත්පර 4ක් රඳවන්න, තත්පර 4ක් පිට කරන්න.",
            "Grounding අභ්‍යාසය (5-4-3-2-1 ක්‍රමය): පෙනෙන දේ 5ක්, ඇල්ලිය හැකි 4ක්, ඇසෙන ශබ්ද 3ක්, සුවඳ 2ක්, රස 1ක් නම් කරන්න.",
            "ස්ථාවර දිනචරියාවක් පවත්වා ගැනීම: නින්ද, ආහාර සහ සෙල්ලම් කරන වේලාවන් ස්ථාවරව තැබීම.",
            "චිත්‍ර ඇඳීම: දරුවාට තම හැඟීම් චිත්‍ර මඟින් ප්‍රකාශ කිරීමට දිරිගැන්වීම."
          ] : [
            "Box Breathing: Inhale for 4 seconds, hold for 4, exhale for 4. Repeat 5 times.",
            "5-4-3-2-1 Grounding: Name 5 things seen, 4 touched, 3 heard, 2 smelled, and 1 tasted.",
            "Consistent Routine: Restoring normal schedules for meals, school, and bedtimes.",
            "Creative expression: Draw or write down feelings without strict guidelines."
          ]
        };
      case "safe_space_building":
        return {
          title: isSinhala ? "ආරක්ෂිත වටපිටාව හා විශ්වාසය ගොඩනැගීම / Building Safety Zones" : "Safe Space & Confidence Building",
          description: isSinhala
            ? "දරුවාට සුරක්ෂිත පරිසරයක් නිවස තුළ නිර්මාණය කිරීමේ පියවර:"
            : "Actionable directions to restore confidence inside the household:",
          bullets: isSinhala ? [
            "අපරාධකරුට දරුවා වෙත ළඟා විය හැකි මාර්ග සීමා කරන්න (තර්ජන ඇත්නම් තාවකාලිකව වෙනත් තැනකට යන්න).",
            "දරුවාට තනිවම කුඩා තීරණ ගැනීමට ඉඩ දෙන්න (ආත්ම විශ්වාසය වැඩීමට).",
            "දරුවා තනිවම අනාරක්ෂිත වටපිටාවක රඳවා තැබීමෙන් වළකින්න."
          ] : [
            "Restrict perpetrator access: Prevent physical access or relocate temporarily if needed.",
            "Encourage small choices: Build agency by letting the child choose daily activities.",
            "Avoid isolation: Ensure the child does not feel abandoned or left alone in dark spaces."
          ]
        };
      case "file_complaint_action":
        return {
          title: isSinhala ? "පැමිණිල්ලක් කරන්න / File a Police Complaint" : "Filing a Complaint",
          description: isSinhala 
            ? "පැමිණිල්ලක් සටහන් කිරීම සඳහා වහාම ක්‍රියාත්මක වන්න:"
            : "Immediate steps to file a formal complaint at the nearest police station:",
          bullets: isSinhala ? [
            "පොලිස් ළමා හා කාන්තා අංශයේ නිලධාරියෙකු හමුවී පැමිණිල්ල ලියාපදිංචි කරන්න.",
            "පැමිණිල්ල සටහන් කරගත් Reference අංකය (CIB අංකය) අනිවාර්යයෙන්ම ලබා ගන්න.",
            "තුවාල ඇත්නම්, රෝහල් JMO හමුවීමට MLEF පත්‍රිකාව පොලිසියෙන් ඉල්ලා ගන්න."
          ] : [
            "Locate the dedicated Children & Women Bureau desk at the nearest police station.",
            "Obtain the formal Complaint Reference Number (CIB Number) for tracking.",
            "Request the police officer to issue the Medico-Legal Entry Form (MLEF) for forensic examination."
          ]
        };
      case "inform_authorities_action":
        return {
          title: isSinhala ? "අදාළ නිලධාරීන්ට දැනුම් දීම / Notify Authorities" : "Notify National Authorities",
          description: isSinhala
            ? "නඩු විමර්ශන ප්‍රමාද වන්නේ නම් හෝ තර්ජන එල්ල වන්නේ නම් සම්බන්ධ කරගත යුතු ආයතන:"
            : "Authorized departments to notify for caseload support or witness protection:",
          bullets: isSinhala ? [
            "ජාතික ළමා ආරක්ෂක අධිකාරියේ (NCPA) සභාපති කාර්යාලය: 011 2 778911.",
            "සාක්ෂිකරුවන් ආරක්ෂා කිරීමේ ජාතික කොට්ඨාසය (Witness Protection Division): 011 2 676034.",
            "ශ්‍රී ලංකා CERT (මාර්ගගත අපරාධ සඳහා): 011 2 691692."
          ] : [
            "NCPA Complaints & Investigations Monitoring Division: 011 2 778911.",
            "National Witness Protection Authority: Call 011 2 676034 if suspect threatens you.",
            "Sri Lanka CERT for digital abuse removal/blocking support: 011 2 691692."
          ]
        };
      case "get_legal_aid":
        return {
          title: isSinhala ? "නීතිමය සහාය ලබාගන්න / Legal Aid Commission" : "Request Free Legal Aid",
          description: isSinhala
            ? "නොමිලේ නීති උපදෙස් සහ අධිකරණ නියෝජනය ලබාගත හැකි රාජ්‍ය ආයතනය:"
            : "Free legal representation resources for families of child victims in Sri Lanka:",
          bullets: isSinhala ? [
            "ශ්‍රී ලංකා නීති ආධාර කොමිෂන් සභාව (Legal Aid Commission) සම්බන්ධ කරගන්න.",
            "ප්‍රධාන කාර්යාලය: අලුත්කඩේ උසාවි සංකීර්ණය, කොළඹ 12. දුරකථන: 011 2 433618.",
            "දිවයින පුරා පිහිටි අධිකරණ සංකීර්ණ තුළ ඇති LAC ශාඛා මඟින් සහාය ලබාගත හැකිය."
          ] : [
            "Contact the Legal Aid Commission of Sri Lanka (LAC) for free legal support.",
            "LAC Headquarters: Hulftsdorp Court Complex, Colombo 12. Tel: 011 2 433618.",
            "LAC has 84+ regional branches inside district court premises island-wide."
          ]
        };
      case "safety_measures":
        return {
          title: isSinhala ? "ආරක්ෂාව හා ආරක්ෂණ විධිවිධාන / Crisis Shelter & Safety" : "Emergency Safety Measures",
          description: isSinhala
            ? "දරුවාට ක්ෂණික අනතුරක් ඇති විට ගත යුතු හදිසි ආරක්ෂක පියවර:"
            : "Critical emergency steps if the child's life is under immediate threat:",
          bullets: isSinhala ? [
            "වහාම 119 (පොලිසිය) හෝ 1929 (NCPA) අමතා ක්ෂණික ගලවා ගැනීමේ සහාය ඉල්ලා සිටින්න.",
            "සැකකරු ගෘහස්ථ සාමාජිකයෙකු නම්, දරුවා සමඟ වහාම ආරක්ෂිත ඥාතියෙකුගේ නිවසකට හෝ රජයේ පරිවාස නිවාසයකට මාරු වන්න.",
            "අත්‍යවශ්‍ය ලේඛන (උප්පැන්න සහතිකය, ඖෂධ) අඩංගු හදිසි බෑගයක් සූදානම්ව තබා ගන්න."
          ] : [
            "Call 119 (Police) or 1929 (NCPA) immediately for emergency rescue.",
            "Relocate with the child immediately to a secure relative's home or a state crisis shelter.",
            "Keep an emergency file ready containing birth certificates and identity card documents."
          ]
        };

      default:
        return {
          title: isSinhala ? "තොරතුරු" : "Information",
          description: isSinhala ? "කරුණාකර ඉහත පියවරවලින් එකක් තෝරන්න." : "Please select one of the checklist items."
        };
    }
  };

  const detailData = getDetailContent();
  const activeCategory = result.classification.primaryCategory;

  return (
    <View style={styles.container}>
      {/* 1. User Question */}
      <View style={styles.stepCard}>
        <View style={styles.stepCardHeader}>
          <View style={[styles.stepBadge, { backgroundColor: "#2563eb" }]}>
            <Text style={styles.stepBadgeText}>1</Text>
          </View>
          <View>
            <Text style={styles.stepCardTitle}>{t.step1Title}</Text>
            <Text style={styles.stepCardSubtitle}>{t.step1Prompt}</Text>
          </View>
        </View>
        <View style={styles.inputSummaryBox}>
          <Text style={styles.inputSummaryText}>{result.userDescription}</Text>
        </View>
      </View>

      {/* 2. Detect Abuse Category */}
      <View style={styles.stepCard}>
        <View style={styles.stepCardHeader}>
          <View style={[styles.stepBadge, { backgroundColor: "#8b5cf6" }]}>
            <Text style={styles.stepBadgeText}>2</Text>
          </View>
          <View>
            <Text style={styles.stepCardTitle}>{t.step2Title}</Text>
            <Text style={styles.stepCardSubtitle}>{t.step2Prompt}</Text>
          </View>
        </View>

        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesLabel}>{t.categoriesLabel}</Text>
          <View style={styles.categoriesList}>
            {categories.map((cat) => {
              const isSystemMatched = cat.id === activeCategory || 
                result.classification.secondaryCategories.includes(cat.id);
              
              return (
                <View 
                  key={cat.id} 
                  style={[
                    styles.categoryRow, 
                    isSystemMatched ? { 
                      borderColor: cat.color, 
                      backgroundColor: cat.color + "0d",
                      borderWidth: 2 
                    } : styles.categoryRowInactive
                  ]}
                >
                  <View style={styles.categoryInfo}>
                    <View style={[
                      styles.categoryIconCircle, 
                      { backgroundColor: isSystemMatched ? cat.color : "#f1f5f9" }
                    ]}>
                      <Ionicons 
                        name={cat.icon as any} 
                        size={14} 
                        color={isSystemMatched ? "#fff" : "#94a3b8"} 
                      />
                    </View>
                    <Text style={[
                      styles.categoryText, 
                      isSystemMatched ? { color: "#1f2937", fontWeight: "700" } : styles.categoryTextInactive
                    ]}>
                      {language === "si" ? cat.labelSi : cat.labelEn}
                    </Text>
                  </View>
                  {isSystemMatched && (
                    <View style={[styles.checkCircle, { backgroundColor: cat.color }]}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Stack of Steps 3 to 7 (Accordion items) */}
      <View style={styles.gridFlow}>
        
        {/* Step 3: Get Personalized Guidance */}
        <View style={styles.gridColumn}>
          <View style={[styles.gridColumnHeader, { borderTopColor: "#10b981" }]}>
            <View style={[styles.gridStepBadge, { backgroundColor: "#10b981" }]}>
              <Text style={styles.gridStepBadgeText}>3</Text>
            </View>
            <Text style={styles.gridColumnTitle}>{t.guidanceTitle}</Text>
          </View>
          <View style={styles.gridItemsList}>
            {step3Items.map((item) => {
              const isSelected = selectedItem.step === 3 && selectedItem.id === item.id;
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.checklistItem, isSelected && styles.checklistItemActive]}
                  onPress={() => setSelectedItem({ step: 3, id: item.id })}
                >
                  <View style={[styles.checkboxCircle, isSelected && { backgroundColor: "#10b981", borderColor: "#10b981" }]}>
                    {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={[styles.checklistItemText, isSelected && styles.checklistItemTextActive]}>
                    {language === "si" ? item.labelSi : item.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Step 4: Step-by-Step Actions */}
        <View style={styles.gridColumn}>
          <View style={[styles.gridColumnHeader, { borderTopColor: "#3b82f6" }]}>
            <View style={[styles.gridStepBadge, { backgroundColor: "#3b82f6" }]}>
              <Text style={styles.gridStepBadgeText}>4</Text>
            </View>
            <Text style={styles.gridColumnTitle}>{t.actionsTitle}</Text>
          </View>
          <View style={styles.gridItemsList}>
            {step4Items.map((item) => {
              const isSelected = selectedItem.step === 4 && selectedItem.id === item.id;
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.checklistItem, isSelected && styles.checklistItemActive]}
                  onPress={() => setSelectedItem({ step: 4, id: item.id })}
                >
                  <View style={[styles.checkboxCircle, isSelected && { backgroundColor: "#3b82f6", borderColor: "#3b82f6" }]}>
                    {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={[styles.checklistItemText, isSelected && styles.checklistItemTextActive]}>
                    {language === "si" ? item.labelSi : item.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Step 5: Legal Information */}
        <View style={styles.gridColumn}>
          <View style={[styles.gridColumnHeader, { borderTopColor: "#8b5cf6" }]}>
            <View style={[styles.gridStepBadge, { backgroundColor: "#8b5cf6" }]}>
              <Text style={styles.gridStepBadgeText}>5</Text>
            </View>
            <Text style={styles.gridColumnTitle}>{t.legalTitle}</Text>
          </View>
          <View style={styles.gridItemsList}>
            {step5Items.map((item) => {
              const isSelected = selectedItem.step === 5 && selectedItem.id === item.id;
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.checklistItem, isSelected && styles.checklistItemActive]}
                  onPress={() => setSelectedItem({ step: 5, id: item.id })}
                >
                  <View style={[styles.checkboxCircle, isSelected && { backgroundColor: "#8b5cf6", borderColor: "#8b5cf6" }]}>
                    {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={[styles.checklistItemText, isSelected && styles.checklistItemTextActive]}>
                    {language === "si" ? item.labelSi : item.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Step 6: Counseling & Support */}
        <View style={styles.gridColumn}>
          <View style={[styles.gridColumnHeader, { borderTopColor: "#f59e0b" }]}>
            <View style={[styles.gridStepBadge, { backgroundColor: "#f59e0b" }]}>
              <Text style={styles.gridStepBadgeText}>6</Text>
            </View>
            <Text style={styles.gridColumnTitle}>{t.supportTitle}</Text>
          </View>
          <View style={styles.gridItemsList}>
            {step6Items.map((item) => {
              const isSelected = selectedItem.step === 6 && selectedItem.id === item.id;
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.checklistItem, isSelected && styles.checklistItemActive]}
                  onPress={() => setSelectedItem({ step: 6, id: item.id })}
                >
                  <View style={[styles.checkboxCircle, isSelected && { backgroundColor: "#f59e0b", borderColor: "#f59e0b" }]}>
                    {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={[styles.checklistItemText, isSelected && styles.checklistItemTextActive]}>
                    {language === "si" ? item.labelSi : item.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Step 7: Escalate / Take Action */}
        <View style={styles.gridColumn}>
          <View style={[styles.gridColumnHeader, { borderTopColor: "#ef4444" }]}>
            <View style={[styles.gridStepBadge, { backgroundColor: "#ef4444" }]}>
              <Text style={styles.gridStepBadgeText}>7</Text>
            </View>
            <Text style={styles.gridColumnTitle}>{t.escalateTitle}</Text>
          </View>
          <View style={styles.gridItemsList}>
            {step7Items.map((item) => {
              const isSelected = selectedItem.step === 7 && selectedItem.id === item.id;
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.checklistItem, isSelected && styles.checklistItemActive]}
                  onPress={() => setSelectedItem({ step: 7, id: item.id })}
                >
                  <View style={[styles.checkboxCircle, isSelected && { backgroundColor: "#ef4444", borderColor: "#ef4444" }]}>
                    {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={[styles.checklistItemText, isSelected && styles.checklistItemTextActive]}>
                    {language === "si" ? item.labelSi : item.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

      </View>

      {/* Dynamic Detailed Information Box */}
      <View style={[
        styles.detailsPanel, 
        { borderColor: currentTheme.color, backgroundColor: currentTheme.bg }
      ]}>
        <View style={[styles.detailsHeader, { borderBottomColor: currentTheme.border }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={[styles.detailsHeaderIconBox, { backgroundColor: currentTheme.color }]}>
              <Ionicons name={currentTheme.icon as any} size={18} color="#fff" />
            </View>
            <Text style={[styles.detailsHeaderTitle, { color: currentTheme.color }]}>
              {detailData.title}
            </Text>
          </View>
          <Text style={styles.detailsHeaderStepName}>{currentTheme.name}</Text>
        </View>

        <View style={styles.detailsContent}>
          {detailData.description ? (
            <Text style={styles.detailsDescriptionText}>{detailData.description}</Text>
          ) : null}

          {detailData.bullets && detailData.bullets.map((bullet, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={16} color={currentTheme.color} style={{ marginTop: 2 }} />
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}

          {detailData.customRender ? detailData.customRender : null}
        </View>
      </View>

      {/* Reassurance Help Banner */}
      <View style={styles.greenHelpCard}>
        <View style={styles.greenHelpTop}>
          <View style={styles.greenHeartCircle}>
            <Ionicons name="heart" size={24} color="#10b981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.greenHelpTitle}>{t.notAloneTitle}</Text>
            <Text style={styles.greenHelpText}>{t.notAloneSub}</Text>
          </View>
        </View>
      </View>

      {/* Counseling & Support Tabs */}
      <View style={styles.counselingCard}>
        <Text style={styles.counselingTitle}>{t.counselingOptionsTitle}</Text>
        <View style={styles.counselingTabsRow}>
          <TouchableOpacity 
            style={[styles.counselingTabBtn, counselingTab === "chat" && styles.counselingTabBtnActive]}
            onPress={() => {
              setCounselingTab(counselingTab === "chat" ? null : "chat");
              setSelectedItem({ step: 6, id: "talk_counselor" });
            }}
          >
            <Ionicons name="chatbubbles" size={20} color={counselingTab === "chat" ? "#fff" : "#2563eb"} />
            <Text style={[styles.counselingTabText, counselingTab === "chat" && styles.counselingTabTextActive]}>
              {t.counselingTabs.chat}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.counselingTabBtn, counselingTab === "call" && styles.counselingTabBtnActive]}
            onPress={() => {
              setCounselingTab(counselingTab === "call" ? null : "call");
              setSelectedItem({ step: 6, id: "talk_counselor" });
            }}
          >
            <Ionicons name="call" size={20} color={counselingTab === "call" ? "#fff" : "#2563eb"} />
            <Text style={[styles.counselingTabText, counselingTab === "call" && styles.counselingTabTextActive]}>
              {t.counselingTabs.call}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.counselingTabBtn, counselingTab === "resources" && styles.counselingTabBtnActive]}
            onPress={() => {
              setCounselingTab(counselingTab === "resources" ? null : "resources");
              setSelectedItem({ step: 6, id: "coping_tips" });
            }}
          >
            <Ionicons name="book" size={20} color={counselingTab === "resources" ? "#fff" : "#2563eb"} />
            <Text style={[styles.counselingTabText, counselingTab === "resources" && styles.counselingTabTextActive]}>
              {t.counselingTabs.resources}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.counselingTabBtn, counselingTab === "wellness" && styles.counselingTabBtnActive]}
            onPress={() => {
              setCounselingTab(counselingTab === "wellness" ? null : "wellness");
              setSelectedItem({ step: 6, id: "coping_tips" });
            }}
          >
            <Ionicons name="fitness" size={20} color={counselingTab === "wellness" ? "#fff" : "#2563eb"} />
            <Text style={[styles.counselingTabText, counselingTab === "wellness" && styles.counselingTabTextActive]}>
              {t.counselingTabs.wellness}
            </Text>
          </TouchableOpacity>
        </View>

        {counselingTab && (
          <View style={styles.counselingTabDetails}>
            <Ionicons name="information-circle-outline" size={16} color="#1e3a8a" />
            <Text style={styles.counselingTabDetailsText}>
              {counselingTab === "chat" && (
                language === "si" 
                  ? "නිරනාමික උපදේශනය සඳහා NCPA 1929 Chat සේවාව හෝ Sumithrayo (011 268 2535) අමතන්න." 
                  : "For anonymous support, connect with NCPA 1929 Chat Line or reach Shanthi Maargam at 077 722 2888."
              )}
              {counselingTab === "call" && (
                language === "si" 
                  ? "ශ්‍රව්‍ය ඇමතුම් සඳහා NCPA 1929 helpline හෝ ශ්‍රී ලංකා සුමිත්‍රයෝ 011 268 2535 (දිනපතා පෙ.ව. 9 - ප.ව. 8) අමතන්න." 
                  : "Call the 1929 child helpline, or reach Sumithrayo counseling hotline at 011 268 2535."
              )}
              {counselingTab === "resources" && (
                language === "si" 
                  ? "1. NCPA ළමා ලිංගික අපයෝජන වැළැක්වීමේ අත්පොත. 2. කම්පනය ජයගැනීමේ මඟපෙන්වීම්. 3. හුස්ම ගැනීමේ සහ චිත්තවේග පාලන අභ්‍යාස." 
                  : "1. NCPA Guide for Parents on Abuse Prevention. 2. Coping with Child Trauma Booklet. 3. Breathing Worksheets."
              )}
              {counselingTab === "wellness" && (
                language === "si" 
                  ? "1. පෙට්ටියක් මෙන් හුස්ම ගැනීම (4s). 2. 5-4-3-2-1 බිම්ගත කිරීම. 3. හැඟීම් චිත්‍රයට නැගීම. 4. ස්ථාවර දිනචරියාවක් පවත්වා ගැනීම." 
                  : "1. Box Breathing (4s focus). 2. 5-4-3-2-1 Grounding exercise. 3. Emotional drawing. 4. Maintain a regular daily routine."
              )}
            </Text>
          </View>
        )}
      </View>

      {/* Emergency Call Box */}
      <TouchableOpacity 
        style={styles.emergencyCard}
        onPress={() => Linking.openURL("tel:1929")}
      >
        <Text style={styles.emergencyTitle}>{t.emergencyTitle}</Text>
        <View style={styles.emergencyBtn}>
          <Ionicons name="call" size={24} color="#fff" />
          <Text style={styles.emergencyCallBtnText}>{t.emergencyCall}</Text>
        </View>
        <Text style={styles.emergencySubText}>{t.emergencySub}</Text>
      </TouchableOpacity>

      {/* Trust bar */}
      <View style={styles.trustBar}>
        <View style={styles.trustItemsRow}>
          <View style={styles.trustItem}>
            <Ionicons name="globe-outline" size={16} color="#10b981" />
            <Text style={styles.trustText}>{t.trustBar.bilingual}</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={16} color="#10b981" />
            <Text style={styles.trustText}>{t.trustBar.verified}</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="cloud-offline" size={16} color="#10b981" />
            <Text style={styles.trustText}>{t.trustBar.offline}</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="happy-outline" size={16} color="#10b981" />
            <Text style={styles.trustText}>{t.trustBar.childFriendly}</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="lock-closed-outline" size={16} color="#10b981" />
            <Text style={styles.trustText}>{t.trustBar.confidential}</Text>
          </View>
        </View>
        <Text style={styles.disclaimerText}>{t.disclaimer}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  stepCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  stepCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  stepBadgeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  stepCardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e293b",
  },
  stepCardSubtitle: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
    marginTop: 1,
  },
  inputSummaryBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  inputSummaryText: {
    fontSize: 12,
    color: "#334155",
    lineHeight: 16,
    fontWeight: "500",
  },
  categoriesSection: {
    marginTop: 6,
  },
  categoriesLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
  },
  categoriesList: {
    gap: 4,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryRowInactive: {
    borderColor: "#f1f5f9",
    backgroundColor: "#fafafa",
    opacity: 0.7,
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  categoryIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryText: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "600",
    flex: 1,
  },
  categoryTextInactive: {
    color: "#94a3b8",
    fontWeight: "500",
  },
  checkCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  gridFlow: {
    gap: 10,
    marginBottom: 12,
  },
  gridColumn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    overflow: "hidden",
  },
  gridColumnHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 3,
    backgroundColor: "#fafafa",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  gridStepBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  gridStepBadgeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 9,
  },
  gridColumnTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1e293b",
    flex: 1,
  },
  gridItemsList: {
    padding: 6,
    gap: 4,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "#fff",
  },
  checklistItemActive: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
  },
  checkboxCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#94a3b8",
    justifyContent: "center",
    alignItems: "center",
  },
  checklistItemText: {
    fontSize: 10,
    color: "#475569",
    fontWeight: "600",
    flex: 1,
  },
  checklistItemTextActive: {
    color: "#1e293b",
    fontWeight: "700",
  },
  detailsPanel: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    paddingBottom: 8,
    marginBottom: 8,
  },
  detailsHeaderIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  detailsHeaderTitle: {
    fontSize: 12,
    fontWeight: "800",
  },
  detailsHeaderStepName: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  detailsContent: {
    paddingHorizontal: 2,
  },
  detailsDescriptionText: {
    fontSize: 11.5,
    color: "#334155",
    lineHeight: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
    alignItems: "flex-start",
  },
  bulletText: {
    fontSize: 11,
    color: "#475569",
    lineHeight: 14,
    fontWeight: "600",
    flex: 1,
  },
  lawDetailCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 8,
  },
  lawDetailTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1e3a8a",
    flex: 1,
  },
  lawSectionBadge: {
    fontSize: 8,
    fontWeight: "700",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  lawDetailText: {
    fontSize: 10,
    color: "#475569",
    marginTop: 3,
    lineHeight: 13,
  },
  disclaimerMini: {
    fontSize: 9,
    color: "#94a3b8",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
  },
  actionCardInline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderLeftWidth: 3,
    borderRadius: 6,
    padding: 6,
  },
  actionCardLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1e293b",
  },
  actionCardDesc: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 1,
  },
  greenHelpCard: {
    backgroundColor: "#10b981",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  greenHelpTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  greenHeartCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  greenHelpTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
  },
  greenHelpText: {
    fontSize: 10.5,
    color: "#e6fbf3",
    marginTop: 1,
    lineHeight: 13,
    fontWeight: "500",
  },
  counselingCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  counselingTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 4,
  },
  counselingTabsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  counselingTabBtn: {
    flex: 1,
    minWidth: 80,
    borderWidth: 1,
    borderColor: "#dbeafe",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 6,
    alignItems: "center",
    gap: 4,
  },
  counselingTabBtnActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  counselingTabText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#1e40af",
    textAlign: "center",
    lineHeight: 10,
  },
  counselingTabTextActive: {
    color: "#fff",
  },
  counselingTabDetails: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: "#f0f7ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 6,
    padding: 6,
    marginTop: 8,
    alignItems: "center",
  },
  counselingTabDetailsText: {
    fontSize: 9.5,
    fontWeight: "600",
    color: "#1e40af",
    flex: 1,
  },
  emergencyCard: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 12,
  },
  emergencyTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#b91c1c",
    textAlign: "center",
  },
  emergencyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  emergencyCallBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
  },
  emergencySubText: {
    fontSize: 8.5,
    color: "#ef4444",
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 10,
  },
  trustBar: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
    alignItems: "center",
  },
  trustItemsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 8,
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trustText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#475569",
    lineHeight: 10,
  },
  disclaimerText: {
    fontSize: 8.5,
    color: "#94a3b8",
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 12,
  },
});
