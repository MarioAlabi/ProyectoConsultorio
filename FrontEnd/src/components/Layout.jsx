import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { ErrorBoundary } from "./ErrorBoundary";

export const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar_collapsed", String(next));
      } catch {
        /* noop */
      }
      return next;
    });
  };

  return (
    <div className={`app-shell ${isCollapsed ? "is-sidebar-collapsed" : ""}`}>
      <Navbar isCollapsed={isCollapsed} onToggleCollapse={toggleSidebar} />
      <main>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
};
