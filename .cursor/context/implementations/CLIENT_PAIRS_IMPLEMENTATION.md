# Client Pairs Implementation Guide

## Overview
This document provides a complete reference for implementing the Pairs feature on the client side, including API routes, TypeScript types, service functions, and React Query hooks.

---

## Table of Contents
1. [TypeScript Types](#typescript-types)
2. [API Routes Reference](#api-routes-reference)
3. [Service Implementation](#service-implementation)
4. [React Query Hooks](#react-query-hooks)
5. [Error Handling](#error-handling)
6. [Usage Examples](#usage-examples)

---

## TypeScript Types

### Enums

```typescript
export enum PairRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum MediaType {
  MOVIE = 'movie',
  TV = 'tv',
}

export enum SessionStatus {
  FILTER_PENDING = 'filter_pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export enum SwipeDirection {
  LEFT = 'left',
  RIGHT = 'right',
}

export enum PairRequestAction {
  ACCEPT = 'accept',
  REJECT = 'reject',
}
```

### Core Types

```typescript
// User-related types
export interface User {
  id: string;
  name: string;
  email: string;
  picture: string | null;
}

// Pair Request types
export interface PairRequest {
  id: string;
  requester_id: string;
  requested_id: string;
  status: PairRequestStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface PairRequestWithRequester extends PairRequest {
  requester: Pick<User, 'id' | 'name' | 'email' | 'picture'>;
}

// Pair types
export interface Pair {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
}

export interface PairWithOtherUser extends Pair {
  otherUser: Pick<User, 'id' | 'name' | 'email' | 'picture'>;
}

// Session types
export interface PairSession {
  id: string;
  pair_id: string;
  created_by_user_id: string;
  media_type: MediaType;
  status: SessionStatus;
  filters_proposed_at: string | null;
  filters_accepted_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionFilter {
  id: string;
  session_id: string;
  year_min: number | null;
  year_max: number | null;
  genre_ids: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface SessionWithFilters extends PairSession {
  filters?: SessionFilter | null;
}

// Swipe types
export interface Swipe {
  id: string;
  session_id: string;
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  direction: SwipeDirection;
  created_at: string;
}

// Match types
export interface PairMatch {
  id: string;
  pair_id: string;
  session_id: string;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  overview: string;
  matched_at: string;
  marked_watched: boolean;
}

// Content types
export interface Content {
  id: number;
  title: string;
  posterPath: string | null;
  overview: string;
  voteAverage?: number;
  releaseDate?: string;
  firstAirDate?: string;
}
```

### Request/Response Types

```typescript
// API Response wrapper
export interface APIResponse<T> {
  data: T;
  code: number | string;
  message: string;
  timestamp: string;
}

// Request DTOs
export interface SendPairRequestDto {
  username?: string;
  email?: string;
}

export interface RespondPairRequestDto {
  action: PairRequestAction;
}

export interface CreateSessionDto {
  mediaType: MediaType;
}

export interface ProposeFiltersDto {
  yearMin?: number;
  yearMax?: number;
  genreIds?: number[];
}

export interface RecordSwipeDto {
  tmdbId: number;
  direction: SwipeDirection;
}

export interface GetMatchesDto {
  mediaType?: MediaType;
  markedWatched?: boolean;
}

// Response types
export interface SwipeResponse {
  matched: boolean;
  match?: PairMatch;
}
```

---

## API Routes Reference

### Base Configuration

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Axios instance with authentication
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 1. Pair Requests

#### Send Pair Request
```typescript
POST /pairs/requests

Request Body:
{
  username?: string;    // Either username or email required
  email?: string;
}

Response: APIResponse<PairRequest>

Example:
{
  "code": 201,
  "message": "Pair request sent successfully",
  "data": {
    "id": "uuid",
    "requester_id": "uuid",
    "requested_id": "uuid",
    "status": "pending",
    "expires_at": "2026-01-17T00:00:00.000Z",
    "created_at": "2026-01-10T10:30:00.000Z",
    "updated_at": "2026-01-10T10:30:00.000Z"
  }
}

Errors:
- 400: Username/email missing, duplicate request, already paired
- 404: User not found
```

#### Get Pending Requests
```typescript
GET /pairs/requests

Response: APIResponse<PairRequestWithRequester[]>

Example:
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "requester_id": "uuid",
      "requested_id": "uuid",
      "status": "pending",
      "expires_at": "2026-01-17T00:00:00.000Z",
      "created_at": "2026-01-10T10:30:00.000Z",
      "updated_at": "2026-01-10T10:30:00.000Z",
      "requester": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "picture": "https://example.com/avatar.jpg"
      }
    }
  ]
}
```

#### Respond to Pair Request
```typescript
PATCH /pairs/requests/:id

Request Body:
{
  action: "accept" | "reject"
}

Response: APIResponse<{ request: PairRequest; pair?: Pair }>

Example (Accept):
{
  "code": 200,
  "message": "Pair request accepted",
  "data": {
    "request": { /* PairRequest */ },
    "pair": {
      "id": "uuid",
      "user1_id": "uuid",
      "user2_id": "uuid",
      "created_at": "2026-01-10T10:30:00.000Z"
    }
  }
}

Errors:
- 400: Request already responded to, request expired
- 403: Not authorized to respond
- 404: Request not found
```

### 2. Pairs Management

#### Get All Pairs
```typescript
GET /pairs

Response: APIResponse<PairWithOtherUser[]>

Example:
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "user1_id": "uuid",
      "user2_id": "uuid",
      "created_at": "2026-01-10T10:30:00.000Z",
      "otherUser": {
        "id": "uuid",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "picture": "https://example.com/avatar.jpg"
      }
    }
  ]
}
```

#### Delete Pair
```typescript
DELETE /pairs/:id

Response: APIResponse<Pair>

Errors:
- 403: Not part of this pair
- 404: Pair not found
```

### 3. Sessions

#### Create Session
```typescript
POST /pairs/:pairId/sessions

Request Body:
{
  mediaType: "movie" | "tv"
}

Response: APIResponse<PairSession>

Example:
{
  "code": 201,
  "message": "Session created successfully",
  "data": {
    "id": "uuid",
    "pair_id": "uuid",
    "created_by_user_id": "uuid",
    "media_type": "movie",
    "status": "filter_pending",
    "filters_proposed_at": null,
    "filters_accepted_at": null,
    "ended_at": null,
    "created_at": "2026-01-10T10:30:00.000Z",
    "updated_at": "2026-01-10T10:30:00.000Z"
  }
}

Errors:
- 400: Active session already exists
- 403: Not part of this pair
- 404: Pair not found
```

#### Get Active Session
```typescript
GET /pairs/:pairId/sessions/active

Response: APIResponse<SessionWithFilters | null>

Example:
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": "uuid",
    "pair_id": "uuid",
    "created_by_user_id": "uuid",
    "media_type": "movie",
    "status": "active",
    "filters_proposed_at": "2026-01-10T10:30:00.000Z",
    "filters_accepted_at": "2026-01-10T10:35:00.000Z",
    "ended_at": null,
    "created_at": "2026-01-10T10:30:00.000Z",
    "updated_at": "2026-01-10T10:35:00.000Z",
    "filters": {
      "id": "uuid",
      "session_id": "uuid",
      "year_min": 2000,
      "year_max": 2024,
      "genre_ids": [28, 12, 878],
      "created_at": "2026-01-10T10:30:00.000Z",
      "updated_at": "2026-01-10T10:30:00.000Z"
    }
  }
}
```

#### Propose Filters
```typescript
PATCH /pairs/:pairId/sessions/:sessionId/filters

Request Body:
{
  yearMin?: number;      // 1900-2100
  yearMax?: number;      // 1900-2100
  genreIds?: number[];   // TMDB genre IDs
}

Response: APIResponse<{ session: PairSession; filters: SessionFilter }>

Example:
{
  "code": 200,
  "message": "Filters proposed successfully",
  "data": {
    "session": { /* PairSession */ },
    "filters": {
      "id": "uuid",
      "session_id": "uuid",
      "year_min": 2000,
      "year_max": 2024,
      "genre_ids": [28, 12, 878],
      "created_at": "2026-01-10T10:30:00.000Z",
      "updated_at": "2026-01-10T10:30:00.000Z"
    }
  }
}

Errors:
- 400: Invalid filters (yearMin > yearMax), invalid session status
- 403: Not part of this pair
- 404: Session not found
```

#### Accept Filters
```typescript
POST /pairs/:pairId/sessions/:sessionId/filters/accept

Response: APIResponse<{ session: PairSession; filters: SessionFilter }>

Example:
{
  "code": 200,
  "message": "Filters accepted, session is now active",
  "data": {
    "session": {
      /* PairSession with status: "active" */
    },
    "filters": { /* SessionFilter */ }
  }
}

Errors:
- 400: Filters not proposed, session creator cannot accept own filters
- 403: Not part of this pair
- 404: Session not found
```

#### End Session
```typescript
POST /pairs/:pairId/sessions/:sessionId/end

Response: APIResponse<PairSession>

Errors:
- 400: Session already completed
- 403: Not part of this pair
- 404: Session not found
```

### 4. Swiping

#### Get Next Content
```typescript
GET /pairs/sessions/:sessionId/next

Response: APIResponse<Content | null>

Example:
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": 550,
    "title": "Fight Club",
    "posterPath": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    "overview": "A ticking-time-bomb insomniac and a slippery soap salesman...",
    "voteAverage": 8.4,
    "releaseDate": "1999-10-15"
  }
}

Returns null when no more content available.

Errors:
- 400: Session not active
- 403: Not part of this pair
- 404: Session not found
```

#### Record Swipe
```typescript
POST /pairs/sessions/:sessionId/swipe

Request Body:
{
  tmdbId: number;
  direction: "left" | "right"
}

Response: APIResponse<SwipeResponse>

Example (Match):
{
  "code": 200,
  "message": "It's a match!",
  "data": {
    "matched": true,
    "match": {
      "id": "uuid",
      "pair_id": "uuid",
      "session_id": "uuid",
      "tmdb_id": 550,
      "media_type": "movie",
      "title": "Fight Club",
      "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      "overview": "A ticking-time-bomb insomniac...",
      "matched_at": "2026-01-10T10:30:00.000Z",
      "marked_watched": false
    }
  }
}

Example (No Match):
{
  "code": 200,
  "message": "Swipe recorded",
  "data": {
    "matched": false
  }
}

Errors:
- 400: Session not active
- 403: Not part of this pair
- 404: Session not found
```

### 5. Matches

#### Get Matches
```typescript
GET /pairs/:pairId/matches?mediaType=movie&markedWatched=false

Query Parameters:
- mediaType?: "movie" | "tv"
- markedWatched?: boolean

Response: APIResponse<PairMatch[]>

Example:
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "pair_id": "uuid",
      "session_id": "uuid",
      "tmdb_id": 550,
      "media_type": "movie",
      "title": "Fight Club",
      "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      "overview": "A ticking-time-bomb insomniac...",
      "matched_at": "2026-01-10T10:30:00.000Z",
      "marked_watched": false
    }
  ]
}

Errors:
- 403: Not part of this pair
- 404: Pair not found
```

#### Mark Match as Watched
```typescript
PATCH /pairs/:pairId/matches/:matchId/watched

Request Body:
{
  watched: boolean
}

Response: APIResponse<PairMatch>

Errors:
- 403: Not part of this pair
- 404: Match not found
```

---

## Service Implementation

### pairs.service.ts

```typescript
import { apiClient } from './api-client';
import type {
  APIResponse,
  SendPairRequestDto,
  RespondPairRequestDto,
  CreateSessionDto,
  ProposeFiltersDto,
  RecordSwipeDto,
  GetMatchesDto,
  PairRequest,
  PairRequestWithRequester,
  Pair,
  PairWithOtherUser,
  PairSession,
  SessionFilter,
  SessionWithFilters,
  Content,
  SwipeResponse,
  PairMatch,
} from './types';

class PairsService {
  // ==================== Pair Requests ====================
  
  async sendPairRequest(data: SendPairRequestDto): Promise<PairRequest> {
    const response = await apiClient.post<APIResponse<PairRequest>>(
      '/pairs/requests',
      data
    );
    return response.data.data;
  }

  async getPendingRequests(): Promise<PairRequestWithRequester[]> {
    const response = await apiClient.get<APIResponse<PairRequestWithRequester[]>>(
      '/pairs/requests'
    );
    return response.data.data;
  }

  async respondToPairRequest(
    requestId: string,
    data: RespondPairRequestDto
  ): Promise<{ request: PairRequest; pair?: Pair }> {
    const response = await apiClient.patch<
      APIResponse<{ request: PairRequest; pair?: Pair }>
    >(`/pairs/requests/${requestId}`, data);
    return response.data.data;
  }

  // ==================== Pairs ====================
  
  async getUserPairs(): Promise<PairWithOtherUser[]> {
    const response = await apiClient.get<APIResponse<PairWithOtherUser[]>>(
      '/pairs'
    );
    return response.data.data;
  }

  async deletePair(pairId: string): Promise<Pair> {
    const response = await apiClient.delete<APIResponse<Pair>>(
      `/pairs/${pairId}`
    );
    return response.data.data;
  }

  // ==================== Sessions ====================
  
  async createSession(
    pairId: string,
    data: CreateSessionDto
  ): Promise<PairSession> {
    const response = await apiClient.post<APIResponse<PairSession>>(
      `/pairs/${pairId}/sessions`,
      data
    );
    return response.data.data;
  }

  async getActiveSession(pairId: string): Promise<SessionWithFilters | null> {
    const response = await apiClient.get<APIResponse<SessionWithFilters | null>>(
      `/pairs/${pairId}/sessions/active`
    );
    return response.data.data;
  }

  async proposeFilters(
    pairId: string,
    sessionId: string,
    data: ProposeFiltersDto
  ): Promise<{ session: PairSession; filters: SessionFilter }> {
    const response = await apiClient.patch<
      APIResponse<{ session: PairSession; filters: SessionFilter }>
    >(`/pairs/${pairId}/sessions/${sessionId}/filters`, data);
    return response.data.data;
  }

  async acceptFilters(
    pairId: string,
    sessionId: string
  ): Promise<{ session: PairSession; filters: SessionFilter }> {
    const response = await apiClient.post<
      APIResponse<{ session: PairSession; filters: SessionFilter }>
    >(`/pairs/${pairId}/sessions/${sessionId}/filters/accept`);
    return response.data.data;
  }

  async endSession(pairId: string, sessionId: string): Promise<PairSession> {
    const response = await apiClient.post<APIResponse<PairSession>>(
      `/pairs/${pairId}/sessions/${sessionId}/end`
    );
    return response.data.data;
  }

  // ==================== Swiping ====================
  
  async getNextContent(sessionId: string): Promise<Content | null> {
    const response = await apiClient.get<APIResponse<Content | null>>(
      `/pairs/sessions/${sessionId}/next`
    );
    return response.data.data;
  }

  async recordSwipe(
    sessionId: string,
    data: RecordSwipeDto
  ): Promise<SwipeResponse> {
    const response = await apiClient.post<APIResponse<SwipeResponse>>(
      `/pairs/sessions/${sessionId}/swipe`,
      data
    );
    return response.data.data;
  }

  // ==================== Matches ====================
  
  async getMatches(
    pairId: string,
    params?: GetMatchesDto
  ): Promise<PairMatch[]> {
    const response = await apiClient.get<APIResponse<PairMatch[]>>(
      `/pairs/${pairId}/matches`,
      { params }
    );
    return response.data.data;
  }

  async markMatchAsWatched(
    pairId: string,
    matchId: string,
    watched: boolean
  ): Promise<PairMatch> {
    const response = await apiClient.patch<APIResponse<PairMatch>>(
      `/pairs/${pairId}/matches/${matchId}/watched`,
      { watched }
    );
    return response.data.data;
  }
}

export const pairsService = new PairsService();
```

---

## React Query Hooks

### hooks/usePairs.ts

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pairsService } from '../services/pairs.service';
import type {
  SendPairRequestDto,
  RespondPairRequestDto,
  CreateSessionDto,
  ProposeFiltersDto,
  RecordSwipeDto,
  GetMatchesDto,
} from '../types';

// ==================== Query Keys ====================
export const pairsKeys = {
  all: ['pairs'] as const,
  lists: () => [...pairsKeys.all, 'list'] as const,
  list: (filters?: string) => [...pairsKeys.lists(), filters] as const,
  details: () => [...pairsKeys.all, 'detail'] as const,
  detail: (id: string) => [...pairsKeys.details(), id] as const,
  
  requests: {
    all: ['pair-requests'] as const,
    pending: () => [...pairsKeys.requests.all, 'pending'] as const,
  },
  
  sessions: {
    all: ['pair-sessions'] as const,
    active: (pairId: string) => [...pairsKeys.sessions.all, 'active', pairId] as const,
  },
  
  content: {
    next: (sessionId: string) => ['pair-content', sessionId] as const,
  },
  
  matches: {
    all: ['pair-matches'] as const,
    list: (pairId: string, filters?: GetMatchesDto) => 
      [...pairsKeys.matches.all, pairId, filters] as const,
  },
};

// ==================== Pair Requests ====================

export function useSendPairRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: SendPairRequestDto) => 
      pairsService.sendPairRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pairsKeys.requests.all });
    },
  });
}

