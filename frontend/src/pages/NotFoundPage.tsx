import { Link } from "react-router-dom";

import { PageHeader, PageShell } from "../components/ui";

export function NotFoundPage() {
  return (
    <PageShell>
      <PageHeader
        title="Page not found"
        subtitle="This URL is not part of the member portal. Check the address or return home."
      />
      <Link to="/dashboard" className="text-sm font-semibold text-circuit-blue hover:underline">
        Back to dashboard
      </Link>
    </PageShell>
  );
}
