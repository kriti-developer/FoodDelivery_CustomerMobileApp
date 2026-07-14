import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function RestaurantCard({ restaurant, onPress, isFavorite, onToggleFavorite }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.emojiWrap}>
        <Text style={styles.emoji}>{restaurant.emoji}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{restaurant.name}</Text>
        <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="star" size={13} color={colors.warning} />
          <Text style={styles.metaText}>{restaurant.rating}</Text>
          <Ionicons name="time-outline" size={13} color={colors.textMuted} style={styles.metaIconSpacing} />
          <Text style={styles.metaText}>{restaurant.deliveryTime}</Text>
        </View>
      </View>
      {onToggleFavorite && (
        <TouchableOpacity
          style={styles.favoriteButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite ? colors.primary : colors.textMuted}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    gap: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  emojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 26,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cuisine: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  metaText: {
    fontSize: 12.5,
    color: colors.text,
    marginLeft: 4,
  },
  metaIconSpacing: {
    marginLeft: 12,
  },
  favoriteButton: {
    paddingLeft: 8,
    justifyContent: 'center',
  },
});
