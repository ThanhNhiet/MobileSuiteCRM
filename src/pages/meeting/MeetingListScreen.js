import React from "react";
import { StyleSheet, Text, View } from "react-native";
export default function MeetingListScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Meeting List Screen</Text>
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

    