import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';

export default function EditProfileScreen({ navigation }) {
  const { user, updateProfile } = useApp();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim()) {
      Alert.alert('Missing details', 'Please fill in every field to continue.');
      return;
    }
    setSaving(true);
    await updateProfile({ name: name.trim(), email: email.trim(), phone: phone.trim(), address: address.trim() });
    setSaving(false);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

          <Text style={styles.label}>Delivery Address</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={address}
            onChangeText={setAddress}
            multiline
          />

          <View style={styles.spacer} />
          <PrimaryButton title="Save Changes" onPress={handleSave} loading={saving} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    padding: 24,
  },
  form: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
  },
  multiline: {
    height: 60,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  spacer: {
    height: 8,
  },
});
