"use client";

import { Provider } from "react-redux";
import { ThemeProvider } from "next-themes";
import { store } from "@/store";

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        enableSystem
        disableTransitionOnChange // <-- Prevents early style dispatch
      >
        {children}
      </ThemeProvider>
    </Provider>
  );
}