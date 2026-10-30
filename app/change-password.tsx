// Forced password change shown after logging in with a default password (phone number)
import { useColorScheme } from '@/components/useColorScheme';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Colors from '../constants/Colors';
import { apiClient } from '../lib/api';
import { auth } from '../lib/auth';
import { useAuthStore } from '../lib/store';

export default function ChangePasswordScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'dark'];
    const { user, updateUser, logout } = useAuthStore();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!currentPassword || !newPassword) {
            Alert.alert('Missing Details', 'Enter your current password and a new password.');
            return;
        }
        if (newPassword.length < 8) {
            Alert.alert('Weak Password', 'New password must be at least 8 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Mismatch', 'New passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            await apiClient.post('/api/settings/password', { currentPassword, newPassword });
            // Persist the cleared flag so the app doesn't route back here on next launch
            if (user) {
                await auth.setUser({ ...user, mustChangePassword: false });
            }
            updateUser({ mustChangePassword: false });
            Alert.alert('Password Updated', 'Your new password is set. Use it next time you log in.');
        } catch (error: any) {
            Alert.alert('Update Failed', error.response?.data?.error || 'Unable to change password right now.');
        } finally {
            setIsLoading(false);
        }
    };

    const fields: { label: string; value: string; onChange: (v: string) => void; placeholder: string }[] = [
        { label: 'Current Password (Phone Number)', value: currentPassword, onChange: setCurrentPassword, placeholder: 'Your phone number' },
        { label: 'New Password', value: newPassword, onChange: setNewPassword, placeholder: 'At least 8 characters' },
        { label: 'Confirm New Password', value: confirmPassword, onChange: setConfirmPassword, placeholder: 'Re-enter new password' },
    ];

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={[styles.title, { color: theme.text }]}>Set Your Password</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    You logged in with your default password. Choose a new password to continue.
                </Text>

                <View style={[styles.form, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    {fields.map((field) => (
                        <View key={field.label} style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>{field.label}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                                placeholder={field.placeholder}
                                placeholderTextColor={theme.textSecondary + '80'}
                                value={field.value}
                                onChangeText={field.onChange}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!isLoading}
                            />
                        </View>
                    ))}

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.primary }, isLoading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Password</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.signOut} onPress={logout} disabled={isLoading}>
                        <Text style={[styles.signOutText, { color: theme.textSecondary }]}>Sign out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingVertical: 48 },
    title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 8 },
    subtitle: { fontSize: 14, fontWeight: '500', marginBottom: 24, lineHeight: 20 },
    form: { borderRadius: 24, borderWidth: 1, padding: 20 },
    inputContainer: { marginBottom: 16 },
    label: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
    button: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    signOut: { alignItems: 'center', marginTop: 16, paddingVertical: 8 },
    signOutText: { fontSize: 14, fontWeight: '600' },
});
