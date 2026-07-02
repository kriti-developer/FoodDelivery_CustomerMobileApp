// Catalog for Home's search / Top Rated / "What do you want to eat"
// sections, and for the cart/order flow. RESTAURANTS/DISHES/MENU_ITEMS
// start out as this hardcoded mock data (so there's something to render
// immediately), then loadCatalogFromBackend() below replaces their
// contents in place with the real backend catalog once it's fetched - see
// AppContext.js, which awaits it before rendering any screen. A dish can
// be served by more than one restaurant, which is what the "see all
// restaurants with this dish" screen is for; the real backend has no such
// grouping, so it's derived by matching menu item names across
// restaurants instead.

export const RESTAURANTS = [
  {
    id: 'r1',
    name: 'Tasty Bites',
    cuisine: 'Multi-cuisine • Home-style cooking',
    rating: 4.5,
    deliveryTime: '25-30 min',
    costForTwo: 350,
    address: '123 Food Street, Flavor Town',
    emoji: '🍽️',
    location: { latitude: 28.6139, longitude: 77.209 },
  },
  {
    id: 'r2',
    name: 'Spice Route',
    cuisine: 'North Indian • Mughlai',
    rating: 4.7,
    deliveryTime: '30-35 min',
    costForTwo: 550,
    address: '45 Curry Lane, Flavor Town',
    emoji: '🍛',
    location: { latitude: 28.6304, longitude: 77.2177 },
  },
  {
    id: 'r3',
    name: 'Pizza Planet',
    cuisine: 'Italian • Pizza & Pasta',
    rating: 4.3,
    deliveryTime: '20-25 min',
    costForTwo: 450,
    address: '9 Cheese Avenue, Flavor Town',
    emoji: '🍕',
    location: { latitude: 28.6219, longitude: 77.2419 },
  },
  {
    id: 'r4',
    name: 'Dragon Wok',
    cuisine: 'Chinese • Asian Fusion',
    rating: 4.6,
    deliveryTime: '25-30 min',
    costForTwo: 400,
    address: '78 Noodle Road, Flavor Town',
    emoji: '🥡',
    location: { latitude: 28.5921, longitude: 77.229 },
  },
  {
    id: 'r5',
    name: 'Burger Barn',
    cuisine: 'American • Burgers & Fries',
    rating: 4.2,
    deliveryTime: '15-20 min',
    costForTwo: 300,
    address: '12 Grill Street, Flavor Town',
    emoji: '🍔',
    location: { latitude: 28.6448, longitude: 77.2167 },
  },
  {
    id: 'r6',
    name: 'Sweet Tooth',
    cuisine: 'Desserts • Bakery',
    rating: 4.8,
    deliveryTime: '20-25 min',
    costForTwo: 250,
    address: '3 Sugar Boulevard, Flavor Town',
    emoji: '🍰',
    location: { latitude: 28.6129, longitude: 77.2295 },
  },
];

// The dishes featured in "What do you want to eat" - each one can be
// served by multiple restaurants (see MENU_ITEMS below).
export const DISHES = [
  { id: 'd1', name: 'Margherita Pizza', emoji: '🍕' },
  { id: 'd2', name: 'Butter Chicken', emoji: '🍗' },
  { id: 'd3', name: 'Veg Hakka Noodles', emoji: '🍜' },
  { id: 'd4', name: 'Classic Cheeseburger', emoji: '🍔' },
  { id: 'd5', name: 'Chocolate Brownie', emoji: '🍫' },
  { id: 'd6', name: 'Paneer Tikka', emoji: '🧀' },
];

