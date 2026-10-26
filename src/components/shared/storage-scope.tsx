"use client";

import { useEffect, type JSX, type ReactNode } from "react";

import { announceStorageScope, setStorageScope } from "@/lib/local-store";

/**
 * Browser-ийн store-уудад хэний өгөгдлийг харуулахыг хэлнэ: бүртгэл бүр энэ
 * төхөөрөмж дээр өөрийн профайл, захиалгын жагсаалттай, нэвтрээгүй үед дахиад нэг.
 * Хуудсыг ороодог тул доорх store-ууд уншихаас өмнө хамрах хүрээ тохирно.
 */
export function StorageScope({
  accountId,
  children,
}: {
  accountId: string | null;
  children: ReactNode;
}): JSX.Element {
  setStorageScope(accountId ?? "");
  // Бүтэн дахин ачаалалгүйгээр нэвтэрсэн эсвэл гарсан: дэлгэц дээрх store-ууд дахин уншина.
  useEffect(() => {
    announceStorageScope();
  }, [accountId]);
  return <>{children}</>;
}
