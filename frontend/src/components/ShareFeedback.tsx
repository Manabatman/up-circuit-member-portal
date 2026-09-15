import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { submitFeedback, type FeedbackCategory } from "../api/feedback";
import { Button, Modal, TextArea } from "./ui";
import styles from "./ui.module.css";

const CATEGORIES: { id: FeedbackCategory; title: string; hint: string }[] = [
  { id: "broken", title: "Something's broken", hint: "A feature isn't working as expected" },
  { id: "idea", title: "I have an idea", hint: "A way to make the portal better" },
  { id: "story", title: "Share your story", hint: "How the portal helped you" },
];

export function ShareFeedback() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"pick" | "form" | "success">("pick");
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [message, setMessage] = useState("");
  const [error, setMessageError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const reset = useCallback(() => {
    setStep("pick");
    setCategory(null);
    setMessage("");
    setMessageError(null);
    setSubmitting(false);
  }, []);

  function requestClose() {
    if (step === "form" && message.trim()) {
      const ok = window.confirm("Discard your feedback?");
      if (!ok) return;
    }
    setOpen(false);
    reset();
    returnFocusRef.current?.focus();
  }

  function openModal() {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  }

  async function onSubmit() {
    if (!category) return;
    const trimmed = message.trim();
    if (!trimmed) {
      setMessageError("Please write a short message.");
      return;
    }
    setSubmitting(true);
    setMessageError(null);
    try {
      await submitFeedback({
        category,
        message: trimmed,
        page_path: location.pathname,
      });
      setStep("success");
    } catch (err: unknown) {
      setMessageError(err instanceof Error ? err.message : "Could not send feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const dialog = document.getElementById("feedback-dialog");
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [open, step]);

  return (
    <>
      <Button
        type="button"
        variant="primary"
        className={styles.feedbackFab}
        onClick={openModal}
        aria-haspopup="dialog"
      >
        Share feedback
      </Button>

      <Modal
        open={open}
        title={
          step === "success"
            ? "Thank you"
            : step === "form"
              ? "Tell us more"
              : "Share feedback"
        }
        onClose={requestClose}
        dialogId="feedback-dialog"
        footer={
          step === "form" ? (
            <>
              <Button variant="secondary" type="button" onClick={() => setStep("pick")}>
                Back
              </Button>
              <Button type="button" onClick={() => void onSubmit()} disabled={submitting}>
                {submitting ? "Sending…" : "Send"}
              </Button>
            </>
          ) : step === "success" ? (
            <Button type="button" onClick={requestClose}>
              Close
            </Button>
          ) : (
            <Button variant="secondary" type="button" onClick={requestClose}>
              Cancel
            </Button>
          )
        }
      >
        {step === "pick" ? (
          <ul className={styles.feedbackCategoryList}>
            {CATEGORIES.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={styles.feedbackCategoryButton}
                  onClick={() => {
                    setCategory(item.id);
                    setStep("form");
                  }}
                >
                  <span className={styles.feedbackCategoryTitle}>{item.title}</span>
                  <span className={styles.feedbackCategoryHint}>{item.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {step === "form" ? (
          <>
            <p className={styles.muted}>Only your message is required — we attach the page automatically.</p>
            <TextArea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="What's on your mind?"
              aria-label="Feedback message"
            />
            {error ? <p className={styles.errorText}>{error}</p> : null}
          </>
        ) : null}
        {step === "success" ? (
          <p>Your feedback helps us improve the portal for all Circuit members.</p>
        ) : null}
      </Modal>
    </>
  );
}
