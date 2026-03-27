import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { ErrorBoundary } from "./ErrorBoundary";

export const Layout = () => {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <Navbar />
      <main>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
};
