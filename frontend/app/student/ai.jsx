// adhas/frontend/app/student/ai.jsx  (or student/ai-assistant.jsx)

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function StudentAI() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const askAI = async (custom = null) => {
    const finalPrompt = custom || query.trim();
    if (!finalPrompt) return;

    setLoading(true);
    setReply("");

    try {
      const token = await AsyncStorage.getItem("token");

      const response = await axios.post(
        "http://10.49.102.21:5000/api/ai/analyze",
        { prompt: finalPrompt },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReply(response.data.reply);
    } catch {
      setReply("AI could not respond. Please try again.");
    }

    setLoading(false);
  };

  const quickPrompts = [
    "How to apply for leave?",
    "What are the mess timings?",
    "How to file a complaint?",
    "What is Day Pass vs Home Pass?",
    "How to check my attendance?",
    "How to check my room details?",
    "What to do for electricity or water problems?",
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#eef4ff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: 140,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 900,
            paddingHorizontal: 20,
            paddingTop: 30,
          }}
        >
          {/* BACK BUTTON */}
          <TouchableOpacity
            onPress={() => router.push("/student-dashboard")}
            style={styles.backBtn}
          >
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backLabel}>Back</Text>
          </TouchableOpacity>

          {/* HEADING */}
          <Text style={styles.title}>AI Assistant</Text>
          <Text style={styles.subtitle}>
            Ask anything related to leave, mess, rooms, attendance or hostel
            rules.
          </Text>

          {/* QUICK PROMPTS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 25 }}
          >
            {quickPrompts.map((p, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => askAI(p)}
                style={styles.chip}
              >
                <Text style={styles.chipText}>{p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* MAIN CARD */}
          <View style={styles.mainCard}>
            {/* INPUT */}
            <TextInput
              placeholder="Type your question..."
              placeholderTextColor="#94a3b8"
              value={query}
              onChangeText={setQuery}
              style={styles.input}
            />

            {/* ASK BUTTON */}
            <TouchableOpacity style={styles.askBtn} onPress={() => askAI()}>
              <Text style={styles.askBtnText}>Ask AI</Text>
            </TouchableOpacity>

            {/* LOADING */}
            {loading && (
              <View style={{ marginTop: 15 }}>
                <ActivityIndicator size="large" color="#2563eb" />
              </View>
            )}

            {/* RESPONSE MESSAGE */}
            {!loading && reply !== "" && (
              <View style={styles.replyBubble}>
                <Text style={styles.replyText}>{reply}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ---------------------- STYLES ---------------------- */

const styles = {
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
  },

  backArrow: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
    marginRight: 5,
  },

  backLabel: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "600",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 25,
  },

  subtitle: {
    fontSize: 15,
    color: "#475569",
    marginTop: 6,
    marginBottom: 25,
  },

  chip: {
    backgroundColor: "#eef2ff",
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#c7d2fe",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
  },

  chipText: {
    fontSize: 14,
    color: "#4338ca",
  },

  mainCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 15,
    color: "#0f172a",
  },

  askBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: "#1d4ed8",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 10,
  },

  askBtnText: {
    textAlign: "center",
    fontSize: 18,
    color: "white",
    fontWeight: "700",
  },

  replyBubble: {
    marginTop: 18,
    backgroundColor: "#eef4ff",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },

  replyText: {
    fontSize: 16,
    color: "#1e293b",
    lineHeight: 22,
  },
};
