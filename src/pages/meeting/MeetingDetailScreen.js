import React from "react";
import { StyleSheet, Text, View } from "react-native";
export default function MeetingDetailScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Meeting Detail Screen</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    text: {
        fontSize: 20,
        color: "#333",
    },
});
