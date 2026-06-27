'use client';
import { useState, useCallback, useEffect } from 'react';
import type { MemoryPin } from '@/lib/types';

const STORAGE_KEY = 'streetpins_memories';

function load(): MemoryPin[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function save(pins: MemoryPin[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
}

export function useMemories() {
  const [memories, setMemories] = useState<MemoryPin[]>([]);

  useEffect(() => {
    setMemories(load());
  }, []);

  const addMemory = useCallback((pin: Omit<MemoryPin, 'id' | 'savedAt'>) => {
    const newPin: MemoryPin = {
      ...pin,
      id: `mp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      savedAt: Date.now(),
    };
    setMemories((prev) => {
      const next = [newPin, ...prev];
      save(next);
      return next;
    });
    return newPin;
  }, []);

  const removeMemory = useCallback((id: string) => {
    setMemories((prev) => {
      const next = prev.filter((m) => m.id !== id);
      save(next);
      return next;
    });
  }, []);

  const updateMemory = useCallback((id: string, updates: Partial<Omit<MemoryPin, 'id' | 'savedAt'>>) => {
    setMemories((prev) => {
      const next = prev.map((m) => m.id === id ? { ...m, ...updates } : m);
      save(next);
      return next;
    });
  }, []);

  const hasMemory = useCallback((lat: number, lng: number, radiusKm = 0.5) => {
    return memories.some((m) => {
      const dx = (m.lat - lat) * 111;
      const dy = (m.lng - lng) * 111 * Math.cos((lat * Math.PI) / 180);
      return Math.sqrt(dx * dx + dy * dy) < radiusKm;
    });
  }, [memories]);

  return { memories, addMemory, removeMemory, updateMemory, hasMemory };
}
