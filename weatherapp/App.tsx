import React from "react";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { useEffect, useState } from "react";
import axios from "axios";

const API_KEY = "3daa2a0e87c83595d50ccce6b4e7a9ba";
const CITY = "Accra";

export default function App() {
  const [weather, setWeather] = useState<{
    name: string;
    main: { temp: number };
    weather: { description: string }[];
  } | null>(null);
  const [forecast, setForecast] = useState<
    { dt: number; main: { temp: number }; weather: { main: string }[] }[]
  >([]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Request permission
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.error("Permission to access location was denied");
          return;
        }
    
        // Get current position
        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
    
        // Current Weather
        const weatherRes = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
        );
    
        // Forecast
        const forecastRes = await axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
        );
    
        setWeather(weatherRes.data);
        setForecast(
          forecastRes.data.list.filter((_: any, index: number) => index % 8 === 0)
        );
      } catch (err) {
        console.error("Error fetching weather:", err);
      }
    };
    
    fetchWeather();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Video */}
      <Video
        source={require("./assets/sunny.mp4")}
        style={StyleSheet.absoluteFill}
        isLooping
        shouldPlay
        isMuted
        resizeMode={ResizeMode.COVER}
      />

      {/* Dark Overlay */}
      <View style={styles.overlay} />

      {/* Content */}
      {weather && (
        <>
          <Text style={styles.locationText}>{weather.name}</Text>
          <View style={styles.topContainer}>
            <Text style={styles.tempText}>{Math.round(weather.main.temp)}°</Text>
            <Text style={styles.tempStatus}>
              {weather.weather[0].description}
            </Text>
          </View>
        </>
      )}

      {/* Forecast */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.forecastContainer}
      >
        {forecast.map((item, index) => (
          <View key={index} style={styles.forecastBlock}>
            <Text style={styles.dayText}>
              {new Date(item.dt * 1000).toLocaleDateString("en-US", {
                weekday: "long",
              })}
            </Text>
            <Text style={styles.smallTemp}>{Math.round(item.main.temp)}°</Text>
            <Text style={styles.statusText}>{item.weather[0].main}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ccc",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  topContainer: {
    marginTop: 100,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  locationText: {
    fontSize: 30,
    fontWeight: "400",
    color: "#fff",
    marginTop: 90,
  },
  tempText: {
    fontSize: 200,
    fontWeight: "300",
    color: "#fff",
    marginBottom: 20,
  },
  tempStatus: {
    fontSize: 20,
    fontWeight: "400",
    color: "#fff",
  },
  forecastContainer: {
    marginTop: 150,
    paddingHorizontal: 10,
  },
  forecastBlock: {
    width: 110,
    height: 110,
    marginHorizontal: 4,
    borderRadius: 24,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  dayText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#fff",
  },
  smallTemp: {
    fontSize: 24,
    fontWeight: "600",
    marginVertical: 5,
    color: "#fff",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#eee",
  },
});
