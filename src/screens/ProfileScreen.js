import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../theme/colors';

const FIELDS = [
  { key: 'email', label: 'Email', icon: 'mail-outline' },
  { key: 'phone', label: 'Phone', icon: 'call-outline' },
  { key: 'address', label: 'Delivery Address', icon: 'location-outline' },
];

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useApp();
  const insets = useSafeAreaInsets();
  const initial = (user?.name || '?').trim().charAt(0).toUpperCase();

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 24 }]}>
      <View style={styles.avatarWrap}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <Text style={styles.name}>{user?.name}</Text>

      <View style={styles.card}>
        {FIELDS.map((field, index) => (
          <View
            key={field.key}
            style={[styles.fieldRow, index === FIELDS.length - 1 && styles.fieldRowLast]}
          >
            <Ionicons name={field.icon} size={18} color={colors.primary} style={styles.fieldIcon} />
            <View style={styles.fieldTextWrap}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <Text style={styles.fieldValue}>{user?.[field.key] || '—'}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actionsWrap}>
        <PrimaryButton title="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
        <View style={styles.actionSpacer} />
        <PrimaryButton title="Log Out" onPress={logout} variant="outline" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    backgroundColor: colors.background,
    alignItems: 'center',
    flexGrow: 1,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  name: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 28,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fieldRowLast: {
    borderBottomWidth: 0,
  },
  fieldIcon: {
    marginTop: 2,
  },
  fieldTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  fieldValue: {
    fontSize: 14.5,
    color: colors.text,
    fontWeight: '600',
    marginTop: 2,
  },
  actionsWrap: {
    width: '100%',
    marginTop: 28,
  },
  actionSpacer: {
    height: 12,
  },
});
