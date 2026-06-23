import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMenuItemsByRestaurant, getRestaurantById } from '../data/mockData';
import { useApp } from '../context/AppContext';
import QuantityStepper from '../components/QuantityStepper';
import CartBar from '../components/CartBar';
import { colors } from '../theme/colors';

export default function RestaurantScreen({ route }) {
  const { restaurantId } = route.params;
  const restaurant = getRestaurantById(restaurantId);
  const menuItems = getMenuItemsByRestaurant(restaurantId);
  const { cart, addToCart, replaceCart, setItemQuantity, cartRestaurantId } = useApp();

  if (!restaurant) return null;

  const handleAdd = (item) => {
    if (cartRestaurantId && cartRestaurantId !== item.restaurantId) {
      const currentRestaurant = getRestaurantById(cartRestaurantId);
      Alert.alert(
        'Replace cart?',
        `Your cart has items from ${currentRestaurant?.name || 'another restaurant'}. Adding this dish will clear them and start a new cart from ${restaurant.name}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace Cart',
            style: 'destructive',
            onPress: () => replaceCart(item.id, 1),
          },
        ]
      );
      return;
    }
    addToCart(item.id, 1);
  };

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
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
      {menuItems.map((item) => {
        const quantity = cart[item.id] || 0;
        return (
          <View key={item.id} style={styles.dishRow}>
            <Text style={styles.dishEmoji}>{item.emoji}</Text>
            <View style={styles.dishInfo}>
              <Text style={styles.dishName}>{item.name}</Text>
              <Text style={styles.dishPrice}>{item.price === 0 ? 'FREE' : `$${item.price}`}</Text>
            </View>
            {quantity > 0 ? (
              <QuantityStepper
                quantity={quantity}
                size="small"
                onIncrease={() => addToCart(item.id, 1)}
                onDecrease={() => setItemQuantity(item.id, quantity - 1)}
              />
            ) : (
              <TouchableOpacity style={styles.addButton} onPress={() => handleAdd(item)}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
      </ScrollView>
      <CartBar />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 90,
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
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  dishEmoji: {
    fontSize: 22,
  },
  dishInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 14.5,
    fontWeight: '600',
    color: colors.text,
  },
  dishPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondary,
    marginTop: 2,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
