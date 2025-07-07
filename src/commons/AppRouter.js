import { Text, View } from "react-native";

export default function AppRouter() {
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <View style={{ width: 100, height: 100, backgroundColor: "blue" }} />
            <Text style={{ color: "black", fontSize: 20, marginTop: 20 }}>
                Welcome to the CRM App
            </Text>
        </View>
    );
}