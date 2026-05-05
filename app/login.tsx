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

  const handleClear = () => {
    setDescription("")
    setLanguage("en")
    setError("")
    setResult(null)
  }

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError("Please enter an incident description")
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Child Abuse Legal Guidance</Text>
      <Text style={styles.helperText}>
        Enter an abuse-related incident description to receive legal guidance.
      </Text>

      <Text style={styles.label}>Incident Description</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Enter abuse-related incident description"
        multiline
        numberOfLines={5}
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Language</Text>
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
            English
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
            Sinhala
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.submitButton, styles.actionButtonFirst]} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={{ marginTop: 20, alignItems: "center" }}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={{ marginTop: 8 }}>Loading legal guidance...</Text>
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Result</Text>

          <Text style={styles.resultText}>
            <Text style={styles.bold}>Detected Language: </Text>
            {result.detected_language}
          </Text>

          <Text style={styles.resultText}>
            <Text style={styles.bold}>Abuse Category: </Text>
            {result.abuse_category}
          </Text>

          <Text style={styles.sectionHeading}>Relevant Laws</Text>
          {result.relevant_laws?.map((law: any, index: number) => (
            <View key={index} style={styles.lawCard}>
              <Text style={styles.resultText}>
                <Text style={styles.bold}>Section: </Text>
                {law.section}
              </Text>

              <Text style={styles.resultText}>
                <Text style={styles.bold}>Title: </Text>
                {law.title}
              </Text>

              <Text style={styles.resultText}>
                <Text style={styles.bold}>Simple Explanation: </Text>
                {law.simple_explanation}
              </Text>

              <Text style={styles.resultText}>
                <Text style={styles.bold}>Reporting Guidance: </Text>
                {law.reporting_guidance}
              </Text>
            </View>
          ))}

          <Text style={styles.sectionHeading}>Decision Roadmap</Text>
          {result.decision_roadmap?.map((step: string, index: number) => (
            <Text key={index} style={styles.roadmapItem}>
              • {step}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 30,
    marginBottom: 25,
    color: "#0f172a",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1e293b",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#ffffff",
    textAlignVertical: "top",
    marginBottom: 18,
    minHeight: 120,
  },
  languageRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#94a3b8",
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  activeLanguageButton: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  actionButtonFirst: {
    marginRight: 12,
  },
  languageButtonFirst: {
    marginRight: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#94a3b8",
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  clearButtonText: {
    color: "#1e293b",
    fontSize: 16,
    fontWeight: "700",
  },
  helperText: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    marginBottom: 18,
    lineHeight: 20,
  },
  languageButtonText: {
    color: "#1e293b",
    fontWeight: "600",
  },
  activeLanguageButtonText: {
    color: "#ffffff",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  errorText: {
    color: "red",
    marginTop: 16,
    fontSize: 15,
  },
  resultCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    color: "#0f172a",
  },
  resultText: {
    fontSize: 15,
    marginBottom: 8,
    color: "#334155",
    lineHeight: 22,
  },
  bold: {
    fontWeight: "700",
    color: "#0f172a",
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 10,
    color: "#0f172a",
  },
  lawCard: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  roadmapItem: {
    fontSize: 15,
    marginBottom: 6,
    color: "#334155",
    lineHeight: 22,
  },
})
