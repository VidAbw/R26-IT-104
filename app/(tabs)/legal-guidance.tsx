import React, { useState } from "react"
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Modal,
} from "react-native"
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons"
import { queryLegalRAG, LegalResult } from "../../lib/legal"
import LegalDecisionRoadmap from "../../src/component/LegalDecisionRoadmap"
import { buildRoadmapResult, RoadmapResult } from "../../src/utils/legalRoadmapLogic"
import IncidentMap from "../../src/component/IncidentMap"
import { ProtectivaTheme } from "../../constants/theme"

export default function LegalGuidanceScreen() {
  const { width } = useWindowDimensions()
  const isDesktop = width > 1024
  
  const [description, setDescription] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "si">("en")
  const [isManualSelection, setIsManualSelection] = useState(false)
  const language = selectedLanguage
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

  // Interactive UI states
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)

  const uiText = language === "si"
    ? {
        title: "Child Abuse Legal Guidance",
        subtitle: "Bilingual legal information & guidance for Sri Lanka | ද්විභාෂා නීති මාර්ගෝපදේශ",
        describeTitle: "Describe what happened",
        describeSubtitle: "Share the details of the incident to find relevant legal guidance.",
        describeTitleSi: "සිදුවූ දේ විස්තර කරන්න",
        describeSubtitleSi: "අමාත්‍යංශ සහ පොලිස් මාර්ගෝපදේශ ලබා ගැනීමට සිද්ධියේ විස්තර බෙදා ගන්න.",
        placeholder: "Type or paste a description of what happened (e.g., online abuse, physical harm, neglect, etc.)",
        placeholderSi: "සිදුවූ දේ පිළිබඳ විස්තරයක් ඇතුළත් කරන්න (උදා: මාර්ගගත අපයෝජනය, ශාරීරික හානිය, නොසලකා හැරීම, ආදිය)",
        privacyNotice: "Your information is private and used only to provide guidance.",
        privacyNoticeSi: "ඔබේ තොරතුරු රහසිගත වන අතර මාර්ගෝපදේශ සැපයීම සඳහා පමණක් භාවිතා වේ.",
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
        validationError: "කරුණාකර අර්ථවත් අපයෝජනයට අදාළ සිද්ධි විස්තරයක් ඇතුළත් කරන්න.",
        section: "Section",
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
    : {
        title: "Child Abuse Legal Guidance",
        subtitle: "Bilingual legal information & guidance for Sri Lanka | ද්විභාෂා නීති මාර්ගෝපදේශ",
        describeTitle: "Describe what happened",
        describeSubtitle: "Share the details of the incident to find relevant legal guidance.",
        describeTitleSi: "Describe what happened",
        describeSubtitleSi: "Share the details of the incident to find relevant legal guidance.",
        placeholder: "Type or paste a description of what happened (e.g., online abuse, physical harm, neglect, etc.)",
        placeholderSi: "Type or paste a description of what happened (e.g., online abuse, physical harm, neglect, etc.)",
        privacyNotice: "Your information is private and used only to provide guidance.",
        privacyNoticeSi: "Your information is private and used only to provide guidance.",
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
        section: "Section",
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
    setIsManualSelection(false)
    setSelectedLanguage("en")
  }

  const handleSelectLanguage = (lang: "en" | "si") => {
    setSelectedLanguage(lang)
    setIsManualSelection(true)
    setShowLangMenu(false)
  }

  const handleDescriptionChange = (text: string) => {
    setDescription(text)
    if (validationError) setValidationError("")

    const containsSinhala = /[\u0D80-\u0DFF]/.test(text)
    if (containsSinhala) {
      setSelectedLanguage("si")
    } else if (!isManualSelection && text.trim().length > 0) {
      setSelectedLanguage("en")
    }
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
    const containsSinhala = /[\u0D80-\u0DFF]/.test(description)
    const activeLang = containsSinhala ? "si" : selectedLanguage
    if (selectedLanguage !== activeLang) {
      setSelectedLanguage(activeLang)
    }

    const vError = validateIncidentDescription(description, activeLang);
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
      const roadmapData = buildRoadmapResult(description, activeLang);
      setRoadmapResult(roadmapData);

      const data = await queryLegalRAG({
        description,
        language: activeLang,
      })
      setError("")
      setResult(data)

      if (data && data.detected_language) {
        const backendLang = data.detected_language.toLowerCase()
        if (backendLang === "si" || backendLang === "sinhala") {
          setSelectedLanguage("si")
        } else if (backendLang === "en" || backendLang === "english") {
          setSelectedLanguage("en")
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong")
      setResult(null)
      setRoadmapResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* 1. Header Banner Section */}
      <View style={styles.headerCard}>
        <View style={styles.headerLeftRow}>
          <View style={styles.shieldIconCircle}>
            <Ionicons name="shield-checkmark" size={24} color={ProtectivaTheme.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{uiText.title}</Text>
            <Text style={styles.headerSubtitle}>{uiText.subtitle}</Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          {/* Language Switcher Dropdown */}
          <View style={{ position: 'relative', zIndex: 100 }}>
            <TouchableOpacity
              style={styles.langSelectorBtn}
              onPress={() => setShowLangMenu(!showLangMenu)}
              activeOpacity={0.8}
            >
              <Ionicons name="globe-outline" size={16} color={ProtectivaTheme.primaryDark} />
              <Text style={styles.langSelectorText}>
                {selectedLanguage === "en" ? "English" : "සිංහල"}
              </Text>
              <Ionicons name="chevron-down" size={14} color={ProtectivaTheme.textSecondary} />
            </TouchableOpacity>

            {showLangMenu && (
              <View style={styles.langDropdownMenu}>
                <TouchableOpacity
                  style={[styles.langMenuItem, selectedLanguage === 'en' && styles.langMenuItemActive]}
                  onPress={() => handleSelectLanguage('en')}
                >
                  <Text style={[styles.langMenuText, selectedLanguage === 'en' && styles.langMenuTextActive]}>English</Text>
                  {selectedLanguage === 'en' && <Ionicons name="checkmark" size={14} color="#0F766E" />}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.langMenuItem, selectedLanguage === 'si' && styles.langMenuItemActive]}
                  onPress={() => handleSelectLanguage('si')}
                >
                  <Text style={[styles.langMenuText, selectedLanguage === 'si' && styles.langMenuTextActive]}>සිංහල</Text>
                  {selectedLanguage === 'si' && <Ionicons name="checkmark" size={14} color="#0F766E" />}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* About Button */}
          <TouchableOpacity style={styles.aboutPillBtn} onPress={() => setShowAboutModal(true)}>
            <Ionicons name="information-circle-outline" size={16} color={ProtectivaTheme.textSecondary} />
            <Text style={styles.aboutPillBtnText}>{uiText.about}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Incident Description Card */}
      <View style={styles.incidentCard}>
        <View style={styles.incidentCardHeader}>
          <View style={styles.chatIconSquare}>
            <Ionicons name="chatbox-ellipses" size={20} color={ProtectivaTheme.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.incidentTitle}>
              {language === 'si' ? uiText.describeTitleSi : uiText.describeTitle}
            </Text>
            <Text style={styles.incidentSubtitle}>
              {language === 'si' ? uiText.describeSubtitleSi : uiText.describeSubtitle}
            </Text>
          </View>
        </View>

        <TextInput
          style={[styles.textAreaInput, validationError ? styles.textAreaError : null]}
          placeholder={language === 'si' ? uiText.placeholderSi : uiText.placeholder}
          placeholderTextColor="#94A3B8"
          multiline
          value={description}
          onChangeText={handleDescriptionChange}
        />

        {validationError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.errorBannerText}>{validationError}</Text>
          </View>
        ) : null}

        <View style={styles.incidentCardFooter}>
          <View style={styles.privacyNoticeLeft}>
            <Ionicons name="lock-closed-outline" size={14} color={ProtectivaTheme.textSecondary} />
            <Text style={styles.privacyNoticeText}>
              {language === 'si' ? uiText.privacyNoticeSi : uiText.privacyNotice}
            </Text>
          </View>

          <View style={styles.actionButtonsRight}>
            <TouchableOpacity style={styles.clearBtnGhost} onPress={handleClear}>
              <Ionicons name="refresh-outline" size={16} color={ProtectivaTheme.textSecondary} />
              <Text style={styles.clearBtnText}>{uiText.clear}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtnTeal} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.submitBtnText}>{uiText.submit}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Error Message if API fails */}
      {error ? (
        <View style={styles.mainErrorCard}>
          <Ionicons name="alert-circle" size={24} color="#DC2626" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.mainErrorTitle}>Unable to Fetch Legal Guidance</Text>
            <Text style={styles.mainErrorText}>{error}</Text>
          </View>
        </View>
      ) : null}

      {/* 3. Middle Section: Important Contacts & Your Privacy Matters */}
      <View style={[styles.middleGridRow, isDesktop ? styles.row : styles.column]}>
        {/* Left: Important Contacts Card */}
        <View style={[styles.dashboardCardTile, { flex: 1.1 }]}>
          <View style={styles.cardHeaderTitleRow}>
            <Ionicons name="call-outline" size={20} color={ProtectivaTheme.primaryDark} style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.cardHeaderTitle}>{uiText.importantContacts}</Text>
              <Text style={styles.cardHeaderSubtitle}>{uiText.reachOut}</Text>
            </View>
          </View>

          <View style={styles.contactsGridRow}>
            {/* NCPA 1929 */}
            <View style={styles.contactSubTile}>
              <View style={styles.contactIconBadgeTeal}>
                <Ionicons name="headset-outline" size={22} color={ProtectivaTheme.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactPhoneNum}>1929</Text>
                <Text style={styles.contactLabel}>{uiText.ncpa}</Text>
                <Text style={styles.contactSubLabel}>{uiText.ncpaSub}</Text>
              </View>
            </View>

            {/* Police 119 */}
            <View style={styles.contactSubTile}>
              <View style={styles.contactIconBadgeGreen}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactPhoneNum}>119</Text>
                <Text style={styles.contactLabel}>{uiText.police}</Text>
                <Text style={styles.contactSubLabel}>{uiText.policeSub}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Right: Your Privacy Matters Card */}
        <View style={[styles.privacyCardTile, { flex: 1 }]}>
          <View style={styles.privacyTopRow}>
            <View style={styles.privacyLockBadge}>
              <Ionicons name="lock-closed" size={20} color={ProtectivaTheme.primaryDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.privacyTitle}>{uiText.privacyMatters}</Text>
              <Text style={styles.privacyDescription}>{uiText.privacyDetails}</Text>
              <Text style={styles.privacyDangerAlert}>{uiText.immediateDanger}</Text>
            </View>
            <View style={styles.privacyHelpingIcon}>
              <FontAwesome5 name="hands-helping" size={22} color={ProtectivaTheme.primary} />
            </View>
          </View>
        </View>
      </View>

      {/* 4. Summary Stats Bar & Legal Results Area (After Submission) */}
      {result && (
        <View style={{ marginTop: 24 }}>
          {/* Summary Stats Cards */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="globe-outline" size={22} color={ProtectivaTheme.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
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
              <View style={[styles.statIconContainer, { backgroundColor: '#F5F3FF' }]}>
                <MaterialCommunityIcons name="scale-balance" size={22} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statLabel}>{uiText.abuseCategory}</Text>
                <Text style={styles.statValue}>
                  {language === 'si' && result.abuse_category_si ? result.abuse_category_si :
                   language === 'en' && result.abuse_category_en ? result.abuse_category_en :
                   (uiText.categories?.[result.abuse_category?.toLowerCase() as keyof typeof uiText.categories] || 
                    result.abuse_category?.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 
                    uiText.categories?.["general abuse"])}
                </Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="book-outline" size={22} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statLabel}>{uiText.relevantLawsFound}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={styles.statValueLarge}>{result.relevant_laws?.length || 0}</Text>
                  <Text style={styles.statValueSubText}>
                    {result.relevant_laws?.length === 1 ? uiText.section : uiText.sections}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Main Content Grid: Relevant Laws (Left) & Legal Decision Roadmap (Right) */}
          <View style={[styles.resultsGridRow, isDesktop ? styles.row : styles.column]}>
            {/* Left Column: Relevant Laws (Primary Laws + Nested Provisions + NCPA Act) */}
            <View style={[styles.dashboardCardTile, { flex: 1.2 }]}>
              <View style={styles.cardHeaderTitleRow}>
                <MaterialCommunityIcons name="scale-balance" size={22} color={ProtectivaTheme.primaryDark} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardHeaderTitle}>{uiText.relevantLawsTitle}</Text>
                  <Text style={styles.cardHeaderSubtitle}>{uiText.relevantLawsSubtitle}</Text>
                </View>
              </View>

              {/* Primary Offences (Penal Code) */}
              {result.relevant_laws?.filter(l => l.law_type !== 'supporting').length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <View style={styles.subSectionHeader}>
                    <Text style={styles.subSectionTitle}>{uiText.primaryOffencesTitle}</Text>
                    <Text style={styles.subSectionSubtitle}>{uiText.primaryOffencesSubtitle}</Text>
                  </View>

                  {result.relevant_laws
                    ?.filter(l => l.law_type !== 'supporting')
                    .map((law, idx) => (
                      <View key={`primary-${idx}`} style={styles.primaryLawCard}>
                        <View style={styles.lawCardHeaderRow}>
                          <View style={styles.primaryLawBadge}>
                            <Text style={styles.primaryLawBadgeText}>{idx + 1}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.primaryLawSectionText}>
                              {law.law_name ? `${law.law_name} - ` : ""}{uiText.section} {law.section}
                            </Text>
                            <Text style={styles.primaryLawTitleText}>
                              {language === 'si' && law.title_si ? law.title_si :
                               language === 'en' && law.title_en ? law.title_en :
                               law.title}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.lawCardBody}>
                          <Text style={styles.lawMeaningLabel}>{uiText.whatItMeans}</Text>
                          <Text style={styles.lawMeaningDesc}>
                            {language === 'si' && law.simple_explanation_si ? law.simple_explanation_si :
                             language === 'en' && law.simple_explanation_en ? law.simple_explanation_en :
                             law.simple_explanation}
                          </Text>

                          {/* Reporting Guidance Note */}
                          {(law.reporting_guidance || law.reporting_guidance_si) && (
                            <View style={styles.reportingGuidanceBox}>
                              <Ionicons name="checkmark-circle" size={16} color={ProtectivaTheme.primaryDark} style={{ marginRight: 6 }} />
                              <Text style={styles.reportingGuidanceText}>
                                <Text style={{ fontWeight: '800' }}>{uiText.reportingGuidance} </Text>
                                {language === 'si' && law.reporting_guidance_si ? law.reporting_guidance_si :
                                 language === 'en' && law.reporting_guidance_en ? law.reporting_guidance_en :
                                 law.reporting_guidance}
                              </Text>
                            </View>
                          )}

                          {/* Nested Related / Supporting Provisions */}
                          {law.related_provisions && law.related_provisions.length > 0 && (
                            <View style={styles.nestedRelatedContainer}>
                              <Text style={styles.nestedRelatedHeader}>
                                {language === 'si' ? "අදාළ වෙනත් වගන්ති" : "Related Provisions"} ({law.related_provisions.length})
                              </Text>
                              {law.related_provisions.map((subLaw, subIdx) => (
                                <View key={`sub-${subIdx}`} style={styles.nestedRelatedItemCard}>
                                  <Text style={styles.nestedRelatedTitle}>
                                    {subLaw.law_name ? `${subLaw.law_name} - ` : ""}{uiText.section} {subLaw.section}: {language === 'si' && subLaw.title_si ? subLaw.title_si : (subLaw.title_en || subLaw.title)}
                                  </Text>
                                  <Text style={styles.nestedRelatedDesc}>
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

              {/* Protection & Authority Guidelines (NCPA Act) */}
              {result.relevant_laws?.filter(l => l.law_type === 'supporting').length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <View style={styles.subSectionHeader}>
                    <Text style={[styles.subSectionTitle, { color: ProtectivaTheme.primaryDark }]}>{uiText.protectionGuidanceTitle}</Text>
                    <Text style={styles.subSectionSubtitle}>{uiText.protectionGuidanceSubtitle}</Text>
                  </View>

                  {result.relevant_laws
                    ?.filter(l => l.law_type === 'supporting')
                    .map((law, idx) => (
                      <View key={`supporting-${idx}`} style={[styles.primaryLawCard, styles.supportingLawCard]}>
                        <View style={styles.lawCardHeaderRow}>
                          <View style={[styles.primaryLawBadge, styles.supportingLawBadge]}>
                            <Text style={[styles.primaryLawBadgeText, styles.supportingLawBadgeText]}>{idx + 1}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.primaryLawSectionText, { color: ProtectivaTheme.primaryDark }]}>
                              {law.law_name ? `${law.law_name} - ` : ""}{uiText.section} {law.section}
                            </Text>
                            <Text style={styles.primaryLawTitleText}>
                              {language === 'si' && law.title_si ? law.title_si :
                               language === 'en' && law.title_en ? law.title_en :
                               law.title}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.lawCardBody}>
                          <Text style={styles.lawMeaningLabel}>{uiText.whatItMeans}</Text>
                          <Text style={styles.lawMeaningDesc}>
                            {language === 'si' && law.simple_explanation_si ? law.simple_explanation_si :
                             language === 'en' && law.simple_explanation_en ? law.simple_explanation_en :
                             law.simple_explanation}
                          </Text>

                          {(law.reporting_guidance || law.reporting_guidance_si) && (
                            <View style={styles.reportingGuidanceBox}>
                              <Ionicons name="shield-checkmark" size={16} color={ProtectivaTheme.primaryDark} style={{ marginRight: 6 }} />
                              <Text style={styles.reportingGuidanceText}>
                                <Text style={{ fontWeight: '800' }}>{uiText.reportingGuidance} </Text>
                                {language === 'si' && law.reporting_guidance_si ? law.reporting_guidance_si :
                                 language === 'en' && law.reporting_guidance_en ? law.reporting_guidance_en :
                                 law.reporting_guidance}
                              </Text>
                            </View>
                          )}

                          {law.related_provisions && law.related_provisions.length > 0 && (
                            <View style={styles.nestedRelatedContainer}>
                              <Text style={styles.nestedRelatedHeader}>
                                {language === 'si' ? "අදාළ වෙනත් වගන්ති" : "Related Provisions"} ({law.related_provisions.length})
                              </Text>
                              {law.related_provisions.map((subLaw, subIdx) => (
                                <View key={`sub-${subIdx}`} style={styles.nestedRelatedItemCard}>
                                  <Text style={styles.nestedRelatedTitle}>
                                    {subLaw.law_name ? `${subLaw.law_name} - ` : ""}{uiText.section} {subLaw.section}: {language === 'si' && subLaw.title_si ? subLaw.title_si : (subLaw.title_en || subLaw.title)}
                                  </Text>
                                  <Text style={styles.nestedRelatedDesc}>
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

              {/* Disclaimer Box */}
              <View style={styles.disclaimerBoxTile}>
                <Ionicons name="information-circle-outline" size={18} color={ProtectivaTheme.primaryDark} style={{ marginRight: 8 }} />
                <Text style={styles.disclaimerText}>{uiText.legalDisclaimer}</Text>
              </View>
            </View>

            {/* Right Column: Full Interactive Decision Roadmap */}
            <View style={[styles.gridColumnRight, isDesktop && { flex: 0.8 }]}>
              <LegalDecisionRoadmap result={roadmapResult} language={language} />
            </View>
          </View>

          {/* Interactive Incident Map Component */}
          <View style={{ marginTop: 20 }}>
            <View style={styles.dashboardCardTile}>
              <View style={styles.cardHeaderTitleRow}>
                <Ionicons name="location-outline" size={20} color={ProtectivaTheme.primaryDark} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardHeaderTitle}>{uiText.mapSectionTitle}</Text>
                  <Text style={styles.cardHeaderSubtitle}>{uiText.mapSectionSubtitle}</Text>
                </View>
              </View>

              <IncidentMap
                language={language}
                onLocationSelect={(lat, lng, name) => setSelectedLocation({ latitude: lat, longitude: lng, placeName: name })}
                selectedLocation={selectedLocation}
              />
            </View>
          </View>

          {/* Bottom "You are not alone" Hero Banner */}
          <View style={styles.bottomNotAloneBanner}>
            <View style={styles.notAloneCheckCircle}>
              <Ionicons name="shield-checkmark" size={22} color={ProtectivaTheme.primaryDark} />
            </View>
            <Text style={styles.notAloneBannerText}>
              <Text style={{ fontWeight: '800' }}>You are not alone.</Text> Protectiva is here to support you with trusted guidance and resources.
            </Text>
          </View>
        </View>
      )}

      {/* About Modal Dialog */}
      {showAboutModal && (
        <Modal transparent animationType="fade" visible={showAboutModal}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowAboutModal(false)}
          >
            <View style={styles.modalDialogCard}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.shieldIconCircle}>
                  <Ionicons name="scale-outline" size={22} color={ProtectivaTheme.primaryDark} />
                </View>
                <Text style={styles.modalTitle}>About Legal Guidance</Text>
              </View>
              <Text style={styles.modalBodyText}>
                Protectiva Child Abuse Legal Guidance provides confidential, bilingual information grounded in Sri Lankan Penal Code sections and NCPA Act provisions.
              </Text>
              <Text style={[styles.modalBodyText, { marginTop: 8 }]}>
                This system retrieves verified legal information to assist parents and guardians in taking safe, informed actions to protect children.
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowAboutModal(false)}
              >
                <Text style={styles.modalCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 20,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  row: { flexDirection: 'row' },
  column: { flexDirection: 'column' },

  // Header Banner Card
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    zIndex: 100,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 280,
    gap: 12,
  },
  shieldIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 100,
  },
  langSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  langSelectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  langDropdownMenu: {
    position: 'absolute',
    top: 42,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    width: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 9999,
  },
  langMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  langMenuItemActive: {
    backgroundColor: '#E6F4F1',
  },
  langMenuText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  langMenuTextActive: {
    color: '#0F766E',
    fontWeight: '700',
  },
  aboutPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  aboutPillBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },

  // Incident Card
  incidentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  incidentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  chatIconSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  incidentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  incidentSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  textAreaInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    fontSize: 14,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  textAreaError: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  errorBannerText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '500',
  },
  incidentCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  privacyNoticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  privacyNoticeText: {
    fontSize: 13,
    color: '#64748B',
  },
  actionButtonsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clearBtnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  submitBtnTeal: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#0F766E',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Error Card
  mainErrorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 20,
  },
  mainErrorTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991B1B',
  },
  mainErrorText: {
    fontSize: 13,
    color: '#DC2626',
    marginTop: 2,
  },

  // Middle Section Grid
  middleGridRow: {
    gap: 16,
    marginBottom: 20,
  },
  dashboardCardTile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardHeaderSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },

  // Contacts Sub Tiles
  contactsGridRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  contactSubTile: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactIconBadgeTeal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactIconBadgeGreen: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactPhoneNum: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  contactSubLabel: {
    fontSize: 11,
    color: '#64748B',
  },

  // Privacy Card Tile
  privacyCardTile: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  privacyTopRow: {
    flexDirection: 'row',
    gap: 14,
  },
  privacyLockBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  privacyDescription: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  privacyDangerAlert: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F766E',
    marginTop: 8,
  },
  privacyHelpingIcon: {
    alignSelf: 'flex-end',
  },

  // Summary Stats Cards Row
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statValueLarge: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F766E',
  },
  statValueSubText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detectedBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  detectedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },

  // Results Grid Row
  resultsGridRow: {
    gap: 16,
    marginBottom: 20,
  },
  gridColumnRight: {
    flex: 1,
  },

  // Primary Law Card Styling
  subSectionHeader: {
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  subSectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  primaryLawCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  supportingLawCard: {
    borderColor: '#CCFBF1',
    backgroundColor: '#FAFDFD',
  },
  lawCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  primaryLawBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0F766E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportingLawBadge: {
    backgroundColor: '#CCFBF1',
  },
  primaryLawBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  supportingLawBadgeText: {
    color: '#0F766E',
  },
  primaryLawSectionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
    textTransform: 'uppercase',
  },
  primaryLawTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  lawCardBody: {
    padding: 14,
  },
  lawMeaningLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  lawMeaningDesc: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    marginBottom: 12,
  },
  reportingGuidanceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: 10,
  },
  reportingGuidanceText: {
    fontSize: 12,
    color: '#0F766E',
    flex: 1,
    lineHeight: 17,
  },
  nestedRelatedContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  nestedRelatedHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nestedRelatedItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#0F766E',
  },
  nestedRelatedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  nestedRelatedDesc: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },

  // Disclaimer Box Tile
  disclaimerBoxTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    flex: 1,
  },

  // Bottom Banner
  bottomNotAloneBanner: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  notAloneCheckCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notAloneBannerText: {
    fontSize: 14,
    color: '#0F172A',
    flex: 1,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalDialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    maxWidth: 480,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalBodyText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  modalCloseBtn: {
    marginTop: 20,
    backgroundColor: '#0F766E',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
