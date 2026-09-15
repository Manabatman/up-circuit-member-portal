/** SquEEEze showcase workspace — external tool links only; not verified organizational data. */

export type DemoResourceGroup = {
  name: string;
  items: DemoWorkspaceResource[];
};

export type DemoWorkspaceResource = {
  title: string;
  description: string;
  url: string;
  resourceType: string;
};

export type DemoMilestone = {
  label: string;
  note: string;
};

export const SQUEEEZE_DEMO = {
  name: "SquEEEze",
  subtitle: "Circuit Quiz Bee",
  overview:
    "SquEEEze is a national competition for outstanding EEE students and professionals, providing a platform to demonstrate technical knowledge, pursue excellence, and develop skills for the continuously evolving landscape of the 21st century.",
  statusNote: "Preparation in progress",
  upcomingNote: "Question writing phase",
  resourceGroups: [
    {
      name: "Operations",
      items: [
        {
          title: "Manpower Tracker",
          description: "Organizer roster in Google Sheets.",
          url: "https://example.com/circuit-demo/squeeeze/manpower",
          resourceType: "GOOGLE_SHEET",
        },
        {
          title: "Event Planning Sheet",
          description: "Timeline and task tracker.",
          url: "https://example.com/circuit-demo/squeeeze/planning",
          resourceType: "GOOGLE_SHEET",
        },
        {
          title: "Registration form",
          description: "Participant sign-up in Google Forms.",
          url: "https://example.com/circuit-demo/squeeeze/registration",
          resourceType: "GOOGLE_FORM",
        },
      ],
    },
    {
      name: "Question Bank",
      items: [
        {
          title: "Question Database",
          description: "Master question list.",
          url: "https://example.com/circuit-demo/squeeeze/questions",
          resourceType: "GOOGLE_SHEET",
        },
        {
          title: "Question Writing",
          description: "Drafting workspace.",
          url: "https://example.com/circuit-demo/squeeeze/writing",
          resourceType: "GOOGLE_DOC",
        },
        {
          title: "Question Review",
          description: "Review checklist.",
          url: "https://example.com/circuit-demo/squeeeze/review",
          resourceType: "GOOGLE_SHEET",
        },
      ],
    },
    {
      name: "Communications",
      items: [
        {
          title: "Official GC",
          description: "Organizing group chat.",
          url: "https://example.com/circuit-demo/squeeeze/gc",
          resourceType: "EXTERNAL_LINK",
        },
        {
          title: "Announcements",
          description: "Announcement doc for officers.",
          url: "https://example.com/circuit-demo/squeeeze/announcements",
          resourceType: "GOOGLE_DOC",
        },
      ],
    },
    {
      name: "Documents",
      items: [
        {
          title: "Event Drive",
          description: "Shared folder for project files.",
          url: "https://example.com/circuit-demo/squeeeze/drive",
          resourceType: "GOOGLE_DRIVE",
        },
        {
          title: "Guidelines",
          description: "Event guidelines document.",
          url: "https://example.com/circuit-demo/squeeeze/guidelines",
          resourceType: "GOOGLE_DOC",
        },
      ],
    },
    {
      name: "Tools",
      items: [
        {
          title: "Overleaf project",
          description: "Printable materials.",
          url: "https://example.com/circuit-demo/squeeeze/overleaf",
          resourceType: "EXTERNAL_LINK",
        },
      ],
    },
  ] satisfies DemoResourceGroup[],
  milestones: [
    { label: "Registration", note: "Opens external form" },
    { label: "Preparation", note: "Question writing phase" },
    { label: "Event date", note: "Finals day" },
  ] satisfies DemoMilestone[],
};
