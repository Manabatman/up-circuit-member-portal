import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { fetchDivisions, updateDivision, type Division } from "../../api/divisions";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  PageHeader,
  Select,
  Spinner,
  SuccessBanner,
  TextArea,
  TextInput,
} from "../../components/ui";
import styles from "../../components/ui.module.css";

export function AdminDivisionsPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    description: "",
    display_order: 0,
    is_active: true,
  });

  async function loadDivisions() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDivisions(true);
      setDivisions(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load divisions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDivisions();
  }, []);

  function startEdit(division: Division) {
    setEditingId(division.id);
    setForm({
      description: division.description ?? "",
      display_order: division.display_order,
      is_active: division.is_active,
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    setError(null);
    setSuccess(null);
    try {
      await updateDivision(editingId, {
        description: form.description || null,
        display_order: form.display_order,
        is_active: form.is_active,
      });
      setSuccess("Division page updated.");
      setEditingId(null);
      await loadDivisions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    }
  }

  return (
    <Card>
      <PageHeader
        title="Admin — Divisions"
        subtitle="Maintain the intro text members see on each division page. Official division names are fixed."
      />

      {loading ? <Spinner /> : null}
      {error ? <ErrorState message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      {!loading && !divisions.length ? <EmptyState message="No divisions found." /> : null}

      {!loading && divisions.length > 0 ? (
        <div className={styles.adminLayout}>
          <div className={styles.adminPanel}>
            <h2 className={styles.adminPanelTitle}>
              {editingId ? "Edit division page intro" : "Select a division to edit"}
            </h2>
            {editingId ? (
              <form className={styles.formGrid} onSubmit={onSubmit}>
                <FormField label="Page intro (description)">
                  <TextArea
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    rows={6}
                    placeholder="The Academic Affairs Division is responsible for…"
                  />
                </FormField>
                <FormField label="Display order">
                  <TextInput
                    type="number"
                    value={String(form.display_order)}
                    onChange={(event) =>
                      setForm({ ...form, display_order: Number(event.target.value) || 0 })
                    }
                  />
                </FormField>
                <FormField label="Active">
                  <Select
                    value={form.is_active ? "true" : "false"}
                    onChange={(event) =>
                      setForm({ ...form, is_active: event.target.value === "true" })
                    }
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Select>
                </FormField>
                <div className={styles.btnRow}>
                  <Button type="submit" variant="primary">
                    Save changes
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <p className={styles.muted}>Choose a division from the list to edit its page intro.</p>
            )}
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Division</th>
                  <th>Active</th>
                  <th>Preview</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {divisions.map((division) => (
                  <tr key={division.id}>
                    <td>{division.name}</td>
                    <td>{division.is_active ? "Yes" : "No"}</td>
                    <td>
                      <Link to={`/divisions/${division.id}`}>View page</Link>
                    </td>
                    <td>
                      <Button type="button" variant="secondary" onClick={() => startEdit(division)}>
                        Edit intro
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
