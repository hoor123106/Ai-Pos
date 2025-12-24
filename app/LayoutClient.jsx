// app/LayoutClient.js
"use client";

import { usePathname } from "next/navigation";
import Header from "./components/Header/Header";
import Sidebar from "./components/Sidebar/Sidebar";

export default function LayoutClient({ children }) {
  const pathname = usePathname();
  // Yeh logic wahi rahegi jo sign-in/sign-up pages par layout hide karti hai
  const hideLayout = pathname === "/sign-in" || pathname === "/sign-up"; 

  if (hideLayout) return <>{children}</>; // sirf page content

  return (
    <div style={{ display: "flex" }}>
      {/* Sidebar */}
      <div style={{ position: "fixed", top: 0, left: 0, width: 240, height: "100vh" }}>
        <Sidebar />
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 240, flex: 1, }}>
        <div style={{ position: "sticky", top: 0, zIndex: 1000 }}>
          <Header />
        </div>

        <main style={{ padding: "20px" }}>{children}</main>
      </div>
    </div>
  );
}