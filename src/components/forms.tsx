import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/constants/brand";

/** Shared form + button primitives matching the new UI mockups. */

export function PrimaryButton({
  title,
  onPress,
  disabled,
  busy,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  const inactive = disabled || busy;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inactive}
      activeOpacity={0.9}
      className="rounded-xl py-4 items-center justify-center"
      style={{ backgroundColor: inactive ? "#ffb59f" : COLORS.primary }}
    >
      {busy ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className="text-white text-sm font-grotesk-bold">{title}</Text>
      )}
    </TouchableOpacity>
  );
}

export function AuthPrimaryButton(props: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  const inactive = props.disabled || props.busy;
  return (
    <TouchableOpacity
      onPress={props.onPress}
      disabled={inactive}
      activeOpacity={0.9}
      className="rounded-full py-4 items-center justify-center"
      style={{ backgroundColor: inactive ? "#ffb59f" : COLORS.primary }}
    >
      {props.busy ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className="text-white text-sm font-grotesk-bold">{props.title}</Text>
      )}
    </TouchableOpacity>
  );
}

export function OutlineButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      className="rounded-xl py-4 items-center justify-center bg-white border border-gray-300"
    >
      <Text className="text-gray-900 text-sm font-grotesk-bold">{title}</Text>
    </TouchableOpacity>
  );
}

export function GoogleButton({
  onPress,
  disabled,
  busy,
}: {
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || busy}
      activeOpacity={0.85}
      className="rounded-full py-4 items-center justify-center bg-white border border-gray-200 flex-row gap-2"
    >
      {busy ? (
        <ActivityIndicator color="#111" />
      ) : (
        <>
          <GoogleG />
          <Text className="text-gray-950 text-sm font-grotesk-bold">Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function GoogleG() {
  return (
    <View className="flex-row items-center">
      <Text style={{ color: "#4285F4", fontWeight: "900", fontSize: 16 }}>G</Text>
    </View>
  );
}

export function OrDivider() {
  return (
    <View className="flex-row items-center gap-4">
      <View className="h-px bg-gray-200 flex-1" />
      <Text className="text-xs text-gray-500 font-grotesk-medium">Or</Text>
      <View className="h-px bg-gray-200 flex-1" />
    </View>
  );
}

/** Bordered labeled input (checkout mockup style). */
export function LabeledInput(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  hint?: string;
  keyboardType?: "default" | "numeric" | "number-pad" | "email-address" | "phone-pad";
  multiline?: boolean;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-xs font-grotesk-bold text-gray-900">{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor="#bdbdbd"
        keyboardType={props.keyboardType ?? "default"}
        multiline={props.multiline}
        secureTextEntry={props.secureTextEntry}
        autoCapitalize={props.autoCapitalize ?? "sentences"}
        className="bg-white border rounded-lg px-4 py-3.5 font-grotesk text-sm text-gray-900"
        style={[
          { borderColor: COLORS.inputBorder },
          props.multiline ? { minHeight: 80, textAlignVertical: "top" } : {},
        ]}
      />
      {!!props.hint && <Text className="font-manrope text-[11px] text-gray-400">{props.hint}</Text>}
    </View>
  );
}

/** Filled gray auth input (auth mockup style). */
export function AuthInput(props: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "number-pad" | "email-address" | "phone-pad";
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  rightSlot?: React.ReactNode;
}) {
  return (
    <View
      className="flex-row items-center px-4 rounded-lg"
      style={{ backgroundColor: COLORS.inputBg, minHeight: 52 }}
    >
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor="#bdbdbd"
        keyboardType={props.keyboardType ?? "default"}
        secureTextEntry={props.secureTextEntry}
        autoCapitalize={props.autoCapitalize ?? "none"}
        className="flex-1 font-grotesk text-sm text-gray-950 py-3.5"
      />
      {props.rightSlot}
    </View>
  );
}
