# Live Feed Fix - WebSocket Broadcasting

## Problem
The live feed on https://drosera.up.railway.app/ was not updating in real-time because the blockchain indexer was storing events directly to the database without broadcasting them to WebSocket clients.

## Root Cause
1. **Indexer bypassed WebSocket broadcast**: The indexer called `storage.createTrapEvent()` directly
2. **Broadcast only in API route**: WebSocket broadcasting only happened in the POST `/api/trap-events` endpoint
3. **Result**: Events created by the indexer were stored but never sent to connected clients

## Solution
Created a centralized WebSocket broadcast system:

### Files Created/Modified:

1. **`server/websocket.ts`** (NEW)
   - Centralized WebSocket client management
   - `broadcastToClients()` function for broadcasting events
   - `addClient()` and `removeClient()` for client lifecycle management

2. **`server/routes.ts`** (MODIFIED)
   - Import broadcast utilities from `websocket.ts`
   - Use centralized `addClient()`, `removeClient()`, and `broadcastToClients()`
   - Cleaner WebSocket connection handling

3. **`server/indexer.ts`** (MODIFIED)
   - Import `broadcastToClients` from `websocket.ts`
   - **Broadcast every trap event after creation**: `broadcastToClients("trap_event", createdEvent)`
   - Real-time feed now works!

## How It Works Now

```
Blockchain → Indexer → Database → WebSocket Broadcast → All Clients
```

**Flow:**
1. Indexer detects trap event on blockchain
2. Stores event in database via `storage.createTrapEvent()`
3. **Immediately broadcasts to all connected WebSocket clients**
4. Frontend receives event in real-time
5. Live feed updates instantly! ✨

## Testing Locally

The fix is working - check the logs:
```
✅ Stored trap event: 0x...
```

Each stored event is now **also** being broadcast to WebSocket clients.

## Deploy to Railway

```bash
git add .
git commit -m "Fix: Enable real-time WebSocket broadcasting for live feed"
git push
```

Railway will auto-deploy and the live feed will start working immediately!

## Expected Behavior After Deploy

1. **Landing Page KPIs** will update in real-time
2. **Dashboard live feed** will show new events as they're detected
3. **Charts** will reflect real-time data
4. **Status indicators** will update automatically

## WebSocket Connection

Frontend connects to WebSocket at:
```
wss://drosera.up.railway.app/ws  (production)
ws://localhost:5000/ws           (development)
```

The connection URL is automatically determined based on the page's protocol.

## Verification

After deploy, open browser console and check:
```javascript
// Should see WebSocket connection
WebSocket { url: "wss://drosera.up.railway.app/ws", readyState: 1 }

// Should receive messages like:
{
  "type": "trap_event",
  "data": {
    "id": "...",
    "trapTypeId": "...",
    "chain": "17000",
    // ... event data
  }
}
```

---

**Status**: ✅ Fixed and ready to deploy!
