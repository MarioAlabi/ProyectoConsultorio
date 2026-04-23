import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { ErrorBoundary } from "./ErrorBoundary";

export const Layout = () => {
  return (
    <div className="app-shell">
      <Navbar />
      <main>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
};
