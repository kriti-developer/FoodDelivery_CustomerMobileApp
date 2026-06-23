import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { API_BASE } from '../config';

const REGISTERED_USER_KEY = '@food_app/registeredUser';
const SESSION_KEY = '@food_app/session';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [cart, setCart] = useState({});
  const [order, setOrder] = useState(null); // the order this customer placed, straight from the backend
  const [menuItem, setMenuItem] = useState(null); // whatever the restaurant currently has live
  const socketRef = useRef(null);

  // Restore login session on app start (still local - no auth backend yet)
  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((raw) => {
        if (raw) setUser(JSON.parse(raw));
      })
      .finally(() => setIsRestoringSession(false));
  }, []);

  // Connect to the backend once, for as long as the app is open
  useEffect(() => {
    fetch(`${API_BASE}/api/menu/displayed`)
      .then((res) => res.json())
      .then((item) => setMenuItem(item))
      .catch(() => {
        // Backend not reachable - menuItem stays null and HomeScreen
        // shows an empty state instead of crashing.
      });

    const socket = io(API_BASE);
    socketRef.current = socket;

    // Restaurant changed the displayed item - update instantly, same
    // event the web dashboard and rider app already listen for.
    socket.on('menu:updated', (item) => {
      setMenuItem(item);
    });

    // A rider accepted (or any order changed status) - only react if
    // it's the order this customer is actually tracking.
    socket.on('order:updated', (updatedOrder) => {
      setOrder((prev) => (prev && prev.id === updatedOrder.id ? updatedOrder : prev));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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

  // There's only ever one orderable item (whatever the restaurant has
  // live), so every entry in the cart dict just points back to it.
  const cartItems = useMemo(
    () =>
      menuItem
        ? Object.entries(cart)
            .filter(([, quantity]) => quantity > 0)
            .map(([, quantity]) => ({ item: menuItem, quantity }))
        : [],
    [cart, menuItem]
  );

  const cartCount = useMemo(
    () => Object.values(cart).reduce((sum, qty) => sum + qty, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, { item, quantity }) => sum + item.price * quantity, 0),
    [cartItems]
  );

  // Places a real order against the backend. Returns { success, message }
  // so the screen can show an error instead of navigating blindly.
  const placeOrder = useCallback(async () => {
    if (cartCount === 0) {
      return { success: false, message: 'Your cart is empty.' };
    }
    if (!user) {
      return { success: false, message: 'You need to be logged in to order.' };
    }

    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: user.name }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.error || 'Could not place order.' };
      }

      setOrder(data);
      clearCart();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: 'Could not reach the server. Check that the backend is running and API_BASE in config.js is correct.',
      };
    }
  }, [cartCount, user, clearCart]);

  const resetOrder = useCallback(() => setOrder(null), []);

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
      addToCart,
      setItemQuantity,
      clearCart,
      menuItem,
      order,
      placeOrder,
      resetOrder,
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
      addToCart,
      setItemQuantity,
      clearCart,
      menuItem,
      order,
      placeOrder,
      resetOrder,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
