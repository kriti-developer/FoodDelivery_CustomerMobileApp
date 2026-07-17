import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';
import QuantityStepper from '../components/QuantityStepper';
import { colors } from '../theme/colors';

// "Order Ahead" lets a customer pick an exact time up to 3 hours out,
// instead of only placing the order immediately.
const MIN_SCHEDULE_MS = 15 * 60 * 1000;
const MAX_SCHEDULE_MS = 3 * 60 * 60 * 1000;

function defaultScheduledDate() {
  return new Date(Date.now() + 30 * 60 * 1000);
}

export default function CartScreen({ navigation }) {
  const { user, cartItems, cartCount, cartTotal, setItemQuantity, placeOrder, scheduleOrder } = useApp();
  const insets = useSafeAreaInsets();
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(defaultScheduledDate);
  const [showPicker, setShowPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTimeChange = (event, picked) => {
    setShowPicker(Platform.OS === 'ios');
    if (event.type === 'dismissed' || !picked) return;

    // mode="time" only carries the time-of-day - if that time already
    // passed today, the customer must mean the same time tomorrow.
    const next = new Date();
    next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    if (next.getTime() <= Date.now()) {
      next.setDate(next.getDate() + 1);
    }
    setScheduledDate(next);
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (!isScheduling) {
        const result = await placeOrder();
        if (result.success) {
          navigation.navigate('Orders');
        } else {
          Alert.alert('Could not place order', result.message);
        }
        return;
      }

      const leadMs = scheduledDate.getTime() - Date.now();
      if (leadMs < MIN_SCHEDULE_MS || leadMs > MAX_SCHEDULE_MS) {
        Alert.alert('Pick a valid time', 'Scheduled orders must be between 15 minutes and 3 hours from now.');
        return;
      }

      const result = await scheduleOrder(scheduledDate.getTime());
      if (result.success) {
        const time = scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setIsScheduling(false);
        setScheduledDate(defaultScheduledDate());
        Alert.alert('Order scheduled!', `We'll place your order automatically around ${time}.`);
        navigation.navigate('Orders');
      } else {
        Alert.alert('Could not schedule order', result.message);
      }
    } finally {
      setIsSubmitting(false);
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
            <TouchableOpacity style={styles.timePickerButton} onPress={() => setShowPicker(true)}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={styles.timePickerButtonText}>
                {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
            <Text style={styles.scheduleTimeText}>Must be within 3 hours from now</Text>
          </View>
        )}

        {showPicker && (
          <DateTimePicker
            value={scheduledDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date(Date.now() + MIN_SCHEDULE_MS)}
            maximumDate={new Date(Date.now() + MAX_SCHEDULE_MS)}
            onChange={handleTimeChange}
          />
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
          loading={isSubmitting}
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
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    gap: 10,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  timePickerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  scheduleTimeText: {
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
