import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

const DEFAULT_WS_URL = Platform.select({
  ios: 'ws://127.0.0.1:8787',
  android: 'ws://10.0.2.2:8787',
  default: 'ws://127.0.0.1:8787'
});

const DEFAULT_API_URL = Platform.select({
  ios: 'http://127.0.0.1:8787',
  android: 'http://10.0.2.2:8787',
  default: 'http://127.0.0.1:8787'
});

const SWIPE_THRESHOLD = -80;
const PRELOAD_TARGET = 3;

export default function App() {
  const [agentName, setAgentName] = useState('Connecting...');
  const [hook, setHook] = useState('');
  const [status, setStatus] = useState('Opening socket...');
  const [swipeCount, setSwipeCount] = useState(0);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [queueDepth, setQueueDepth] = useState(0);
  const wsUrl = useMemo(() => DEFAULT_WS_URL, []);
  const apiUrl = useMemo(() => DEFAULT_API_URL, []);
  const translateX = useRef(new Animated.Value(0)).current;
  const preloadQueueRef = useRef([]);
  const bootHookAppliedRef = useRef(false);
  const isFetchingPreloadRef = useRef(false);

  const updateQueueDepth = () => {
    setQueueDepth(preloadQueueRef.current.length);
  };

  const applyHookPayload = (payload, sourceLabel = 'live hook') => {
    setAgentName(payload.agentName || 'Unknown Agent');
    setHook(payload.text || 'Missing hook');
    setStatus(`${sourceLabel} • ${payload.source || 'unknown source'}`);
  };

  const resetCardPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 6,
      speed: 18
    }).start();
  };

  const fillPreloadQueue = async (minimum = PRELOAD_TARGET) => {
    if (isFetchingPreloadRef.current) return;
    if (preloadQueueRef.current.length >= minimum) return;

    isFetchingPreloadRef.current = true;

    try {
      const needed = Math.max(minimum - preloadQueueRef.current.length, 1);
      const response = await fetch(`${apiUrl}/preload?count=${needed}`);
      const payload = await response.json();
      const hooks = Array.isArray(payload.hooks) ? payload.hooks : [];
      preloadQueueRef.current = [...preloadQueueRef.current, ...hooks];
      updateQueueDepth();
    } catch (_error) {
      setStatus('Preload failed');
    } finally {
      isFetchingPreloadRef.current = false;
    }
  };

  const primeInitialQueue = async () => {
    await fillPreloadQueue(PRELOAD_TARGET);
  };

  const advanceFromQueue = async () => {
    if (isLoadingNext) return;

    setIsLoadingNext(true);

    try {
      if (preloadQueueRef.current.length === 0) {
        setStatus('Queue empty • refilling');
        await fillPreloadQueue(1);
      }

      const nextPayload = preloadQueueRef.current.shift();
      updateQueueDepth();

      if (nextPayload) {
        applyHookPayload(nextPayload, 'preloaded');
        setSwipeCount((value) => value + 1);
        void fillPreloadQueue(PRELOAD_TARGET);
      } else {
        setStatus('No next hook available');
      }
    } catch (_error) {
      setStatus('Failed to advance');
    } finally {
      setIsLoadingNext(false);
      resetCardPosition();
    }
  };

  const triggerSwipeAdvance = () => {
    if (isLoadingNext) return;

    Animated.timing(translateX, {
      toValue: -160,
      duration: 140,
      useNativeDriver: true
    }).start(() => {
      advanceFromQueue();
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gestureState) => Math.abs(gestureState.dx) > 12,
        onPanResponderMove: (_event, gestureState) => {
          if (gestureState.dx < 0) {
            translateX.setValue(gestureState.dx);
          }
        },
        onPanResponderRelease: (_event, gestureState) => {
          if (gestureState.dx <= SWIPE_THRESHOLD) {
            triggerSwipeAdvance();
            return;
          }

          resetCardPosition();
        },
        onPanResponderTerminate: () => {
          resetCardPosition();
        }
      }),
    [isLoadingNext]
  );

  useEffect(() => {
    const socket = new WebSocket(wsUrl);

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
          if (!bootHookAppliedRef.current) {
            bootHookAppliedRef.current = true;
            applyHookPayload(payload, 'live hook');
            void primeInitialQueue();
            return;
          }

          preloadQueueRef.current = [...preloadQueueRef.current, payload];
          updateQueueDepth();
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
        <View style={styles.statsBlock}>
          <Text style={styles.counter}>Swipes {swipeCount}</Text>
          <Text style={styles.counter}>Queued {queueDepth}</Text>
        </View>
      </View>

      <Animated.View
        style={[styles.chatArea, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.hook}>{hook || 'Waiting for first live hook...'}</Text>
        <Text style={styles.meta}>{status}</Text>
        <Text style={styles.swipeHint}>Swipe left for the next agent</Text>
      </Animated.View>

      <View style={styles.inputBar}>
        <TextInput
          editable={false}
          placeholder="Reply"
          placeholderTextColor="#666"
          style={styles.input}
        />
        <Pressable onPress={triggerSwipeAdvance} style={styles.nextButton}>
          <Text style={styles.nextButtonText}>{isLoadingNext ? 'Loading...' : 'Next'}</Text>
        </Pressable>
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
    borderBottomColor: '#1C1C1C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  agentName: {
    color: '#F5F5F5',
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
    paddingRight: 12
  },
  statsBlock: {
    alignItems: 'flex-end',
    gap: 2
  },
  counter: {
    color: '#7D7D7D',
    fontSize: 13,
    fontWeight: '600'
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
  swipeHint: {
    color: '#6F6F6F',
    fontSize: 13,
    lineHeight: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  inputBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1C',
    gap: 10
  },
  input: {
    backgroundColor: '#111111',
    color: '#FFFFFF',
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#222222'
  },
  nextButton: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  nextButtonText: {
    color: '#F5F5F5',
    fontSize: 15,
    fontWeight: '700'
  }
});
