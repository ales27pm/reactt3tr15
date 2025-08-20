import React from "react";
import { View, Text, Pressable } from "react-native";

interface MinimalModalProps {
  visible: boolean;
  title: string;
  message: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  onDismiss?: () => void;
}

export default function MinimalModal({ visible, title, message, primaryActionLabel, onPrimaryAction, secondaryActionLabel, onSecondaryAction, onDismiss }: MinimalModalProps) {
  if (!visible) return null;
  return (
    <View className="absolute inset-0 z-50 items-center justify-center">
      <View className="absolute inset-0 bg-black/70" />
      <View className="w-11/12 max-w-md bg-black border border-neutral-700 rounded-xl p-5">
        <Text className="text-neutral-100 text-lg font-semibold">{title}</Text>
        <Text className="text-neutral-300 mt-2">{message}</Text>
        <View className="flex-row gap-3 mt-5 justify-end">
          {secondaryActionLabel && (
            <Pressable onPress={onSecondaryAction || onDismiss} className="px-4 py-2 rounded-md border border-neutral-600">
              <Text className="text-neutral-200">{secondaryActionLabel}</Text>
            </Pressable>
          )}
          {primaryActionLabel && (
            <Pressable onPress={onPrimaryAction} className="px-4 py-2 rounded-md bg-white/10 border border-white/20">
              <Text className="text-white font-semibold">{primaryActionLabel}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
