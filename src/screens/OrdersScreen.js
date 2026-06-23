import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DELIVERY_PARTNER, ORDER_STAGES } from '../data/mockData';
import { useApp } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../theme/colors';

// The backend only tracks "pending" and "accepted" orders, and only once a
// real rider opens rider-app.html and accepts - there's no "preparing" or
// "delivered" status, and waiting on a real rider is slow to test. So the
// whole timeline below is simulated locally: a random driver is assigned
// the moment the order is placed, and stages auto-advance on a timer. The
// backend still has the real order in its own store (for the dashboard),
// it just isn't what drives this screen anymore.
const STAGE_INTERVAL_MS = 4000;
const RIDER_NAMES = ['Raj Kumar', 'Amit Singh', 'Suresh Patel', 'Vikram Yadav', 'Arjun Mehta'];

export default function OrdersScreen({ navigation }) {
  const { order, resetOrder } = useApp();
  const insets = useSafeAreaInsets();
  const [stageIndex, setStageIndex] = useState(0);
  const [riderName, setRiderName] = useState(null);

  useEffect(() => {
    if (!order) return;
    setStageIndex(0);
    setRiderName(RIDER_NAMES[Math.floor(Math.random() * RIDER_NAMES.length)]);
  }, [order?.id]);

  useEffect(() => {
    if (!order || stageIndex >= ORDER_STAGES.length - 1) return;
    const timer = setTimeout(() => setStageIndex((s) => s + 1), STAGE_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [order?.id, stageIndex]);

  if (!order) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <Ionicons name="receipt-outline" size={64} color={colors.border} />
        <Text style={styles.emptyTitle}>No active orders</Text>
        <Text style={styles.emptySubtitle}>Place an order to see its live status here.</Text>
        <View style={styles.emptyButtonWrap}>
          <PrimaryButton title="Browse Menu" onPress={() => navigation.navigate('Home')} />
        </View>
      </View>
    );
  }

  const isDelivered = stageIndex >= ORDER_STAGES.length - 1;

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.heading}>Order Status</Text>
      <Text style={styles.orderTime}>
        Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>

      <View style={styles.stagesCard}>
        {ORDER_STAGES.map((stage, index) => {
          const isComplete = index <= stageIndex;
          const isCurrent = index === stageIndex;
          return (
            <View key={stage.key} style={styles.stageRow}>
              <View style={styles.stageIconColumn}>
                <View
                  style={[
                    styles.stageIconWrap,
                    isComplete && styles.stageIconWrapComplete,
                    isCurrent && !isDelivered && styles.stageIconWrapCurrent,
                  ]}
                >
                  <Text style={styles.stageIconText}>{stage.icon}</Text>
                </View>
                {index < ORDER_STAGES.length - 1 && (
                  <View style={[styles.stageLine, isComplete && styles.stageLineComplete]} />
                )}
              </View>
              <View style={styles.stageLabelWrap}>
                <Text style={[styles.stageLabel, isComplete && styles.stageLabelComplete]}>
                  {stage.label}
                </Text>
                {isCurrent && !isDelivered && (
                  <Text style={styles.stageHint}>In progress…</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {!isDelivered && (
        <View style={styles.partnerCard}>
          <View style={styles.partnerEmojiWrap}>
            <Text style={styles.partnerEmoji}>{DELIVERY_PARTNER.emoji}</Text>
          </View>
          <View style={styles.partnerInfo}>
            <Text style={styles.partnerName}>{riderName}</Text>
            <Text style={styles.partnerMeta}>{DELIVERY_PARTNER.vehicle}</Text>
            <View style={styles.partnerRatingRow}>
              <Ionicons name="star" size={13} color={colors.warning} />
              <Text style={styles.partnerRating}>{DELIVERY_PARTNER.rating}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => Linking.openURL(`tel:${DELIVERY_PARTNER.phone}`)}
          >
            <Ionicons name="call" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {isDelivered && (
        <View style={styles.doneWrap}>
          <Text style={styles.doneText}>Your order has been delivered. Enjoy! 🎉</Text>
          <PrimaryButton title="Done" onPress={resetOrder} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  orderTime: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  stagesCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
  },
  stageRow: {
    flexDirection: 'row',
  },
  stageIconColumn: {
    alignItems: 'center',
    width: 44,
  },
  stageIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageIconWrapComplete: {
    backgroundColor: '#E8F8EE',
  },
  stageIconWrapCurrent: {
    backgroundColor: '#FFE9DD',
  },
  stageIconText: {
    fontSize: 16,
  },
  stageLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    backgroundColor: colors.border,
  },
  stageLineComplete: {
    backgroundColor: colors.secondary,
  },
  stageLabelWrap: {
    flex: 1,
    paddingBottom: 24,
    paddingTop: 6,
  },
  stageLabel: {
    fontSize: 15,
    color: colors.textMuted,
    fontWeight: '600',
  },
  stageLabelComplete: {
    color: colors.text,
  },
  stageHint: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    gap: 12,
  },
  partnerEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerEmoji: {
    fontSize: 24,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  partnerMeta: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  partnerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  partnerRating: {
    fontSize: 12,
    color: colors.text,
  },
  callButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneWrap: {
    marginTop: 24,
    gap: 16,
  },
  doneText: {
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
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
