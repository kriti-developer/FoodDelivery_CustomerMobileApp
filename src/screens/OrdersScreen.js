import React, { useEffect, useRef, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import {
  DELIVERY_DESTINATION,
  DELIVERY_PARTNER,
  getRestaurantById,
  ORDER_STAGES,
  parseDeliveryTime,
} from '../data/mockData';
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
const OUT_FOR_DELIVERY_INDEX = ORDER_STAGES.findIndex((stage) => stage.key === 'out_for_delivery');
const TOTAL_TRIP_MS = (ORDER_STAGES.length - 1) * STAGE_INTERVAL_MS;

export default function OrdersScreen({ navigation }) {
  const { order, resetOrder } = useApp();
  const insets = useSafeAreaInsets();
  const [stageIndex, setStageIndex] = useState(0);
  const [riderName, setRiderName] = useState(null);
  const [stageChangedAt, setStageChangedAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [rating, setRating] = useState(0);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (!order) return;
    setStageIndex(0);
    setStageChangedAt(Date.now());
    setRiderName(RIDER_NAMES[Math.floor(Math.random() * RIDER_NAMES.length)]);
    setRating(0);
  }, [order?.id]);

  useEffect(() => {
    if (!order || stageIndex >= ORDER_STAGES.length - 1) return;
    const timer = setTimeout(() => {
      setStageIndex((s) => s + 1);
      setStageChangedAt(Date.now());
    }, STAGE_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [order?.id, stageIndex]);

  const isDelivered = stageIndex >= ORDER_STAGES.length - 1;
  useEffect(() => {
    if (!order || isDelivered) return;
    const interval = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(interval);
  }, [order?.id, isDelivered]);

  useEffect(() => {
    if (isDelivered) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [isDelivered]);

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

  const showMap = stageIndex >= OUT_FOR_DELIVERY_INDEX;
  const restaurant = getRestaurantById(order.restaurantId);

  // ETA banner: starts at the restaurant's usual top-end estimate (e.g. "30"
  // from "25-30 min") and counts down to 0 as the simulated trip progresses,
  // so it reaches zero right as the order is marked delivered.
  const etaTotalMinutes = restaurant ? parseDeliveryTime(restaurant.deliveryTime).max : null;
  const tripElapsedMs = now - new Date(order.createdAt).getTime();
  const tripProgress = Math.min(Math.max(tripElapsedMs / TOTAL_TRIP_MS, 0), 1);
  const minutesRemaining = isDelivered
    ? 0
    : etaTotalMinutes
    ? Math.max(1, Math.ceil(etaTotalMinutes * (1 - tripProgress)))
    : null;

  let mapRegion = null;
  let partnerCoordinate = null;
  if (showMap && restaurant) {
    const start = restaurant.location;
    const end = DELIVERY_DESTINATION;
    const progress = isDelivered
      ? 1
      : Math.min(Math.max((now - stageChangedAt) / STAGE_INTERVAL_MS, 0), 1);
    partnerCoordinate = {
      latitude: start.latitude + (end.latitude - start.latitude) * progress,
      longitude: start.longitude + (end.longitude - start.longitude) * progress,
    };
    mapRegion = {
      latitude: (start.latitude + end.latitude) / 2,
      longitude: (start.longitude + end.longitude) / 2,
      latitudeDelta: Math.abs(start.latitude - end.latitude) * 2.5 + 0.02,
      longitudeDelta: Math.abs(start.longitude - end.longitude) * 2.5 + 0.02,
    };
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
    >
      <Text style={styles.heading}>Order Status</Text>
      <Text style={styles.orderTime}>
        Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>

      <View style={styles.etaBanner}>
        <Ionicons name="time-outline" size={20} color={colors.primary} />
        <Text style={styles.etaText}>
          {isDelivered
            ? 'Delivered!'
            : minutesRemaining
            ? `Arriving in ${minutesRemaining} min`
            : 'Calculating arrival time…'}
        </Text>
      </View>

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

      {showMap && restaurant && (
        <View style={styles.mapWrap}>
          <MapView style={styles.map} initialRegion={mapRegion}>
            <Marker coordinate={restaurant.location}>
              <View style={styles.pinWrap}>
                <Text style={styles.pinEmoji}>{restaurant.emoji}</Text>
              </View>
            </Marker>
            <Marker coordinate={DELIVERY_DESTINATION}>
              <View style={styles.pinWrap}>
                <Text style={styles.pinEmoji}>🏠</Text>
              </View>
            </Marker>
            <Marker coordinate={partnerCoordinate}>
              <Text style={styles.partnerMapEmoji}>{DELIVERY_PARTNER.emoji}</Text>
            </Marker>
            <Polyline
              coordinates={[restaurant.location, DELIVERY_DESTINATION]}
              strokeColor={colors.primary}
              strokeWidth={3}
              lineDashPattern={[8, 6]}
            />
          </MapView>
        </View>
      )}

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

          <View style={styles.rateCard}>
            <Text style={styles.rateTitle}>Rate {riderName}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color={colors.warning}
                    style={styles.starIcon}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <PrimaryButton
            title={rating > 0 ? 'Submit Rating' : 'Done'}
            onPress={resetOrder}
          />
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
  etaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE9DD',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  etaText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
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
  mapWrap: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
  },
  map: {
    flex: 1,
  },
  pinWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pinEmoji: {
    fontSize: 17,
  },
  partnerMapEmoji: {
    fontSize: 26,
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
  rateCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  rateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
  },
  starIcon: {
    marginHorizontal: 4,
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
