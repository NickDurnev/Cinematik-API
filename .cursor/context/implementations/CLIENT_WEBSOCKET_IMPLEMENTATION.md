# Client-Side WebSocket Implementation Guide for Pairs Real-Time Notifications

This document provides a comprehensive guide for implementing WebSocket-based real-time notifications in the client application for the Pairs feature.

## Table of Contents

1. [Dependencies](#dependencies)
2. [WebSocket Client Setup](#websocket-client-setup)
3. [Type Definitions](#type-definitions)
4. [WebSocket Service](#websocket-service)
5. [React Hooks](#react-hooks)
6. [Usage Examples](#usage-examples)
7. [Best Practices](#best-practices)
8. [Testing](#testing)

---

## 1. Dependencies

Install the required Socket.IO client library:

```bash
npm install socket.io-client
# or
yarn add socket.io-client
```

---

## 2. WebSocket Client Setup

### Base Configuration

```typescript
// lib/websocket/config.ts
export const WEBSOCKET_CONFIG = {
  url: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080',
  namespace: '/pairs',
  options: {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling'],
  },
};
```

---

## 3. Type Definitions

```typescript
// types/websocket.ts
export interface WebSocketEvent<T = any> {
  type: string;
  data: T;
  timestamp: string;
}

// Pair Request Events
export interface PairRequestEvent {
  id: string;
  requester_id: string;
  requested_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  expires_at: string;
  created_at: string;
  requester: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
}

export interface PairRequestResponseEvent {
  request: {
    id: string;
    status: 'accepted' | 'rejected';
  };
  pair?: {
    id: string;
    user1_id: string;
    user2_id: string;
    created_at: string;
  };
  accepted: boolean;
}

// Session Events
export interface SessionEvent {
  id: string;
  pair_id: string;
  created_by_user_id: string;
  media_type: 'movie' | 'tv';
  status: 'filter_pending' | 'active' | 'completed';
  filters_proposed_at?: string;
  filters_accepted_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FiltersProposedEvent {
  session: SessionEvent;
}

export interface FiltersAcceptedEvent {
  session: SessionEvent;
}

// Swipe Events
export interface PartnerSwipedEvent {
  tmdbId: number;
  direction: 'left' | 'right';
  userId: string;
}

export interface MatchFoundEvent {
  id: string;
  pair_id: string;
  session_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  overview: string;
  matched_at: string;
  marked_watched: boolean;
}

// Match Events
export interface MatchWatchedUpdateEvent {
  matchId: string;
  markedWatched: boolean;
}

// Presence Events
export interface UserOnlineEvent {
  userId: string;
}

export interface PairUserOnlineEvent {
  userId: string;
  pairId: string;
}

export interface PartnerTypingEvent {
  userId: string;
  isTyping: boolean;
}
```

---

## 4. WebSocket Service

```typescript
// services/websocket.service.ts
import { io, Socket } from 'socket.io-client';
import { WEBSOCKET_CONFIG } from '@/lib/websocket/config';
import type {
  PairRequestEvent,
  PairRequestResponseEvent,
  SessionEvent,
  FiltersProposedEvent,
  FiltersAcceptedEvent,
  PartnerSwipedEvent,
  MatchFoundEvent,
  MatchWatchedUpdateEvent,
  UserOnlineEvent,
  PairUserOnlineEvent,
  WebSocketEvent,
} from '@/types/websocket';

type EventCallback<T = any> = (data: WebSocketEvent<T>) => void;

export class PairsWebSocketService {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Set<EventCallback>> = new Map();
  private isInitialized = false;

  constructor() {
    // Prevent multiple initializations
    if (typeof window === 'undefined') return;
  }

  /**
   * Initialize and connect to WebSocket server
   * @param token JWT access token
   */
  connect(token: string): void {
    if (this.isInitialized) {
      console.warn('WebSocket already initialized');
      return;
    }

    const url = `${WEBSOCKET_CONFIG.url}${WEBSOCKET_CONFIG.namespace}`;
    
    this.socket = io(url, {
      ...WEBSOCKET_CONFIG.options,
      auth: { token },
      query: { token },
    });

    this.setupEventListeners();
    this.socket.connect();
    this.isInitialized = true;

    console.log('WebSocket connecting to:', url);
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isInitialized = false;
      this.eventHandlers.clear();
      console.log('WebSocket disconnected');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Setup default event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Custom application events
    this.setupApplicationEvents();
  }

  /**
   * Setup application-specific event listeners
   */
  private setupApplicationEvents(): void {
    if (!this.socket) return;

    const events = [
      'pair-request',
      'pair-request-response',
      'session-created',
      'filters-proposed',
      'filters-accepted',
      'session-ended',
      'partner-swiped',
      'match-found',
      'match-watched-updated',
      'user-online',
      'user-offline',
      'pair-user-online',
      'pair-user-offline',
      'partner-typing',
      'online-users',
    ];

    events.forEach((event) => {
      this.socket?.on(event, (data) => {
        console.log(`Received ${event}:`, data);
        this.notifyHandlers(event, data);
      });
    });
  }

  /**
   * Subscribe to an event
   * @param event Event name
   * @param callback Callback function
   * @returns Unsubscribe function
   */
  on<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    this.eventHandlers.get(event)?.add(callback);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(event)?.delete(callback);
    };
  }

  /**
   * Emit an event to the server
   * @param event Event name
   * @param data Event data
   */
  emit(event: string, data?: any): void {
    if (!this.socket?.connected) {
      console.warn('Cannot emit event: WebSocket not connected');
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Notify all handlers for an event
   */
  private notifyHandlers(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  // ============ Pair-specific methods ============

  /**
   * Join a pair room to receive real-time updates
   */
  joinPair(pairId: string): void {
    this.emit('join-pair', pairId);
  }

  /**
   * Leave a pair room
   */
  leavePair(pairId: string): void {
    this.emit('leave-pair', pairId);
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(pairId: string, isTyping: boolean): void {
    this.emit('typing', { pairId, isTyping });
  }

  // ============ Event subscriptions ============

  onPairRequest(callback: EventCallback<PairRequestEvent>): () => void {
    return this.on('pair-request', callback);
  }

  onPairRequestResponse(callback: EventCallback<PairRequestResponseEvent>): () => void {
    return this.on('pair-request-response', callback);
  }

  onSessionCreated(callback: EventCallback<SessionEvent>): () => void {
    return this.on('session-created', callback);
  }

  onFiltersProposed(callback: EventCallback<FiltersProposedEvent>): () => void {
    return this.on('filters-proposed', callback);
  }

  onFiltersAccepted(callback: EventCallback<FiltersAcceptedEvent>): () => void {
    return this.on('filters-accepted', callback);
  }

  onSessionEnded(callback: EventCallback<SessionEvent>): () => void {
    return this.on('session-ended', callback);
  }

  onPartnerSwiped(callback: EventCallback<PartnerSwipedEvent>): () => void {
    return this.on('partner-swiped', callback);
  }

  onMatchFound(callback: EventCallback<MatchFoundEvent>): () => void {
    return this.on('match-found', callback);
  }

  onMatchWatchedUpdated(callback: EventCallback<MatchWatchedUpdateEvent>): () => void {
    return this.on('match-watched-updated', callback);
  }

  onUserOnline(callback: EventCallback<UserOnlineEvent>): () => void {
    return this.on('user-online', callback);
  }

  onUserOffline(callback: EventCallback<UserOnlineEvent>): () => void {
    return this.on('user-offline', callback);
  }

  onPairUserOnline(callback: EventCallback<PairUserOnlineEvent>): () => void {
    return this.on('pair-user-online', callback);
  }

  onPairUserOffline(callback: EventCallback<PairUserOnlineEvent>): () => void {
    return this.on('pair-user-offline', callback);
  }

  onPartnerTyping(callback: EventCallback<{ userId: string; isTyping: boolean }>): () => void {
    return this.on('partner-typing', callback);
  }

  onOnlineUsers(callback: (userIds: string[]) => void): () => void {
    return this.on('online-users', callback);
  }
}

// Singleton instance
let websocketInstance: PairsWebSocketService | null = null;

export function getWebSocketService(): PairsWebSocketService {
  if (!websocketInstance) {
    websocketInstance = new PairsWebSocketService();
  }
  return websocketInstance;
}

export default getWebSocketService;
```

---

## 5. React Hooks

### useWebSocket Hook

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth'; // Your auth hook
import { getWebSocketService } from '@/services/websocket.service';

export function useWebSocket() {
  const { token, isAuthenticated } = useAuth();
  const wsService = useRef(getWebSocketService());

  useEffect(() => {
    if (isAuthenticated && token && !wsService.current.isConnected()) {
      wsService.current.connect(token);
    }

    return () => {
      // Cleanup on unmount (optional - you might want to keep connection alive)
      // wsService.current.disconnect();
    };
  }, [isAuthenticated, token]);

  return wsService.current;
}
```

### usePairEvents Hook

```typescript
// hooks/usePairEvents.ts
import { useEffect, useState } from 'react';
import { useWebSocket } from './useWebSocket';
import type { MatchFoundEvent, PartnerSwipedEvent } from '@/types/websocket';

export function usePairEvents(pairId: string | null) {
  const ws = useWebSocket();
  const [latestMatch, setLatestMatch] = useState<MatchFoundEvent | null>(null);
  const [partnerActivity, setPartnerActivity] = useState<PartnerSwipedEvent | null>(null);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  useEffect(() => {
    if (!pairId) return;

    // Join the pair room
    ws.joinPair(pairId);

    // Subscribe to events
    const unsubscribeMatch = ws.onMatchFound(({ data }) => {
      setLatestMatch(data);
      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Match! 🎉', {
          body: `You both liked "${data.title}"!`,
          icon: data.poster_path 
            ? `https://image.tmdb.org/t/p/w92${data.poster_path}` 
            : undefined,
        });
      }
    });

    const unsubscribeSwipe = ws.onPartnerSwiped(({ data }) => {
      setPartnerActivity(data);
      setTimeout(() => setPartnerActivity(null), 3000); // Clear after 3s
    });

    const unsubscribeOnline = ws.onPairUserOnline(({ data }) => {
      if (data.pairId === pairId) {
        setIsPartnerOnline(true);
      }
    });

    const unsubscribeOffline = ws.onPairUserOffline(({ data }) => {
      if (data.pairId === pairId) {
        setIsPartnerOnline(false);
      }
    });

    const unsubscribeTyping = ws.onPartnerTyping(({ data }) => {
      setIsPartnerTyping(data.isTyping);
    });

    // Cleanup
    return () => {
      ws.leavePair(pairId);
      unsubscribeMatch();
      unsubscribeSwipe();
      unsubscribeOnline();
      unsubscribeOffline();
      unsubscribeTyping();
    };
  }, [pairId, ws]);

  return {
    latestMatch,
    partnerActivity,
    isPartnerOnline,
    isPartnerTyping,
  };
}
```

### usePairRequests Hook

```typescript
// hooks/usePairRequests.ts
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';
import type { PairRequestEvent, PairRequestResponseEvent } from '@/types/websocket';

export function usePairRequests() {
  const ws = useWebSocket();
  const queryClient = useQueryClient();
  const [newRequest, setNewRequest] = useState<PairRequestEvent | null>(null);
  const [requestResponse, setRequestResponse] = useState<PairRequestResponseEvent | null>(null);

  useEffect(() => {
    // Subscribe to incoming pair requests
    const unsubscribeRequest = ws.onPairRequest(({ data }) => {
      setNewRequest(data);
      
      // Invalidate pending requests query
      queryClient.invalidateQueries({ queryKey: ['pairs', 'pending-requests'] });

      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Pair Request', {
          body: `${data.requester.name} wants to pair with you!`,
          icon: data.requester.picture,
        });
      }
    });

    // Subscribe to pair request responses
    const unsubscribeResponse = ws.onPairRequestResponse(({ data }) => {
      setRequestResponse(data);

      // Invalidate pairs list query
      queryClient.invalidateQueries({ queryKey: ['pairs'] });

      // Show notification
      if (data.accepted && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Pair Request Accepted! 🎉', {
          body: 'Your pair request was accepted!',
        });
      }
    });

    return () => {
      unsubscribeRequest();
      unsubscribeResponse();
    };
  }, [ws, queryClient]);

  return {
    newRequest,
    requestResponse,
    clearNewRequest: () => setNewRequest(null),
    clearRequestResponse: () => setRequestResponse(null),
  };
}
```

### usePresence Hook

```typescript
// hooks/usePresence.ts
import { useEffect, useState } from 'react';
import { useWebSocket } from './useWebSocket';

