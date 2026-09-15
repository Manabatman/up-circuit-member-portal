import { apiJson } from "./client";

export type FeedbackCategory = "broken" | "idea" | "story";

export async function submitFeedback(body: {
  category: FeedbackCategory;
  message: string;
  page_path: string;
}): Promise<{ id: string; message: string }> {
  return apiJson("/api/v1/feedback", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
