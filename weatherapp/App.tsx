import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import { StyleSheet, Text, View, ScrollView ,Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_300Light,
} from "@expo-google-fonts/poppins";
import AppLoading from "expo-app-loading";
import axios from "axios";

const API_KEY = "3daa2a0e87c83595d50ccce6b4e7a9ba";



export default function App() {

  const [bgGradient, setBgGradient] = useState<[string, string]>(["#4facfe", "#00f2fe"]);
  const [nextGradient, setNextGradient] = useState<[string, string] | null>(null);
  const fadeAnim = useState(new Animated.Value(1))[0]; // opacity controller

  const getBackgroundGradient = (weatherMain: string, isNight: boolean) => {
    if (isNight) {
      return ["#0f2027", "#203a43", "#2c5364"]; // Dark night gradient
    }

    switch (weatherMain.toLowerCase()) {
      case "clear":
        return ["#4facfe", "#00f2fe70"]; // Blue sky gradient
      case "clouds":
        return ["#757f9a", "#d7dde870"]; // Gray cloudy gradient
      case "rain":
      case "drizzle":
        return ["#5f72bd", "#9b23ea70"]; // Rainy purple-blue gradient
      case "thunderstorm":
        return ["#232526", "#41434570"]; // Stormy dark gradient
      case "snow":
        return ["#e0eafc", "#cfdef370"]; // Light snowy gradient
      default:
        return ["#4facfe", "#00f2fe70"]; // fallback
    }
  };



  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_300Light,
  });



  const getWeatherIcon = (weatherMain: string) => {
    switch (weatherMain.toLowerCase()) {
      case "clear":
        return require("./assets/icons/sunny.json");
      case "clouds":
        return require("./assets/icons/clouds.json");
      case "rain":
      case "drizzle":
        return require("./assets/icons/rain.json");
      case "thunderstorm":
        return require("./assets/icons/thunder.json");
      case "snow":
        return require("./assets/icons/snow.json");
      case "mist":
      case "fog":
      case "haze":
      case "smoke":
        return require("./assets/icons/clouds.json");
      default:
        return require("./assets/icons/sunny.json");
    }
  };

  const [weather, setWeather] = useState<{
    name: string;
    main: { temp: number };
    weather: { main: string; description: string }[];
  } | null>(null);

  

  const [forecast, setForecast] = useState<
    { dt: number; main: { temp: number }; weather: { main: string }[] }[]
  >([]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.error("Permission to access location was denied");
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        const weatherRes = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
        );

        const forecastRes = await axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
        );

        setWeather(weatherRes.data);
        setForecast(
          forecastRes.data.list.filter((_: any, i: number) => i % 8 === 0)
        );
      } catch (err) {
        console.error("Error fetching weather:", err);
      }
    };

    fetchWeather();
  }, []);
  useEffect(() => {
    if (weather) {
      const hour = new Date().getHours();
      const isNight = hour < 6 || hour >= 18;
      const newGradient = getBackgroundGradient(weather.weather[0].main, isNight);

      if (newGradient.join() !== bgGradient.join()) {
        setNextGradient(newGradient);

        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [weather]);

  // Once fadeAnim finishes → commit new gradient
  useEffect(() => {
    if (nextGradient) {
      const listenerId = fadeAnim.addListener(({ value }) => {
        if (value === 1) {
          setBgGradient(nextGradient);
          setNextGradient(null);
        }
      });

      return () => fadeAnim.removeListener(listenerId);
    }
  }, [nextGradient]);
  if (!fontsLoaded) {
    return <AppLoading />;
  }



  return (
    <View style={[styles.container]}>
      <LinearGradient colors={bgGradient} style={StyleSheet.absoluteFill} />
      {/* Overlay next gradient with fade */}
      {nextGradient && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: fadeAnim },
          ]}
        >
          <LinearGradient colors={nextGradient} style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}
      {/* Current Weather */}
      {weather && (
        <>
          <Text style={styles.locationText}>{weather.name}</Text>
          <View style={styles.topContainer}>
            <Text style={styles.tempText}>
              {Math.round(weather.main.temp)}°
            </Text>
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
            <LottieView
              source={getWeatherIcon(item.weather[0].main)}
              autoPlay
              loop
              style={{ width: 50, height: 50 }}
            />
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
    backgroundColor: "#1a1a2e", // solid dark background
    alignItems: "center",
    justifyContent: "flex-start",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)", // subtle overlay
  },
  topContainer: {
    marginTop: 40,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  locationText: {
    fontSize: 40,
    color: "#fff",
    marginTop: 100,
    fontFamily: "Poppins_300Light",
  },
  tempText: {
    fontSize: 200,
    color: "#fff",
    marginBottom: 20,
    fontFamily: "Poppins_300Light",
  },
  tempStatus: {
    fontSize: 30,
    color: "#fff",
    textTransform: "capitalize",
    fontFamily: "Poppins_300Light",
  },
  forecastContainer: {
    marginTop: 60,
    paddingHorizontal: 10,
  },
  forecastBlock: {
    width: 110,
    height: 160,
    marginHorizontal: 4,
    borderRadius: 24,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "Poppins_300Light",
  },
  smallTemp: {
    fontSize: 24,
    marginVertical: 5,
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
  },
  statusText: {
    fontSize: 14,
    color: "#eee",
    fontFamily: "Poppins_300Light",
  },
});