export function usePresence() {
  const ws = useWebSocket();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribeOnline = ws.onUserOnline(({ data }) => {
      setOnlineUsers((prev) => new Set(prev).add(data.userId));
    });

    const unsubscribeOffline = ws.onUserOffline(({ data }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    });

    const unsubscribeList = ws.onOnlineUsers((userIds: string[]) => {
      setOnlineUsers(new Set(userIds));
    });

    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
      unsubscribeList();
    };
  }, [ws]);

  return {
    onlineUsers,
    isUserOnline: (userId: string) => onlineUsers.has(userId),
  };
}
```

---

## 6. Usage Examples

### In a Pair Swipe Component

```typescript
// components/PairSwipe.tsx
import React from 'react';
import { usePairEvents } from '@/hooks/usePairEvents';
import { useRecordSwipeMutation } from '@/hooks/mutations/usePairs';

interface Props {
  pairId: string;
  sessionId: string;
}

export function PairSwipe({ pairId, sessionId }: Props) {
  const { latestMatch, partnerActivity, isPartnerOnline, isPartnerTyping } = 
    usePairEvents(pairId);
  const recordSwipe = useRecordSwipeMutation();

  const handleSwipe = (tmdbId: number, direction: 'left' | 'right') => {
    recordSwipe.mutate({
      sessionId,
      tmdbId,
      direction,
    });
  };

  return (
    <div>
      {/* Online status indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isPartnerOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
        <span>{isPartnerOnline ? 'Partner online' : 'Partner offline'}</span>
      </div>

      {/* Typing indicator */}
      {isPartnerTyping && (
        <div className="text-sm text-gray-500">Partner is swiping...</div>
      )}

      {/* Partner activity */}
      {partnerActivity && (
        <div className="bg-blue-100 p-2 rounded">
          Partner {partnerActivity.direction === 'right' ? 'liked' : 'passed'}
        </div>
      )}

      {/* Match notification */}
      {latestMatch && (
        <div className="bg-green-500 text-white p-4 rounded">
          <h3>It's a match! 🎉</h3>
          <p>{latestMatch.title}</p>
        </div>
      )}

      {/* Swipe UI */}
      {/* ... your swipe component ... */}
    </div>
  );
}
```

### In a Notifications Component

```typescript
// components/Notifications.tsx
import React from 'react';
import { usePairRequests } from '@/hooks/usePairRequests';
import { useRespondToPairRequestMutation } from '@/hooks/mutations/usePairs';

