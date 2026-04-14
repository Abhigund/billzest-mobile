# Error Handling & Edge Cases Guide

This document outlines the comprehensive error handling and edge case management implemented in BillZest Mobile.

## Overview

The app implements multiple layers of error handling:
1. **Network Layer**: Timeout handling, request cancellation, connection quality detection
2. **Session Layer**: Token refresh, session expiry detection, multi-device management
3. **Validation Layer**: Form validation, data validation, business rule validation
4. **UI Layer**: Error boundaries, graceful degradation, user-friendly error messages
5. **Recovery Layer**: Retry mechanisms, automated data refetching

---

## 1. Network Error Handling

### Timeout Handling

All network requests have a default timeout of 30 seconds. This can be customized:

```typescript
import { withTimeout, createTimeoutSignal } from '../utils/networkUtils';

// Wrap a promise with timeout
const result = await withTimeout(
  fetchData(),
  30000, // 30 seconds
  'Request timed out'
);
```

### Request Cancellation

Requests are automatically cancelled when components unmount:

```typescript
import { useCancellableQuery } from '../hooks/useCancellableQuery';

const { data, error } = useCancellableQuery({
  queryKey: ['products'],
  queryFn: async (signal) => {
    // signal is automatically provided
    return await fetchProducts(signal);
  },
  timeout: 30000, // optional, defaults to 30000ms
});
```

### Network Error Detection

The app automatically detects network errors:

```typescript
import { isNetworkError, isTimeoutError, isCancelledError } from '../utils/networkUtils';

try {
  await fetchData();
} catch (error) {
  if (isNetworkError(error)) {
    // Handle network issues
  } else if (isTimeoutError(error)) {
    // Handle timeout
  } else if (isCancelledError(error)) {
    // Request was cancelled, ignore
  }
}
```

---

## 2. Session Management

### Session Expiry Detection

The `SupabaseContext` automatically detects when sessions are about to expire:

```typescript
import { useSupabase } from '../contexts/SupabaseContext';

const { isSessionExpired, refreshSession } = useSupabase();

if (isSessionExpired) {
  // Session expires in less than 5 minutes
  await refreshSession();
}
```

### Token Refresh

Tokens are automatically refreshed:
- When app comes to foreground
- Before expiry (5 minutes buffer)
- On auth state changes

### Multi-Device Session Management

- **Global Logout**: Logs out from all devices
- **Local Logout**: Logs out from current device only
- **Session Recovery**: Automatically restores session on app restart

---

## 3. Form Validation

### Validation Utilities

Use the validation utilities for consistent validation:

```typescript
import {
  validateEmail,
  validatePhone,
  validateRequired,
  validatePositiveNumber,
  validateGSTIN,
  validateDateRange,
  validateStock,
  validatePrice,
} from '../utils/validation';

// Email validation
const emailResult = validateEmail(email);
if (!emailResult.isValid) {
  setError(emailResult.error);
}

// Phone validation
const phoneResult = validatePhone(phone);

// Required field
const nameResult = validateRequired(name, 'Name');

// Positive number
const priceResult = validatePositiveNumber(price, 'Price');

// GSTIN validation
const gstinResult = validateGSTIN(gstin);

// Date range (e.g., due date after issue date)
const dateResult = validateDateRange(issueDate, dueDate, {
  start: 'Issue date',
  end: 'Due date',
});

// Stock validation (non-negative integer)
const stockResult = validateStock(stock);

// Price validation (positive with max 2 decimals)
const priceResult = validatePrice(price);
```

### Invoice Date Validation

```typescript
import { validateInvoiceDates } from '../utils/validation';

const result = validateInvoiceDates(issueDate, dueDate);
if (!result.isValid) {
  // Show error: "Due date must be after Issue date"
}
```

---

## 4. Error Boundaries

### Global Error Boundary

The app has a global error boundary in `RootNavigator`:

```typescript
<ErrorBoundary>
  <NavigationContainer>
    {/* App content */}
  </NavigationContainer>
</ErrorBoundary>
```

### Custom Error Boundaries

You can create custom error boundaries for specific sections:

```typescript
<ErrorBoundary
  fallback={<CustomErrorScreen />}
  onError={(error, errorInfo) => {
    // Log to crash reporting
    logger.error('Component error', error, errorInfo);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

---

## 5. Graceful Degradation

### Cached Data Display

Show cached data while fetching fresh data:

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  staleTime: 30000,
  // Show cached data while refetching
  placeholderData: (previousData) => previousData,
});
```

