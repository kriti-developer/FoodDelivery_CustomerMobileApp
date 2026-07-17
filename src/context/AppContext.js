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
const REQUEST_TIMEOUT_MS = 4500;
const STATUS_ALERT_DURATION_MS = 4000;

const ORDER_STATUS_MESSAGES = {
  confirmed: 'Your order has been confirmed!',
  preparing: 'The kitchen has started preparing your order.',
  ready: 'Your order is packed and waiting for a delivery partner.',
  'on-the-way': 'Your order is out for delivery!',
  delivered: 'Your order has been delivered. Enjoy! 🎉',
  cancelled: 'Your order was cancelled.',
};

const AppContext = createContext(null);

function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId);
  });
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [catalogVersion, setCatalogVersion] = useState(0);
  // cart shape: { [itemId]: { quantity: number, note: string } }
  const [cart, setCart] = useState({});
  const [order, setOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [menuItem, setMenuItem] = useState(null);
  const [favoriteRestaurantIds, setFavoriteRestaurantIds] = useState([]);
  const [statusAlert, setStatusAlert] = useState(null);
  const [scheduledOrders, setScheduledOrders] = useState([]);
  const socketRef = useRef(null);
  const statusAlertTimeoutRef = useRef(null);
  const userIdRef = useRef(null);
  const isPlacingOrderRef = useRef(false);
  const isSchedulingOrderRef = useRef(false);

  useEffect(() => {
    userIdRef.current = user?.id || user?._id || null;
  }, [user]);

  const announceStatusChange = useCallback((status) => {
    const message = ORDER_STATUS_MESSAGES[status];
    if (!message) return;
    setStatusAlert({ id: Date.now(), message });
    if (statusAlertTimeoutRef.current) clearTimeout(statusAlertTimeoutRef.current);
    statusAlertTimeoutRef.current = setTimeout(() => setStatusAlert(null), STATUS_ALERT_DURATION_MS);
  }, []);

  const dismissStatusAlert = useCallback(() => {
    if (statusAlertTimeoutRef.current) clearTimeout(statusAlertTimeoutRef.current);
    setStatusAlert(null);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((raw) => {
        if (!raw) return;
        const session = JSON.parse(raw);
        setUser(session.user || null);
        setAuthToken(session.token || null);
      })
      .finally(() => setIsRestoringSession(false));
  }, []);

  const saveSession = useCallback(async ({ token, user: nextUser }) => {
    const session = { token, user: nextUser };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setAuthToken(token);
    setUser(nextUser);
  }, []);

  useEffect(() => {
    const migrateLegacySession = async () => {
      const rawSession = await AsyncStorage.getItem(SESSION_KEY);
      if (!rawSession) return;

      const session = JSON.parse(rawSession);
      if (session?.token) return;

      const rawLegacyUser = await AsyncStorage.getItem(REGISTERED_USER_KEY);
      if (!rawLegacyUser) return;

      const legacyUser = JSON.parse(rawLegacyUser);
      if (!legacyUser?.email || !legacyUser?.password) return;

      const loginResponse = await fetchWithTimeout(`${API_BASE}/api/auth/customer-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: legacyUser.email, password: legacyUser.password }),
      });

      if (loginResponse.ok) {
        const data = await loginResponse.json();
        await saveSession({ token: data.token, user: data.user });
        return;
      }

      const signupResponse = await fetchWithTimeout(`${API_BASE}/api/auth/customer-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: legacyUser.name,
          email: legacyUser.email,
          phone: legacyUser.phone,
          address: legacyUser.address,
          password: legacyUser.password,
        }),
      });

      if (signupResponse.ok) {
        const data = await signupResponse.json();
        await saveSession({ token: data.token, user: data.user });
      }
    };

    migrateLegacySession().catch(() => {});
  }, [saveSession]);

  useEffect(() => {
    loadCatalogFromBackend(API_BASE, REQUEST_TIMEOUT_MS).finally(() => {
      setIsLoadingCatalog(false);
      setCatalogVersion((v) => v + 1);
    });
  }, []);

  useEffect(() => {
    const refreshCatalog = () =>
      loadCatalogFromBackend(API_BASE, REQUEST_TIMEOUT_MS).catch(() => {});

    fetchWithTimeout(`${API_BASE}/api/menu/displayed`)
      .then((res) => res.json())
      .then((items) => {
        const displayedItems = Array.isArray(items) ? items : items ? [items] : [];
        setMenuItem(displayedItems[0] || null);
      })
      .catch(() => {});

    const socket = io(API_BASE, {
      timeout: REQUEST_TIMEOUT_MS,
    });
    socketRef.current = socket;

    socket.on('menu:updated', (payload) => {
      const updatedItem = payload?.item || payload || null;
      if (updatedItem) {
        setMenuItem(updatedItem);
      }
      // Reload catalog then bump version so all screens re-render immediately
      loadCatalogFromBackend(API_BASE, REQUEST_TIMEOUT_MS)
        .catch(() => {})
        .finally(() => setCatalogVersion((v) => v + 1));
    });

    socket.on('order:updated', (updatedOrder) => {
      setOrder((prev) => {
        if (!prev || prev._id !== updatedOrder._id) return prev;
        if (prev.status !== updatedOrder.status) {
          announceStatusChange(updatedOrder.status);
        }
        return updatedOrder;
      });
    });

    // Fires for every new order, including ones a scheduled "order ahead"
    // just turned into a real order server-side with no action on this
    // device - if it's ours, start tracking it live automatically.
    socket.on('order:new', (newOrder) => {
      if (userIdRef.current && newOrder.customerId === userIdRef.current) {
        setOrder(newOrder);
        setStatusAlert({ id: Date.now(), message: `Your scheduled order from ${newOrder.restaurant?.name || 'the restaurant'} has been placed!` });
        if (statusAlertTimeoutRef.current) clearTimeout(statusAlertTimeoutRef.current);
        statusAlertTimeoutRef.current = setTimeout(() => setStatusAlert(null), STATUS_ALERT_DURATION_MS);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const signUp = useCallback(async ({ name, email, phone, address, password }) => {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/auth/customer-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, address, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Sign up failed.' };
      }
      await saveSession({ token: data.token, user: data.user });
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Could not reach the backend. Is it running?' };
    }
  }, [saveSession]);

  const login = useCallback(async ({ email, password }) => {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/auth/customer-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Login failed.' };
      }
      await saveSession({ token: data.token, user: data.user });
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Could not reach the backend. Is it running?' };
    }
  }, [saveSession]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
    setAuthToken(null);
    setCart({});
    setOrder(null);
    setOrderHistory([]);
  }, []);

  const fetchOrderHistory = useCallback(async () => {
    if (!authToken) {
      setOrderHistory([]);
      return;
    }
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/orders/mine`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status === 401) {
        await logout();
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setOrderHistory(Array.isArray(data) ? data : []);
    } catch {
      // Keep whatever history is already loaded if the backend is unreachable.
    }
  }, [authToken, logout]);

  useEffect(() => {
    fetchOrderHistory();
  }, [fetchOrderHistory]);

  const fetchFavorites = useCallback(async () => {
    if (!authToken) {
      setFavoriteRestaurantIds([]);
      return;
    }
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/customers/favorites`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status === 401) {
        await logout();
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setFavoriteRestaurantIds(Array.isArray(data) ? data.map((r) => r._id) : []);
    } catch {
      // Keep whatever favorites are already loaded if the backend is unreachable.
    }
  }, [authToken, logout]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavoriteRestaurant = useCallback(
    (restaurantId) => favoriteRestaurantIds.includes(restaurantId),
    [favoriteRestaurantIds]
  );

  const toggleFavoriteRestaurant = useCallback(async (restaurantId) => {
    if (!authToken) return;
    const isFavorite = favoriteRestaurantIds.includes(restaurantId);
    // Optimistic update so the star responds instantly.
    setFavoriteRestaurantIds((prev) =>
      isFavorite ? prev.filter((id) => id !== restaurantId) : [...prev, restaurantId]
    );
    try {
      const res = await fetchWithTimeout(
        `${API_BASE}/api/customers/favorites/${restaurantId}`,
        {
          method: isFavorite ? 'DELETE' : 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      if (res.status === 401) {
        await logout();
        return;
      }
      if (!res.ok) throw new Error();
    } catch {
      // Revert the optimistic update if the request failed.
      setFavoriteRestaurantIds((prev) =>
        isFavorite ? [...prev, restaurantId] : prev.filter((id) => id !== restaurantId)
      );
    }
  }, [authToken, favoriteRestaurantIds, logout]);

  const updateProfile = useCallback(async ({ name, email, phone, address }) => {
    const nextUser = { ...(user || {}), name, email, phone, address };
    await saveSession({ token: authToken, user: nextUser });
    return { success: true };
  }, [authToken, saveSession, user]);

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

  // Rebuilds the cart from a past order's items, so the customer can
  // reorder in one tap. Dishes that no longer exist in the current
  // catalog (removed/renamed) are silently skipped.
  const reorderOrder = useCallback((pastOrder) => {
    const nextCart = {};
    const skippedNames = [];
    (pastOrder?.items || []).forEach(({ menuItem, quantity, note }) => {
      const itemId = typeof menuItem === 'string' ? menuItem : menuItem?._id;
      const catalogItem = itemId && getMenuItemById(itemId);
      if (!catalogItem) {
        skippedNames.push((typeof menuItem === 'object' && menuItem?.name) || 'an item');
        return;
      }
      const existing = nextCart[itemId];
      nextCart[itemId] = {
        quantity: (existing?.quantity || 0) + (quantity || 1),
        note: note || existing?.note || '',
      };
    });
    setCart(nextCart);
    return { addedCount: Object.keys(nextCart).length, skippedNames };
  }, []);

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
    if (!authToken) {
      return { success: false, message: 'Your session is missing. Please log out and log back in.' };
    }
    if (isPlacingOrderRef.current) {
      return { success: false, message: 'Your order is already being placed.' };
    }
    isPlacingOrderRef.current = true;
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
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
      if (res.status === 401) {
        await logout();
        return { success: false, message: 'Your session has expired. Please log in again.' };
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not place your order. Please try again.');
      }
      const created = await res.json();
      setOrder(created);
      clearCart();
      fetchOrderHistory();
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    } finally {
      isPlacingOrderRef.current = false;
    }
  }, [authToken, cartCount, cartItems, cartRestaurantId, clearCart, fetchOrderHistory, logout]);

  const fetchScheduledOrders = useCallback(async () => {
    if (!authToken) {
      setScheduledOrders([]);
      return;
    }
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/scheduled-orders/mine`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status === 401) {
        await logout();
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setScheduledOrders(Array.isArray(data) ? data : []);
    } catch {
      // Keep whatever's already loaded if the backend is unreachable.
    }
  }, [authToken, logout]);

  useEffect(() => {
    fetchScheduledOrders();
  }, [fetchScheduledOrders]);

  // "Order Ahead": schedules the current cart for a future time instead of
  // placing it now. The backend turns it into a real order automatically
  // when it's due (see the order:new handler above for how it shows up here).
  const scheduleOrder = useCallback(async (scheduledFor) => {
    if (cartCount === 0) {
      return { success: false, message: 'Your cart is empty.' };
    }
    if (!authToken) {
      return { success: false, message: 'Your session is missing. Please log out and log back in.' };
    }
    if (isSchedulingOrderRef.current) {
      return { success: false, message: 'Your order is already being scheduled.' };
    }
    isSchedulingOrderRef.current = true;
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/scheduled-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          restaurantId: cartRestaurantId,
          items: cartItems.map(({ item, quantity, note }) => ({
            menuItem: item.id,
            quantity,
            price: item.price,
            ...(note ? { note } : {}),
          })),
          scheduledFor: new Date(scheduledFor).toISOString(),
        }),
      });
      if (res.status === 401) {
        await logout();
        return { success: false, message: 'Your session has expired. Please log in again.' };
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not schedule your order. Please try again.');
      }
      clearCart();
      fetchScheduledOrders();
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    } finally {
      isSchedulingOrderRef.current = false;
    }
  }, [authToken, cartCount, cartItems, cartRestaurantId, clearCart, fetchScheduledOrders, logout]);

  const cancelScheduledOrder = useCallback(async (scheduledOrderId) => {
    if (!authToken) {
      return { success: false, message: 'Your session is missing. Please log out and log back in.' };
    }
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/scheduled-orders/${scheduledOrderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status === 401) {
        await logout();
        return { success: false, message: 'Your session has expired. Please log in again.' };
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not cancel this scheduled order.');
      }
      fetchScheduledOrders();
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }, [authToken, fetchScheduledOrders, logout]);

  const cancelOrder = useCallback(async (orderId) => {
    if (!authToken) {
      return { success: false, message: 'Your session is missing. Please log out and log back in.' };
    }
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status === 401) {
        await logout();
        return { success: false, message: 'Your session has expired. Please log in again.' };
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not cancel this order.');
      }
      const updated = await res.json();
      setOrder((prev) => (prev && prev._id === updated._id ? updated : prev));
      fetchOrderHistory();
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }, [authToken, fetchOrderHistory, logout]);

  const rateOrder = useCallback(async (orderId, rating) => {
    if (!authToken) {
      return { success: false, message: 'Your session is missing. Please log out and log back in.' };
    }
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/orders/${orderId}/rate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ rating }),
      });
      if (res.status === 401) {
        await logout();
        return { success: false, message: 'Your session has expired. Please log in again.' };
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not submit your rating.');
      }
      const updated = await res.json();
      setOrder((prev) => (prev && prev._id === updated._id ? updated : prev));
      fetchOrderHistory();
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }, [authToken, fetchOrderHistory, logout]);

  const resetOrder = useCallback(() => setOrder(null), []);

  const value = useMemo(
    () => ({
      user,
      isRestoringSession,
      isLoadingCatalog,
      catalogVersion,
      signUp,
      login,
      logout,
      updateProfile,
      cart,
      cartItems,
      cartCount,
      cartTotal,
      cartRestaurantId,
      authToken,
      addToCart,
      replaceCart,
      setItemQuantity,
      clearCart,
      menuItem,
      order,
      orderHistory,
      fetchOrderHistory,
      placeOrder,
      cancelOrder,
      rateOrder,
      reorderOrder,
      resetOrder,
      scheduledOrders,
      fetchScheduledOrders,
      scheduleOrder,
      cancelScheduledOrder,
      favoriteRestaurantIds,
      isFavoriteRestaurant,
      toggleFavoriteRestaurant,
      statusAlert,
      dismissStatusAlert,
    }),
    [
      user,
      isRestoringSession,
      isLoadingCatalog,
      catalogVersion,
      signUp,
      login,
      logout,
      updateProfile,
      cart,
      cartItems,
      cartCount,
      cartTotal,
      cartRestaurantId,
      authToken,
      addToCart,
      replaceCart,
      setItemQuantity,
      clearCart,
      menuItem,
      order,
      orderHistory,
      fetchOrderHistory,
      placeOrder,
      cancelOrder,
      rateOrder,
      reorderOrder,
      resetOrder,
      scheduledOrders,
      fetchScheduledOrders,
      scheduleOrder,
      cancelScheduledOrder,
      favoriteRestaurantIds,
      isFavoriteRestaurant,
      toggleFavoriteRestaurant,
      statusAlert,
      dismissStatusAlert,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
