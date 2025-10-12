// File: frontend/app/screens/AttendanceScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, Button, Alert } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import * as Location from "expo-location";
import axios from "axios";

export default function AttendanceScreen() {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      // Request Camera Permission
      const { status: cameraStatus } =
        await BarCodeScanner.requestPermissionsAsync();
      setHasCameraPermission(cameraStatus === "granted");

      // Request Location Permission
      const { status: locationStatus } =
        await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(locationStatus === "granted");
    })();
  }, []);

  // ✅ Handle QR scan
  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    Alert.alert("QR Code Scanned", data);

    try {
      const location = await Location.getCurrentPositionAsync({});
      await axios.post("http://172.28.233.21:5000/api/attendance", {
        student_id: 1, // Replace later with logged-in user's ID
        method: "QR",
        location: `${location.coords.latitude},${location.coords.longitude}`,
      });
      Alert.alert("Success", "Attendance marked via QR!");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to mark attendance");
    }
  };

  // ✅ Handle GPS-only attendance
  const handleGPSAttendance = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      await axios.post("http://172.28.233.21:5000/api/attendance", {
        student_id: 1,
        method: "GPS",
        location: `${location.coords.latitude},${location.coords.longitude}`,
      });
      Alert.alert("Success", "Attendance marked via GPS!");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to mark GPS attendance");
    }
  };

  // Handle permissions
  if (hasCameraPermission === null || hasLocationPermission === null)
    return <Text>Requesting permissions...</Text>;
  if (!hasCameraPermission || !hasLocationPermission)
    return <Text>No access to camera or location</Text>;

  return (
    <View style={{ flex: 1 }}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={{ flex: 1 }}
      />
      {scanned && (
        <Button title="Scan Again" onPress={() => setScanned(false)} />
      )}
      <Button title="Mark Attendance via GPS" onPress={handleGPSAttendance} />
    </View>
  );
}
