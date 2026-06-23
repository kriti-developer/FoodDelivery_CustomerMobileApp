import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMenuItemById, getRestaurantById } from '../data/mockData';
import { useApp } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';
import QuantityStepper from '../components/QuantityStepper';
import { colors } from '../theme/colors';

export default function ItemDetailScreen({ route, navigation }) {
  const { addToCart, replaceCart, cartRestaurantId } = useApp();
  const [quantity, setQuantity] = useState(1);
  const { itemId } = route.params;
  const item = getMenuItemById(itemId);
  const restaurant = item ? getRestaurantById(item.restaurantId) : null;

  if (!item) return null;

  const goToCart = () => navigation.navigate('MainTabs', { screen: 'Cart' });

  const handleAddToCart = () => {
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
            onPress: () => {
              replaceCart(item.id, quantity);
              goToCart();
            },
          },
        ]
      );
      return;
    }
    addToCart(item.id, quantity);
    goToCart();
  };

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.banner}>
          <Text style={styles.bannerEmoji}>{item.emoji}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.name}>{item.name}</Text>
          {restaurant && <Text style={styles.restaurant}>from {restaurant.name}</Text>}

          <View style={styles.priceBadgeWrap}>
            <Text style={styles.priceBadge}>{item.price === 0 ? 'FREE' : `$${item.price}`}</Text>
          </View>

          <Text style={styles.description}>{item.description}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="leaf-outline" size={16} color={colors.secondary} />
            <Text style={styles.infoText}>Vegetarian</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>Quantity</Text>
            <QuantityStepper
              quantity={quantity}
              onIncrease={() => setQuantity((q) => Math.min(q + 1, 10))}
              onDecrease={() => setQuantity((q) => Math.max(q - 1, 1))}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title={`Add ${quantity} to Cart • ${item.price === 0 ? 'FREE' : `$${item.price * quantity}`}`}
          onPress={handleAddToCart}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    paddingBottom: 24,
  },
  banner: {
    height: 220,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerEmoji: {
    fontSize: 96,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  restaurant: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  priceBadgeWrap: {
    marginTop: 12,
  },
  priceBadge: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary,
  },
  description: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 21,
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
});
