import { useState } from "react"
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { queryLegalRAG } from "../lib/legalApi"

export default function LoginScreen() {
  const [description, setDescription] = useState("")
  const [language, setLanguage] = useState("en")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<any>(null)

  const uiText = language === "si"
    ? {
        title: "ළමා අපයෝජන නීතිමය මාර්ගෝපදේශ",
        subtitle: "සිද්ධිය පිළිබඳ විස්තරයක් ඇතුළත් කර නීතිමය මාර්ගෝපදේශ, අදාළ නීති කොටස් සහ ක්‍රියාමාර්ග සැලැස්ම ලබාගන්න.",
        incidentDescription: "සිද්ධියේ විස්තරය",
        incidentPlaceholder: "අපයෝජනයට අදාල සිද්ධියේ විස්තරය ඇතුළත් කරන්න",
        language: "භාෂාව",
        english: "ඉංග්‍රීසි",
        sinhala: "සිංහල",
        submit: "ඉදිරිපත් කරන්න",
        clear: "මකන්න",
        loading: "නීතිමය මාර්ගෝපදේශ ලබාගනිමින් පවතී...",
        result: "ප්‍රතිඵල",
        detectedLanguage: "හඳුනාගත් භාෂාව",
        abuseCategory: "අපයෝජන වර්ගය",
        relevantLaws: "අදාළ නීති කොටස්",
        decisionRoadmap: "ක්‍රියාමාර්ග සැලැස්ම",
        section: "වගන්තිය",
        titleLabel: "ශීර්ෂය",
        simpleExplanation: "සරල පැහැදිලි කිරීම",
        reportingGuidance: "පැමිණිලි කිරීමේ උපදෙස්",
        emergencyContacts: "හදිසි සම්බන්ධතා",
        ncpaLabel: "ජාතික ළමා ආරක්ෂක කොමිසම",
        policeLabel: "පොලීසිය",
        lawsFound: "හමුවූ නීති කොටස්",
        emptyError: "කරුණාකර සිද්ධියේ විස්තරයක් ඇතුළත් කරන්න",
        followSteps: "මෙම පියවර අනුගමනය කරමින් සුදුසු ක්‍රියාමාර්ගයක් ගන්න:",
      }
    : {
        title: "Child Abuse Legal Guidance",
        subtitle: "Enter an incident description to receive legal guidance, relevant legal sections, and a clear decision roadmap.",
        incidentDescription: "Incident Description",
        incidentPlaceholder: "Enter abuse-related incident description",
        language: "Language",
        english: "English",
        sinhala: "Sinhala",
        submit: "Submit",
        clear: "Clear",
        loading: "Loading legal guidance...",
        result: "Result",
        detectedLanguage: "Detected Language",
        abuseCategory: "Abuse Category",
        relevantLaws: "Relevant Laws",
        decisionRoadmap: "Decision Roadmap",
        section: "Section",
        titleLabel: "Title",
        simpleExplanation: "Simple Explanation",
        reportingGuidance: "Reporting Guidance",
        emergencyContacts: "Emergency Contacts",
        ncpaLabel: "NCPA",
        policeLabel: "Police",
        lawsFound: "Relevant Laws Found",
        emptyError: "Please enter an incident description",
        followSteps: "Follow these steps to take appropriate action:",
      }

  const handleClear = () => {
    setDescription("")
    setError("")
    setResult(null)
  }

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError(uiText.emptyError)
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const data = await queryLegalRAG({
        description,
        language,
      })
      setResult(data)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const parseRoadmapSteps = (roadmap: string[]): Array<{ number: string; title: string; description: string }> => {
    return roadmap.map((step) => {
      const match = step.match(/^(\d+)\.\s*(.+):\s*(.+)$/);
      if (match) {
        return { number: match[1], title: match[2], description: match[3] };
      }
      return { number: "", title: "", description: step };
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.mainTitle}>{uiText.title}</Text>
        <Text style={styles.subtitle}>{uiText.subtitle}</Text>
      </View>

      {/* Input Card */}
      <View style={styles.inputCard}>
        <View style={styles.sectionContainer}>
          <Text style={styles.cardLabel}>{uiText.incidentDescription}</Text>
          <TextInput
            style={styles.textArea}
            placeholder={uiText.incidentPlaceholder}
            multiline
            numberOfLines={5}
            value={description}
            onChangeText={setDescription}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionContainer}>
          <Text style={styles.cardLabel}>{uiText.language}</Text>
          <View style={styles.languageRow}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                styles.languageButtonFirst,
                language === "en" && styles.activeLanguageButton,
              ]}
              onPress={() => setLanguage("en")}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  language === "en" && styles.activeLanguageButtonText,
                ]}
              >
                {uiText.english}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.languageButton,
                language === "si" && styles.activeLanguageButton,
              ]}
              onPress={() => setLanguage("si")}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  language === "si" && styles.activeLanguageButtonText,
                ]}
              >
                {uiText.sinhala}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.submitButton, styles.actionButtonFirst]} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>{uiText.submit}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>{uiText.clear}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>{uiText.loading}</Text>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      )}

      {/* Result Section */}
      {result && (
        <>
          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{uiText.detectedLanguage}</Text>
              <Text style={styles.summaryValue}>{result.detected_language}</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{uiText.abuseCategory}</Text>
              <Text style={styles.summaryValue}>{result.abuse_category}</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{uiText.relevantLaws}</Text>
              <Text style={styles.summaryValue}>{result.relevant_laws?.length || 0}</Text>
              <Text style={styles.summarySubtext}>{uiText.lawsFound}</Text>
            </View>
          </View>

          {/* Relevant Laws Section */}
          {result.relevant_laws && result.relevant_laws.length > 0 && (
            <View style={styles.lawsSection}>
              <Text style={styles.sectionTitle}>{uiText.relevantLaws}</Text>
              {result.relevant_laws.map((law: any, index: number) => (
                <View key={index} style={styles.lawCardPremium}>
                  <View style={styles.lawHeader}>
                    <View style={styles.lawBadge}>
                      <Text style={styles.lawBadgeText}>{index + 1}</Text>
                    </View>
                    <View style={styles.lawHeaderText}>
                              <Text style={styles.lawSection}>{uiText.section}: {law.section}</Text>
                      <Text style={styles.lawTitle} numberOfLines={2}>{law.title}</Text>
                    </View>
                  </View>

                  <View style={styles.lawContent}>
                    <View style={styles.lawContentItem}>
                      <Text style={styles.lawContentLabel}>{uiText.simpleExplanation}</Text>
                      <Text style={styles.lawContentText}>{law.simple_explanation}</Text>
                    </View>

                    <View style={styles.lawContentItem}>
                      <Text style={styles.lawContentLabel}>{uiText.reportingGuidance}</Text>
                      <Text style={styles.lawContentText}>{law.reporting_guidance}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Decision Roadmap Section */}
          {result.decision_roadmap && result.decision_roadmap.length > 0 && (
            <View style={styles.roadmapSectionContainer}>
              <View style={styles.roadmapTitleContainer}>
                <View style={styles.roadmapTitleIcon}>
                  <Text style={styles.roadmapTitleIconText}>🗺️</Text>
                </View>
                <Text style={styles.roadmapSectionTitle}>{uiText.decisionRoadmap}</Text>
              </View>
              <Text style={styles.roadmapSubtitle}>{uiText.followSteps}</Text>
              <View style={styles.roadmapSection}>
                {parseRoadmapSteps(result.decision_roadmap).map((step: { number: string; title: string; description: string }, index) => (
                  <View key={index} style={styles.roadmapStep}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.stepContent}>
                      {step.title && <Text style={styles.stepTitle}>{step.title}</Text>}
                      <Text style={styles.stepDescription}>{step.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Emergency Contacts Section */}
          <View style={styles.emergencySection}>
            <View style={styles.emergencyHeader}>
              <Text style={styles.emergencyTitle}>🚨 {uiText.emergencyContacts}</Text>
            </View>
            <View style={styles.emergencyContent}>
              <View style={styles.emergencyContact}>
                <Text style={styles.emergencyContactLabel}>{uiText.ncpaLabel}</Text>
                <Text style={styles.emergencyContactNumber}>1929</Text>
              </View>
              <View style={styles.emergencyContact}>
                <Text style={styles.emergencyContactLabel}>{uiText.policeLabel}</Text>
                <Text style={styles.emergencyContactNumber}>119</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f0f4f8",
  },
  heroSection: {
    marginBottom: 28,
    marginTop: 12,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    color: "#1e3a8a",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
    lineHeight: 24,
  },
  inputCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  sectionContainer: {
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#f8fafc",
    textAlignVertical: "top",
    minHeight: 120,
    fontSize: 15,
    color: "#1e293b",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 16,
  },
  languageRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    alignItems: "center",
  },
  languageButtonFirst: {
    marginRight: 10,
  },
  activeLanguageButton: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  languageButtonText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 14,
  },
  activeLanguageButtonText: {
    color: "#ffffff",
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 18,
  },
  actionButtonFirst: {
    marginRight: 10,
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  clearButtonText: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "700",
  },
  loadingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#475569",
    fontWeight: "500",
  },
  errorCard: {
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "600",
  },
  summaryContainer: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e0e7ff",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e3a8a",
  },
  summarySubtext: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4,
  },
  lawsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e3a8a",
    marginBottom: 14,
  },
  lawCardPremium: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  lawHeader: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  lawBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  lawBadgeText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  lawHeaderText: {
    flex: 1,
  },
  lawSection: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  lawTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 4,
  },
  lawContent: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  lawContentItem: {
    marginBottom: 12,
  },
  lawContentLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563eb",
    marginBottom: 4,
  },
  lawContentText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 21,
  },
  roadmapSection: {
    marginBottom: 24,
    position: "relative",
  },
  roadmapSectionContainer: {
    marginBottom: 24,
  },
  roadmapTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  roadmapTitleIcon: {
    marginRight: 10,
    fontSize: 24,
  },
  roadmapTitleIconText: {
    fontSize: 24,
  },
  roadmapSectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e3a8a",
    flex: 1,
  },
  roadmapSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
    fontWeight: "500",
  },
  roadmapStep: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-start",
    position: "relative",
  },
  stepNumber: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2563eb",
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    marginTop: 0,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
    flexShrink: 0,
  },
  stepNumberText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 18,
  },
  stepContent: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: "#dbeafe",
    marginTop: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e3a8a",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
    fontWeight: "500",
  },
  emergencySection: {
    backgroundColor: "#fef08a",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#fcd34d",
  },
  emergencyHeader: {
    backgroundColor: "#f59e0b",
    padding: 14,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  emergencyContent: {
    flexDirection: "row",
    padding: 14,
    justifyContent: "space-around",
  },
  emergencyContact: {
    alignItems: "center",
  },
  emergencyContactLabel: {
    fontSize: 12,
    color: "#92400e",
    fontWeight: "600",
    marginBottom: 4,
  },
  emergencyContactNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#b45309",
  },
})

