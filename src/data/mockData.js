export const RESTAURANT = {
  id: 'r1',
  name: 'Tasty Bites',
  tagline: 'Multi-cuisine • Home-style cooking',
  rating: 4.5,
  deliveryTime: '25-30 min',
  address: '123 Food Street, Flavor Town',
  emoji: '🍽️',
};

// The menu item itself now comes from the backend (see AppContext.js),
// since the restaurant dashboard picks it live. This is just placeholder
// info for fields the backend doesn't track yet.
export const DELIVERY_PARTNER = {
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
