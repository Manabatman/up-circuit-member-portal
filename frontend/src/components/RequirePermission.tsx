import { Navigate, Outlet, useOutletContext } from "react-router-dom";

import type { MeResponse } from "../api/auth";
import { AccessDenied } from "./ui";

type Props = {
  permission?: string;
  anyOf?: string[];
  redirectTo?: string;
};

function hasAccess(me: MeResponse, permission?: string, anyOf?: string[]): boolean {
  if (anyOf && anyOf.length > 0) {
    return anyOf.some((name) => me.permissions.includes(name));
  }
  return Boolean(permission && me.permissions.includes(permission));
}

export function RequirePermission({ permission, anyOf, redirectTo = "/dashboard" }: Props) {
  const me = useOutletContext<MeResponse>();
  if (!hasAccess(me, permission, anyOf)) {
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
