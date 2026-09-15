import { DEMO_PROJECTS } from "../demo/projects";
import { PageHeader, PageShell, ProjectCard } from "../components/ui";

export function ProjectsPage() {
  const featured = DEMO_PROJECTS.find((p) => p.status === "active");
  const comingSoon = DEMO_PROJECTS.filter((p) => p.status === "coming-soon");

  return (
    <PageShell>
      <PageHeader
        kicker="Discover"
        title="Flagship Events"
        subtitle="UP Circuit's flagship events and initiatives."
      />

      {featured ? (
        <section className="mb-10">
          <ProjectCard
            projectId={featured.id}
            name={featured.name}
            tagline={featured.tagline}
            to={featured.path}
            featured
          />
        </section>
      ) : null}

      {comingSoon.length > 0 ? (
        <section>
          <h2 className="type-section-title mb-4 text-sm text-circuit-navy">More flagship events</h2>
          <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
            {comingSoon.map((project) => (
              <li key={project.id}>
                <ProjectCard
                  projectId={project.id}
                  name={project.name}
                  tagline={project.tagline}
                  comingSoon
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </PageShell>
  );
}