export function usePendingRequests() {
  return useQuery({
    queryKey: pairsKeys.requests.pending(),
    queryFn: () => pairsService.getPendingRequests(),
  });
}

export function useRespondToPairRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      requestId, 
      data 
    }: { 
      requestId: string; 
      data: RespondPairRequestDto 
    }) => pairsService.respondToPairRequest(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pairsKeys.requests.all });
      queryClient.invalidateQueries({ queryKey: pairsKeys.lists() });
    },
  });
}

// ==================== Pairs ====================

export function useUserPairs() {
  return useQuery({
    queryKey: pairsKeys.lists(),
    queryFn: () => pairsService.getUserPairs(),
  });
}

export function useDeletePair() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (pairId: string) => pairsService.deletePair(pairId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pairsKeys.lists() });
    },
  });
}

// ==================== Sessions ====================

export function useCreateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      pairId, 
      data 
    }: { 
      pairId: string; 
      data: CreateSessionDto 
    }) => pairsService.createSession(pairId, data),
    onSuccess: (_, { pairId }) => {
      queryClient.invalidateQueries({ 
        queryKey: pairsKeys.sessions.active(pairId) 
      });
    },
  });
}

export function useActiveSession(pairId: string) {
  return useQuery({
    queryKey: pairsKeys.sessions.active(pairId),
    queryFn: () => pairsService.getActiveSession(pairId),
    enabled: !!pairId,
  });
}

