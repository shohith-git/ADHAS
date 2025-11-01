import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router"; // ✅ Added import

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [editRoomId, setEditRoomId] = useState(null);
  const [editForm, setEditForm] = useState({
    room_number: "",
    floor: "",
    side: "",
    sharing: "",
    occupied: "",
  });

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

  // 🧾 Fetch rooms
  const fetchRooms = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get("http://10.69.232.21:5000/api/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(res.data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  // ⚙️ Auto generate
  const autoGenerateRooms = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const body = {
        fromRoom: parseInt(form.fromRoom),
        toRoom: parseInt(form.toRoom),
        floor: parseInt(form.floor),
        eastSharing: parseInt(form.eastSharing),
        westSharing: parseInt(form.westSharing),
      };
      console.log("[UI] sending auto-generate", body);
      const res = await axios.post(
        "http://10.69.232.21:5000/api/rooms/auto-generate",
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Success", res.data.message);
      fetchRooms();
    } catch (error) {
      console.error("[UI] auto-gen error:", error);
      Alert.alert("Error", "Auto-generate failed!");
    }
  };

  // ➕ Add single room
  const addRoom = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.post("http://10.69.232.21:5000/api/rooms", manualForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert("Success", "Room added!");
      fetchRooms();
    } catch (error) {
      Alert.alert("Error", "Failed to add room");
    }
  };

  // ❌ Delete single room
  const deleteRoom = async (id) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.delete(`http://10.69.232.21:5000/api/rooms/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert("Deleted", "Room removed!");
      fetchRooms();
    } catch (error) {
      Alert.alert("Error", "Failed to delete room");
    }
  };

  // 🧹 Delete all rooms
  const deleteAllRooms = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.delete("http://10.69.232.21:5000/api/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert("Success", "All rooms deleted!");
      fetchRooms();
    } catch (error) {
      Alert.alert("Error", "Failed to delete all rooms");
    }
  };

  // ✏️ Edit room
  const handleEdit = (room) => {
    setEditRoomId(room.id);
    setEditForm({
      room_number: room.room_number,
      floor: room.floor,
      side: room.side,
      sharing: room.sharing,
      occupied: room.occupied,
    });
  };

  const saveEdit = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.put(
        `http://10.69.232.21:5000/api/rooms/${editRoomId}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Updated", res.data.message);
      setEditRoomId(null);
      fetchRooms();
    } catch (error) {
      Alert.alert("Error", "Failed to update room");
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
        Room Management
      </Text>

      {/* AUTO-GENERATE */}
      <Text style={{ fontWeight: "bold", marginTop: 10 }}>
        ⚙️ Auto Generate Rooms
      </Text>
      <TextInput
        placeholder="From Room (e.g. 101)"
        value={form.fromRoom}
        onChangeText={(text) => setForm({ ...form, fromRoom: text })}
        style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
      />
      <TextInput
        placeholder="To Room (e.g. 120)"
        value={form.toRoom}
        onChangeText={(text) => setForm({ ...form, toRoom: text })}
        style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
      />
      <TextInput
        placeholder="Floor (e.g. 3)"
        value={form.floor}
        onChangeText={(text) => setForm({ ...form, floor: text })}
        style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
      />
      <TextInput
        placeholder="East Sharing"
        value={form.eastSharing}
        onChangeText={(text) => setForm({ ...form, eastSharing: text })}
        style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
      />
      <TextInput
        placeholder="West Sharing"
        value={form.westSharing}
        onChangeText={(text) => setForm({ ...form, westSharing: text })}
        style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
      />
      <Button title="Generate Rooms" onPress={autoGenerateRooms} />

      {/* ADD INDIVIDUAL ROOM */}
      <Text style={{ fontWeight: "bold", marginTop: 20 }}>
        📝 Add Individual Room
      </Text>
      <TextInput
        placeholder="Room Number"
        value={manualForm.room_number}
        onChangeText={(text) =>
          setManualForm({ ...manualForm, room_number: text })
        }
        style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
      />
      <TextInput
        placeholder="Floor"
        value={manualForm.floor}
        onChangeText={(text) => setManualForm({ ...manualForm, floor: text })}
        style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
      />
      <TextInput
        placeholder="Side (East/West)"
        value={manualForm.side}
        onChangeText={(text) => setManualForm({ ...manualForm, side: text })}
        style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
      />
      <TextInput
        placeholder="Sharing"
        value={manualForm.sharing}
        onChangeText={(text) => setManualForm({ ...manualForm, sharing: text })}
        style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
      />
      <Button title="Add Room" onPress={addRoom} />

      {/* DELETE ALL */}
      <View style={{ marginTop: 20 }}>
        <Button
          title="🗑️ Delete All Rooms"
          color="red"
          onPress={deleteAllRooms}
        />
      </View>

      {/* AVAILABLE ROOMS */}
      <Text
        style={{ fontWeight: "bold", fontSize: 18, marginVertical: 10 }}
      >{`📋 Available Rooms (${rooms.length})`}</Text>

      {rooms.map((room) => (
        <View
          key={room.id}
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            marginVertical: 5,
          }}
        >
          {editRoomId === room.id ? (
            <>
              <TextInput
                placeholder="Room Number"
                value={editForm.room_number}
                onChangeText={(text) =>
                  setEditForm({ ...editForm, room_number: text })
                }
                style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
              />
              <TextInput
                placeholder="Floor"
                value={String(editForm.floor)}
                onChangeText={(text) =>
                  setEditForm({ ...editForm, floor: text })
                }
                style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
              />
              <TextInput
                placeholder="Side"
                value={editForm.side}
                onChangeText={(text) =>
                  setEditForm({ ...editForm, side: text })
                }
                style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
              />
              <TextInput
                placeholder="Sharing"
                value={String(editForm.sharing)}
                onChangeText={(text) =>
                  setEditForm({ ...editForm, sharing: text })
                }
                style={{ borderWidth: 1, marginVertical: 5, padding: 5 }}
              />
              <Button title="💾 Save" onPress={saveEdit} />
            </>
          ) : (
            <>
              <Text>
                {room.room_number} — Floor {room.floor} ({room.side}) | Sharing:{" "}
                {room.sharing}
              </Text>
              <View style={{ flexDirection: "row", marginTop: 5 }}>
                <TouchableOpacity
                  style={{ marginRight: 10 }}
                  onPress={() => handleEdit(room)}
                >
                  <Text style={{ color: "blue" }}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteRoom(room.id)}>
                  <Text style={{ color: "red" }}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      ))}

      {/* ✅ BACK BUTTON AT END */}
      <TouchableOpacity
        style={{
          marginTop: 30,
          backgroundColor: "#0b5cff",
          padding: 12,
          borderRadius: 10,
          alignItems: "center",
        }}
        onPress={() => router.back()}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          ← Back to Dashboard
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
