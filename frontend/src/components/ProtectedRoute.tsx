import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

import { fetchMe, type MeResponse } from "../api/auth";
import { SessionSplash } from "./ui";

export function ProtectedRoute() {
  const [state, setState] = useState<
    { status: "loading" } | { status: "ok"; me: MeResponse } | { status: "denied" }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchMe()
      .then((me) => {
        if (!cancelled) setState({ status: "ok", me });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "denied" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return <SessionSplash />;
  }
  if (state.status === "denied") {
    return <Navigate to="/login" replace />;
  }
  return <Outlet context={state.me} />;
}
