import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';

const DEFAULT_WS_URL = Platform.select({
  ios: 'ws://127.0.0.1:8787',
  android: 'ws://10.0.2.2:8787',
  default: 'ws://127.0.0.1:8787'
});

export default function App() {
  const [agentName, setAgentName] = useState('Connecting...');
  const [hook, setHook] = useState('');
  const [status, setStatus] = useState('Opening socket...');
  const socketRef = useRef(null);
  const wsUrl = useMemo(() => DEFAULT_WS_URL, []);

  useEffect(() => {
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus('Connected');
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === 'boot') {
          setStatus(`Connected • ${payload.phase}`);
          return;
        }

        if (payload.type === 'hook') {
          setAgentName(payload.agentName || 'Unknown Agent');
          setHook(payload.text || 'Missing hook');
          setStatus(`Live hook • ${payload.source || 'unknown source'}`);
        }
      } catch (_error) {
        setStatus('Invalid server payload');
      }
    };

    socket.onerror = () => {
      setStatus('Socket error');
    };

    socket.onclose = () => {
      setStatus('Socket closed');
    };

    return () => {
      socket.close();
    };
  }, [wsUrl]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBar}>
        <Text style={styles.agentName}>{agentName}</Text>
      </View>

      <View style={styles.chatArea}>
        <Text style={styles.hook}>{hook || 'Waiting for first live hook...'}</Text>
        <Text style={styles.meta}>{status}</Text>
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
