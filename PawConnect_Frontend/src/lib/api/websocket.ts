/**
 * Real-Time WebSocket & STOMP Client for PawConnect
 * Connects to Spring Boot /ws STOMP broker, authenticates with JWT in CONNECT frame,
 * and subscribes to /user/queue/notifications.
 */

import { getStoredAccessToken } from "./client";

export interface StompMessage {
  command: string;
  headers: Record<string, string>;
  body: string;
}

export type NotificationCallback = (notification: unknown) => void;

class StompNotificationClient {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectDelay = 15000;
  private callbacks: Set<NotificationCallback> = new Set();
  private subscriptionId = 1;

  public connect(): void {
    if (typeof window === "undefined") return;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = getStoredAccessToken();
    if (!token) {
      return;
    }

    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8000/ws";
    const protocol = wsUrl.startsWith("https") || wsUrl.startsWith("wss") ? "wss" : "ws";
    const endpoint = wsUrl.replace(/^(?:https?|wss?):\/\//, "").replace(/\/+$/, "");
    const socketUrl = endpoint.endsWith("/websocket")
      ? `${protocol}://${endpoint}`
      : `${protocol}://${endpoint}/websocket`;

    try {
      this.socket = new WebSocket(socketUrl);

      this.socket.onopen = () => {
        this.sendConnectFrame(token);
      };

      this.socket.onmessage = (event) => {
        this.handleSocketMessage(event.data as string);
      };

      this.socket.onerror = (err) => {
        console.warn("WebSocket error:", err);
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.scheduleReconnect();
      };
    } catch (err) {
      console.warn("WebSocket connection failure:", err);
      this.scheduleReconnect();
    }
  }

  private sendConnectFrame(token: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    const connectFrame = [
      "CONNECT",
      "accept-version:1.2,1.1,1.0",
      "heart-beat:10000,10000",
      `Authorization:Bearer ${token}`,
      "\n",
    ].join("\n") + "\0";

    this.socket.send(connectFrame);
  }

  private subscribeToNotifications(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    const subFrame = [
      "SUBSCRIBE",
      `id:sub-${this.subscriptionId++}`,
      "destination:/user/queue/notifications",
      "ack:auto",
      "\n",
    ].join("\n") + "\0";

    this.socket.send(subFrame);
  }

  private handleSocketMessage(rawData: string): void {
    const frames = rawData.split("\0").filter((f) => f.trim().length > 0);

    for (const frame of frames) {
      const [headerPart, ...bodyParts] = frame.split("\n\n");
      const lines = headerPart.split("\n");
      const command = lines[0].trim();

      if (command === "CONNECTED") {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.subscribeToNotifications();
      } else if (command === "MESSAGE") {
        const body = bodyParts.join("\n\n").trim();
        try {
          const parsed = JSON.parse(body);
          this.callbacks.forEach((cb) => cb(parsed));
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("pawconnect-realtime-notification", {
                detail: parsed,
              })
            );
          }
        } catch {
          // ignore non-json payload
        }
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public subscribe(cb: NotificationCallback): () => void {
    this.callbacks.add(cb);
    if (!this.isConnected) {
      this.connect();
    }
    return () => {
      this.callbacks.delete(cb);
    };
  }

  public disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.socket) {
      try {
        if (this.socket.readyState === WebSocket.OPEN) {
          this.socket.send("DISCONNECT\n\n\0");
        }
        this.socket.close();
      } catch {
        // ignore
      }
      this.socket = null;
    }
    this.isConnected = false;
  }
}

export const stompClient = new StompNotificationClient();

// Setup listener for logout/token refresh
if (typeof window !== "undefined") {
  window.addEventListener("pawconnect-auth-cleared", () => {
    stompClient.disconnect();
  });

  window.addEventListener("pawconnect-token-refreshed", () => {
    stompClient.disconnect();
    stompClient.connect();
  });
}