export function Notifications() {
  const { newRequest, clearNewRequest } = usePairRequests();
  const respondToRequest = useRespondToPairRequestMutation();

  if (!newRequest) return null;

  const handleRespond = (action: 'accept' | 'reject') => {
    respondToRequest.mutate(
      { requestId: newRequest.id, action },
      {
        onSuccess: () => clearNewRequest(),
      }
    );
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4">
      <h4>New Pair Request</h4>
      <p>{newRequest.requester.name} wants to pair with you!</p>
      <div className="flex gap-2 mt-2">
        <button onClick={() => handleRespond('accept')}>Accept</button>
        <button onClick={() => handleRespond('reject')}>Reject</button>
      </div>
    </div>
  );
}
```

### In App Layout

```typescript
// layouts/AppLayout.tsx
import React, { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const ws = useWebSocket();

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div>
      {/* Connection status indicator (optional) */}
      {!ws.isConnected() && (
        <div className="bg-yellow-500 text-white px-4 py-2">
          Reconnecting...
        </div>
      )}
      
      {children}
    </div>
  );
}
```

---

## 7. Best Practices

### 1. Connection Management

- **Connect once** per user session, typically in your app's root component or auth provider
- **Reuse the same connection** across components using the singleton pattern
- **Handle reconnection** automatically using Socket.IO's built-in reconnection logic

### 2. Memory Management

- **Always unsubscribe** from events in useEffect cleanup functions
- **Leave rooms** when components unmount
- **Clear state** when appropriate to prevent memory leaks

### 3. Error Handling

```typescript
// Always handle WebSocket errors
ws.on('error', (error) => {
  console.error('WebSocket error:', error);
  // Show user-friendly error message
  toast.error('Connection error. Retrying...');
});

