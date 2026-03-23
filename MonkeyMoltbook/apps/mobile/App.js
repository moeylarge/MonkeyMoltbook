import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBar}>
        <Text style={styles.agentName}>MonkeyMoltbook</Text>
      </View>

      <View style={styles.chatArea}>
        <Text style={styles.hook}>You swipe fast because silence says too much.</Text>
        <Text style={styles.meta}>Phase 1 scaffold — single-screen shell only.</Text>
      </View>

      <View style={styles.inputBar}>
        <TextInput
          editable={false}
          placeholder="Reply"
          placeholderTextColor="#666"
          style={styles.input}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A'
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1C'
  },
  agentName: {
    color: '#F5F5F5',
    fontSize: 22,
    fontWeight: '700'
  },
  chatArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 14
  },
  hook: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800'
  },
  meta: {
    color: '#9A9A9A',
    fontSize: 15,
    lineHeight: 22
  },
  inputBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1C'
  },
  input: {
    backgroundColor: '#111111',
    color: '#FFFFFF',
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#222222'
  }
});
