import { Navigate, Route, Routes } from "react-router-dom";

import { AuthShell } from "./components/AuthShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RequirePermission } from "./components/RequirePermission";
import { AcademicDrivePage } from "./pages/AcademicDrivePage";
import { AccountPage } from "./pages/AccountPage";
import { AdminDivisionsPage } from "./pages/admin/AdminDivisionsPage";
import { AdminEventsPage } from "./pages/admin/AdminEventsPage";
import { AdminMembersPage } from "./pages/admin/AdminMembersPage";
import { AdminOverviewPage } from "./pages/admin/AdminOverviewPage";
import { AdminResourcesPage } from "./pages/admin/AdminResourcesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DivisionDetailPage } from "./pages/DivisionDetailPage";
import { DivisionsPage } from "./pages/DivisionsPage";
import { DirectoryPage } from "./pages/DirectoryPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { CalendarPage } from "./pages/CalendarPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { RenewalsPage } from "./pages/RenewalsPage";
import { ResourcesPage } from "./pages/ResourcesPage";
import { SqueezeWorkspacePage } from "./pages/SqueezeWorkspacePage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AuthShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/calendar/:eventId" element={<EventDetailPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/squeeeze" element={<SqueezeWorkspacePage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/academic-drive" element={<AcademicDrivePage />} />
          <Route path="/divisions" element={<DivisionsPage />} />
          <Route path="/divisions/:divisionId" element={<DivisionDetailPage />} />
          <Route path="/directory" element={<DirectoryPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/renewals" element={<RenewalsPage />} />
          <Route element={<RequirePermission permission="view_admin_dashboard" />}>
            <Route path="/admin" element={<AdminOverviewPage />} />
            <Route
              element={
                <RequirePermission
                  anyOf={["manage_academic_resources", "manage_organizational_resources"]}
                />
              }
            >
              <Route path="/admin/resources" element={<AdminResourcesPage />} />
            </Route>
            <Route element={<RequirePermission permission="manage_events" />}>
              <Route path="/admin/events" element={<AdminEventsPage />} />
            </Route>
            <Route element={<RequirePermission permission="manage_organizational_resources" />}>
              <Route path="/admin/divisions" element={<AdminDivisionsPage />} />
            </Route>
            <Route element={<RequirePermission permission="manage_membership_status" />}>
              <Route path="/admin/members" element={<AdminMembersPage />} />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
