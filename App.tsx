import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppState } from "./hooks/useAppState";
import {
  ActivityIcons,
  ActivityIconType,
  LiveActivityUpdateEvent,
  useLiveActivity,
} from "./hooks/useLiveActivity";
import { useTimer } from "./hooks/useTimer";

const { width } = Dimensions.get("window");

export default function App() {
  const [activityName, setActivityName] = useState("");
  const [selectedIcon, setSelectedIcon] =
    useState<ActivityIconType>("WALKING");

  const { currentAppState, previousAppState } = useAppState();
  const timer = useTimer({
    onUpdate: (elapsedTime) => {
      console.log("Timer updated:", elapsedTime);
    },
  });

  const liveActivity = useLiveActivity();
  const isLiveActivityAvailable =
    liveActivity.isLiveActivityAvailable;

  const syncTimerWithLiveActivity = async () => {
    if (
      currentAppState !== "active" ||
      Platform.OS !== "ios" ||
      !liveActivity.isLiveActivityAvailable ||
      !liveActivity.liveActivityId
    ) {
      return;
    }

    try {
      const status = await liveActivity.updateStatus();

      if (status.state === "active" || status.state === "paused") {
        const timeDiff = Math.abs(
          status.elapsedTime - timer.elapsedTime
        );
        if (timeDiff >= 1) {
          console.log(
            `Syncing timer - difference of ${timeDiff}s detected`
          );
          timer.syncWithExternalTimer(status.elapsedTime);
        }
      }
    } catch (error) {
      console.error("Error syncing timer:", error);
    }
  };

  useEffect(() => {
    if (
      previousAppState === "background" &&
      currentAppState === "active"
    ) {
      syncTimerWithLiveActivity();
    }
  }, [currentAppState, previousAppState]);

  useEffect(() => {
    liveActivity.addListener("onLiveActivityUpdate", (event) => {
      const updateEvent = event as LiveActivityUpdateEvent;

      if (updateEvent.state === "paused") {
        timer.pause();
      }

      if (updateEvent.state === "active") {
        timer.resume();
      }
    });

    liveActivity.addListener("onLiveActivityEnd", (_event) => {
      timer.reset();
    });

    liveActivity.addListener("onWidgetCompleteActivity", (_event) => {
      Alert.alert(
        "Would you like to complete your activity?",
        "This will end your activity and update your timer.",
        [
          {
            text: "Yes",
            onPress: () => {
              timer.reset();
            },
          },
          { text: "No" },
        ]
      );
    });
  }, [isLiveActivityAvailable]);

  const handleStart = async () => {
    if (!activityName.trim()) {
      Alert.alert(
        "Activity Name Required",
        "Please enter an activity name to start the timer."
      );
      return;
    }

    timer.start();

    if (
      Platform.OS === "ios" &&
      liveActivity.isLiveActivityAvailable
    ) {
      const activityId = await liveActivity.startActivity({
        activityName: activityName.trim(),
        activityIcon: selectedIcon,
      });

      if (activityId) {
        console.log("Live Activity started with ID:", activityId);
      } else {
        console.warn("Failed to start Live Activity");
      }
    }
  };

  const handlePause = async () => {
    timer.pause();

    if (
      Platform.OS === "ios" &&
      liveActivity.isLiveActivityAvailable &&
      liveActivity.liveActivityId
    ) {
      const success = await liveActivity.pauseActivity();
      if (!success) {
        console.warn("Failed to pause Live Activity");
      }
    }
  };

  const handleResume = async () => {
    timer.resume();

    if (
      Platform.OS === "ios" &&
      liveActivity.isLiveActivityAvailable &&
      liveActivity.liveActivityId
    ) {
      const success = await liveActivity.resumeActivity();
      if (success) {
        console.log("Live Activity resumed");
      } else {
        console.warn("Failed to resume Live Activity");
      }
    }
  };

  const handleEnd = async () => {
    timer.reset();

    if (
      Platform.OS === "ios" &&
      liveActivity.isLiveActivityAvailable &&
      liveActivity.liveActivityId
    ) {
      const success = await liveActivity.endActivity();
      if (!success) {
        console.warn("Failed to end Live Activity");
      }
    }
  };

  const iconButtonSize = width < 380 ? 60 : 70;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#1a2151", "#2c3e7e", "#4c5fa6"]}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Activity Timer</Text>
            {Platform.OS === "ios" && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  Live Activity:{" "}
                  {liveActivity.isLiveActivityAvailable
                    ? "Available"
                    : "Not Available"}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.timerCard}>
            <LinearGradient
              colors={
                timer.state === "active"
                  ? ["#52b788", "#40916c"]
                  : timer.state === "paused"
                  ? ["#e85d04", "#f48c06"]
                  : ["#0062e3", "#0091ff"]
              }
              style={styles.timerGradient}
            >
              <Text style={styles.timerText}>
                {timer.formattedTime}
              </Text>
              <Text style={styles.timerState}>
                {timer.state.charAt(0).toUpperCase() +
                  timer.state.slice(1)}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Activity Name</Text>
            <TextInput
              style={styles.input}
              value={activityName}
              onChangeText={setActivityName}
              placeholder="What are you doing?"
              placeholderTextColor="#8891b0"
              selectionColor="#4c5fa6"
            />

            <Text style={styles.label}>Choose Activity Type</Text>
            <View style={styles.iconSelector}>
              {Object.entries(ActivityIcons).map(([key, icon]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.iconButton,
                    selectedIcon === key && styles.selectedIconButton,
                    {
                      width: iconButtonSize,
                      height: iconButtonSize,
                      borderRadius: iconButtonSize / 2,
                    },
                  ]}
                  onPress={() =>
                    setSelectedIcon(key as ActivityIconType)
                  }
                >
                  <Text
                    style={[
                      styles.iconText,
                      selectedIcon === key && styles.selectedIconText,
                    ]}
                  >
                    {icon}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            {timer.state === "idle" && (
              <TouchableOpacity
                style={[styles.button, styles.startButton]}
                onPress={handleStart}
              >
                <Text style={styles.buttonText}>Start Timer</Text>
              </TouchableOpacity>
            )}

            {timer.state === "active" && (
              <TouchableOpacity
                style={[styles.button, styles.pauseButton]}
                onPress={handlePause}
              >
                <Text style={styles.buttonText}>Pause</Text>
              </TouchableOpacity>
            )}

            {timer.state === "paused" && (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.resumeButton]}
                  onPress={handleResume}
                >
                  <Text style={styles.buttonText}>Resume</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.endButton]}
                  onPress={handleEnd}
                >
                  <Text style={styles.buttonText}>End</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a2151",
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  statusBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    color: "#e0e7ff",
  },
  timerCard: {
    marginBottom: 30,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  timerGradient: {
    padding: 30,
    alignItems: "center",
  },
  timerText: {
    fontSize: 54,
    fontWeight: "bold",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontVariant: ["tabular-nums"],
  },
  timerState: {
    fontSize: 16,
    color: "#e0e7ff",
    marginTop: 8,
    fontWeight: "500",
  },
  inputSection: {
    marginBottom: 30,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 20,
  },
  label: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 10,
    color: "#ffffff",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    color: "#ffffff",
  },
  iconSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
    justifyContent: "space-between",
  },
  iconButton: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  selectedIconButton: {
    borderColor: "#ffffff",
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  iconText: {
    fontSize: 40,
  },
  selectedIconText: {
    fontSize: 40,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginHorizontal: 8,
    minWidth: 135,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  startButton: {
    backgroundColor: "#4361ee",
  },
  pauseButton: {
    backgroundColor: "#7c3aed",
  },
  resumeButton: {
    backgroundColor: "#4361ee",
  },
  endButton: {
    backgroundColor: "#d90429",
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  activeActivitiesSection: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  activityName: {
    fontSize: 16,
    color: "#e0e7ff",
    fontWeight: "500",
  },
  activityEndButton: {
    backgroundColor: "#d90429",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  activityEndButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
