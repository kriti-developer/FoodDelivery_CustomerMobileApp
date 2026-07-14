import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';

export default function StatusBanner() {
  const { statusAlert, dismissStatusAlert } = useApp();
  const insets = useSafeAreaInsets();

  if (!statusAlert) return null;

  return (
    <View style={[styles.wrap, { top: insets.top + 8 }]} pointerEvents="box-none">
      <TouchableOpacity style={styles.banner} activeOpacity={0.9} onPress={dismissStatusAlert}>
        <Ionicons name="notifications" size={16} color="#fff" />
        <Text style={styles.text} numberOfLines={2}>{statusAlert.message}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    alignItems: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.text,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    maxWidth: '100%',
  },
  text: {
    flex: 1,
    color: '#fff',
    fontSize: 13.5,
    fontWeight: '600',
  },
});
