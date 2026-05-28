"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClient = () => true;
const getServer = () => false;

export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, getClient, getServer);
}
