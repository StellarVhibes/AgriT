"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { WalletProvider } from "./lib/wallet/WalletContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <WalletProvider>{children}</WalletProvider>
    </ThemeProvider>
  );
}
