import React, { useState, useRef } from "react"
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
  Platform,
} from "react-native"
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons"
import { queryLegalRAG, LegalResult } from "../../lib/legal"
import LegalDecisionRoadmap from "../../src/component/LegalDecisionRoadmap"
import { buildRoadmapResult, RoadmapResult } from "../../src/utils/legalRoadmapLogic"
import IncidentMap from "../../src/component/IncidentMap"
import { saveMarkedLocation, SAVE_RESULT } from "../../lib/locationService"
import DistrictLocationSummary from "../../src/component/DistrictLocationSummary"
import { ProtectivaTheme } from "../../constants/theme"

export default function LegalGuidanceScreen() {
  const { width } = useWindowDimensions()
  const isDesktop = width > 1024
  
  const scrollViewRef = useRef<ScrollView>(null)
  const [resultsY, setResultsY] = useState(0)

  const [description, setDescription] = useState("")
  const [submittedDescription, setSubmittedDescription] = useState("")
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)

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

  // pendingLocation: the unconfirmed preview from the last map click/search.
  // Nothing is written to Supabase until the user clicks "Confirm Location".
  const [pendingLocation, setPendingLocation] = useState<{
    latitude: number;
    longitude: number;
    placeName?: string;
    /** Canonical Sri Lanka district resolved from geocoding address_components. */
    district?: string;
  } | null>(null)

  // True once the current pendingLocation has been successfully saved.
  // Prevents accidental duplicate saves of the same selection.
  const [locationSaved, setLocationSaved] = useState(false)

  // Interactive UI states
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  // Incremented after each successful location save to trigger chart refresh
  const [locationRefreshTrigger, setLocationRefreshTrigger] = useState(0)
  // Save status for the confirm-location action: null | "saving" | "saved" | string (error)
  const [locationSaveStatus, setLocationSaveStatus] = useState<null | "saving" | "saved" | string>(null)

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
        submittedIncidentTitle: "ඉදිරිපත් කළ සිදුවීම",
        submittedIncidentSubtitle: "මෙම සිදුවීම් විස්තරය සඳහා නීතිමය මාර්ගෝපදේශය සකසා ඇත",
        editDescription: "විස්තරය සංස්කරණය කරන්න",
        newAnalysis: "නව විස්තරයක් ඇතුළත් කරන්න",
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
        submittedIncidentTitle: "Submitted Incident",
        submittedIncidentSubtitle: "Legal guidance generated for this incident description",
        editDescription: "Edit Description",
        newAnalysis: "New Analysis",
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
    setSubmittedDescription("")
    setError("")
    setValidationError("")
    setResult(null)
    setRoadmapResult(null)
    setSelectedLocation(null)
    setPendingLocation(null)
    setLocationSaved(false)
    setLocationSaveStatus(null)
    setHasSubmitted(false)
    setIsEditingDescription(false)
    setIsManualSelection(false)
    setSelectedLanguage("en")
  }

  const handleNewAnalysis = () => {
    setDescription("")
    setSubmittedDescription("")
    setError("")
    setValidationError("")
    setResult(null)
    setRoadmapResult(null)
    setSelectedLocation(null)
    setPendingLocation(null)
    setLocationSaved(false)
    setLocationSaveStatus(null)
    setHasSubmitted(false)
    setIsEditingDescription(false)
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true })
    }
  }

  /**
   * Writes the pendingLocation to Supabase exactly once per selection.
   * Called only when the user explicitly clicks "Confirm Location".
   *
   * If the geocoder could not resolve a canonical district the row is NOT
   * inserted and the user sees a clear error asking them to pick a different
   * location. This prevents "Unknown" from ever entering marked_locations.
   */
  const handleConfirmLocation = async () => {
    if (!pendingLocation) return
    if (locationSaved) return // guard against double-save

    setLocationSaveStatus("saving")
    try {
      const result = await saveMarkedLocation(
        pendingLocation.latitude,
        pendingLocation.longitude,
        pendingLocation.placeName,
        pendingLocation.district   // geocoding-sourced canonical district
      )

      if (result.kind === "ok") {
        setLocationSaveStatus("saved")
        setLocationSaved(true)           // disable re-save for this selection
        setSelectedLocation(pendingLocation) // commit preview → confirmed
        setLocationRefreshTrigger((t) => t + 1)
        setTimeout(() => setLocationSaveStatus(null), 4000)

      } else if (result.kind === "noDistrict") {
        // District could not be resolved — do NOT save, show guidance
        setLocationSaveStatus(
          language === "si"
            ? "දිස්ත්‍රික්කය හඳුනාගත නොහැකි විය. කරුණාකර වෙනත් ස්ථානයක් තෝරන්න."
            : "District could not be identified. Please select another location."
        )

      } else {
        // DB error
        setLocationSaveStatus(
          `Save failed — ${result.kind === "dbError" ? result.msg : "check the marked_locations table in Supabase."}`
        )
      }
    } catch (err: any) {
      console.error("[legal-guidance] handleConfirmLocation error:", err)
      setLocationSaveStatus(`Error: ${err?.message ?? String(err)}`)
    }
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
      setSubmittedDescription(description)
      setHasSubmitted(true)
      setIsEditingDescription(false)

      if (data && data.detected_language) {
        const backendLang = data.detected_language.toLowerCase()
        if (backendLang === "si" || backendLang === "sinhala") {
          setSelectedLanguage("si")
        } else if (backendLang === "en" || backendLang === "english") {
          setSelectedLanguage("en")
        }
      }

      // Smooth scroll to top of results section
      setTimeout(() => {
        if (scrollViewRef.current) {
          const scrollTarget = resultsY > 0 ? resultsY - 20 : 350
          scrollViewRef.current.scrollTo({ y: scrollTarget, animated: true })
        }
      }, 150)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
      setResult(null)
      setRoadmapResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
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

      {/* 2. Incident Description Section (Compact Card after Submit vs Full Form) */}
      {hasSubmitted && !isEditingDescription ? (
        /* Compact Submitted Summary Card */
        <View style={styles.submittedCard}>
          <View style={styles.submittedCardHeader}>
            <View style={styles.chatIconSquare}>
              <Ionicons name="checkmark-circle" size={20} color={ProtectivaTheme.primaryDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.submittedTitle}>{uiText.submittedIncidentTitle}</Text>
              <Text style={styles.submittedSubtitle}>{uiText.submittedIncidentSubtitle}</Text>
            </View>
            <View style={styles.langPillBadge}>
              <Ionicons name="globe-outline" size={14} color={ProtectivaTheme.primaryDark} />
              <Text style={styles.langPillBadgeText}>
                {selectedLanguage === "si" ? "සිංහල" : "English"}
              </Text>
            </View>
          </View>

          <View style={styles.submittedTextContainer}>
            <Text style={styles.submittedText}>{submittedDescription}</Text>
          </View>

          <View style={styles.submittedCardFooter}>
            <TouchableOpacity
              style={styles.editBtnOutline}
              onPress={() => setIsEditingDescription(true)}
            >
              <Ionicons name="create-outline" size={16} color={ProtectivaTheme.primaryDark} />
              <Text style={styles.editBtnText}>{uiText.editDescription}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newAnalysisBtnGhost}
              onPress={handleNewAnalysis}
            >
              <Ionicons name="add-circle-outline" size={16} color="#64748B" />
              <Text style={styles.newAnalysisBtnText}>{uiText.newAnalysis}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Original Full Incident Form */
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
      )}

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
        <View
          onLayout={(event) => {
            setResultsY(event.nativeEvent.layout.y)
          }}
          style={{ marginTop: 24 }}
        >
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

              {/*
               * onLocationSelect is called by IncidentMap on every click / search / drag.
               * We ONLY store the preview in pendingLocation — no DB write happens here.
               * The DB insert is deferred until the user clicks "Confirm Location".
               */}
              <IncidentMap
                language={language}
                onLocationSelect={(lat, lng, name, district) => {
                  // Preview only — do NOT call saveMarkedLocation here
                  setPendingLocation({ latitude: lat, longitude: lng, placeName: name, district })
                  setLocationSaved(false)      // new selection → re-enable confirm
                  setLocationSaveStatus(null)  // clear any previous status badge
                }}
                selectedLocation={pendingLocation}
              />

              {/* ── Pending location preview (shown before confirming) ── */}
              {pendingLocation && !locationSaved && (
                <View style={styles.pendingLocationPreview}>
                  <View style={styles.pendingLocationRow}>
                    <Ionicons name="location" size={16} color="#0284c7" />
                    <Text style={styles.pendingLocationTitle}>
                      {language === "si" ? "තෝරාගත් ස්ථානය (තහවුරු කර නැත)" : "Selected Location (not yet confirmed)"}
                    </Text>
                  </View>
                  <Text style={styles.pendingLocationName} numberOfLines={2}>
                    {pendingLocation.placeName || `${pendingLocation.latitude.toFixed(5)}, ${pendingLocation.longitude.toFixed(5)}`}
                  </Text>
                  {pendingLocation.district ? (
                    <Text style={styles.pendingLocationDistrict}>
                      {language === "si" ? "දිස්ත්‍රික්කය: " : "District: "}
                      <Text style={{ fontWeight: "700" }}>{pendingLocation.district}</Text>
                    </Text>
                  ) : (
                    <Text style={styles.pendingLocationDistrictUnknown}>
                      {language === "si"
                        ? "⚠ දිස්ත්‍රික්කය හඳුනාගත නොහැකි විය"
                        : "⚠ District could not be resolved"}
                    </Text>
                  )}
                  <Text style={styles.pendingLocationCoords}>
                    {pendingLocation.latitude.toFixed(6)}, {pendingLocation.longitude.toFixed(6)}
                  </Text>
                </View>
              )}

              {/* ── Already-confirmed location display ── */}
              {locationSaved && selectedLocation && (
                <View style={styles.confirmedLocationBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.confirmedLocationTitle}>
                      {language === "si" ? "✓ ස්ථානය සුරකින ලදී" : "✓ Location Confirmed & Saved"}
                    </Text>
                    <Text style={styles.confirmedLocationName} numberOfLines={2}>
                      {selectedLocation.placeName}
                    </Text>
                  </View>
                </View>
              )}

              {/* ── Confirm Location button ── */}
              {pendingLocation && (
                <TouchableOpacity
                  style={[
                    styles.confirmLocationBtn,
                    (locationSaveStatus === "saving" || locationSaved) && styles.confirmLocationBtnDisabled,
                  ]}
                  onPress={handleConfirmLocation}
                  disabled={locationSaveStatus === "saving" || locationSaved}
                  activeOpacity={0.8}
                >
                  {locationSaveStatus === "saving" ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Ionicons
                      name={locationSaved ? "checkmark-circle" : "checkmark-circle-outline"}
                      size={18}
                      color="#ffffff"
                    />
                  )}
                  <Text style={styles.confirmLocationBtnText}>
                    {locationSaved
                      ? (language === "si" ? "සුරකින ලදී" : "Saved")
                      : locationSaveStatus === "saving"
                      ? (language === "si" ? "සුරකිමින්..." : "Saving…")
                      : (language === "si" ? "ස්ථානය තහවුරු කරන්න" : "Confirm Location")}
                  </Text>
                </TouchableOpacity>
              )}

              {/* ── Save status badge (error state only; success shown in confirmedLocationBadge) ── */}
              {locationSaveStatus !== null &&
                locationSaveStatus !== "saving" &&
                locationSaveStatus !== "saved" && (
                <View style={styles.saveErrorBadge}>
                  <Ionicons name="alert-circle" size={16} color="#dc2626" />
                  <Text style={styles.saveErrorBadgeText}>
                    {locationSaveStatus}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* District Location Summary — updates after each confirmed location mark */}
          <DistrictLocationSummary refreshTrigger={locationRefreshTrigger} />

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
    padding: 24,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  row: { flexDirection: 'row' },
  column: { flexDirection: 'column' },

  // ── Pending location preview panel ─────────────────────────
  pendingLocationPreview: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    gap: 8,
  },
  pendingLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingLocationTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pendingLocationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 20,
  },
  pendingLocationCoords: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  pendingLocationDistrict: {
    fontSize: 13,
    color: '#0F766E',
    fontWeight: '600',
  },
  pendingLocationDistrictUnknown: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
  },

  // ── Confirmed location badge ────────────────────────────────
  confirmedLocationBadge: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  confirmedLocationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 4,
  },
  confirmedLocationName: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
  },

  // ── Confirm Location button ─────────────────────────────────
  confirmLocationBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmLocationBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmLocationBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // ── Save error badge ────────────────────────────────────────
  saveErrorBadge: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveErrorBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
    flex: 1,
  },

  // Header Banner Card
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    zIndex: 100,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 280,
    gap: 16,
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
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 4,
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
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  langSelectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  langDropdownMenu: {
    position: 'absolute',
    top: 46,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    width: 140,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 9999,
  },
  langMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  langMenuItemActive: {
    backgroundColor: '#F0FDF4',
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  aboutPillBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },

  // Compact Submitted Summary Card
  submittedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: 24,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  submittedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  submittedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  submittedSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  langPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  langPillBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F766E',
  },
  submittedTextContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  submittedText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  submittedCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    flexWrap: 'wrap',
  },
  editBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0F766E',
    backgroundColor: '#F0FDF4',
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
  },
  newAnalysisBtnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  newAnalysisBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },

  // Incident Card
  incidentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 2,
  },
  incidentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  chatIconSquare: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
    fontSize: 12,
    color: '#64748B',
  },
  textAreaInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    minHeight: 140,
    fontSize: 14,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#CBD5E1',
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
    gap: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  incidentCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  privacyNoticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privacyNoticeText: {
    fontSize: 12,
    color: '#64748B',
  },
  actionButtonsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearBtnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
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
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0F766E',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
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
    marginBottom: 24,
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
    marginBottom: 24,
  },
  dashboardCardTile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardHeaderSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // Contacts Sub Tiles
  contactsGridRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  contactSubTile: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  contactIconBadgeTeal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactIconBadgeGreen: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactPhoneNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 24,
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
    padding: 24,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  privacyTopRow: {
    flexDirection: 'row',
    gap: 16,
  },
  privacyLockBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
    marginBottom: 6,
  },
  privacyDescription: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  privacyDangerAlert: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F766E',
    marginTop: 12,
  },
  privacyHelpingIcon: {
    alignSelf: 'flex-end',
  },

  // Summary Stats Cards Row
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 240,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statValueLarge: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F766E',
  },
  statValueSubText: {
    fontSize: 12,
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
    marginBottom: 24,
  },
  gridColumnRight: {
    flex: 1,
  },

  // Primary Law Card Styling
  subSectionHeader: {
    marginBottom: 16,
    paddingBottom: 8,
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  supportingLawCard: {
    borderColor: '#CCFBF1',
    backgroundColor: '#FAFDFD',
  },
  lawCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  primaryLawBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    marginTop: 2,
  },
  lawCardBody: {
    padding: 16,
  },
  lawMeaningLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  lawMeaningDesc: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 16,
  },
  reportingGuidanceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: 12,
  },
  reportingGuidanceText: {
    fontSize: 12,
    color: '#0F766E',
    flex: 1,
    lineHeight: 18,
  },
  nestedRelatedContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  nestedRelatedHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nestedRelatedItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
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
    marginTop: 4,
    lineHeight: 18,
  },

  // Disclaimer Box Tile
  disclaimerBoxTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
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
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 24,
    marginBottom: 32,
  },
  notAloneCheckCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    lineHeight: 20,
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
    ...Platform.select({
      web: { cursor: "pointer" as any },
      default: {},
    }),
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
