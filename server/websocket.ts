// WebSocket broadcast utility for real-time updates
import { WebSocket } from "ws";

// Global WebSocket clients set
export const wsClients = new Set<WebSocket>();

// Broadcast event to all connected WebSocket clients
export function broadcastToClients(type: string, data: any): void {
  const message = JSON.stringify({ type, data });
  
  console.log(`📡 Broadcasting ${type} to ${wsClients.size} client(s)`);
  
  let sentCount = 0;
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
        sentCount++;
      } catch (error) {
        console.error("Error sending WebSocket message:", error);
        // Remove dead clients
        wsClients.delete(client);
      }
    }
  });
  
  if (sentCount > 0) {
    console.log(`✅ Sent ${type} to ${sentCount} client(s)`);
  } else if (wsClients.size > 0) {
    console.log(`⚠️  No clients ready to receive (${wsClients.size} connected but not OPEN)`);
  }
}

// Add a client to the set
export function addClient(client: WebSocket): void {
  wsClients.add(client);
  console.log(`WebSocket client connected. Total clients: ${wsClients.size}`);
}

// Remove a client from the set
export function removeClient(client: WebSocket): void {
  wsClients.delete(client);
  console.log(`WebSocket client disconnected. Total clients: ${wsClients.size}`);
}
