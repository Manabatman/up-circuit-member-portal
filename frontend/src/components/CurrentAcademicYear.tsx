import { useEffect, useState } from "react";

import {
  fetchCurrentAcademicYear,
  type AcademicYear,
} from "../api/academicYear";
import styles from "./CurrentAcademicYear.module.css";

export function CurrentAcademicYear() {
  const [year, setYear] = useState<AcademicYear | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCurrentAcademicYear()
      .then((data) => {
        if (!cancelled) {
          setYear(data);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : "Request failed.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p role="alert">{error}</p>;
  }
  if (!year) {
    return <p>Loading current academic year…</p>;
  }

  return (
    <section className={styles.panel}>
      <h1 className={styles.label}>{year.label}</h1>
      <p className={styles.meta}>Start year {year.start_year}</p>
    </section>
  );
}
