import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RESTAURANTS } from '../data/mockData';
import { useApp } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';
import QuantityStepper from '../components/QuantityStepper';
import { colors } from '../theme/colors';

export default function ItemDetailScreen({ navigation }) {
  const { menuItem, addToCart } = useApp();
  const [quantity, setQuantity] = useState(1);

  if (!menuItem) {
    return (
      <View style={[styles.flex, styles.emptyState]}>
        <Text style={styles.emptyText}>This item isn't available anymore.</Text>
      </View>
    );
  }

  const handleAddToCart = () => {
    addToCart(menuItem.id, quantity);
    navigation.navigate('MainTabs', { screen: 'Cart' });
  };

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.banner}>
          <Text style={styles.bannerEmoji}>{menuItem.emoji || '🍽️'}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.name}>{menuItem.name}</Text>
          <Text style={styles.restaurant}>from {RESTAURANTS[0].name}</Text>

          <View style={styles.priceBadgeWrap}>
            <Text style={styles.priceBadge}>₹{menuItem.price}</Text>
          </View>

          <Text style={styles.description}>{menuItem.description || ''}</Text>

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
          title={`Add ${quantity} to Cart • ₹${menuItem.price * quantity}`}
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