// Every restaurant's actual menu - one row per (restaurant, dish) pairing.
// A dish with more than one row here is served by more than one restaurant.
export const MENU_ITEMS = [
  { id: 'i1', restaurantId: 'r1', dishId: 'd1', price: 0 }, // Tasty Bites - Margherita Pizza
  { id: 'i2', restaurantId: 'r1', dishId: 'd5', price: 0 }, // Tasty Bites - Chocolate Brownie
  { id: 'i3', restaurantId: 'r2', dishId: 'd2', price: 0 }, // Spice Route - Butter Chicken
  { id: 'i4', restaurantId: 'r2', dishId: 'd6', price: 0 }, // Spice Route - Paneer Tikka
  { id: 'i5', restaurantId: 'r3', dishId: 'd1', price: 0 }, // Pizza Planet - Margherita Pizza
  { id: 'i6', restaurantId: 'r3', dishId: 'd5', price: 0, name: 'Tiramisu', emoji: '🍰' }, // Pizza Planet's own dessert
  { id: 'i7', restaurantId: 'r4', dishId: 'd3', price: 0 }, // Dragon Wok - Veg Hakka Noodles
  { id: 'i8', restaurantId: 'r4', dishId: 'd4', price: 0 }, // Dragon Wok - Classic Cheeseburger (fusion menu)
  { id: 'i9', restaurantId: 'r5', dishId: 'd4', price: 0 }, // Burger Barn - Classic Cheeseburger
  { id: 'i10', restaurantId: 'r5', dishId: 'd3', price: 0, name: 'Crispy Fries', emoji: '🍟' }, // Burger Barn's own side
  { id: 'i11', restaurantId: 'r6', dishId: 'd5', price: 0 }, // Sweet Tooth - Chocolate Brownie
  { id: 'i12', restaurantId: 'r6', dishId: 'd5', price: 0, name: 'Cupcake Trio', emoji: '🧁' }, // Sweet Tooth's own dessert
];

export const DELIVERY_PARTNER = {
  phone: '+919876543210',
  vehicle: 'Bike • DL 4S AB 1234',
  rating: 4.8,
  emoji: '🛵',
};

// Mock coordinate for the customer's delivery address - there's no real
// geocoding here, just a fixed point the partner marker travels to.
export const DELIVERY_DESTINATION = { latitude: 28.6169, longitude: 77.2295 };

export const ORDER_STAGES = [
  { key: 'placed', label: 'Order Placed', icon: '🧾' },
  { key: 'preparing', label: 'Preparing your food', icon: '👨‍🍳' },
  { key: 'out_for_delivery', label: 'Out for delivery', icon: '🛵' },
  { key: 'delivered', label: 'Delivered', icon: '✅' },
];

export function getRestaurantById(restaurantId) {
  return RESTAURANTS.find((r) => r.id === restaurantId);
}

export function getDishById(dishId) {
  return DISHES.find((d) => d.id === dishId);
}

function describeMenuItem(menuItem) {
  const dish = getDishById(menuItem.dishId);
  return {
    ...menuItem,
    name: menuItem.name || dish?.name,
    emoji: menuItem.emoji || dish?.emoji,
  };
}

export function getMenuItemsByRestaurant(restaurantId) {
  return MENU_ITEMS.filter((i) => i.restaurantId === restaurantId).map(describeMenuItem);
}

export function getMenuItemById(itemId) {
  const item = MENU_ITEMS.find((i) => i.id === itemId);
  return item ? describeMenuItem(item) : undefined;
}

// All (restaurant, menuItem) pairs that serve a given dish.
export function getRestaurantsServingDish(dishId) {
  return MENU_ITEMS.filter((i) => i.dishId === dishId).map((menuItem) => ({
    restaurant: getRestaurantById(menuItem.restaurantId),
    menuItem: describeMenuItem(menuItem),
  }));
}

export function getTopRatedRestaurants(limit = 4) {
  return [...RESTAURANTS].sort((a, b) => b.rating - a.rating).slice(0, limit);
}

// "25-30 min" -> { min: 25, max: 30, average: 27.5 }
export function parseDeliveryTime(deliveryTime) {
  const [min, max] = deliveryTime.split('-').map((n) => parseInt(n, 10));
  return { min, max: max ?? min, average: max ? (min + max) / 2 : min };
}

