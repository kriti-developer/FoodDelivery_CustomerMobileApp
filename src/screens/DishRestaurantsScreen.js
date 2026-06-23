import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getDishById, getRestaurantsServingDish } from '../data/mockData';
import RestaurantCard from '../components/RestaurantCard';
import { colors } from '../theme/colors';

export default function DishRestaurantsScreen({ route, navigation }) {
  const { dishId } = route.params;
  const dish = getDishById(dishId);
  const offers = getRestaurantsServingDish(dishId);

  if (!dish) return null;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{dish.emoji}</Text>
        <Text style={styles.name}>{dish.name}</Text>
        <Text style={styles.subtitle}>
          Available at {offers.length} restaurant{offers.length === 1 ? '' : 's'}
        </Text>
      </View>

      {offers.map(({ restaurant }) => (
        <RestaurantCard
          key={restaurant.id}
          restaurant={restaurant}
          onPress={() => navigation.navigate('Restaurant', { restaurantId: restaurant.id })}
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
  emoji: {
    fontSize: 48,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
});
