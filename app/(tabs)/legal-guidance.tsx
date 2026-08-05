import { useState } from "react"
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native"
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons"
import { queryLegalRAG, LegalResult } from "../../lib/legal"
import LegalDecisionRoadmap from "../../src/component/LegalDecisionRoadmap"
import { buildRoadmapResult, RoadmapResult } from "../../src/utils/legalRoadmapLogic"
import IncidentMap from "../../src/component/IncidentMap"

export default function LegalGuidanceScreen() {
  const { width } = useWindowDimensions()
  const isDesktop = width > 1024
  
  const [description, setDescription] = useState("")
  const [language, setLanguage] = useState("en")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [validationError, setValidationError] = useState("")
  const [result, setResult] = useState<LegalResult | null>(null)
  const [roadmapResult, setRoadmapResult] = useState<RoadmapResult | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    placeName?: string;
  } | null>(null)

  const uiText = language === "si"
    ? {
        title: "Child Abuse Legal Guidance",
        subtitle: "Bilingual legal information & guidance for Sri Lanka | ද්විභාෂා නීති මාර්ගෝපදේශ",
        describeTitle: "සිදුවූ දේ විස්තර කරන්න",
        describeSubtitle: "අමාත්‍යංශ සහ පොලිස් මාර්ගෝපදේශ ලබා ගැනීමට සිද්ධියේ විස්තර බෙදා ගන්න.",
        placeholder: "සිදුවූ දේ පිළිබඳ විස්තරයක් ඇතුළත් කරන්න (උදා: මාර්ගගත අපයෝජනය, ශාරීරික හානිය, නොසලකා හැරීම, ආදිය)",
        privacyNotice: "ඔබේ තොරතුරු රහසිගත වන අතර මාර්ගෝපදේශ සැපයීම සඳහා පමණක් භාවිතා වේ.",
        clear: "මකන්න",
        submit: "ඉදිරිපත් කරන්න",
        detectedLanguage: "හඳුනාගත් භාෂාව",
        abuseCategory: "අපයෝජන වර්ගය",
        relevantLawsFound: "හමුවූ අදාළ නීති",
        sections: "වගන්ති",
        relevantLawsTitle: "අදාළ නීති",
        relevantLawsSubtitle: "මෙම තත්වයට අදාළ විය හැකි නීති සහ වගන්ති.",
        primaryOffencesTitle: "ප්‍රධාන අපරාධ වැරදි (දණ්ඩ නීති සංග්‍රහය)",
        primaryOffencesSubtitle: "ළමා අපයෝජන අපරාධ සහ දඬුවම් අර්ථ දක්වන වගන්ති.",
        protectionGuidanceTitle: "ආරක්ෂණ සහ අධිකාරී මාර්ගෝපදේශ (NCPA පනත)",
        protectionGuidanceSubtitle: "පැමිණිලි කිරීම් සහ පරීක්ෂණ ක්‍රියා පටිපාටි පෙන්වන විධිවිධාන.",
        whatItMeans: "එයින් අදහස් කරන්නේ කුමක්ද:",
        reportingGuidance: "පැමිණිලි කිරීමේ උපදෙස්:",
        decisionRoadmap: "තීරණ මාර්ගෝපදේශය",
        roadmapSubtitle: "ආරක්ෂිත සහ නිවැරදි ක්‍රියාමාර්ග ගැනීමට මෙම පියවර අනුගමනය කරන්න.",
        legalDisclaimer: "මෙම තොරතුරු මාර්ගෝපදේශ සඳහා පමණක් වන අතර වෘත්තීය නීති උපදෙස් සඳහා ආදේශකයක් නොවේ.",
        importantContacts: "වැදගත් සම්බන්ධතා",
        reachOut: "සහාය සඳහා සම්බන්ධ වන්න.",
        ncpa: "NCPA උපකාරක අංකය",
        ncpaSub: "ජාතික ළමා ආරක්ෂක අධිකාරිය",
        police: "පොලිස් හදිසි අංකය",
        policeSub: "ශ්‍රී ලංකා පොලිසිය",
        privacyMatters: "ඔබේ රහස්‍යභාවය වැදගත් වේ",
        privacyDetails: "ඔබ ලබා දෙන සියලුම තොරතුරු රහසිගත සහ ආරක්ෂිතයි. එය භාවිතා කරනුයේ සුදුසු නීතිමය මාර්ගෝපදේශ සහ සහාය ලබා දීමට පමණි.",
        immediateDanger: "දරුවෙකු ක්ෂණික අනතුරක සිටී නම්, වහාම 119 හෝ 1929 අමතන්න.",
        about: "පිළිබඳව",
        english: "English",
        sinhala: "සිංහල",
        detected: "හඳුනාගත්තා",
        laws: "නීති",
        validationError: "කරුණාකර අර්ථවත් අපයෝජනයට අදාළ සිද්ධි විස්තරයක් ඇතුළත් කරන්න.",
        section: "වගන්තිය",
        englishLang: "ඉංග්‍රීසි",
        sinhalaLang: "සිංහල",
        categories: {
          "physical abuse": "ශාරීරික අපයෝජනය",
          "sexual abuse": "ලිංගික අපයෝජනය",
          "neglect": "නොසලකා හැරීම",
          "trafficking": "ජාවාරම",
          "digital abuse": "ඩිජिटल අපයෝජනය",
          "emotional abuse": "මානසික අපයෝජනය",
          "general abuse": "සාමාන්‍ය අපයෝජනය"
        },
        mapSectionTitle: "Incident Location / සිද්ධිය වූ ස්ථානය",
        mapSectionSubtitle: "අසල ඇති සහය සහ බලධාරීන් සොයා ගැනීමට සිද්ධිය සිදු වූ ස්ථානය සලකුණු කරන්න.",
        mapHelperText: "සිද්ධිය වූ ස්ථානය සලකුණු කිරීමට සිතියම මත තට්ටු කරන්න හෝ සොයන්න.",
        mapPrivacyWarning: "ඔබේ නිශ්චිත නිවාස ලිපිනය ඇතුළත් නොකරන්න. මෙය පොදු සිද්ධි පිහිටීම හඳුනා ගැනීමට පමණි.",
        selectedLocationLabel: "තෝරාගත් ස්ථානය:",
        latitudeLabel: "අක්ෂාංශ:",
        longitudeLabel: "දේශාංශ:"
      }
    : {
        title: "Child Abuse Legal Guidance",
        subtitle: "Bilingual legal information & guidance for Sri Lanka | ද්විභාෂා නීති මාර්ගෝපදේශ",
        describeTitle: "Describe what happened",
        describeSubtitle: "Share the details of the incident to find relevant legal guidance.",
        placeholder: "Type or paste a description of what happened (e.g., online abuse, physical harm, neglect, etc.)",
        privacyNotice: "Your information is private and used only to provide guidance.",
        clear: "Clear",
        submit: "Submit",
        detectedLanguage: "Detected Language",
        abuseCategory: "Abuse Category",
        relevantLawsFound: "Relevant Laws Found",
        sections: "sections",
        relevantLawsTitle: "Relevant Laws",
        relevantLawsSubtitle: "Laws and sections that may apply to this situation.",
        primaryOffencesTitle: "Primary Criminal Offences (Penal Code)",
        primaryOffencesSubtitle: "Penal Code sections defining child abuse crimes and penalties.",
        protectionGuidanceTitle: "Protection & Authority Guidelines (NCPA Act)",
        protectionGuidanceSubtitle: "NCPA Act provisions outlining reporting and inspection procedures.",
        whatItMeans: "What it means:",
        reportingGuidance: "Reporting Guidance:",
        decisionRoadmap: "Decision Roadmap",
        roadmapSubtitle: "Follow these steps to take safe and correct action.",
        legalDisclaimer: "This information is for guidance only and not a substitute for professional legal advice.",
        importantContacts: "Important Contacts",
        reachOut: "Reach out for help and support.",
        ncpa: "NCPA Helpline",
        ncpaSub: "National Child Protection Authority",
        police: "Police Emergency",
        policeSub: "Sri Lanka Police",
        privacyMatters: "Your Privacy Matters",
        privacyDetails: "All information you provide is confidential and secure. It is used only to deliver appropriate legal guidance and support.",
        immediateDanger: "If a child is in immediate danger, call 119 or 1929 right away.",
        about: "About",
        english: "English",
        sinhala: "සිංහල",
        detected: "Detected",
        laws: "Laws",
        validationError: "Please enter a meaningful abuse-related incident description.",
        section: "section",
        englishLang: "English",
        sinhalaLang: "Sinhala",
        categories: {
          "physical abuse": "Physical Abuse",
          "sexual abuse": "Sexual Abuse",
          "neglect": "Neglect",
          "trafficking": "Trafficking",
          "digital abuse": "Digital Abuse",
          "emotional abuse": "Emotional Abuse",
          "general abuse": "General Abuse"
        },
        mapSectionTitle: "Incident Location / සිද්ධිය වූ ස්ථානය",
        mapSectionSubtitle: "Mark the place where the incident happened to find nearby support and authorities.",
        mapHelperText: "Tap or search to mark the incident location.",
        mapPrivacyWarning: "Do not ask for exact home address. This is for general incident location support only.",
        selectedLocationLabel: "Selected Location:",
        latitudeLabel: "Latitude:",
        longitudeLabel: "Longitude:"
      }

  const handleClear = () => {
    setDescription("")
    setError("")
    setValidationError("")
    setResult(null)
    setRoadmapResult(null)
    setSelectedLocation(null)
  }

  const validateIncidentDescription = (text: string, lang: "en" | "si") => {
    const trimmed = text.trim();
    const errorMsg = lang === "si"
      ? "කරුණාකර අර්ථවත් අපයෝජනයට අදාළ සිද්ධි විස්තරයක් ඇතුළත් කරන්න."
      : "Please enter a meaningful abuse-related incident description.";

    if (!trimmed) return errorMsg;
    if (trimmed.length < 5) return errorMsg;

    const repeatedCharPattern = /(.)\1{5,}/;
    if (repeatedCharPattern.test(trimmed)) return errorMsg;

    const words = trimmed.split(/\s+/).filter(w => w.length >= 1);
    if (words.length < 2) return errorMsg;

    return null;
  };

  const handleSubmit = async () => {
    const isSinhala = /[\u0D80-\u0DFF]/.test(description);
    const detectedLang = isSinhala ? "si" : "en";
    
    setLanguage(detectedLang);

    const vError = validateIncidentDescription(description, detectedLang);
    if (vError) {
      setValidationError(vError);
      setResult(null);
      setRoadmapResult(null);
      return;
    }

    setLoading(true)
    setError("")
    setValidationError("")
    setResult(null)
    setRoadmapResult(null)
    try {
      const roadmapData = buildRoadmapResult(description, detectedLang);
      setRoadmapResult(roadmapData);

      const data = await queryLegalRAG({
        description,
        language: detectedLang,
      })
      setError("")
      setResult(data)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
      setResult(null)
      setRoadmapResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="shield-account" size={32} color="#0D9488" />
          </View>
          <View>
            <Text style={styles.headerTitle}>{uiText.title}</Text>
            <Text style={styles.headerSubtitle}>{uiText.subtitle}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.languageSwitcher}>
            <TouchableOpacity 
              style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
              onPress={() => setLanguage('en')}
            >
              <Ionicons name="globe-outline" size={18} color={language === 'en' ? '#fff' : '#2563eb'} />
              <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>{uiText.english}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.langBtn, language === 'si' && styles.langBtnActive]}
              onPress={() => setLanguage('si')}
            >
              <Text style={[styles.sinhalaLetterIcon, { color: language === 'si' ? '#fff' : '#64748b' }]}>සි</Text>
              <Text style={[styles.langBtnText, language === 'si' && styles.langBtnTextActive]}>{uiText.sinhala}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.aboutBtn}>
            <Ionicons name="information-circle-outline" size={20} color="#64748b" />
            <Text style={styles.aboutBtnText}>{uiText.about}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Input Section */}
      <View style={styles.inputCard}>
        <View style={styles.inputHeader}>
          <View style={styles.inputIconContainer}>
            <Ionicons name="chatbox-ellipses" size={24} color="#2563eb" />
          </View>
          <View>
            <Text style={styles.inputTitle}>{uiText.describeTitle}</Text>
            <Text style={styles.inputSubtitle}>{uiText.describeSubtitle}</Text>
          </View>
        </View>
        <TextInput
          style={[styles.textArea, validationError ? styles.textAreaError : null]}
          placeholder={uiText.placeholder}
          placeholderTextColor="#94a3b8"
          multiline
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            if (validationError) setValidationError("");
          }}
        />
        {validationError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color="#ef4444" />
            <Text style={styles.errorTextUnderInput}>{validationError}</Text>
          </View>
        ) : null}
        <View style={styles.inputFooter}>
          <View style={styles.privacyNotice}>
            <Ionicons name="lock-closed-outline" size={14} color="#94a3b8" />
            <Text style={styles.privacyNoticeText}>{uiText.privacyNotice}</Text>
          </View>
          <View style={styles.inputActions}>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Ionicons name="refresh-outline" size={18} color="#64748b" />
              <Text style={styles.clearBtnText}>{uiText.clear}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>{uiText.submit}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Error Message */}
      {error ? (
        <View style={styles.mainErrorCard}>
          <Ionicons name="alert-circle" size={24} color="#ef4444" />
          <View style={{ flex: 1 }}>
            <Text style={styles.mainErrorTitle}>Error</Text>
            <Text style={styles.mainErrorText}>{error}</Text>
          </View>
        </View>
      ) : null}

      {/* Summary Stats */}
      {result && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="globe-outline" size={24} color="#2563eb" />
            </View>
            <View>
              <Text style={styles.statLabel}>{uiText.detectedLanguage}</Text>
              <Text style={styles.statValue}>
                {result.detected_language?.toLowerCase() === 'si' || result.detected_language?.toLowerCase() === 'sinhala' ? uiText.sinhalaLang : 
                 result.detected_language?.toLowerCase() === 'en' || result.detected_language?.toLowerCase() === 'english' ? uiText.englishLang : 
                 (result.detected_language || 'English')}
              </Text>
            </View>
            <View style={styles.detectedBadge}>
              <Ionicons name="checkmark" size={12} color="#059669" />
              <Text style={styles.detectedBadgeText}>{uiText.detected}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#f5f3ff' }]}>
              <MaterialCommunityIcons name="scale-balance" size={24} color="#7c3aed" />
            </View>
            <View>
              <Text style={styles.statLabel}>{uiText.abuseCategory}</Text>
              <Text style={styles.statValue}>
                {language === 'si' && result.abuse_category_si ? result.abuse_category_si :
                 language === 'en' && result.abuse_category_en ? result.abuse_category_en :
                 (uiText.categories?.[result.abuse_category?.toLowerCase() as keyof typeof uiText.categories] || 
                  result.abuse_category?.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 
                  uiText.categories?.["general abuse"])}
              </Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="information-circle-outline" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="book-outline" size={24} color="#10b981" />
            </View>
            <View>
              <Text style={styles.statLabel}>{uiText.relevantLawsFound}</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statValueLarge}>{result.relevant_laws?.length || 0}</Text>
                <Text style={styles.statValueSubText}>
                  {result.relevant_laws?.length === 1 ? uiText.section : uiText.sections}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Main Content Grid */}
      {result && (
        <View style={[styles.mainGrid, isDesktop ? styles.row : styles.column]}>
          {/* Left Column: Relevant Laws */}
          <View style={[styles.gridColumn, isDesktop && { flex: 1.2 }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderIcon}>
                <Ionicons name="bookmarks" size={20} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>{uiText.relevantLawsTitle}</Text>
                <Text style={styles.sectionSubtitle}>{uiText.relevantLawsSubtitle}</Text>
              </View>
            </View>

            {/* Primary Offences */}
            {result.relevant_laws?.filter(l => l.law_type !== 'supporting').length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <View style={styles.subSectionHeader}>
                  <Text style={styles.subSectionTitle}>{uiText.primaryOffencesTitle}</Text>
                  <Text style={styles.subSectionSubtitle}>{uiText.primaryOffencesSubtitle}</Text>
                </View>
                {result.relevant_laws
                  ?.filter(l => l.law_type !== 'supporting')
                  .map((law, idx) => (
                    <View key={`primary-${idx}`} style={styles.lawCard}>
                      <View style={styles.lawCardHeader}>
                        <View style={styles.lawBadge}>
                          <Text style={styles.lawBadgeText}>{idx + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.lawSectionText}>
                            {law.law_name ? `${law.law_name} - ` : ""}{uiText.section} {law.section}
                          </Text>
                          <Text style={styles.lawTitleText}>
                            {language === 'si' && law.title_si ? law.title_si :
                             language === 'en' && law.title_en ? law.title_en :
                             law.title}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.lawContent}>
                        <Text style={styles.lawLabel}>{uiText.whatItMeans}</Text>
                        <Text style={styles.lawDescription}>
                          {language === 'si' && law.simple_explanation_si ? law.simple_explanation_si :
                           language === 'en' && law.simple_explanation_en ? law.simple_explanation_en :
                           law.simple_explanation}
                        </Text>
                        
                        <View style={styles.guidanceBox}>
                          <Ionicons name="checkmark-circle" size={18} color="#2563eb" />
                          <Text style={styles.guidanceText}>
                            <Text style={styles.guidanceLabel}>{uiText.reportingGuidance} </Text>
                            {language === 'si' && law.reporting_guidance_si ? law.reporting_guidance_si :
                             language === 'en' && law.reporting_guidance_en ? law.reporting_guidance_en :
                             law.reporting_guidance}
                          </Text>
                        </View>

                        {law.related_provisions && law.related_provisions.length > 0 && (
                          <View style={styles.relatedContainer}>
                            <Text style={styles.relatedHeader}>
                              {language === 'si' ? "අදාළ වෙනත් වගන්ති" : "Related Provisions"} ({law.related_provisions.length})
                            </Text>
                            {law.related_provisions.map((subLaw, subIdx) => (
                              <View key={`sub-${subIdx}`} style={styles.relatedItem}>
                                <Text style={styles.relatedTitle}>
                                  {subLaw.law_name ? `${subLaw.law_name} - ` : ""}{uiText.section} {subLaw.section}: {language === 'si' && subLaw.title_si ? subLaw.title_si : (subLaw.title_en || subLaw.title)}
                                </Text>
                                <Text style={styles.relatedDesc}>
                                  {language === 'si' && subLaw.simple_explanation_si ? subLaw.simple_explanation_si : (subLaw.simple_explanation_en || subLaw.simple_explanation)}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
              </View>
            )}

            {/* Protection Guidance / NCPA Act */}
            {result.relevant_laws?.filter(l => l.law_type === 'supporting').length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <View style={[styles.subSectionHeader, { marginTop: 12 }]}>
                  <Text style={[styles.subSectionTitle, { color: '#0f766e' }]}>{uiText.protectionGuidanceTitle}</Text>
                  <Text style={styles.subSectionSubtitle}>{uiText.protectionGuidanceSubtitle}</Text>
                </View>
                {result.relevant_laws
                  ?.filter(l => l.law_type === 'supporting')
                  .map((law, idx) => (
                    <View key={`supporting-${idx}`} style={[styles.lawCard, styles.supportingLawCard]}>
                      <View style={styles.lawCardHeader}>
                        <View style={[styles.lawBadge, styles.supportingLawBadge]}>
                          <Text style={[styles.lawBadgeText, styles.supportingLawBadgeText]}>{idx + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.lawSectionText, { color: '#0f766e' }]}>
                            {law.law_name ? `${law.law_name} - ` : ""}{uiText.section} {law.section}
                          </Text>
                          <Text style={[styles.lawTitleText, { color: '#115e59' }]}>
                            {language === 'si' && law.title_si ? law.title_si :
                             language === 'en' && law.title_en ? law.title_en :
                             law.title}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.lawContent}>
                        <Text style={styles.lawLabel}>{uiText.whatItMeans}</Text>
                        <Text style={styles.lawDescription}>
                          {language === 'si' && law.simple_explanation_si ? law.simple_explanation_si :
                           language === 'en' && law.simple_explanation_en ? law.simple_explanation_en :
                           law.simple_explanation}
                        </Text>
                        
                        <View style={[styles.guidanceBox, styles.supportingGuidanceBox]}>
                          <Ionicons name="shield-checkmark" size={18} color="#0f766e" />
                          <Text style={styles.guidanceText}>
                            <Text style={[styles.guidanceLabel, { color: '#0f766e' }]}>{uiText.reportingGuidance} </Text>
                            {language === 'si' && law.reporting_guidance_si ? law.reporting_guidance_si :
                             language === 'en' && law.reporting_guidance_en ? law.reporting_guidance_en :
                             law.reporting_guidance}
                          </Text>
                        </View>

                        {law.related_provisions && law.related_provisions.length > 0 && (
                          <View style={[styles.relatedContainer, { borderTopColor: '#ccfbf1' }]}>
                            <Text style={[styles.relatedHeader, { color: '#0f766e' }]}>
                              {language === 'si' ? "අදාළ වෙනත් වගන්ති" : "Related Provisions"} ({law.related_provisions.length})
                            </Text>
                            {law.related_provisions.map((subLaw, subIdx) => (
                              <View key={`sub-${subIdx}`} style={[styles.relatedItem, { borderLeftColor: '#0f766e' }]}>
                                <Text style={[styles.relatedTitle, { color: '#115e59' }]}>
                                  {subLaw.law_name ? `${subLaw.law_name} - ` : ""}{uiText.section} {subLaw.section}: {language === 'si' && subLaw.title_si ? subLaw.title_si : (subLaw.title_en || subLaw.title)}
                                </Text>
                                <Text style={styles.relatedDesc}>
                                  {language === 'si' && subLaw.simple_explanation_si ? subLaw.simple_explanation_si : (subLaw.simple_explanation_en || subLaw.simple_explanation)}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
              </View>
            )}

            <View style={styles.disclaimerBox}>
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text style={styles.disclaimerText}>{uiText.legalDisclaimer}</Text>
            </View>
          </View>

          {/* Right Column: Custom Interactive Decision Roadmap */}
          <View style={[styles.gridColumn, isDesktop && { flex: 0.8, marginLeft: 24 }]}>
            <LegalDecisionRoadmap result={roadmapResult} language={language as "en" | "si"} />
          </View>
        </View>
      )}

      {/* Map Section */}
      {result && (
        <View style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <View style={styles.mapIconContainer}>
              <Ionicons name="location-sharp" size={24} color="#2563eb" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.mapTitle}>{uiText.mapSectionTitle}</Text>
              <Text style={styles.mapSubtitle}>{uiText.mapSectionSubtitle}</Text>
            </View>
          </View>
          
          <IncidentMap
            language={language}
            onLocationSelect={(lat, lng, name) => setSelectedLocation({ latitude: lat, longitude: lng, placeName: name })}
            selectedLocation={selectedLocation}
          />
          
          <View style={styles.mapFooter}>
            <Text style={styles.mapHelperText}>{uiText.mapHelperText}</Text>
            <Text style={styles.mapPrivacyWarning}>{uiText.mapPrivacyWarning}</Text>
            
            {selectedLocation && (
              <View style={styles.locationDetailsBox}>
                <Ionicons name="information-circle" size={20} color="#2563eb" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.locationDetailsTitle}>
                    {uiText.selectedLocationLabel}
                  </Text>
                  <TextInput
                    style={styles.locationDetailsInput}
                    value={selectedLocation.placeName || ""}
                    onChangeText={(text) => setSelectedLocation({ ...selectedLocation, placeName: text })}
                    placeholder={language === 'si' ? "ස්ථානයේ නම ඇතුළත් කරන්න" : "Enter location name"}
                    placeholderTextColor="#94a3b8"
                  />
                  <Text style={styles.locationDetailsCoords}>
                    {uiText.latitudeLabel} {selectedLocation.latitude.toFixed(6)} | {uiText.longitudeLabel} {selectedLocation.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Footer / Contacts */}
      <View style={[styles.footerRow, isDesktop ? styles.row : styles.column]}>
        <View style={styles.contactsSection}>
          <View style={styles.contactsHeader}>
            <Ionicons name="call" size={20} color="#2563eb" />
            <Text style={styles.contactsTitle}>{uiText.importantContacts}</Text>
          </View>
          <Text style={styles.contactsSubtitle}>{uiText.reachOut}</Text>
          
          <View style={styles.contactCardsRow}>
            <View style={styles.contactCard}>
              <View style={styles.contactIconCircle}>
                <Ionicons name="headset" size={24} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.contactNumber}>1929</Text>
                <Text style={styles.contactName}>{uiText.ncpa}</Text>
                <Text style={styles.contactSub}>{uiText.ncpaSub}</Text>
              </View>
            </View>

            <View style={styles.contactCard}>
              <View style={[styles.contactIconCircle, { backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="shield-checkmark" size={24} color="#10b981" />
              </View>
              <View>
                <Text style={styles.contactNumber}>119</Text>
                <Text style={styles.contactName}>{uiText.police}</Text>
                <Text style={styles.contactSub}>{uiText.policeSub}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.privacyMattersCard}>
          <View style={styles.privacyTop}>
            <View style={styles.lockCircle}>
              <Ionicons name="lock-closed" size={24} color="#1e293b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.privacyTitle}>{uiText.privacyMatters}</Text>
              <Text style={styles.privacyDesc}>{uiText.privacyDetails}</Text>
              <Text style={styles.dangerText}>{uiText.immediateDanger}</Text>
            </View>
            <View style={styles.heartIcon}>
              <FontAwesome5 name="hands-helping" size={24} color="#f87171" />
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Copyright */}
      <View style={styles.bottomFooter}>
        <Text style={styles.copyrightText}>© 2026 Child Abuse Legal Guidance Project</Text>
        <View style={styles.footerDot} />
        <Text style={styles.copyrightText}>Built for research & social impact</Text>
        <View style={styles.footerDot} />
        <Text style={styles.copyrightText}>Not an official government site</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  contentContainer: {
    padding: 24,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  row: { flexDirection: 'row' },
  column: { flexDirection: 'column' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    flexWrap: 'wrap',
    gap: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e3a8a',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  languageSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  langBtnActive: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  langBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  langBtnTextActive: {
    color: '#fff',
  },
  sinhalaLetterIcon: {
    fontSize: 16,
    fontWeight: '800',
    marginRight: 2,
    lineHeight: 18,
  },
  aboutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aboutBtnText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 32,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  inputIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  inputSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  textAreaError: {
    borderColor: '#fecaca',
    backgroundColor: '#fffcfc',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  errorTextUnderInput: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '500',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  privacyNoticeText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  inputActions: {
    flexDirection: 'row',
    gap: 12,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 32,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e3a8a',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValueLarge: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e3a8a',
  },
  statValueSubText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  detectedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detectedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  mainGrid: {
    gap: 24,
    marginBottom: 40,
  },
  gridColumn: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sectionHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e3a8a',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  lawCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eff6ff',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  lawCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  lawBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lawBadgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  lawSectionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
    textTransform: 'uppercase',
  },
  lawTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  lawContent: {
    padding: 16,
  },
  lawLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
  },
  lawDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 16,
  },
  guidanceBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  guidanceText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 20,
  },
  guidanceLabel: {
    fontWeight: '800',
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  footerRow: {
    gap: 24,
    marginBottom: 40,
  },
  contactsSection: {
    flex: 1,
  },
  contactsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  contactsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  contactsSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  contactCardsRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  contactCard: {
    flex: 1,
    minWidth: 240,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  contactIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e3a8a',
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  contactSub: {
    fontSize: 12,
    color: '#64748b',
  },
  privacyMattersCard: {
    flex: 1,
    backgroundColor: '#fffcf0',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  privacyTop: {
    flexDirection: 'row',
    gap: 16,
  },
  lockCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  privacyDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 8,
  },
  dangerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b45309',
  },
  heartIcon: {
    alignSelf: 'flex-end',
  },
  bottomFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexWrap: 'wrap',
    gap: 8,
  },
  copyrightText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  mainErrorCard: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 32,
    alignItems: 'center',
  },
  mainErrorTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991b1b',
    marginBottom: 2,
  },
  mainErrorText: {
    fontSize: 14,
    color: '#b91c1c',
    lineHeight: 20,
  },
  subSectionHeader: {
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  subSectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  supportingLawCard: {
    borderColor: '#ccfbf1',
    backgroundColor: '#fafdfd',
  },
  supportingLawBadge: {
    backgroundColor: '#ccfbf1',
  },
  supportingLawBadgeText: {
    color: '#0f766e',
  },
  supportingGuidanceBox: {
    backgroundColor: '#f0fdfa',
    borderColor: '#e2e8f0',
    borderWidth: 1,
  },
  relatedContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eff6ff',
  },
  relatedHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563eb',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  relatedItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  relatedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  relatedDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  mapCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 32,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  mapIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  mapFooter: {
    marginTop: 16,
  },
  mapHelperText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 4,
  },
  mapPrivacyWarning: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  locationDetailsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    marginTop: 8,
  },
  locationDetailsTitle: {
    fontSize: 14,
    color: '#1e40af',
  },
  locationDetailsCoords: {
    fontSize: 12,
    color: '#2563eb',
    marginTop: 4,
  },
  locationDetailsInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 6,
    width: '100%',
  }
})
