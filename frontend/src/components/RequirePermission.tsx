import { Navigate, Outlet, useOutletContext } from "react-router-dom";

import type { MeResponse } from "../api/auth";
import { AccessDenied } from "./ui";

type Props = {
  permission: string;
  redirectTo?: string;
};

export function RequirePermission({ permission, redirectTo = "/dashboard" }: Props) {
  const me = useOutletContext<MeResponse>();
  if (!me.permissions.includes(permission)) {
    if (me.permissions.includes("view_admin_dashboard")) {
      return (
        <AccessDenied
          title="Access denied"
          message="You do not have access to this admin section."
        />
      );
    }
    return <Navigate to={redirectTo} replace />;
  }
  return <Outlet context={me} />;
}
