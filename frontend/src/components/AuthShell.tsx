import { useOutletContext } from "react-router-dom";

import type { MeResponse } from "../api/auth";
import { AppLayout } from "./AppLayout";

export function AuthShell() {
  const me = useOutletContext<MeResponse>();
  return <AppLayout me={me} />;
}
