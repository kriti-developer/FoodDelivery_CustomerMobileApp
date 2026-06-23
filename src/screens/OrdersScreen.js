import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import {
  DELIVERY_DESTINATION,
  DELIVERY_PARTNER,
  getMenuItemById,
  getRestaurantById,
  ORDER_STAGES,
} from '../data/mockData';
import { ORDER_STAGE_INTERVAL_MS, useApp } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../theme/colors';

const OUT_FOR_DELIVERY_INDEX = ORDER_STAGES.findIndex((stage) => stage.key === 'out_for_delivery');

export default function OrdersScreen({ navigation }) {
  const { order, resetOrder } = useApp();
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(Date.now());
  const isTrackingActive = order?.stageIndex === OUT_FOR_DELIVERY_INDEX;

  useEffect(() => {
    if (!isTrackingActive) return;
    const interval = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(interval);
  }, [isTrackingActive, order?.stageChangedAt]);

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

  const { stageIndex } = order;
  const isDelivered = stageIndex >= ORDER_STAGES.length - 1;
  const showMap = stageIndex >= OUT_FOR_DELIVERY_INDEX;
  const restaurant = getRestaurantById(order.restaurantId);

  let mapRegion = null;
  let partnerCoordinate = null;
  if (showMap && restaurant) {
    const start = restaurant.location;
    const end = DELIVERY_DESTINATION;
    const progress = isDelivered
      ? 1
      : Math.min(Math.max((now - new Date(order.stageChangedAt).getTime()) / ORDER_STAGE_INTERVAL_MS, 0), 1);
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
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.heading}>Order Status</Text>
      <Text style={styles.orderTime}>
        Placed at {new Date(order.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>

      <View style={styles.itemsCard}>
        {order.items.map(({ itemId, quantity }) => {
          const item = getMenuItemById(itemId);
          if (!item) return null;
          return (
            <View key={itemId} style={styles.itemRow}>
              <Text style={styles.itemEmoji}>{item.emoji}</Text>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQty}>x{quantity}</Text>
            </View>
          );
        })}
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
            <Text style={styles.partnerName}>{DELIVERY_PARTNER.name}</Text>
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
  itemsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  itemEmoji: {
    fontSize: 18,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  itemQty: {
    fontSize: 13,
    color: colors.textMuted,
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
