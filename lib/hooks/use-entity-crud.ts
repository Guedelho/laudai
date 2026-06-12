"use client";

import { useState } from "react";

export function useEntityCrud<T extends { id: string; name: string }>(initial: T[], fallbackError: string) {
  const [items, setItems] = useState<T[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const message = (err: unknown) => (err instanceof Error ? err.message : fallbackError);
  const sortByName = (list: T[]) => [...list].sort((a, b) => a.name.localeCompare(b.name));

  async function submitAdd(create: () => Promise<T>, afterAdd?: () => void) {
    setSaving(true);
    setError("");
    try {
      const item = await create();
      setItems((prev) => sortByName([...prev, item]));
      setShowForm(false);
      afterAdd?.();
    } catch (err) {
      setError(message(err));
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit(update: () => Promise<(item: T) => T>, { close = true } = {}) {
    if (!editingId) return;
    setEditSaving(true);
    setEditError("");
    try {
      const apply = await update();
      setItems((prev) => sortByName(prev.map((item) => (item.id === editingId ? apply(item) : item))));
      if (close) setEditingId(null);
    } catch (err) {
      setEditError(message(err));
    } finally {
      setEditSaving(false);
    }
  }

  function startEdit(id: string) {
    setEditingId(id);
    setEditError("");
  }

  async function remove(id: string, del: () => Promise<void>) {
    await del();
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return {
    items,
    setItems,
    showForm,
    setShowForm,
    saving,
    error,
    editingId,
    setEditingId,
    editSaving,
    editError,
    submitAdd,
    submitEdit,
    startEdit,
    remove,
  };
}
