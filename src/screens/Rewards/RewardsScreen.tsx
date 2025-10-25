import { FlatList, StyleSheet, Text, View } from "react-native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useMemo } from "react";
import type { MainTabParamList } from "../../navigation/types";
import { useAppStore } from "../../state/appStore";
import type { Reward } from "../../state/appStore";

export type RewardsScreenProps = BottomTabScreenProps<MainTabParamList, "Rewards">;

const renderReward = ({ item }: { item: Reward }) => (
  <View style={styles.rewardCard}>
    <Text style={styles.rewardTitle}>{item.title}</Text>
    <Text style={styles.rewardDescription}>{item.description}</Text>
    <Text style={styles.rewardPoints}>{item.points} pts</Text>
    <Text style={styles.rewardDate}>{new Date(item.earnedAt).toLocaleString()}</Text>
  </View>
);

const keyExtractor = (item: Reward) => item.id;

const RewardsScreen = () => {
  const rewards = useAppStore((state) => state.rewards);
  const totalPoints = useMemo(() => rewards.reduce((acc, reward) => acc + reward.points, 0), [rewards]);

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total points</Text>
        <Text style={styles.summaryValue}>{totalPoints}</Text>
        <Text style={styles.summaryHint}>Earn points by keeping streaks alive and finishing sessions.</Text>
      </View>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={rewards}
        keyExtractor={keyExtractor}
        renderItem={renderReward}
        ListEmptyComponent={
          <Text style={styles.emptyState}>Complete onboarding and play sessions to unlock rewards.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  summaryCard: {
    padding: 20,
    backgroundColor: "#0f172a",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1e293b",
  },
  summaryLabel: {
    color: "#94a3b8",
    fontSize: 16,
  },
  summaryValue: {
    color: "#38bdf8",
    fontSize: 32,
    fontWeight: "700",
    marginTop: 4,
  },
  summaryHint: {
    color: "#64748b",
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  rewardCard: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#1e293b",
  },
  rewardTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
  },
  rewardDescription: {
    color: "#94a3b8",
    marginTop: 6,
  },
  rewardPoints: {
    color: "#22d3ee",
    marginTop: 8,
    fontWeight: "700",
  },
  rewardDate: {
    color: "#475569",
    marginTop: 6,
    fontSize: 12,
  },
  emptyState: {
    textAlign: "center",
    color: "#475569",
    marginTop: 48,
  },
});

export default RewardsScreen;