export function useProposeFilters() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      pairId, 
      sessionId, 
      data 
    }: { 
      pairId: string; 
      sessionId: string; 
      data: ProposeFiltersDto 
    }) => pairsService.proposeFilters(pairId, sessionId, data),
    onSuccess: (_, { pairId }) => {
      queryClient.invalidateQueries({ 
        queryKey: pairsKeys.sessions.active(pairId) 
      });
    },
  });
}

export function useAcceptFilters() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      pairId, 
      sessionId 
    }: { 
      pairId: string; 
      sessionId: string 
    }) => pairsService.acceptFilters(pairId, sessionId),
    onSuccess: (_, { pairId }) => {
      queryClient.invalidateQueries({ 
        queryKey: pairsKeys.sessions.active(pairId) 
      });
    },
  });
}

export function useEndSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      pairId, 
      sessionId 
    }: { 
      pairId: string; 
      sessionId: string 
    }) => pairsService.endSession(pairId, sessionId),
    onSuccess: (_, { pairId }) => {
      queryClient.invalidateQueries({ 
        queryKey: pairsKeys.sessions.active(pairId) 
      });
    },
  });
}

// ==================== Swiping ====================

export function useNextContent(sessionId: string) {
  return useQuery({
    queryKey: pairsKeys.content.next(sessionId),
    queryFn: () => pairsService.getNextContent(sessionId),
    enabled: !!sessionId,
    // Don't refetch automatically - only on manual refetch
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useRecordSwipe() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      sessionId, 
      data 
    }: { 
      sessionId: string; 
      data: RecordSwipeDto 
    }) => pairsService.recordSwipe(sessionId, data),
    onSuccess: (result, { sessionId }) => {
      // Refetch next content
      queryClient.invalidateQueries({ 
        queryKey: pairsKeys.content.next(sessionId) 
      });
      
      // If matched, invalidate matches list
      if (result.matched) {
        queryClient.invalidateQueries({ 
          queryKey: pairsKeys.matches.all 
        });
      }
    },
  });
}

