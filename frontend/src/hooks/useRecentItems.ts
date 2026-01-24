import { useState, useEffect, useCallback } from "react";

export interface RecentItem {
  id: string;
  type: "patient" | "user" | "report";
  title: string;
  path: string;
  timestamp: Date;
}

const STORAGE_KEY = "recent_items";
const MAX_ITEMS = 10;

export function useRecentItems() {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const items = JSON.parse(stored).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        setRecentItems(items);
      } catch (error) {
        console.error("Error loading recent items:", error);
      }
    }
  }, []);

  const addRecentItem = useCallback((item: Omit<RecentItem, "timestamp">) => {
    setRecentItems((prev) => {
      // Remove if already exists
      const filtered = prev.filter((i) => !(i.id === item.id && i.type === item.type));
      // Add new item at the beginning
      const newItems = [
        { ...item, timestamp: new Date() },
        ...filtered,
      ].slice(0, MAX_ITEMS);
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      return newItems;
    });
  }, []);

  const removeRecentItem = useCallback((id: string, type: RecentItem["type"]) => {
    setRecentItems((prev) => {
      const filtered = prev.filter((i) => !(i.id === id && i.type === type));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    });
  }, []);

  const clearRecentItems = useCallback(() => {
    setRecentItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    recentItems,
    addRecentItem,
    removeRecentItem,
    clearRecentItems,
  };
}
