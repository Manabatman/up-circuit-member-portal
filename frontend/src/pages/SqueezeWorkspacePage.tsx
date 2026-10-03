import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { SQUEEEZE29_QUESTIONS, SQUEEEZE29_QUESTION_SHEET_URL } from "../content/squeeeze29";
import { SQUEEEZE_DEMO } from "../demo/squeeeze";
import {
  EmptyState,
  PageShell,
  PrimaryExternalButton,
  SearchInput,
  SectionHeader,
} from "../components/ui";
import styles from "../components/ui.module.css";

export function SqueezeWorkspacePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(() => {
    const names = new Set(SQUEEEZE29_QUESTIONS.map((item) => item.category).filter(Boolean));
    return ["All", ...[...names].sort()];
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SQUEEEZE29_QUESTIONS.filter((item) => {
      if (category !== "All" && item.category !== category) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [category, query]);

  return (
    <PageShell>
      <p className={styles.backLinkWrap}>
        <Link to="/projects">← Flagship Events</Link>
      </p>

      <header className={styles.workspaceHeader}>
        <h1 className="type-page-title m-0 text-[1.875rem] text-circuit-navy">{SQUEEEZE_DEMO.name}</h1>
        <p className={styles.workspaceSubtitle}>{SQUEEEZE_DEMO.subtitle}</p>
        <p className={styles.workspaceLead}>{SQUEEEZE_DEMO.overview}</p>
      </header>

      <section>
        <SectionHeader
          title="SquEEEze 29 questions"
          subtitle="Questions and answers for this edition."
        />
        <PrimaryExternalButton href={SQUEEEZE29_QUESTION_SHEET_URL}>
          Open question sheet
        </PrimaryExternalButton>

        {SQUEEEZE29_QUESTIONS.length === 0 ? (
          <div className="mt-6">
            <EmptyState message="The question list is in the shared sheet. Open it to review questions and answers." />
          </div>
        ) : (
          <div className="mt-6">
            <div className={styles.academicDriveFilters}>
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search questions or answers…"
              />
              {categories.length > 2 ? (
                <label className="flex items-center gap-2 text-sm text-text-secondary">
                  Category
                  <select
                    className="rounded-md border border-border px-2 py-1.5 text-sm"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  >
                    {categories.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
            {visible.length === 0 ? (
              <EmptyState message="No questions matched your search." />
            ) : (
              <ul className={styles.recentlyAddedList}>
                {visible.map((item) => (
                  <li key={item.id} className="border-b border-border px-4 py-3 last:border-b-0">
                    {item.category ? (
                      <p className="m-0 text-xs font-medium text-text-secondary">{item.category}</p>
                    ) : null}
                    <p className="m-0 mt-1 font-semibold text-circuit-navy">{item.question}</p>
                    <p className="m-0 mt-1 text-sm text-text-secondary">{item.answer}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </PageShell>
  );
}