// ==================== Matches ====================

export function useMatches(pairId: string, filters?: GetMatchesDto) {
  return useQuery({
    queryKey: pairsKeys.matches.list(pairId, filters),
    queryFn: () => pairsService.getMatches(pairId, filters),
    enabled: !!pairId,
  });
}

export function useMarkMatchAsWatched() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      pairId, 
      matchId, 
      watched 
    }: { 
      pairId: string; 
      matchId: string; 
      watched: boolean 
    }) => pairsService.markMatchAsWatched(pairId, matchId, watched),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: pairsKeys.matches.all 
      });
    },
  });
}
```

---

## Error Handling

### error-handler.ts

```typescript
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast'; // or your preferred toast library

interface APIError {
  message: string;
  code: string | number;
  statusCode: number;
}

export function handleAPIError(error: unknown): void {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as APIError;
    
    switch (error.response?.status) {
      case 400:
        toast.error(apiError?.message || 'Invalid request');
        break;
      case 401:
        toast.error('Please log in to continue');
        // Redirect to login
        break;
      case 403:
        toast.error('You do not have permission to perform this action');
        break;
      case 404:
        toast.error('Resource not found');
        break;
      case 409:
        toast.error('This action conflicts with existing data');
        break;
      case 500:
        toast.error('Server error. Please try again later');
        break;
      default:
        toast.error(apiError?.message || 'An error occurred');
    }
  } else {
    toast.error('An unexpected error occurred');
  }
}

