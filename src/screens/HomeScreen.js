import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RESTAURANT } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';

export default function HomeScreen({ navigation }) {
  const { user, menuItem } = useApp();
  const insets = useSafeAreaInsets();
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
    >
      <Text style={styles.greeting}>Hi, {firstName} 👋</Text>
      <Text style={styles.heading}>What would you like to eat today?</Text>

      <View style={styles.restaurantCard}>
        <View style={styles.restaurantEmojiWrap}>
          <Text style={styles.restaurantEmoji}>{RESTAURANT.emoji}</Text>
        </View>
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{RESTAURANT.name}</Text>
          <Text style={styles.restaurantTagline}>{RESTAURANT.tagline}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="star" size={14} color={colors.warning} />
            <Text style={styles.metaText}>{RESTAURANT.rating}</Text>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} style={styles.metaIconSpacing} />
            <Text style={styles.metaText}>{RESTAURANT.deliveryTime}</Text>
          </View>
          <Text style={styles.address}>{RESTAURANT.address}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Today's Special</Text>

      {menuItem ? (
        <TouchableOpacity
          style={styles.itemCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ItemDetail')}
        >
          <View style={styles.itemEmojiWrap}>
            <Text style={styles.itemEmoji}>{menuItem.emoji || '🍽️'}</Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{menuItem.name}</Text>
            <Text style={styles.itemDescription} numberOfLines={2}>
              {menuItem.description || ''}
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceBadge}>₹{menuItem.price}</Text>
              <Text style={styles.viewLink}>View item</Text>
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.emptyItemCard}>
          <Text style={styles.emptyItemText}>Nothing on the menu right now — check back soon.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 15,
    color: colors.textMuted,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
    marginBottom: 20,
  },
  restaurantCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  restaurantEmojiWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantEmoji: {
    fontSize: 28,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  restaurantTagline: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  metaText: {
    fontSize: 13,
    color: colors.text,
    marginLeft: 4,
  },
  metaIconSpacing: {
    marginLeft: 14,
  },
  address: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: 28,
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  itemEmojiWrap: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: {
    fontSize: 32,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  itemDescription: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 17,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  priceBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondary,
  },
  viewLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyItemCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyItemText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
