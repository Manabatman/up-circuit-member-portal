/**
 * SquEEEze 29 question sheet.
 * The spreadsheet is not publicly exportable (Google returns 401), so the rows
 * are not copied here. The flagship page links to this sheet instead of
 * inventing questions or placeholder links.
 */
export const SQUEEEZE29_QUESTION_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1jKQEwoOmNSEIjAaPWXeiTIKHqGtIoeZ9EEF1MlFpb3s/edit?usp=sharing";

export type SqueezeQuestion = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

export const SQUEEEZE29_QUESTIONS: SqueezeQuestion[] = [];
