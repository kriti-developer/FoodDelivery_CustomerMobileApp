import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DISHES,
  getTopRatedRestaurants,
  RESTAURANTS,
  searchCatalog,
  sortRestaurants,
} from '../data/mockData';
import { useApp } from '../context/AppContext';
import RestaurantCard from '../components/RestaurantCard';
import DishTile from '../components/DishTile';
import CartBar from '../components/CartBar';
import { colors } from '../theme/colors';

const SORT_OPTIONS = [
  { key: 'deliveryTime', label: 'Delivery Time' },
  { key: 'rating', label: 'Rating' },
  { key: 'cost', label: 'Cost' },
];

export default function HomeScreen({ navigation }) {
  const { user, catalogVersion } = useApp();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState(null);
  const firstName = user?.name?.split(' ')[0] || 'there';

  const topRated = useMemo(() => getTopRatedRestaurants(4), [catalogVersion]);
  const sortedRestaurants = useMemo(() => sortRestaurants(RESTAURANTS, sortBy), [sortBy, catalogVersion]);
  const searchResults = useMemo(() => searchCatalog(query), [query, catalogVersion]);
  const isSearching = query.trim().length > 0;
  const hasResults = searchResults.restaurants.length > 0 || searchResults.dishes.length > 0;

  const openRestaurant = (restaurantId) => navigation.navigate('Restaurant', { restaurantId });
  const openDish = (dishId) => navigation.navigate('DishRestaurants', { dishId });

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={styles.greeting}>Hi, {firstName} 👋</Text>
      <Text style={styles.heading}>What would you like to eat today?</Text>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants or dishes"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {isSearching && (
          <Ionicons
            name="close-circle"
            size={18}
            color={colors.textMuted}
            onPress={() => setQuery('')}
          />
        )}
      </View>

      {isSearching ? (
        hasResults ? (
          <>
            {searchResults.restaurants.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Restaurants</Text>
                {searchResults.restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    onPress={() => openRestaurant(restaurant.id)}
                  />
                ))}
              </>
            )}
            {searchResults.dishes.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Dishes</Text>
                <View style={styles.dishGrid}>
                  {searchResults.dishes.map((dish) => (
                    <DishTile key={dish.id} dish={dish} onPress={() => openDish(dish.id)} />
                  ))}
                </View>
              </>
            )}
          </>
        ) : (
          <View style={styles.emptyResults}>
            <Ionicons name="search-outline" size={40} color={colors.border} />
            <Text style={styles.emptyResultsText}>No matches for "{query}"</Text>
          </View>
        )
      ) : (
        <>
          <Text style={styles.sectionTitle}>Top Rated</Text>
          {topRated.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onPress={() => openRestaurant(restaurant.id)}
            />
          ))}

          <Text style={styles.sectionTitle}>What do you want to eat?</Text>
          <View style={styles.dishGrid}>
            {DISHES.map((dish) => (
              <DishTile key={dish.id} dish={dish} onPress={() => openDish(dish.id)} />
            ))}
          </View>

          <Text style={styles.sectionTitle}>All Restaurants</Text>
          <View style={styles.sortRow}>
            {SORT_OPTIONS.map((option) => {
              const isActive = sortBy === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.sortChip, isActive && styles.sortChipActive]}
                  onPress={() => setSortBy(isActive ? null : option.key)}
                >
                  <Text style={[styles.sortChipText, isActive && styles.sortChipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {sortedRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onPress={() => openRestaurant(restaurant.id)}
            />
          ))}
        </>
      )}
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
  greeting: {
    fontSize: 15,
    color: colors.textMuted,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
    marginBottom: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 12,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  sortChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.text,
  },
  sortChipTextActive: {
    color: '#fff',
  },
  dishGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyResultsText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 12,
  },
});
