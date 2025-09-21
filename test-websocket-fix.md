# WebSocket Runtime Error Fix

## Problem
Runtime TypeError: Cannot read properties of undefined (reading 'length') in executive-dashboard.tsx line 199

## Root Cause
WebSocket data structure doesn't include `utilities` field:
```json
{
  "type": "initial",
  "data": {
    "grinding": {...},
    "kiln": {...},
    "raw_material": {...},
    "recommendations": [...],
    // ❌ Missing: "utilities": [...]
  }
}
```

But chart generation function expected `combinedData.utilities.length` to exist.

## Fix Applied

### 1. Enhanced null safety in generateChartsData()
- Added `combinedData?.utilities?.length > 0` check
- Added fallback energy data when utilities are not available
- Added proper optional chaining for all data access

### 2. Updated WebSocket data merging
- Preserve existing utilities data when WebSocket doesn't include it
- Use empty array as fallback for utilities

### 3. Enhanced calculateKPIs() function
- Added null safety for `plant_overview` access
- Added optional chaining for all nested property access

## Expected Result
- ✅ No more runtime errors when WebSocket data is received
- ✅ Charts display correctly with or without utilities data
- ✅ Component handles partial data gracefully
- ✅ Real-time updates work without crashes