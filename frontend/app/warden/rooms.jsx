// frontend/app/warden/rooms.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editRoomId, setEditRoomId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [form, setForm] = useState({
    fromRoom: "",
    toRoom: "",
    floor: "",
    eastSharing: "",
    westSharing: "",
  });
  const [manualForm, setManualForm] = useState({
    room_number: "",
    floor: "",
    side: "",
    sharing: "",
  });

  const BACKEND = "http://10.69.232.21:5000";

  // 📦 Fetch rooms
  const fetchRooms = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(`${BACKEND}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(res.data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      Alert.alert("Error", "Unable to fetch room data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // 🏗️ Auto-generate rooms
  const autoGenerateRooms = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.post(
        `${BACKEND}/api/rooms/auto-generate`,
        {
          fromRoom: parseInt(form.fromRoom),
          toRoom: parseInt(form.toRoom),
          floor: parseInt(form.floor),
          eastSharing: parseInt(form.eastSharing),
          westSharing: parseInt(form.westSharing),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Success", res.data.message);
      fetchRooms();
    } catch (err) {
      console.error("Error:", err);
      Alert.alert("Error", "Auto-generate failed");
    }
  };

  // ➕ Add individual room
  const addRoom = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.post(`${BACKEND}/api/rooms`, manualForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert("Added", "Room added successfully!");
      fetchRooms();
    } catch (err) {
      Alert.alert("Error", "Failed to add room");
    }
  };

  // ✏️ Edit room
  const handleEdit = (room) => {
    setEditRoomId(room.id);
    setEditForm(room);
  };

  const saveEdit = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.put(
        `${BACKEND}/api/rooms/${editRoomId}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Updated", res.data.message);
      setEditRoomId(null);
      fetchRooms();
    } catch (err) {
      Alert.alert("Error", "Failed to save changes");
    }
  };

  // ❌ Delete single room
  const deleteRoom = async (id) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.delete(`${BACKEND}/api/rooms/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert("Deleted", "Room deleted successfully");
      fetchRooms();
    } catch {
      Alert.alert("Error", "Failed to delete room");
    }
  };

  // 🧹 Delete all rooms
  const deleteAllRooms = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.delete(`${BACKEND}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert("Cleared", "All rooms deleted");
      fetchRooms();
    } catch {
      Alert.alert("Error", "Failed to delete all rooms");
    }
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Loading rooms...</Text>
      </View>
    );

  return (
    <ScrollView style={styles.page}>
      <Text style={styles.pageTitle}>🏠 Room Management</Text>

      {/* 🔹 Top Form Row: Auto Generate + Add Single Room */}
      <View style={styles.formRow}>
        {/* ⚙️ Auto Generate */}
        <View style={[styles.formCard, styles.shadowCard]}>
          <Text style={styles.formHeader}>
            ⚙️ <Text style={{ color: "#0b5cff" }}>Auto Generate Rooms</Text>
          </Text>

          {[
            ["From Room:", "fromRoom", "Eg:101"],
            ["To Room:", "toRoom", "Eg:120"],
            ["Floor:", "floor", "Eg:2"],
            ["East Sharing:", "eastSharing", "Eg:2"],
            ["West Sharing:", "westSharing", "Eg:3"],
          ].map(([label, key, placeholder]) => (
            <View key={key} style={styles.inputBlock}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.inputModern}
                placeholder={placeholder}
                placeholderTextColor="#94a3b8"
                value={form[key]}
                onChangeText={(t) => setForm({ ...form, [key]: t })}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.buttonGradient, { marginTop: 10 }]}
            onPress={autoGenerateRooms}
          >
            <Text style={styles.buttonText}>⚡ Generate Rooms</Text>
          </TouchableOpacity>
        </View>

        {/* 🏠 Add Single Room */}
        <View style={[styles.formCard, styles.shadowCard]}>
          <Text style={styles.formHeader}>
            🏠 <Text style={{ color: "#0b5cff" }}>Add Single Room</Text>
          </Text>

          {[
            ["Room Number:", "room_number", "Eg:E101"],
            ["Floor:", "floor", "Eg:2"],
            ["Side (East/West):", "side", "Eg:East"],
            ["Sharing:", "sharing", "Eg:2"],
          ].map(([label, key, placeholder]) => (
            <View key={key} style={styles.inputBlock}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.inputModern}
                placeholder={placeholder}
                placeholderTextColor="#94a3b8"
                value={manualForm[key]}
                onChangeText={(t) => setManualForm({ ...manualForm, [key]: t })}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.buttonGradient, { marginTop: 10 }]}
            onPress={addRoom}
          >
            <Text style={styles.buttonText}>➕ Add Room</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 🧭 EAST WING */}
      <Text style={styles.subHeader}>🧭 East Wing</Text>
      <View style={styles.grid}>
        {rooms
          .filter((r) => r.side?.toLowerCase() === "east")
          .map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              editRoomId={editRoomId}
              editForm={editForm}
              setEditForm={setEditForm}
              handleEdit={handleEdit}
              saveEdit={saveEdit}
              deleteRoom={deleteRoom}
              setEditRoomId={setEditRoomId} // ✅ FIXED
            />
          ))}
      </View>

      {/* 🌇 WEST WING */}
      <Text style={[styles.subHeader, { marginTop: 20 }]}>🌇 West Wing</Text>
      <View style={styles.grid}>
        {rooms
          .filter((r) => r.side?.toLowerCase() === "west")
          .map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              editRoomId={editRoomId}
              editForm={editForm}
              setEditForm={setEditForm}
              handleEdit={handleEdit}
              saveEdit={saveEdit}
              deleteRoom={deleteRoom}
              setEditRoomId={setEditRoomId} // ✅ FIXED
            />
          ))}
      </View>

      {/* 🗑️ Delete All */}
      <View style={{ marginTop: 20 }}>
        <Button
          title="🗑️ Delete All Rooms"
          color="red"
          onPress={deleteAllRooms}
        />
      </View>

      {/* 🔙 Back Button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/warden-dashboard")}
      >
        <Text style={styles.backBtnText}>← Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ------------------------- ROOM CARD COMPONENT ------------------------- */
function RoomCard({
  room,
  editRoomId,
  editForm,
  setEditForm,
  handleEdit,
  saveEdit,
  deleteRoom,
  setEditRoomId,
}) {
  const full = room.occupied >= room.sharing;

  return (
    <View style={[styles.card, full ? styles.fullRoom : styles.availableRoom]}>
      {editRoomId === room.id ? (
        <>
          <Text style={styles.editLabel}>Room Number:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter room number"
            value={editForm.room_number}
            onChangeText={(t) => setEditForm({ ...editForm, room_number: t })}
          />

          <Text style={styles.editLabel}>Floor:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter floor"
            value={String(editForm.floor)}
            onChangeText={(t) => setEditForm({ ...editForm, floor: t })}
          />

          <Text style={styles.editLabel}>Side (East/West):</Text>
          <TextInput
            style={styles.input}
            placeholder="Eg: East"
            value={editForm.side}
            onChangeText={(t) => setEditForm({ ...editForm, side: t })}
          />

          <Text style={styles.editLabel}>Sharing:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter sharing count"
            value={String(editForm.sharing)}
            onChangeText={(t) => setEditForm({ ...editForm, sharing: t })}
          />

          {/* 💾 Save + ❌ Cancel Buttons */}
          <View style={styles.dualBtnRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
              <Text style={styles.saveText}>💾 Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setEditForm({});
                setEditRoomId(null);
              }}
            >
              <Text style={styles.cancelText}>❌ Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.roomNumber}>{room.room_number}</Text>
          <Text style={styles.roomDetail}>
            Floor {room.floor} • {room.side}
          </Text>
          <Text style={styles.occupancy}>
            Sharing: {room.sharing} | Occupied: {room.occupied}
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              onPress={() => handleEdit(room)}
              style={styles.editBtn}
            >
              <Text style={styles.btnText}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deleteRoom(room.id)}
              style={styles.delBtn}
            >
              <Text style={styles.btnText}>🗑️ Delete</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

/* ------------------------------ STYLES ------------------------------ */
const { width } = Dimensions.get("window");
const cardWidth = width / 3 - 30;

const styles = StyleSheet.create({
  page: { backgroundColor: "#f9fafb", padding: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0b5cff",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1e293b",
  },
  subHeader: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0b5cff",
    marginBottom: 8,
    marginTop: 10,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    backgroundColor: "#f8fafc",
  },
  inputHalf: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    backgroundColor: "#f8fafc",
  },
  label: {
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
    marginTop: 6,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 4,
    marginBottom: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: cardWidth,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 3,
  },
  availableRoom: { backgroundColor: "#e0f2fe" },
  fullRoom: { backgroundColor: "#fee2e2" },
  roomNumber: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  roomDetail: { color: "#475569", marginVertical: 3 },
  occupancy: { color: "#334155", fontWeight: "600" },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  dualBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    width: "100%",
    gap: 10,
  },
  editBtn: {
    backgroundColor: "#93c5fd",
    padding: 6,
    borderRadius: 6,
    width: "48%",
    alignItems: "center",
  },
  delBtn: {
    backgroundColor: "#fca5a5",
    padding: 6,
    borderRadius: 6,
    width: "48%",
    alignItems: "center",
  },
  btnText: { fontWeight: "600", color: "#0f172a" },
  saveBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "700" },
  cancelBtn: {
    backgroundColor: "#cbd5e1",
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
  },
  cancelText: {
    color: "#1e293b",
    fontWeight: "700",
  },
  backBtn: {
    marginTop: 25,
    backgroundColor: "#0b5cff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  backBtnText: { color: "#fff", fontWeight: "700" },
  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    width: "48%",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  shadowCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },

  formHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    color: "#1e293b",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 6,
  },

  inputBlock: {
    marginBottom: 10,
  },

  inputModern: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: "#f8fafc",
    color: "#0f172a",
  },

  buttonGradient: {
    backgroundColor: "linear-gradient(90deg, #2563eb, #1d4ed8)", // looks good on web
    backgroundColor: "#2563eb", // fallback for React Native Web
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.4,
  },
});
