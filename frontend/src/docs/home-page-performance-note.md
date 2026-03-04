# Home Page Performance Investigation & Fix

## Date: February 14, 2026

## Problem
The Home page was experiencing slow load times, appearing to hang while loading the organizations/groups list.

## Root Cause Analysis

### 1. N+1 Query Problem (Primary Issue)
**Location:** `ResourcesNeedsView.tsx`

The component was calling `useGetProfile(need.profileId)` and `useGetProfile(resource.profileId)` for EACH need and resource item in the lists. This created:
- One backend call per need item
- One backend call per resource item
- Total: N backend calls where N = number of needs + number of resources

**Example:** With 20 needs and 15 resources, this resulted in 35 separate backend profile queries, all firing simultaneously on page load.

### 2. Aggressive React Query Refetching (Secondary Issue)
**Location:** `useQueries.ts` - `useAllProfiles()` hook

The profiles list query had default React Query settings, causing it to refetch:
- On window focus
- On component remount
- On reconnect
- Every time stale time expired

This meant the organizations list would reload frequently, even when the data hadn't changed.

### 3. No Profile Lookup Optimization
The already-fetched profiles list from `useAllProfiles()` was not being used to derive organization names for needs/resources. Instead, each item triggered its own profile fetch.

## Solution Implemented

### Fix 1: Eliminated N+1 Queries
**File:** `ResourcesNeedsView.tsx`

Created an in-memory profile lookup map using `useMemo`:
