import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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

const STATUS_LABELS = {
  pending: 'Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  'on-the-way': 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

// Driven by the order's real status now (pending/confirmed/preparing/
// on-the-way/delivered), pushed live via the order:updated socket event in
// AppContext.js - whoever is operating the rider app controls these
// transitions for real. The rider app's own flow skips "preparing" (it
// goes straight from accept to "Order Collected" = on-the-way), so that
// status maps to the same stage as "confirmed" here.
const STATUS_TO_STAGE_INDEX = {
  pending: 0,
  confirmed: 1,
  preparing: 1,
  ready: 1,          // food is packed but rider not yet picked up — still stage 1
  'on-the-way': 2,
  delivered: 3,
};
const OUT_FOR_DELIVERY_INDEX = ORDER_STAGES.findIndex((stage) => stage.key === 'out_for_delivery');

export default function OrdersScreen({ navigation }) {
  const { order, resetOrder, orderHistory, fetchOrderHistory } = useApp();
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(Date.now());
  const [rating, setRating] = useState(0);
  const scrollViewRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      fetchOrderHistory();
    }, [fetchOrderHistory])
  );

  useEffect(() => {
    if (!order) return;
    setRating(0);
  }, [order?._id]);

  const stageIndex = order ? STATUS_TO_STAGE_INDEX[order.status] ?? 0 : 0;
  const isDelivered = stageIndex >= ORDER_STAGES.length - 1;

  // Ticks while there's an order in flight, to drive the live ETA
  // countdown and the partner marker's position on the map below.
  useEffect(() => {
    if (!order || isDelivered) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [order?._id, isDelivered]);

  useEffect(() => {
    if (isDelivered) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [isDelivered]);

  if (!order) {
    if (orderHistory.length === 0) {
      return (
        <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
          <Ionicons name="receipt-outline" size={64} color={colors.border} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>Place an order to see its live status here.</Text>
          <View style={styles.emptyButtonWrap}>
            <PrimaryButton title="Browse Menu" onPress={() => navigation.navigate('Home')} />
          </View>
        </View>
      );
    }

    return (
      <FlatList
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
        data={orderHistory}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={<Text style={styles.heading}>Past Orders</Text>}
        renderItem={({ item }) => {
          const itemCount = (item.items || []).reduce((sum, entry) => sum + (entry.quantity || 0), 0);
          return (
            <View style={styles.historyCard}>
              <View style={styles.historyCardTop}>
                <Text style={styles.historyRestaurant}>{item.restaurant?.name || 'Restaurant'}</Text>
                <Text style={styles.historyStatus}>{STATUS_LABELS[item.status] || item.status}</Text>
              </View>
              <Text style={styles.historyMeta}>
                {new Date(item.createdAt).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {' · '}
                {itemCount} item{itemCount === 1 ? '' : 's'}
              </Text>
              <Text style={styles.historyTotal}>₹{item.totalPrice}</Text>
            </View>
          );
        }}
      />
    );
  }

  const showMap = stageIndex >= OUT_FOR_DELIVERY_INDEX;
  const restaurant = getRestaurantById(order.restaurant?._id);

  // ETA banner: counts down from the restaurant's usual top-end estimate
  // (e.g. "30" from "25-30 min") based on real elapsed time since the
  // order was placed - not fully real (no GPS), but a true elapsed-time
  // estimate rather than a fixed demo countdown.
  const etaTotalMinutes = restaurant ? parseDeliveryTime(restaurant.deliveryTime).max : null;
  const totalTripMs = etaTotalMinutes ? etaTotalMinutes * 60 * 1000 : null;
  const tripElapsedMs = now - new Date(order.createdAt).getTime();
  const tripProgress = totalTripMs ? Math.min(Math.max(tripElapsedMs / totalTripMs, 0), 1) : 0;
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
    // order.updatedAt is when the order last changed status - while it's
    // "on-the-way" that's the moment the rider collected it, so this is a
    // real elapsed-time-based estimate of how far along the trip is.
    const onTheWayStartedAt = new Date(order.updatedAt).getTime();
    const assumedTransitMs = totalTripMs || 5 * 60 * 1000;
    const progress = isDelivered
      ? 1
      : Math.min(Math.max((now - onTheWayStartedAt) / assumedTransitMs, 0), 1);
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
            <Text style={styles.partnerName}>Delivery Partner</Text>
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
            <Text style={styles.rateTitle}>Rate your delivery partner</Text>
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
  historyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  historyCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyRestaurant: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  historyStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  historyMeta: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 6,
  },
  historyTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
});
