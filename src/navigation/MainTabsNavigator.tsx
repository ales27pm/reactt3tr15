import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import TetrisScreen from "../screens/TetrisScreen";
import RewardsScreen from "../screens/Rewards/RewardsScreen";
import NotificationSettingsScreen from "../screens/Notifications/NotificationSettingsScreen";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabsNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: "#020617",
        borderTopColor: "#1e293b",
      },
      tabBarActiveTintColor: "#38bdf8",
      tabBarInactiveTintColor: "#475569",
      tabBarIcon: ({ color, size }) => {
        const iconName: keyof typeof Ionicons.glyphMap =
          route.name === "Play" ? "game-controller" : route.name === "Rewards" ? "gift" : "notifications";
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen
      name="Play"
      component={TetrisScreen}
      options={{ tabBarButtonTestID: "tab-play", tabBarAccessibilityLabel: "Play tab" }}
    />
    <Tab.Screen
      name="Rewards"
      component={RewardsScreen}
      options={{ tabBarButtonTestID: "tab-rewards", tabBarAccessibilityLabel: "Rewards tab" }}
    />
    <Tab.Screen
      name="Settings"
      component={NotificationSettingsScreen}
      options={{ tabBarButtonTestID: "tab-settings", tabBarAccessibilityLabel: "Settings tab" }}
    />
  </Tab.Navigator>
);

export default MainTabsNavigator;
