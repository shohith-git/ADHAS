import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function WardenStudentDetails({ mode = "add" }) {
  // mode: "add" or "edit"
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const studentId = id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const BACKEND = "http://172.29.206.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [details, setDetails] = useState({
    usn: "",
    dept_branch: "",
    year: "",
    batch: "",
    room_no: "",
    gender: "",
    dob: "",
    phone_number: "",
    address: "",
    father_name: "",
    father_number: "",
    mother_name: "",
    mother_number: "",
    profile_photo: "",
  });

  // Fetch student if editing
  useEffect(() => {
    const fetchStudent = async () => {
      if (!studentId) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${BACKEND}/api/students/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDetails((prev) => ({ ...prev, ...res.data }));
      } catch (err) {
        Swal.fire("❌ Error", "Unable to load student details", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId]);

  // Save or Update student
  const handleSave = async () => {
    if (!details.usn || !details.room_no) {
      return Swal.fire(
        "⚠️ Missing Info",
        "USN and Room No are required",
        "warning"
      );
    }

    try {
      setSaving(true);

      const res = await axios.put(
        `${BACKEND}/api/students/${studentId}/details`,
        details,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      Swal.fire("✅ Success", res.data.message, "success");

      // ✅ Correct dynamic route
      router.push(`/warden/student-profile/${studentId}`);
    } catch (err) {
      Swal.fire(
        "❌ Error",
        err.response?.data?.message || "Failed to save details",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    console.log("Navigating back to:", id);
    router.push(`/warden/student-profile/${id}`);
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Loading student data...</Text>
      </View>
    );

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>
        {mode === "edit" ? "✏️ Edit Student Details" : "🧾 Add Student Details"}
      </Text>

      {/* ─── Basic Info ─── */}
      <Text style={styles.sectionTitle}>Basic Information</Text>

      {/* ─── Profile ─── */}
      <Text style={styles.sectionTitle}>Profile</Text>

      <Text style={styles.label}>Profile Photo (URL)</Text>
      <TextInput
        style={styles.input}
        placeholder="Paste photo URL or leave blank"
        value={details.profile_photo}
        onChangeText={(text) => setDetails({ ...details, profile_photo: text })}
      />
      <Text style={styles.label}>Hostel ID</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter hostel ID (number only)"
        keyboardType="numeric"
        value={details.hostel_id?.toString() || ""}
        onChangeText={(text) =>
          setDetails({ ...details, hostel_id: text.replace(/[^0-9]/g, "") })
        }
      />

      <Text style={styles.label}>USN</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter unique student number"
        value={details.usn}
        onChangeText={(text) => setDetails({ ...details, usn: text })}
      />

      <Text style={styles.label}>Department / Branch</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. CSE / ECE / MECH"
        value={details.dept_branch}
        onChangeText={(text) => setDetails({ ...details, dept_branch: text })}
      />

      <Text style={styles.label}>Year</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 2"
        keyboardType="numeric"
        value={details.year?.toString() || ""}
        onChangeText={(text) => setDetails({ ...details, year: text })}
      />

      <Text style={styles.label}>Batch</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 2023-27"
        value={details.batch}
        onChangeText={(text) => setDetails({ ...details, batch: text })}
      />

      <Text style={styles.label}>Room Number</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. E101"
        value={details.room_no}
        onChangeText={(text) => setDetails({ ...details, room_no: text })}
      />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.radioGroup}>
        {["Male", "Female", "Other"].map((option) => (
          <TouchableOpacity
            key={option}
            style={styles.radioOption}
            onPress={() => setDetails({ ...details, gender: option })}
          >
            <View style={styles.radioCircle}>
              {details.gender === option && (
                <View style={styles.radioSelected} />
              )}
            </View>
            <Text style={styles.radioText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Date of Birth</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={details.dob}
        onChangeText={(text) => setDetails({ ...details, dob: text })}
      />

      {/* ─── Contact Info ─── */}
      <Text style={styles.sectionTitle}>Contact Details</Text>

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        keyboardType="phone-pad"
        placeholder="Enter phone number"
        value={details.phone_number}
        onChangeText={(text) => setDetails({ ...details, phone_number: text })}
      />

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: "top" }]}
        multiline
        placeholder="Enter full address"
        value={details.address}
        onChangeText={(text) => setDetails({ ...details, address: text })}
      />

      {/* ─── Parent Info ─── */}
      <Text style={styles.sectionTitle}>Parent Details</Text>

      <Text style={styles.label}>Father's Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter father's name"
        value={details.father_name}
        onChangeText={(text) => setDetails({ ...details, father_name: text })}
      />

      <Text style={styles.label}>Father's Phone Number</Text>
      <TextInput
        style={styles.input}
        keyboardType="phone-pad"
        placeholder="Enter father's phone number"
        value={details.father_number}
        onChangeText={(text) => setDetails({ ...details, father_number: text })}
      />

      <Text style={styles.label}>Mother's Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter mother's name"
        value={details.mother_name}
        onChangeText={(text) => setDetails({ ...details, mother_name: text })}
      />

      <Text style={styles.label}>Mother's Phone Number</Text>
      <TextInput
        style={styles.input}
        keyboardType="phone-pad"
        placeholder="Enter mother's phone number"
        value={details.mother_number}
        onChangeText={(text) => setDetails({ ...details, mother_number: text })}
      />

      {/* ─── Buttons ─── */}
      <TouchableOpacity
        style={[styles.button, saving && { backgroundColor: "#93c5fd" }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.buttonText}>
          {saving
            ? "Saving..."
            : mode === "edit"
            ? "Update Details"
            : "Save Details"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
        <Ionicons name="arrow-back" size={18} color="#fff" />
        <Text style={styles.backText}>Back to Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: "#f8fafc", flex: 1 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0b5cff",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 18,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#0b5cff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 18,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  backBtn: {
    marginTop: 15,
    backgroundColor: "#64748b",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  backBtnText: { color: "#fff", fontWeight: "600" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  radioGroup: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginVertical: 10,
  },

  radioOption: {
    flexDirection: "row",
    alignItems: "center",
  },

  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  radioSelected: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: "#2563eb",
  },

  radioText: {
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
  },
});