const SORTERS = {
  deliveryTime: (a, b) => parseDeliveryTime(a.deliveryTime).average - parseDeliveryTime(b.deliveryTime).average,
  rating: (a, b) => b.rating - a.rating,
  cost: (a, b) => a.costForTwo - b.costForTwo,
};

export function sortRestaurants(restaurants, sortBy) {
  const sorter = SORTERS[sortBy];
  return sorter ? [...restaurants].sort(sorter) : restaurants;
}

export function searchCatalog(query) {
  const q = query.trim().toLowerCase();
  if (!q) return { restaurants: [], dishes: [] };
  return {
    restaurants: RESTAURANTS.filter((r) => r.name.toLowerCase().includes(q)),
    dishes: DISHES.filter((d) => d.name.toLowerCase().includes(q)),
  };
}

// The real backend has no lat/lng for restaurants. Reuses the mock
// coordinates above, keyed by name, so the map in OrdersScreen still has
// somewhere sensible to put each restaurant's pin; falls back to a small
// offset from DELIVERY_DESTINATION for any restaurant name it doesn't
// recognize (e.g. one added on the backend after this list was written).
const KNOWN_LOCATIONS = new Map(RESTAURANTS.map((r) => [r.name, r.location]));
function locationForRestaurantName(name, index) {
  return (
    KNOWN_LOCATIONS.get(name) || {
      latitude: DELIVERY_DESTINATION.latitude + 0.01 * (index + 1),
      longitude: DELIVERY_DESTINATION.longitude + 0.01 * (index + 1),
    }
  );
}

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
}

// Fetches the real catalog (GET /api/catalog: restaurants, each with a
// nested menuItems array) and replaces RESTAURANTS/DISHES/MENU_ITEMS'
// contents in place with it, reshaped into this file's existing shape -
// so every helper above, and every screen that already imports from this
// file, keeps working unchanged, just backed by real ids/prices instead
// of the hardcoded mock ones. Fails silently (keeping whatever was
// already in these arrays) if the backend isn't reachable, same as the
// rest of the app's "don't block on the backend" approach.
export async function loadCatalogFromBackend(apiBase) {
  try {
    const res = await fetch(`${apiBase}/api/catalog`);
    if (!res.ok) return;
    const catalog = await res.json();

    const dishesByName = new Map();
    const menuItems = [];
    catalog.forEach((restaurant) => {
      (restaurant.menuItems || []).forEach((item) => {
        // Customer app only shows items currently live in dashboard.
        if (!item.isDisplayed || item.isAvailable === false) return;

        const dishId = slugify(item.name);
        if (!dishesByName.has(dishId)) {
          dishesByName.set(dishId, { id: dishId, name: item.name, emoji: item.emoji });
        }
        menuItems.push({
          id: item._id,
          restaurantId: restaurant._id,
          dishId,
          name: item.name,
          emoji: item.emoji,
          price: item.price,
          isDisplayed: true,
        });
      });
    });

    const liveRestaurantIds = new Set(menuItems.map((item) => item.restaurantId));
    const restaurants = catalog
      .filter((r) => liveRestaurantIds.has(r._id))
      .map((r, index) => ({
        id: r._id,
        name: r.name,
        cuisine: r.cuisine,
        rating: r.rating,
        deliveryTime: r.deliveryTime,
        costForTwo: r.costForTwo,
        address: r.address,
        emoji: r.emoji,
        location: locationForRestaurantName(r.name, index),
      }));

    RESTAURANTS.length = 0;
    RESTAURANTS.push(...restaurants);
    DISHES.length = 0;
    DISHES.push(...dishesByName.values());
    MENU_ITEMS.length = 0;
    MENU_ITEMS.push(...menuItems);
  } catch (e) {
    // Backend unreachable - keep the mock catalog already in these arrays
    // so the app is still browsable, same as the rest of the app's
    // graceful-degradation approach.
  }
}
