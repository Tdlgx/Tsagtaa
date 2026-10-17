"use client";

import { useEffect, type JSX, type ReactNode } from "react";

import { announceStorageScope, setStorageScope } from "@/lib/local-store";

/**
 * Tells the browser stores whose data to show: each account keeps its own
 * profile and booking list on this device, and signed out has one more. It
 * wraps the page so the scope is set before any store below it reads.
 */
export function StorageScope({
  accountId,
  children,
}: {
  accountId: string | null;
  children: ReactNode;
}): JSX.Element {
  setStorageScope(accountId ?? "");
  // Signed in or out without a full reload: stores already on screen re-read.
  useEffect(() => {
    announceStorageScope();
  }, [accountId]);
  return <>{children}</>;
}
