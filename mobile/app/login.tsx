import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Logo } from "@/components/ui/Logo";
import Theme from "@/constants/Theme";
import { Fonts } from "@/constants/Fonts";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithPassword } = useAuth();
  const [email, setEmail] = useState("demo@feedbacker.local");
  const [password, setPassword] = useState("demo123456");
  const [pending, setPending] = useState(false);

  const leaveLogin = () => {
    if (router.canDismiss?.()) {
      router.dismiss();
      return;
    }
    router.replace("/(tabs)");
  };

  const handleLogin = async () => {
    setPending(true);
    const error = await signInWithPassword(email.trim(), password);
    setPending(false);

    if (error) {
      Alert.alert("Login failed", error);
      return;
    }
    leaveLogin();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <View style={styles.logoWrap}>
          <Logo variant="full" size="lg" />
        </View>
        <Text style={styles.subtitle}>Log in to vote and track your stats</Text>

        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor={Theme.textFaint}
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          secureTextEntry
          placeholder="Password"
          placeholderTextColor={Theme.textFaint}
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <Pressable style={styles.btn} onPress={handleLogin} disabled={pending}>
          <Text style={styles.btnText}>{pending ? "Signing in…" : "Sign in"}</Text>
        </Pressable>

        <Text style={styles.hint}>
          Local demo: demo@feedbacker.local / demo123456{"\n"}
          Run seed if login fails{"\n"}
          If login hangs: fix EXPO_PUBLIC_SUPABASE_URL in mobile/.env (Mac IP, not ngrok)
        </Text>

        <Pressable onPress={leaveLogin}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.line,
    padding: 24,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    color: Theme.textMuted,
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    fontFamily: Fonts.regular,
    borderWidth: 1,
    borderColor: Theme.line,
    borderRadius: Theme.radiusBtn,
    padding: 14,
    color: Theme.text,
    marginBottom: 12,
    backgroundColor: Theme.background,
  },
  btn: {
    backgroundColor: Theme.brand,
    borderRadius: Theme.radiusBtn,
    padding: 14,
    alignItems: "center",
    marginTop: 4,
    shadowColor: Theme.brandGlow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  btnText: {
    fontFamily: Fonts.bold,
    color: "#fff",
  },
  hint: {
    fontFamily: Fonts.regular,
    color: Theme.textFaint,
    fontSize: 11,
    marginTop: 16,
    textAlign: "center",
    lineHeight: 16,
  },
  cancel: {
    fontFamily: Fonts.semibold,
    color: Theme.textMuted,
    textAlign: "center",
    marginTop: 16,
  },
});
