import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMenuItemsByRestaurant, getRestaurantById } from '../data/mockData';
import { useApp } from '../context/AppContext';
import QuantityStepper from '../components/QuantityStepper';
import PrimaryButton from '../components/PrimaryButton';
import CartBar from '../components/CartBar';
import { colors } from '../theme/colors';

const NOTE_MAX_LENGTH = 150;

export default function RestaurantScreen({ route }) {
  const { restaurantId } = route.params;
  const {
    cart,
    addToCart,
    replaceCart,
    setItemQuantity,
    cartRestaurantId,
    catalogVersion,
    isFavoriteRestaurant,
    toggleFavoriteRestaurant,
  } = useApp();
  const restaurant = useMemo(() => getRestaurantById(restaurantId), [restaurantId, catalogVersion]);
  const menuItems = useMemo(() => getMenuItemsByRestaurant(restaurantId), [restaurantId, catalogVersion]);

  // The item currently being customised (null = sheet closed)
  const [pendingItem, setPendingItem] = useState(null);
  const [pendingNote, setPendingNote] = useState('');

  if (!restaurant) return null;

  const isClosed = restaurant.isOpen === false;

  // Called when user taps "Add" on a dish that has no cart entry yet.
  const handleAdd = (item) => {
    if (isClosed) {
      Alert.alert('Restaurant closed', `${restaurant.name} isn't accepting orders right now.`);
      return;
    }
    if (cartRestaurantId && cartRestaurantId !== item.restaurantId) {
      const currentRestaurant = getRestaurantById(cartRestaurantId);
      Alert.alert(
        'Replace cart?',
        `Your cart has items from ${currentRestaurant?.name || 'another restaurant'}. Adding this dish will clear them and start a new cart from ${restaurant.name}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace Cart',
            style: 'destructive',
            onPress: () => openNoteSheet(item, true),
          },
        ]
      );
      return;
    }
    openNoteSheet(item, false);
  };

  const openNoteSheet = (item, replace) => {
    setPendingItem({ item, replace });
    setPendingNote('');
  };

  const confirmAdd = () => {
    if (!pendingItem) return;
    const { item, replace } = pendingItem;
    if (replace) {
      replaceCart(item.id, 1, pendingNote.trim());
    } else {
      addToCart(item.id, 1, pendingNote.trim());
    }
    setPendingItem(null);
    setPendingNote('');
  };

  const cancelAdd = () => {
    setPendingItem(null);
    setPendingNote('');
  };

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.favoriteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => toggleFavoriteRestaurant(restaurant.id)}
          >
            <Ionicons
              name={isFavoriteRestaurant(restaurant.id) ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavoriteRestaurant(restaurant.id) ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
          <View style={styles.emojiWrap}>
            <Text style={styles.emoji}>{restaurant.emoji}</Text>
          </View>
          <Text style={styles.name}>{restaurant.name}</Text>
          {isClosed && (
            <View style={styles.closedBadge}>
              <Text style={styles.closedBadgeText}>Currently Closed</Text>
            </View>
          )}
          <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="star" size={14} color={colors.warning} />
            <Text style={styles.metaText}>{restaurant.rating}</Text>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} style={styles.metaIconSpacing} />
            <Text style={styles.metaText}>{restaurant.deliveryTime}</Text>
          </View>
          <Text style={styles.address}>{restaurant.address}</Text>
        </View>

        <Text style={styles.sectionTitle}>Menu</Text>
        {menuItems.map((item) => {
          const entry = cart[item.id];
          const quantity = entry ? entry.quantity : 0;
          return (
            <View key={item.id} style={styles.dishRow}>
              <Text style={styles.dishEmoji}>{item.emoji}</Text>
              <View style={styles.dishInfo}>
                <Text style={styles.dishName}>{item.name}</Text>
                <Text style={styles.dishPrice}>{item.price === 0 ? 'FREE' : `₹${item.price}`}</Text>
                {/* Show the saved note inline so users can see what they requested */}
                {entry?.note ? (
                  <Text style={styles.dishNote} numberOfLines={1}>
                    📝 {entry.note}
                  </Text>
                ) : null}
              </View>
              {quantity > 0 ? (
                <QuantityStepper
                  quantity={quantity}
                  size="small"
                  onIncrease={() => addToCart(item.id, 1)}
                  onDecrease={() => setItemQuantity(item.id, quantity - 1)}
                />
              ) : (
                <TouchableOpacity
                  style={[styles.addButton, isClosed && styles.addButtonDisabled]}
                  onPress={() => handleAdd(item)}
                >
                  <Text style={[styles.addButtonText, isClosed && styles.addButtonTextDisabled]}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
      <CartBar />

      {/* ── Customisation bottom sheet ───────────────────────────── */}
      <Modal
        visible={!!pendingItem}
        transparent
        animationType="slide"
        onRequestClose={cancelAdd}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Tap outside to dismiss */}
          <Pressable style={styles.modalBackdrop} onPress={cancelAdd} />

          <View style={styles.sheet}>
            {/* Handle bar */}
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>
              {pendingItem?.item.emoji}  {pendingItem?.item.name}
            </Text>
            <Text style={styles.sheetSubtitle}>
              Any customisations? We'll pass them straight to the kitchen.
            </Text>

            <TextInput
              style={styles.noteInput}
              placeholder="E.g. less spicy, no onions, extra sauce…"
              placeholderTextColor={colors.textMuted}
              value={pendingNote}
              onChangeText={(text) =>
                text.length <= NOTE_MAX_LENGTH && setPendingNote(text)
              }
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoFocus
              returnKeyType="done"
              blurOnSubmit
            />
            <Text style={styles.charCount}>
              {pendingNote.length}/{NOTE_MAX_LENGTH}
            </Text>

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.skipButton} onPress={confirmAdd}>
                <Text style={styles.skipText}>Skip & Add</Text>
              </TouchableOpacity>
              <View style={styles.sheetAddBtn}>
                <PrimaryButton title="Add to Cart" onPress={confirmAdd} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* ─────────────────────────────────────────────────────────── */}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 90,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    position: 'relative',
  },
  favoriteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    padding: 8,
  },
  emojiWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 36,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  cuisine: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  closedBadge: {
    backgroundColor: colors.danger,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  closedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  metaText: {
    fontSize: 13,
    color: colors.text,
    marginLeft: 4,
  },
  metaIconSpacing: {
    marginLeft: 14,
  },
  address: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  dishEmoji: {
    fontSize: 22,
  },
  dishInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 14.5,
    fontWeight: '600',
    color: colors.text,
  },
  dishPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondary,
    marginTop: 2,
  },
  dishNote: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 3,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  addButtonDisabled: {
    borderColor: colors.border,
  },
  addButtonTextDisabled: {
    color: colors.textMuted,
  },
  // ── modal / sheet ────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  sheetSubtitle: {
    fontSize: 13.5,
    color: colors.textMuted,
    marginBottom: 16,
    lineHeight: 19,
  },
  noteInput: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 88,
    lineHeight: 20,
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 18,
  },
  sheetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  sheetAddBtn: {
    flex: 1,
  },
  // ────────────────────────────────────────────────────────────
});
