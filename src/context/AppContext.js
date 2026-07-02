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
import { getMenuItemById, loadCatalogFromBackend } from '../data/mockData';

const REGISTERED_USER_KEY = '@food_app/registeredUser';
const SESSION_KEY = '@food_app/session';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  // cart shape: { [itemId]: { quantity: number, note: string } }
  const [cart, setCart] = useState({});
  const [order, setOrder] = useState(null);
  const [menuItem, setMenuItem] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((raw) => {
        if (raw) setUser(JSON.parse(raw));
      })
      .finally(() => setIsRestoringSession(false));
  }, []);

  useEffect(() => {
    loadCatalogFromBackend(API_BASE).finally(() => setIsLoadingCatalog(false));
  }, []);

  useEffect(() => {
    const refreshCatalog = () => {
      loadCatalogFromBackend(API_BASE).catch(() => {});
    };

    fetch(`${API_BASE}/api/menu/displayed`)
      .then((res) => res.json())
      .then((items) => {
        const displayedItems = Array.isArray(items) ? items : items ? [items] : [];
        setMenuItem(displayedItems[0] || null);
      })
      .catch(() => {});

    const socket = io(API_BASE);
    socketRef.current = socket;

    socket.on('menu:updated', (payload) => {
      const updatedItem = payload?.item || payload || null;
      if (updatedItem) {
        setMenuItem(updatedItem);
      }
      refreshCatalog();
    });

    socket.on('order:updated', (updatedOrder) => {
      setOrder((prev) => (prev && prev._id === updatedOrder._id ? updatedOrder : prev));
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

  const updateProfile = useCallback(async ({ name, email, phone, address }) => {
    const session = { name, email, phone, address };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    const raw = await AsyncStorage.getItem(REGISTERED_USER_KEY);
    if (raw) {
      const registered = JSON.parse(raw);
      await AsyncStorage.setItem(
        REGISTERED_USER_KEY,
        JSON.stringify({ ...registered, name, email, phone, address })
      );
    }
    setUser(session);
    return { success: true };
  }, []);

  // Adds quantity to an item, optionally attaching/overwriting its note.
  const addToCart = useCallback((itemId, quantity = 1, note = '') => {
    setCart((prev) => {
      const existing = prev[itemId] || { quantity: 0, note: '' };
      return {
        ...prev,
        [itemId]: {
          quantity: existing.quantity + quantity,
          // Only overwrite the note if a non-empty one is provided,
          // so increments from the QuantityStepper don't blank it out.
          note: note !== '' ? note : existing.note,
        },
      };
    });
  }, []);

  const setItemQuantity = useCallback((itemId, quantity) => {
    setCart((prev) => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[itemId];
      } else {
        next[itemId] = { ...(next[itemId] || { note: '' }), quantity };
      }
      return next;
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, entry]) => entry.quantity > 0)
        .map(([itemId, { quantity, note }]) => ({
          item: getMenuItemById(itemId),
          quantity,
          note,
        }))
        .filter((entry) => entry.item),
    [cart]
  );

  const cartCount = useMemo(
    () => Object.values(cart).reduce((sum, entry) => sum + (entry.quantity || 0), 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, { item, quantity }) => sum + item.price * quantity, 0),
    [cartItems]
  );

  const cartRestaurantId = cartItems[0]?.item.restaurantId ?? null;

  const replaceCart = useCallback((itemId, quantity = 1, note = '') => {
    setCart({ [itemId]: { quantity, note } });
  }, []);

  const placeOrder = useCallback(async () => {
    if (cartCount === 0) {
      return { success: false, message: 'Your cart is empty.' };
    }
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: user?.name || 'Guest',
          restaurantId: cartRestaurantId,
          items: cartItems.map(({ item, quantity, note }) => ({
            menuItem: item.id,
            quantity,
            price: item.price,
            // note is sent to the backend so kitchen / rider can see it
            ...(note ? { note } : {}),
          })),
        }),
      });
      if (!res.ok) throw new Error('Could not place your order. Please try again.');
      const created = await res.json();
      setOrder(created);
      clearCart();
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }, [cartCount, cartItems, cartRestaurantId, clearCart, user]);

  const resetOrder = useCallback(() => setOrder(null), []);

  const value = useMemo(
    () => ({
      user,
      isRestoringSession,
      isLoadingCatalog,
      signUp,
      login,
      logout,
      updateProfile,
      cart,
      cartItems,
      cartCount,
      cartTotal,
      cartRestaurantId,
      addToCart,
      replaceCart,
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
      isLoadingCatalog,
      signUp,
      login,
      logout,
      updateProfile,
      cart,
      cartItems,
      cartCount,
      cartTotal,
      cartRestaurantId,
      addToCart,
      replaceCart,
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