ws.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Maybe refresh the token if it's expired
  if (error.message.includes('unauthorized')) {
    // Refresh token logic
  }
});
```

### 4. Performance Optimization

- **Debounce typing indicators** to reduce network traffic
- **Batch notifications** if multiple events arrive quickly
- **Use React.memo** for components that receive frequent updates

```typescript
// Debounced typing indicator
const debouncedTyping = useCallback(
  debounce((pairId: string, isTyping: boolean) => {
    ws.sendTypingIndicator(pairId, isTyping);
  }, 300),
  [ws]
);
```

### 5. Offline Support

```typescript
// Handle offline/online events
useEffect(() => {
  const handleOnline = () => {
    if (!ws.isConnected()) {
      ws.connect(token);
    }
  };

  const handleOffline = () => {
    // Show offline indicator
    toast.info('You are offline');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, [ws, token]);
```

---

## 8. Testing

### Unit Tests with Jest

```typescript
// __tests__/websocket.service.test.ts
import { PairsWebSocketService } from '@/services/websocket.service';
import { io } from 'socket.io-client';

jest.mock('socket.io-client');

describe('PairsWebSocketService', () => {
  let service: PairsWebSocketService;
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
      connected: true,
    };

    (io as jest.Mock).mockReturnValue(mockSocket);
    service = new PairsWebSocketService();
  });

  afterEach(() => {
    service.disconnect();
  });

  it('should connect with token', () => {
    service.connect('test-token');
    
    expect(io).toHaveBeenCalledWith(
      expect.stringContaining('/pairs'),
      expect.objectContaining({
        auth: { token: 'test-token' },
      })
    );
  });

  it('should subscribe to events', () => {
    const callback = jest.fn();
    service.connect('test-token');
    
    service.onMatchFound(callback);
    
    // Simulate event
    const eventHandler = mockSocket.on.mock.calls.find(
      ([event]) => event === 'match-found'
    )?.[1];
    
    eventHandler?.({ data: { title: 'Test Movie' } });
    
    expect(callback).toHaveBeenCalled();
  });

  it('should emit events', () => {
    service.connect('test-token');
    service.emit('join-pair', 'pair-123');
    
    expect(mockSocket.emit).toHaveBeenCalledWith('join-pair', 'pair-123');
  });
});
```

### Integration Tests with React Testing Library

```typescript
// __tests__/usePairEvents.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { usePairEvents } from '@/hooks/usePairEvents';
import { getWebSocketService } from '@/services/websocket.service';

