import { useEffect, useRef } from 'react';
import { getSupabaseBrowserClient, supabaseBrowserEnabled } from './supabase-browser';

export function useMoltmailRealtime({ enabled, userId, selectedThreadId, onThreadEvent, onMessageEvent, onPresenceSync }) {
  const cleanupRef = useRef([]);

  useEffect(() => {
    cleanupRef.current.forEach((fn) => {
      try { fn(); } catch {}
    });
    cleanupRef.current = [];

    if (!enabled || !userId || !supabaseBrowserEnabled()) return undefined;
    const client = getSupabaseBrowserClient();
    if (!client) return undefined;

    const channels = [];

    const participantChannel = client
      .channel(`moltmail-participants-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mail_participants',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        onThreadEvent?.({ kind: 'participant', payload });
      })
      .subscribe();
    channels.push(participantChannel);

    const threadChannel = client
      .channel(`moltmail-threads-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mail_threads'
      }, (payload) => {
        onThreadEvent?.({ kind: 'thread', payload });
      })
      .subscribe();
    channels.push(threadChannel);

    if (selectedThreadId) {
      const threadMessageChannel = client
        .channel(`moltmail-messages-${selectedThreadId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'mail_messages',
          filter: `thread_id=eq.${selectedThreadId}`
        }, (payload) => {
          onMessageEvent?.({ kind: 'message', payload });
        })
        .subscribe();
      channels.push(threadMessageChannel);

      const presenceChannel = client.channel(`moltmail-presence-${selectedThreadId}`, {
        config: { presence: { key: userId } }
      });
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          onPresenceSync?.(state);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({ userId, threadId: selectedThreadId, onlineAt: new Date().toISOString() });
          }
        });
      channels.push(presenceChannel);
    }

    cleanupRef.current = channels.map((channel) => () => {
      try { client.removeChannel(channel); } catch {}
    });

    return () => {
      cleanupRef.current.forEach((fn) => {
        try { fn(); } catch {}
      });
      cleanupRef.current = [];
    };
  }, [enabled, userId, selectedThreadId, onThreadEvent, onMessageEvent, onPresenceSync]);
}
