import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function AIAssistant() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setReply("");

    try {
      const token = await AsyncStorage.getItem("token");

      const res = await axios.post(
        "http://10.69.232.21:5000/api/ai/analyze",
        { prompt: query },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReply(res.data.reply);
    } catch (err) {
      setReply("AI failed to respond. Check backend or token.");
    }

    setLoading(false);
  };

  // Pre-made easy buttons
  const smartPrompts = [
    "Summarize today's attendance",
    "Give list of common hostel complaints",
    "Suggest improvements for room allocation",
    "Identify students with repeated issues",
    "Give today's warden summary",
  ];

  return (
    <ScrollView style={{ padding: 20 }}>
      {/* 🔙 Floating Back Button */}
      <TouchableOpacity
        onPress={() => router.push("/warden-dashboard")}
        style={{
          paddingVertical: 10,
          paddingHorizontal: 14,
          backgroundColor: "#e2e8f0",
          borderRadius: 50,
          alignSelf: "flex-start",
          marginBottom: 15,
        }}
      >
        <Text style={{ fontSize: 16, color: "#1e293b" }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 26, fontWeight: "800", marginBottom: 10 }}>
        AI Assistant
      </Text>

      <Text style={{ marginBottom: 20, fontSize: 15, color: "#475569" }}>
        Ask anything about hostel operations, attendance, rooms, or complaints.
      </Text>

      {/* ⭐ Smart Prompt Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 20 }}
      >
        {smartPrompts.map((text, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              setQuery(text);
              askAI();
            }}
            style={{
              backgroundColor: "#eef2ff",
              paddingVertical: 10,
              paddingHorizontal: 15,
              marginRight: 10,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#c7d2fe",
            }}
          >
            <Text style={{ color: "#4338ca", fontSize: 13 }}>{text}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ⭐ Input Box */}
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Type your question..."
        style={{
          borderWidth: 1,
          borderColor: "#cbd5e1",
          borderRadius: 12,
          padding: 15,
          backgroundColor: "#fff",
          fontSize: 16,
        }}
      />

      {/* ⭐ Ask Button */}
      <TouchableOpacity
        onPress={askAI}
        style={{
          backgroundColor: "#2563eb",
          padding: 14,
          borderRadius: 12,
          marginTop: 15,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontSize: 17 }}>
          Ask AI
        </Text>
      </TouchableOpacity>

      {/* ⭐ Loader */}
      {loading && (
        <ActivityIndicator
          size="large"
          color="#2563eb"
          style={{ marginTop: 20 }}
        />
      )}

      {/* ⭐ AI Response Box */}
      {reply !== "" && !loading && (
        <View
          style={{
            backgroundColor: "#f8fafc",
            padding: 18,
            borderRadius: 12,
            marginTop: 20,
            borderWidth: 1,
            borderColor: "#e2e8f0",
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 3,
          }}
        >
          <Text style={{ fontSize: 16, color: "#1e293b", lineHeight: 22 }}>
            {reply}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
