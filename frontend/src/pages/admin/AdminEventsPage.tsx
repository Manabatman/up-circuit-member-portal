import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import {
  createEvent,
  deleteEvent,
  fetchEvents,
  updateEvent,
  type PortalEvent,
} from "../../api/events";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  Modal,
  PageHeader,
  PageShell,
  Select,
  Spinner,
  SuccessBanner,
  TextArea,
  TextInput,
} from "../../components/ui";
import styles from "../../components/ui.module.css";

const CATEGORIES = ["ACADEMIC", "MEMBERSHIP", "ORGANIZATION", "EVENT", "DEADLINE"] as const;

type FormState = {
  title: string;
  description: string;
  category: (typeof CATEGORIES)[number];
  starts_on: string;
  ends_on: string;
  is_flagship: boolean;
  link_url: string;
  image_url: string;
};

const emptyForm = (): FormState => ({
  title: "",
  description: "",
  category: "EVENT",
  starts_on: "",
  ends_on: "",
  is_flagship: false,
  link_url: "",
  image_url: "",
});

export function AdminEventsPage() {
  const [events, setEvents] = useState<PortalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PortalEvent | null>(null);
  const [editing, setEditing] = useState<PortalEvent | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEvents();
      setEvents(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setEditorOpen(true);
  }

  function openEdit(event: PortalEvent) {
    setEditing(event);
    setForm({
      title: event.title,
      description: event.description ?? "",
      category: event.category as FormState["category"],
      starts_on: event.starts_on,
      ends_on: event.ends_on ?? "",
      is_flagship: event.is_flagship,
      link_url: event.link_url ?? "",
      image_url: event.image_url ?? "",
    });
    setEditorOpen(true);
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      starts_on: form.starts_on,
      ends_on: form.ends_on.trim() || null,
      is_flagship: form.is_flagship,
      link_url: form.link_url.trim() || null,
      image_url: form.image_url.trim() || null,
    };
    try {
      if (editing) {
        await updateEvent(editing.id, payload);
        setSuccess("Event updated.");
      } else {
        await createEvent(payload);
        setSuccess("Event created.");
      }
      setEditorOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteEvent(deleteTarget.id);
      setSuccess("Event deleted.");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  return (
    <PageShell>
      <Card>
        <PageHeader
          title="Admin — Events"
          subtitle="Calendar entries and flagship events members see on the portal."
        />
        <div className={styles.contextualAdminBar}>
          <Button type="button" variant="primary" onClick={openCreate}>
            + Add event
          </Button>
        </div>
        {loading ? <Spinner /> : null}
        {error ? <ErrorState message={error} /> : null}
        {success ? <SuccessBanner message={success} /> : null}
        {!loading && events.length === 0 ? (
          <EmptyState message="No events yet. Add your first calendar or flagship event." />
        ) : null}
        {!loading && events.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Dates</th>
                  <th>Flagship</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.title}</td>
                    <td className={styles.muted}>
                      {event.starts_on}
                      {event.ends_on ? ` – ${event.ends_on}` : ""}
                    </td>
                    <td>{event.is_flagship ? "Yes" : "No"}</td>
                    <td className={styles.tableActions}>
                      <Button type="button" variant="secondary" onClick={() => openEdit(event)}>
                        Edit
                      </Button>
                      <Button type="button" variant="danger" onClick={() => setDeleteTarget(event)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>

      <Modal open={editorOpen} title={editing ? "Edit event" : "Add event"} onClose={() => setEditorOpen(false)}>
        <form className={styles.formGrid} onSubmit={onSave}>
          <FormField label="Title">
            <TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </FormField>
          <FormField label="Description">
            <TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </FormField>
          <FormField label="Category">
            <Select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value as FormState["category"] })
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Start date">
            <TextInput
              type="date"
              value={form.starts_on}
              onChange={(e) => setForm({ ...form, starts_on: e.target.value })}
              required
            />
          </FormField>
          <FormField label="End date (optional)">
            <TextInput
              type="date"
              value={form.ends_on}
              onChange={(e) => setForm({ ...form, ends_on: e.target.value })}
            />
          </FormField>
          <FormField label="Flagship event">
            <Select
              value={form.is_flagship ? "yes" : "no"}
              onChange={(e) => setForm({ ...form, is_flagship: e.target.value === "yes" })}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </Select>
          </FormField>
          <FormField label="Link URL (optional)">
            <TextInput value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
          </FormField>
          <FormField label="Image path (optional)">
            <TextInput value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          </FormField>
          <Button type="submit" variant="primary">
            Save event
          </Button>
        </form>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        title="Delete event?"
        onClose={() => setDeleteTarget(null)}
      >
        <p className="text-sm text-text-secondary">
          Delete <strong>{deleteTarget?.title}</strong>? Members will no longer see it on the calendar.
        </p>
        <div className={styles.modalActions}>
          <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={() => void confirmDelete()}>
            Delete event
          </Button>
        </div>
      </Modal>
    </PageShell>
  );
}
