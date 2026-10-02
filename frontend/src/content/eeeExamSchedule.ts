/**
 * Official EEE / academic exam schedule (static).
 * Update this file when the department releases a new schedule, then redeploy.
 * Course-level only — no year level, batch, or academic year on exams.
 */

export type ScheduledCourseExam = {
  courseCode: string;
  /** Optional display name; UI falls back to courseCode */
  courseName?: string;
  examName: string;
  /** ISO date YYYY-MM-DD (start) */
  date: string;
  /** Inclusive end for multi-day exams */
  endDate?: string;
  /** Optional 24h HH:MM; omit for date-only exams */
  startTime?: string;
  endTime?: string;
  url?: string;
};

export type CourseCatalogEntry = {
  courseCode: string;
  courseName: string;
  resourceSummary?: string;
};

export type ExamArchiveEntry = {
  courseCode: string;
  examName: string;
  term?: string;
  url?: string;
};

function exam(
  courseCode: string,
  examName: string,
  date: string,
  endDate?: string,
): ScheduledCourseExam {
  return { courseCode, examName, date, endDate };
}

/** Manually configured exams (not app.events) */
export const SCHEDULED_COURSE_EXAMS: ScheduledCourseExam[] = [
  exam("EEE 133", "LE 1", "2026-09-28"),
  exam("Physics 71", "LE 1", "2026-09-28"),

  exam("EEE 157", "LE 1", "2026-10-05"),

  exam("Math 21", "LE 2", "2026-10-13"),
  exam("Math 23", "LE 2", "2026-10-14"),

  exam("Physics 73", "LE 2", "2026-10-17"),

  exam("EEE 118", "Practical Exam 1", "2026-10-19"),
  exam("EEE 151", "LE 1", "2026-10-19"),

  exam("EEE 113", "LE 2", "2026-10-23"),

  exam("EEE 131", "LE 2", "2026-10-26"),
  exam("EEE 155", "LE 2", "2026-10-26"),
  exam("Physics 71", "LE 2", "2026-10-26"),

  exam("EEE 133", "LE 2", "2026-11-07"),

  exam("EEE 157", "LE 2", "2026-11-09", "2026-11-13"),

  exam("Math 21", "LE 3", "2026-11-10"),
  exam("Math 23", "LE 3", "2026-11-11"),

  exam("EEE 111", "LE 2", "2026-11-23"),
  exam("EEE 137", "LE 3", "2026-11-23"),
  exam("EEE 118", "Practical Exam 2", "2026-11-23", "2026-12-05"),

  exam("Physics 71", "LE 3", "2026-11-28"),
  exam("Physics 73", "LE 3", "2026-11-28"),

  exam("Math 21", "LE 4", "2026-12-03"),
  exam("Math 23", "LE 4", "2026-12-04"),

  exam("EEE 113", "LE 3", "2026-12-05"),
  exam("EEE 135", "LE 3", "2026-12-05"),

  exam("EEE 157", "LE 3", "2026-12-07", "2026-12-11"),

  exam("EEE 131", "LE 3", "2026-12-07"),
  exam("EEE 151", "LE 2", "2026-12-07"),
  exam("EEE 155", "LE 3", "2026-12-07"),

  exam("EEE 133", "LE 3", "2026-12-09"),

  exam("EEE 153", "LE 3", "2026-12-14"),
  exam("EEE 155", "Comprehensive E", "2026-12-14"),
];

/** Browse-by-course cards (maintain separately from exam dates) */
export const COURSE_CATALOG: CourseCatalogEntry[] = [
  { courseCode: "EEE 111", courseName: "EEE 111" },
  { courseCode: "EEE 113", courseName: "EEE 113" },
  { courseCode: "EEE 118", courseName: "EEE 118" },
  { courseCode: "EEE 131", courseName: "EEE 131" },
  { courseCode: "EEE 133", courseName: "EEE 133" },
  { courseCode: "EEE 135", courseName: "EEE 135" },
  { courseCode: "EEE 137", courseName: "EEE 137" },
  { courseCode: "EEE 151", courseName: "EEE 151" },
  { courseCode: "EEE 153", courseName: "EEE 153" },
  { courseCode: "EEE 155", courseName: "EEE 155" },
  { courseCode: "EEE 157", courseName: "EEE 157" },
  { courseCode: "Math 21", courseName: "Math 21" },
  { courseCode: "Math 23", courseName: "Math 23" },
  { courseCode: "Physics 71", courseName: "Physics 71" },
  { courseCode: "Physics 73", courseName: "Physics 73" },
];

export const EXAM_ARCHIVES: ExamArchiveEntry[] = [
  { courseCode: "EEE 151", examName: "LE 1", term: "2025–2026 2S" },
  { courseCode: "EEE 155", examName: "LE 2", term: "2025–2026 1S" },
  { courseCode: "EEE 135", examName: "LE 3", term: "2024–2025 2S" },
];

export const STUDY_NEXT_DAYS = 14;
