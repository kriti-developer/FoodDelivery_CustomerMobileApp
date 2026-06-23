export const RESTAURANTS = [
  {
    id: 'r1',
    name: 'Tasty Bites',
    cuisine: 'Multi-cuisine • Home-style cooking',
    rating: 4.5,
    deliveryTime: '25-30 min',
    address: '123 Food Street, Flavor Town',
    emoji: '🍽️',
  },
  {
    id: 'r2',
    name: 'Spice Route',
    cuisine: 'North Indian • Mughlai',
    rating: 4.7,
    deliveryTime: '30-35 min',
    address: '45 Curry Lane, Flavor Town',
    emoji: '🍛',
  },
  {
    id: 'r3',
    name: 'Pizza Planet',
    cuisine: 'Italian • Pizza & Pasta',
    rating: 4.3,
    deliveryTime: '20-25 min',
    address: '9 Cheese Avenue, Flavor Town',
    emoji: '🍕',
  },
  {
    id: 'r4',
    name: 'Dragon Wok',
    cuisine: 'Chinese • Asian Fusion',
    rating: 4.6,
    deliveryTime: '25-30 min',
    address: '78 Noodle Road, Flavor Town',
    emoji: '🥡',
  },
  {
    id: 'r5',
    name: 'Burger Barn',
    cuisine: 'American • Burgers & Fries',
    rating: 4.2,
    deliveryTime: '15-20 min',
    address: '12 Grill Street, Flavor Town',
    emoji: '🍔',
  },
  {
    id: 'r6',
    name: 'Sweet Tooth',
    cuisine: 'Desserts • Bakery',
    rating: 4.8,
    deliveryTime: '20-25 min',
    address: '3 Sugar Boulevard, Flavor Town',
    emoji: '🍰',
  },
];

export const MENU_ITEMS = [
  {
    id: 'i1',
    restaurantId: 'r1',
    name: 'Margherita Pizza',
    description: 'Classic delight with 100% real mozzarella cheese, fresh basil, and a tangy tomato base.',
    price: 0,
    emoji: '🍕',
  },
  {
    id: 'i2',
    restaurantId: 'r1',
    name: 'Garlic Bread',
    description: 'Crisp baked bread loaded with garlic butter and herbs.',
    price: 0,
    emoji: '🥖',
  },
  {
    id: 'i3',
    restaurantId: 'r2',
    name: 'Butter Chicken',
    description: 'Tender chicken simmered in a rich, creamy tomato gravy.',
    price: 0,
    emoji: '🍗',
  },
  {
    id: 'i4',
    restaurantId: 'r2',
    name: 'Paneer Tikka',
    description: 'Smoky grilled cottage cheese marinated in spiced yogurt.',
    price: 0,
    emoji: '🧀',
  },
  {
    id: 'i5',
    restaurantId: 'r3',
    name: 'Pepperoni Pizza',
    description: 'Loaded with spicy pepperoni and extra mozzarella.',
    price: 0,
    emoji: '🍕',
  },
  {
    id: 'i6',
    restaurantId: 'r3',
    name: 'Pasta Alfredo',
    description: 'Creamy white sauce pasta tossed with garlic and parmesan.',
    price: 0,
    emoji: '🍝',
  },
  {
    id: 'i7',
    restaurantId: 'r4',
    name: 'Veg Hakka Noodles',
    description: 'Wok-tossed noodles with fresh vegetables and soy sauce.',
    price: 0,
    emoji: '🍜',
  },
  {
    id: 'i8',
    restaurantId: 'r4',
    name: 'Spring Rolls',
    description: 'Crispy rolls stuffed with veggies, served with a tangy dip.',
    price: 0,
    emoji: '🥟',
  },
  {
    id: 'i9',
    restaurantId: 'r5',
    name: 'Classic Cheeseburger',
    description: 'Juicy patty, melted cheese, and fresh veggies in a soft bun.',
    price: 0,
    emoji: '🍔',
  },
  {
    id: 'i10',
    restaurantId: 'r5',
    name: 'Crispy Fries',
    description: 'Golden, crunchy fries seasoned to perfection.',
    price: 0,
    emoji: '🍟',
  },
  {
    id: 'i11',
    restaurantId: 'r6',
    name: 'Chocolate Brownie',
    description: 'Warm, fudgy brownie with a rich chocolate center.',
    price: 0,
    emoji: '🍫',
  },
  {
    id: 'i12',
    restaurantId: 'r6',
    name: 'Cupcake Trio',
    description: 'Three mini cupcakes in vanilla, chocolate, and red velvet.',
    price: 0,
    emoji: '🧁',
  },
];

export const DELIVERY_PARTNER = {
  id: 'p1',
  name: 'Raj Kumar',
  phone: '+919876543210',
  vehicle: 'Bike • DL 4S AB 1234',
  rating: 4.8,
  emoji: '🛵',
};

export const ORDER_STAGES = [
  { key: 'placed', label: 'Order Placed', icon: '🧾' },
  { key: 'preparing', label: 'Preparing your food', icon: '👨‍🍳' },
  { key: 'out_for_delivery', label: 'Out for delivery', icon: '🛵' },
  { key: 'delivered', label: 'Delivered', icon: '✅' },
];

export function getRestaurantById(restaurantId) {
  return RESTAURANTS.find((r) => r.id === restaurantId);
}

export function getMenuItemById(itemId) {
  return MENU_ITEMS.find((i) => i.id === itemId);
}

export function getMenuItemsByRestaurant(restaurantId) {
  return MENU_ITEMS.filter((i) => i.restaurantId === restaurantId);
}

export function getTopRatedRestaurants(limit = 4) {
  return [...RESTAURANTS].sort((a, b) => b.rating - a.rating).slice(0, limit);
}

export function searchCatalog(query) {
  const q = query.trim().toLowerCase();
  if (!q) return { restaurants: [], items: [] };
  return {
    restaurants: RESTAURANTS.filter((r) => r.name.toLowerCase().includes(q)),
    items: MENU_ITEMS.filter((i) => i.name.toLowerCase().includes(q)),
  };
}
