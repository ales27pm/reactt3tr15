import React from "react";
import { View, Text, Pressable } from "react-native";

interface ErrorBannerProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

export default function ErrorBanner({ title, message, actionLabel, onAction, onDismiss }: ErrorBannerProps) {
  return (
    <View className="w-full bg-black/90 border border-red-500 rounded-md p-3 flex-row items-start gap-3">
      <View className="flex-1">
        <Text className="text-red-400 font-bold text-base">{title}</Text>
        <Text className="text-red-300 mt-1 text-sm">{message}</Text>
      </View>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} className="px-3 py-2 rounded-md bg-red-600/20 border border-red-500 self-start">
          <Text className="text-red-300 font-semibold text-xs">{actionLabel}</Text>
        </Pressable>
      )}
      {onDismiss && (
        <Pressable onPress={onDismiss} className="px-2 py-1 self-start">
          <Text className="text-red-400 text-lg">×</Text>
        </Pressable>
      )}
    </View>
  );
}
