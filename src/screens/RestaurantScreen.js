import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMenuItemsByRestaurant, getRestaurantById } from '../data/mockData';
import DishCard from '../components/DishCard';
import { colors } from '../theme/colors';

export default function RestaurantScreen({ route, navigation }) {
  const { restaurantId } = route.params;
  const restaurant = getRestaurantById(restaurantId);
  const menuItems = getMenuItemsByRestaurant(restaurantId);

  if (!restaurant) return null;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.emojiWrap}>
          <Text style={styles.emoji}>{restaurant.emoji}</Text>
        </View>
        <Text style={styles.name}>{restaurant.name}</Text>
        <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="star" size={14} color={colors.warning} />
          <Text style={styles.metaText}>{restaurant.rating}</Text>
          <Ionicons name="time-outline" size={14} color={colors.textMuted} style={styles.metaIconSpacing} />
          <Text style={styles.metaText}>{restaurant.deliveryTime}</Text>
        </View>
        <Text style={styles.address}>{restaurant.address}</Text>
      </View>

      <Text style={styles.sectionTitle}>Menu</Text>
      {menuItems.map((item) => (
        <DishCard
          key={item.id}
          item={item}
          onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emojiWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 36,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  cuisine: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
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
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
});
