/** Showcase project index — verified names; workspace status is frontend-only. */

export type DemoProjectStatus = "active" | "coming-soon";

export type DemoProject = {
  id: string;
  name: string;
  tagline?: string;
  status: DemoProjectStatus;
  path?: string;
};

export const DEMO_PROJECTS: DemoProject[] = [
  {
    id: "squeeeze",
    name: "SquEEEze",
    tagline:
      "SquEEEze is a national competition for outstanding EEE students and professionals, providing a platform to demonstrate technical knowledge, pursue excellence, and develop skills for the continuously evolving landscape of the 21st century.",
    status: "active",
    path: "/projects/squeeeze",
  },
  {
    id: "interackt",
    name: "InteraCKT",
    tagline:
      "InteraCKT is a fun welcoming event for the incoming BS Electrical, Electronics, and Computer Engineering FSTs initiated by UP Circuit. 🌻",
    status: "coming-soon",
  },
  {
    id: "ewaste",
    name: "The E-Waste Project",
    tagline:
      "An initiative to raise awareness and educate people about proper Electronic Waste Management.",
    status: "coming-soon",
  },
];
