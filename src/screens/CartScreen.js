import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';
import QuantityStepper from '../components/QuantityStepper';
import { colors } from '../theme/colors';

// "Order Ahead" lets a customer pick any time up to 3 hours out, in
// 15-minute steps, instead of only placing the order immediately.
const SCHEDULE_STEP_MINUTES = 15;
const MIN_SCHEDULE_MINUTES = 15;
const MAX_SCHEDULE_MINUTES = 180;

function formatDuration(minutes) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
}

export default function CartScreen({ navigation }) {
  const { user, cartItems, cartCount, cartTotal, setItemQuantity, placeOrder, scheduleOrder } = useApp();
  const insets = useSafeAreaInsets();
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleMinutes, setScheduleMinutes] = useState(30);

  const scheduledClockTime = new Date(Date.now() + scheduleMinutes * 60 * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePlaceOrder = async () => {
    if (!isScheduling) {
      const result = await placeOrder();
      if (result.success) {
        navigation.navigate('Orders');
      } else {
        Alert.alert('Could not place order', result.message);
      }
      return;
    }

    const scheduledFor = Date.now() + scheduleMinutes * 60 * 1000;
    const result = await scheduleOrder(scheduledFor);
    if (result.success) {
      const time = new Date(scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setIsScheduling(false);
      Alert.alert('Order scheduled!', `We'll place your order automatically around ${time}.`);
      navigation.navigate('Orders');
    } else {
      Alert.alert('Could not schedule order', result.message);
    }
  };

  if (cartCount === 0) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <Ionicons name="cart-outline" size={64} color={colors.border} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Browse the menu and add something tasty.</Text>
        <View style={styles.emptyButtonWrap}>
          <PrimaryButton title="Browse Menu" onPress={() => navigation.navigate('Home')} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.heading}>Your Cart</Text>

        {cartItems.map(({ item, quantity, note }) => (
          <View key={item.id} style={styles.cartRow}>
            <View style={styles.itemEmojiWrap}>
              <Text style={styles.itemEmoji}>{item.emoji}</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{item.price === 0 ? 'FREE' : `₹${item.price}`}</Text>
              {/* Customisation note – shown only when present */}
              {note ? (
                <View style={styles.noteRow}>
                  <Ionicons name="create-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.noteText} numberOfLines={2}>{note}</Text>
                </View>
              ) : null}
            </View>
            <QuantityStepper
              quantity={quantity}
              size="small"
              onIncrease={() => setItemQuantity(item.id, quantity + 1)}
              onDecrease={() => setItemQuantity(item.id, quantity - 1)}
            />
          </View>
        ))}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>When would you like this?</Text>
        <View style={styles.scheduleRow}>
          <TouchableOpacity
            style={[styles.scheduleChip, !isScheduling && styles.scheduleChipActive]}
            onPress={() => setIsScheduling(false)}
          >
            <Text style={[styles.scheduleChipText, !isScheduling && styles.scheduleChipTextActive]}>Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.scheduleChip, isScheduling && styles.scheduleChipActive]}
            onPress={() => setIsScheduling(true)}
          >
            <Text style={[styles.scheduleChipText, isScheduling && styles.scheduleChipTextActive]}>
              Schedule for later
            </Text>
          </TouchableOpacity>
        </View>

        {isScheduling && (
          <View style={styles.scheduleStepperCard}>
            <QuantityStepper
              quantity={formatDuration(scheduleMinutes)}
              onDecrease={() =>
                setScheduleMinutes((m) => Math.max(MIN_SCHEDULE_MINUTES, m - SCHEDULE_STEP_MINUTES))
              }
              onIncrease={() =>
                setScheduleMinutes((m) => Math.min(MAX_SCHEDULE_MINUTES, m + SCHEDULE_STEP_MINUTES))
              }
            />
            <Text style={styles.scheduleTimeText}>
              We'll place your order around {scheduledClockTime}
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <Text style={styles.address}>{user?.address || 'No address on file'}</Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Items ({cartCount})</Text>
          <Text style={styles.summaryValue}>{cartTotal === 0 ? 'FREE' : `₹${cartTotal}`}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>
          <Text style={styles.summaryValue}>FREE</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{cartTotal === 0 ? 'FREE' : `₹${cartTotal}`}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title={isScheduling ? 'Schedule Order' : 'Place Order'}
          onPress={handlePlaceOrder}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  itemEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: {
    fontSize: 24,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  itemPrice: {
    fontSize: 13,
    color: colors.secondary,
    fontWeight: '600',
    marginTop: 2,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 5,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  scheduleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scheduleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  scheduleChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  scheduleChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.text,
  },
  scheduleChipTextActive: {
    color: '#fff',
  },
  scheduleStepperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    gap: 12,
  },
  scheduleTimeText: {
    flex: 1,
    fontSize: 12.5,
    color: colors.textMuted,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
  emptyButtonWrap: {
    marginTop: 24,
    width: '100%',
  },
});
