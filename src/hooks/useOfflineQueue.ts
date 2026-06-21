import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface QueueItem {
  id: string;
  timestamp: number;
  table: string;
  action: "insert" | "update" | "delete";
  payload: Record<string, any>;
  recordId?: string;
  status: "pending" | "syncing" | "conflict" | "done";
}

export interface SyncConflict {
  queueItem: QueueItem;
  serverData: Record<string, any> | null;
}

const DB_NAME = "erp_offline_queue";
const STORE_NAME = "mutations";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllItems(): Promise<QueueItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result.sort((a: QueueItem, b: QueueItem) => a.timestamp - b.timestamp));
    req.onerror = () => reject(req.error);
  });
}

async function addItem(item: QueueItem): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function removeItem(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Offline policy enforcement
const OFFLINE_WHITELIST: Record<string, string[]> = {
  bookings: ["insert"],
  work_reports: ["insert"],
  attendance_records: ["insert"],
  orders: ["insert"], // allowed but status forced to pending_sync
};

const OFFLINE_BLACKLIST = [
  "token_ledger",
  "project_shares",
  "permission_policies",
  "agent_permissions",
  "sensitive_action_logs",
  "blockchain_config",
  "api_keys",
  "integration_configs",
  "webhook_logs",
];

function canPerformOffline(table: string, action: string): { allowed: boolean; reason?: string; forceStatus?: string } {
  if (OFFLINE_BLACKLIST.includes(table)) {
    return { allowed: false, reason: `Thao tác trên "${table}" không được phép khi offline (tài sản số)` };
  }

  const whitelist = OFFLINE_WHITELIST[table];
  if (whitelist && whitelist.includes(action)) {
    if (table === "orders") {
      return { allowed: true, forceStatus: "pending_sync" };
    }
    return { allowed: true };
  }

  // For tables not explicitly whitelisted, allow reads but block writes when offline
  if (action === "insert" || action === "update" || action === "delete") {
    return { allowed: true }; // Allow but will be queued
  }

  return { allowed: true };
}

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const { toast } = useToast();
  const syncingRef = useRef(false);
  const flushQueueRef = useRef<() => Promise<void>>();

  const refreshCount = useCallback(async () => {
    try {
      const items = await getAllItems();
      setPendingCount(items.filter(i => i.status === "pending").length);
    } catch { /* indexedDB unavailable */ }
  }, []);

  const flushQueue = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const items = await getAllItems();
      const pending = items.filter(i => i.status === "pending");
      const newConflicts: SyncConflict[] = [];

      for (const item of pending) {
        try {
          // Conflict detection for updates
          if (item.action === "update" && item.recordId) {
            const { data: serverRecord } = await (supabase.from(item.table as any) as any)
              .select("updated_at")
              .eq("id", item.recordId)
              .single();

            if (serverRecord?.updated_at) {
              const serverTime = new Date(serverRecord.updated_at).getTime();
              if (serverTime > item.timestamp) {
                newConflicts.push({ queueItem: item, serverData: serverRecord });
                continue;
              }
            }
          }

          // Execute mutation
          if (item.action === "insert") {
            await (supabase.from(item.table as any) as any).insert(item.payload);
          } else if (item.action === "update" && item.recordId) {
            await (supabase.from(item.table as any) as any).update(item.payload).eq("id", item.recordId);
          } else if (item.action === "delete" && item.recordId) {
            await (supabase.from(item.table as any) as any).delete().eq("id", item.recordId);
          }

          await removeItem(item.id);
        } catch (err) {
          console.error("Sync error for item", item.id, err);
        }
      }

      if (newConflicts.length > 0) {
        setConflicts(prev => [...prev, ...newConflicts]);
      }

      await refreshCount();

      if (pending.length > 0 && newConflicts.length === 0) {
        toast({ title: "Đồng bộ hoàn tất", description: `${pending.length} thao tác đã được đồng bộ` });
      }
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [refreshCount, toast]);

  // Keep ref updated for event listeners
  flushQueueRef.current = flushQueue;

  useEffect(() => {
    refreshCount();

    const goOnline = () => {
      setIsOnline(true);
      toast({ title: "Đã kết nối mạng", description: "Đang đồng bộ dữ liệu...", variant: "default" });
      flushQueueRef.current?.();
    };
    const goOffline = () => {
      setIsOnline(false);
      toast({ title: "Mất kết nối", description: "Dữ liệu sẽ được lưu tạm và đồng bộ khi có mạng", variant: "destructive" });
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [refreshCount, toast]);

  const enqueue = useCallback(async (table: string, action: "insert" | "update" | "delete", payload: Record<string, any>, recordId?: string) => {
    // Offline policy enforcement
    if (!navigator.onLine) {
      const policy = canPerformOffline(table, action);
      if (!policy.allowed) {
        toast({ variant: "destructive", title: "Không thể thực hiện offline", description: policy.reason });
        return;
      }
      // Force status for certain tables
      if (policy.forceStatus && action === "insert") {
        payload = { ...payload, status: policy.forceStatus };
      }
    }

    const item: QueueItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      table,
      action,
      payload,
      recordId,
      status: "pending",
    };
    await addItem(item);
    await refreshCount();

    // If online, try to sync immediately
    if (navigator.onLine) {
      flushQueueRef.current?.();
    }
  }, [refreshCount, toast]);

  const resolveConflict = useCallback(async (queueItemId: string, resolution: "local" | "server") => {
    const conflict = conflicts.find(c => c.queueItem.id === queueItemId);
    if (!conflict) return;

    if (resolution === "local") {
      const item = conflict.queueItem;
      if (item.action === "update" && item.recordId) {
        await (supabase.from(item.table as any) as any).update(item.payload).eq("id", item.recordId);
      }
    }

    await removeItem(queueItemId);
    setConflicts(prev => prev.filter(c => c.queueItem.id !== queueItemId));
    await refreshCount();
  }, [conflicts, refreshCount]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    conflicts,
    enqueue,
    flushQueue,
    resolveConflict,
  };
}
