import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMenuItemById, ORDER_STAGES } from '../data/mockData';

const REGISTERED_USER_KEY = '@food_app/registeredUser';
const SESSION_KEY = '@food_app/session';
const ORDER_STAGE_INTERVAL_MS = 4000;
const MAX_PREVIOUSLY_ORDERED = 6;

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [cart, setCart] = useState({});
  const [order, setOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((raw) => {
        if (raw) setUser(JSON.parse(raw));
      })
      .finally(() => setIsRestoringSession(false));
  }, []);

  useEffect(() => {
    if (!order || order.stageIndex >= ORDER_STAGES.length - 1) return;
    const timer = setTimeout(() => {
      setOrder((prev) => (prev ? { ...prev, stageIndex: prev.stageIndex + 1 } : prev));
    }, ORDER_STAGE_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [order]);

  const signUp = useCallback(async ({ name, email, phone, address, password }) => {
    const profile = { name, email, phone, address, password };
    await AsyncStorage.setItem(REGISTERED_USER_KEY, JSON.stringify(profile));
    const session = { name, email, phone, address };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return { success: true };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const raw = await AsyncStorage.getItem(REGISTERED_USER_KEY);
    if (!raw) {
      return { success: false, message: 'No account found. Please sign up first.' };
    }
    const registered = JSON.parse(raw);
    if (registered.email.toLowerCase() !== email.trim().toLowerCase()) {
      return { success: false, message: 'No account found with that email.' };
    }
    if (registered.password !== password) {
      return { success: false, message: 'Incorrect password.' };
    }
    const session = {
      name: registered.name,
      email: registered.email,
      phone: registered.phone,
      address: registered.address,
    };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
    setCart({});
    setOrder(null);
    setOrderHistory([]);
  }, []);

  const addToCart = useCallback((itemId, quantity = 1) => {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + quantity }));
  }, []);

  const setItemQuantity = useCallback((itemId, quantity) => {
    setCart((prev) => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[itemId];
      } else {
        next[itemId] = quantity;
      }
      return next;
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, quantity]) => quantity > 0)
        .map(([itemId, quantity]) => ({ item: getMenuItemById(itemId), quantity }))
        .filter((entry) => entry.item),
    [cart]
  );

  const cartCount = useMemo(
    () => Object.values(cart).reduce((sum, qty) => sum + qty, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, { item, quantity }) => sum + item.price * quantity, 0),
    [cartItems]
  );

  const cartRestaurantId = cartItems[0]?.item.restaurantId ?? null;

  const replaceCart = useCallback((itemId, quantity = 1) => {
    setCart({ [itemId]: quantity });
  }, []);

  const placeOrder = useCallback(() => {
    if (cartCount === 0) return;
    setOrder({
      stageIndex: 0,
      placedAt: new Date().toISOString(),
      items: cartItems.map(({ item, quantity }) => ({ itemId: item.id, quantity })),
    });
    clearCart();
  }, [cartCount, cartItems, clearCart]);

  const resetOrder = useCallback(() => {
    setOrder((current) => {
      if (current) {
        setOrderHistory((prev) => [current, ...prev]);
      }
      return null;
    });
  }, []);

  const previouslyOrderedItems = useMemo(() => {
    const seen = new Set();
    const items = [];
    for (const pastOrder of orderHistory) {
      for (const { itemId } of pastOrder.items) {
        if (seen.has(itemId)) continue;
        const item = getMenuItemById(itemId);
        if (!item) continue;
        seen.add(itemId);
        items.push(item);
        if (items.length >= MAX_PREVIOUSLY_ORDERED) return items;
      }
    }
    return items;
  }, [orderHistory]);

  const value = useMemo(
    () => ({
      user,
      isRestoringSession,
      signUp,
      login,
      logout,
      cart,
      cartItems,
      cartCount,
      cartTotal,
      cartRestaurantId,
      addToCart,
      replaceCart,
      setItemQuantity,
      clearCart,
      order,
      placeOrder,
      resetOrder,
      previouslyOrderedItems,
    }),
    [
      user,
      isRestoringSession,
      signUp,
      login,
      logout,
      cart,
      cartItems,
      cartCount,
      cartTotal,
      cartRestaurantId,
      addToCart,
      replaceCart,
      setItemQuantity,
      clearCart,
      order,
      placeOrder,
      resetOrder,
      previouslyOrderedItems,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