### Partial Data Loading

Display partial data when some requests fail:

```typescript
const { data: products } = useProducts();
const { data: invoices } = useInvoices();

// Show products even if invoices fail
if (products) {
  // Render products
}
if (invoices) {
  // Render invoices
}
```

---

## 6. Error Recovery

### Retry Logic

React Query automatically retries failed requests:

```typescript
useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  retry: 3, // Retry 3 times
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});
```

  // Automatically retries on network availability via TanStack Query
});

### Manual Retry

Users can manually retry failed operations:

```typescript
const { refetch, isError } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
});

if (isError) {
  return (
    <View>
      <Text>Failed to load data</Text>
      <Button onPress={() => refetch()}>Retry</Button>
    </View>
  );
}
```

---

## 7. User-Friendly Error Messages

### Error Message Formatting

Convert technical errors to user-friendly messages:

```typescript
import { toAppError } from '../utils/appError';

try {
  await operation();
} catch (error) {
  const appError = toAppError('operation', error, 'Something went wrong');
  
  // appError.code can be: 'auth', 'validation', 'not-found', 'conflict', 'server'
  // appError.message is user-friendly
}
```

### Error Code Handling

```typescript
switch (error.code) {
  case 'auth':
    // Show: "Please sign in again"
    break;
  case 'validation':
    // Show validation error message
    break;
  case 'not-found':
    // Show: "Item not found"
    break;
  case 'conflict':
    // Show: "This item already exists"
    break;
  default:
    // Show generic error
}
```

---

## 8. Edge Cases

### Concurrent Edits

Currently not fully implemented. Recommended approach:
- Use optimistic locking (version numbers)
- Show conflict resolution UI
- Allow user to choose which version to keep

### Large Lists

- Use pagination for lists > 100 items
- Implement virtual scrolling for very long lists
- Show loading indicators during pagination

### Slow Network

- Show loading states
- Display cached data immediately
- Allow cancellation of slow requests
- Show progress indicators

### App State Changes

- Pause requests when app goes to background
- Resume/refresh when app comes to foreground
- Handle session expiry during background

---

## 9. Best Practices

### Always Handle Errors

```typescript
// ❌ Bad
const data = await fetchData();

// ✅ Good
try {
  const data = await fetchData();
} catch (error) {
  logger.error('Failed to fetch data', error);
  // Show user-friendly error
}
```

### Use Validation Utilities

```typescript
// ❌ Bad
if (!email.includes('@')) {
  setError('Invalid email');
}

// ✅ Good
const result = validateEmail(email);
if (!result.isValid) {
  setError(result.error);
}
```

### Cancel Requests on Unmount

```typescript
// ✅ Good - useCancellableQuery does this automatically
const { data } = useCancellableQuery({
  queryKey: ['data'],
  queryFn: fetchData,
});
```

### Show Loading States

```typescript
// ✅ Good
if (isLoading) {
  return <LoadingSpinner />;
}

if (isError) {
  return <ErrorScreen onRetry={refetch} />;
}

return <DataDisplay data={data} />;
```

### Log Errors Properly

```typescript
// ❌ Bad
console.error(error);

// ✅ Good
logger.error('Operation failed', error, { context: 'additional info' });
```

---

## 10. Testing Error Handling

### Test Network Errors

Test how the app handles connection failures using mock timeouts.

### Test Session Expiry

```typescript
// Simulate expired session
const mockSession = { expires_at: Date.now() / 1000 - 1000 };
```

### Test Validation

```typescript
import { validateEmail } from '../utils/validation';

test('validates email correctly', () => {
  expect(validateEmail('invalid')).toEqual({
    isValid: false,
    error: 'Please enter a valid email address',
  });
});
```

---

## Summary

The app implements comprehensive error handling at multiple layers:

1. ✅ Network timeout and cancellation
2. ✅ Session expiry detection and refresh
3. ✅ Form validation utilities
4. ✅ Error boundaries
5. ✅ Graceful degradation
6. ✅ Retry mechanisms
7. ✅ User-friendly error messages
8. ✅ Edge case handling

All error handling follows best practices and provides a smooth user experience even when things go wrong.
