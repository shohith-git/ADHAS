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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setReply(response.data.reply);
    } catch (err) {
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
      style={{ flex: 1, backgroundColor: "#f1f5f9" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: 120,
          alignItems: "center",
        }}
      >
        {/* Container */}
        <View
          style={{
            width: "100%",
            maxWidth: 900,
            paddingHorizontal: 20,
            paddingTop: 25,
          }}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.push("/student-dashboard")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#2563eb", // SAME BRIGHT BLUE
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 8,
              alignSelf: "flex-start", // keeps it small
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 3,
            }}
          >
            <Text style={{ fontSize: 16, color: "white", marginRight: 4 }}>
              ←
            </Text>
            <Text style={{ fontSize: 15, color: "white", fontWeight: "600" }}>
              Back
            </Text>
          </TouchableOpacity>

          {/* Heading */}
          <Text
            style={{
              fontSize: 32,
              fontWeight: "800",
              marginTop: 20,
              color: "#0f172a",
            }}
          >
            Student AI Assistant
          </Text>
          <Text
            style={{
              fontSize: 16,
              marginTop: 8,
              color: "#475569",
              marginBottom: 25,
            }}
          >
            Ask anything about leave, mess, attendance, complaints or hostel
            rules.
          </Text>

          {/* Quick Prompts */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20 }}
          >
            {quickPrompts.map((p, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => askAI(p)}
                style={{
                  backgroundColor: "#eef2ff",
                  paddingVertical: 10,
                  paddingHorizontal: 18,
                  marginRight: 12,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "#c7d2fe",
                  shadowColor: "#000",
                  shadowOpacity: 0.04,
                  shadowOffset: { width: 0, height: 1 },
                }}
              >
                <Text style={{ fontSize: 14, color: "#4338ca" }}>{p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Main Card */}
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 20,
              padding: 20,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowOffset: { width: 0, height: 3 },
              shadowRadius: 5,
              borderWidth: 1,
              borderColor: "#e2e8f0",
            }}
          >
            {/* Input */}
            <TextInput
              placeholder="Type your question..."
              value={query}
              onChangeText={setQuery}
              style={{
                backgroundColor: "#f8fafc",
                borderWidth: 1,
                borderColor: "#cbd5e1",
                padding: 14,
                borderRadius: 12,
                fontSize: 16,
                marginBottom: 15,
              }}
            />

            {/* Ask Button */}
            <TouchableOpacity
              onPress={() => askAI()}
              style={{
                backgroundColor: "#2563eb",
                paddingVertical: 15,
                borderRadius: 12,
                marginBottom: 10,
                shadowColor: "#1d4ed8",
                shadowOpacity: 0.3,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 18,
                  color: "white",
                  fontWeight: "600",
                }}
              >
                Ask AI
              </Text>
            </TouchableOpacity>

            {/* Loading */}
            {loading && <ActivityIndicator size="large" color="#2563eb" />}

            {/* Response */}
            {!loading && reply !== "" && (
              <View
                style={{
                  marginTop: 20,
                  backgroundColor: "#f1f5f9",
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: "#1e293b",
                    lineHeight: 22,
                  }}
                >
                  {reply}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