jest.mock('@/services/websocket.service');

describe('usePairEvents', () => {
  let mockWs: any;

  beforeEach(() => {
    mockWs = {
      joinPair: jest.fn(),
      leavePair: jest.fn(),
      onMatchFound: jest.fn(() => jest.fn()),
      onPartnerSwiped: jest.fn(() => jest.fn()),
      onPairUserOnline: jest.fn(() => jest.fn()),
      onPairUserOffline: jest.fn(() => jest.fn()),
      onPartnerTyping: jest.fn(() => jest.fn()),
    };

    (getWebSocketService as jest.Mock).mockReturnValue(mockWs);
  });

  it('should join pair on mount', () => {
    renderHook(() => usePairEvents('pair-123'));
    
    expect(mockWs.joinPair).toHaveBeenCalledWith('pair-123');
  });

  it('should leave pair on unmount', () => {
    const { unmount } = renderHook(() => usePairEvents('pair-123'));
    
    unmount();
    
    expect(mockWs.leavePair).toHaveBeenCalledWith('pair-123');
  });

  it('should update state on match found', async () => {
    let matchCallback: any;
    mockWs.onMatchFound.mockImplementation((cb: any) => {
      matchCallback = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => usePairEvents('pair-123'));

    // Simulate match event
    matchCallback({ data: { title: 'Test Movie', tmdb_id: 123 } });

    await waitFor(() => {
      expect(result.current.latestMatch).toEqual({
        title: 'Test Movie',
        tmdb_id: 123,
      });
    });
  });
});
```

---

## Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_WS_URL=http://localhost:8080
# or for production
NEXT_PUBLIC_WS_URL=https://api.yourapp.com
```

---

## Summary

This WebSocket implementation provides:

1. ✅ **Real-time pair requests** - Instant notifications when someone wants to pair
2. ✅ **Live session updates** - Know when filters are proposed/accepted
3. ✅ **Swipe notifications** - See when your partner swipes
4. ✅ **Instant matches** - Celebrate matches together in real-time
5. ✅ **Presence indicators** - Know when your pair is online
6. ✅ **Typing indicators** - Enhanced UX with activity indicators
7. ✅ **Automatic reconnection** - Resilient connection handling
8. ✅ **Type-safe** - Full TypeScript support

The system is production-ready with proper error handling, memory management, and testing support.