// Usage in components
export function useErrorHandler() {
  return {
    handleError: handleAPIError,
  };
}
```

---

## Usage Examples

### 1. Send Pair Request

```typescript
import { useSendPairRequest } from '@/hooks/usePairs';
import { useErrorHandler } from '@/utils/error-handler';

function InviteFriendForm() {
  const sendRequest = useSendPairRequest();
  const { handleError } = useErrorHandler();
  
  const handleSubmit = async (data: { username: string }) => {
    try {
      await sendRequest.mutateAsync(data);
      toast.success('Invitation sent!');
    } catch (error) {
      handleError(error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="username" placeholder="Enter username" />
      <button type="submit" disabled={sendRequest.isPending}>
        {sendRequest.isPending ? 'Sending...' : 'Send Invite'}
      </button>
    </form>
  );
}
```

### 2. Display Pending Requests

```typescript
import { usePendingRequests, useRespondToPairRequest } from '@/hooks/usePairs';
import { PairRequestAction } from '@/types';

function PendingRequestsList() {
  const { data: requests, isLoading } = usePendingRequests();
  const respondToRequest = useRespondToPairRequest();
  
  const handleRespond = async (requestId: string, action: PairRequestAction) => {
    try {
      await respondToRequest.mutateAsync({ requestId, data: { action } });
      toast.success(action === PairRequestAction.ACCEPT 
        ? 'Request accepted!' 
        : 'Request rejected');
    } catch (error) {
      handleError(error);
    }
  };
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {requests?.map(request => (
        <div key={request.id}>
          <p>{request.requester.name} wants to pair with you</p>
          <button onClick={() => handleRespond(request.id, PairRequestAction.ACCEPT)}>
            Accept
          </button>
          <button onClick={() => handleRespond(request.id, PairRequestAction.REJECT)}>
            Reject
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 3. Create Session and Propose Filters

```typescript
import { 
  useCreateSession, 
  useProposeFilters, 
  useActiveSession 
} from '@/hooks/usePairs';
import { MediaType } from '@/types';

function CreateSessionFlow({ pairId }: { pairId: string }) {
  const createSession = useCreateSession();
  const proposeFilters = useProposeFilters();
  const { data: activeSession } = useActiveSession(pairId);
  
  const handleCreateSession = async () => {
    const session = await createSession.mutateAsync({
      pairId,
      data: { mediaType: MediaType.MOVIE }
    });
    
    // Propose filters after creating session
    await proposeFilters.mutateAsync({
      pairId,
      sessionId: session.id,
      data: {
        yearMin: 2000,
        yearMax: 2024,
        genreIds: [28, 12] // Action, Adventure
      }
    });
    
    toast.success('Session created! Waiting for friend to accept filters');
  };
  
  return (
    <div>
      {!activeSession && (
        <button onClick={handleCreateSession}>
          Start Movie Session
        </button>
      )}
      {activeSession?.status === 'filter_pending' && (
        <p>Waiting for filters to be accepted...</p>
      )}
    </div>
  );
}
```

### 4. Swiping Interface

```typescript
import { useNextContent, useRecordSwipe } from '@/hooks/usePairs';
import { SwipeDirection } from '@/types';
import { useState } from 'react';

function SwipingInterface({ sessionId }: { sessionId: string }) {
  const { data: content, refetch } = useNextContent(sessionId);
  const recordSwipe = useRecordSwipe();
  const [showMatch, setShowMatch] = useState(false);
  const [matchedContent, setMatchedContent] = useState(null);
  
  const handleSwipe = async (direction: SwipeDirection) => {
    if (!content) return;
    
    try {
      const result = await recordSwipe.mutateAsync({
        sessionId,
        data: {
          tmdbId: content.id,
          direction
        }
      });
      
      if (result.matched) {
        setMatchedContent(result.match);
        setShowMatch(true);
        // Show match animation/modal
        setTimeout(() => setShowMatch(false), 3000);
      }
      
      // Load next content
      refetch();
    } catch (error) {
      handleError(error);
    }
  };
  
  if (!content) {
    return <div>No more content available</div>;
  }
  
  return (
    <div className="swipe-container">
      <img src={`https://image.tmdb.org/t/p/w500${content.posterPath}`} />
      <h2>{content.title}</h2>
      <p>{content.overview}</p>
      <p>Rating: {content.voteAverage}/10</p>
      
      <div className="swipe-buttons">
        <button 
          onClick={() => handleSwipe(SwipeDirection.LEFT)}
          disabled={recordSwipe.isPending}
        >
          👎 Pass
        </button>
        <button 
          onClick={() => handleSwipe(SwipeDirection.RIGHT)}
          disabled={recordSwipe.isPending}
        >
          👍 Like
        </button>
      </div>
      
      {showMatch && (
        <div className="match-modal">
          <h1>It's a Match! 🎉</h1>
          <p>{matchedContent?.title}</p>
        </div>
      )}
    </div>
  );
}
```

### 5. Display Matches (Watchlist)

```typescript
import { useMatches, useMarkMatchAsWatched } from '@/hooks/usePairs';
import { MediaType } from '@/types';

function WatchlistPage({ pairId }: { pairId: string }) {
  const { data: matches } = useMatches(pairId, {
    mediaType: MediaType.MOVIE,
    markedWatched: false
  });
  const markWatched = useMarkMatchAsWatched();
  
  const handleMarkWatched = async (matchId: string) => {
    try {
      await markWatched.mutateAsync({
        pairId,
        matchId,
        watched: true
      });
      toast.success('Marked as watched!');
    } catch (error) {
      handleError(error);
    }
  };
  
  return (
    <div className="watchlist">
      <h1>Your Shared Watchlist</h1>
      {matches?.map(match => (
        <div key={match.id} className="match-card">
          <img src={`https://image.tmdb.org/t/p/w200${match.poster_path}`} />
          <h3>{match.title}</h3>
          <p>{match.overview}</p>
          <button onClick={() => handleMarkWatched(match.id)}>
            Mark as Watched
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Best Practices

### 1. Query Invalidation Strategy
- Invalidate relevant queries after mutations
- Use specific query keys for better cache management
- Avoid over-fetching by using `enabled` option

### 2. Optimistic Updates
```typescript
const markWatched = useMutation({
  mutationFn: ({ pairId, matchId, watched }) => 
    pairsService.markMatchAsWatched(pairId, matchId, watched),
  onMutate: async ({ pairId, matchId, watched }) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ 
      queryKey: pairsKeys.matches.list(pairId) 
    });
    
    // Snapshot previous value
    const previousMatches = queryClient.getQueryData(
      pairsKeys.matches.list(pairId)
    );
    
    // Optimistically update
    queryClient.setQueryData(
      pairsKeys.matches.list(pairId),
      (old: PairMatch[]) =>
        old?.map(match =>
          match.id === matchId
            ? { ...match, marked_watched: watched }
            : match
        )
    );
    
    return { previousMatches };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(
      pairsKeys.matches.list(variables.pairId),
      context?.previousMatches
    );
  },
});
```

### 3. Loading States
```typescript
const { data, isLoading, isError, error } = useUserPairs();

if (isLoading) return <Spinner />;
if (isError) return <ErrorMessage error={error} />;
if (!data?.length) return <EmptyState />;

return <PairsList pairs={data} />;
```

### 4. Real-time Updates (Optional with WebSockets)
```typescript
// Future enhancement
useEffect(() => {
  const socket = io(API_BASE_URL);
  
  socket.on('pair-request', () => {
    queryClient.invalidateQueries({ queryKey: pairsKeys.requests.pending() });
  });
  
  socket.on('match-found', () => {
    queryClient.invalidateQueries({ queryKey: pairsKeys.matches.all });
  });
  
  return () => socket.disconnect();
}, [queryClient]);
```

---

## TypeScript Configuration

### tsconfig.json additions
```json
{
  "compilerOptions": {
    "paths": {
      "@/services/*": ["./services/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/types": ["./types/index"]
    }
  }
}
```

---

## Testing

### Example test with MSW (Mock Service Worker)

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.post('/pairs/requests', (req, res, ctx) => {
    return res(
      ctx.json({
        code: 201,
        message: 'Pair request sent successfully',
        data: {
          id: 'test-id',
          status: 'pending',
          // ...
        }
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('sends pair request', async () => {
  const result = await pairsService.sendPairRequest({ 
    username: 'testuser' 
  });
  expect(result.status).toBe('pending');
});
```

---

**Last Updated:** January 10, 2026  
**API Version:** 0.1.1
