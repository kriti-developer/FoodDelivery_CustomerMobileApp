import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { getRestaurantById } from '../data/mockData';
import { colors } from '../theme/colors';

export default function CartBar() {
  const navigation = useNavigation();
  const { cartCount, cartRestaurantId } = useApp();

  if (cartCount === 0) return null;

  const restaurant = getRestaurantById(cartRestaurantId);

  return (
    <TouchableOpacity
      style={styles.bar}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('MainTabs', { screen: 'Cart' })}
    >
      <View style={styles.info}>
        <Text style={styles.restaurantName}>{restaurant?.name}</Text>
        <Text style={styles.itemCount}>
          {cartCount} item{cartCount === 1 ? '' : 's'} added
        </Text>
      </View>
      <View style={styles.viewCart}>
        <Text style={styles.viewCartText}>View Cart</Text>
        <Ionicons name="chevron-forward" size={16} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  info: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  itemCount: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  viewCart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewCartText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
