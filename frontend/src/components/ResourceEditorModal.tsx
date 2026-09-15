import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import {
  createResource,
  fetchResourceCategories,
  updateResource,
  type Resource,
  type ResourceCategory,
} from "../api/resources";
import { Button, FormField, Modal, Select, TextArea, TextInput } from "./ui";

const RESOURCE_TYPES = [
  "GOOGLE_DRIVE",
  "GOOGLE_FORM",
  "GOOGLE_SHEET",
  "GOOGLE_DOC",
  "EXTERNAL_LINK",
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  scope: "academic" | "organizational";
  divisionId?: string | null;
  resource?: Resource | null;
};

export function ResourceEditorModal({
  open,
  onClose,
  onSaved,
  scope,
  divisionId = null,
  resource = null,
}: Props) {
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category_id: "",
    title: "",
    description: "",
    url: "",
    resource_type: "GOOGLE_DRIVE" as (typeof RESOURCE_TYPES)[number],
    display_order: 0,
  });

  useEffect(() => {
    if (!open) return;
    fetchResourceCategories(scope, true)
      .then((data) => {
        setCategories(data.items);
        const first = data.items[0]?.id ?? "";
        if (resource) {
          setForm({
            category_id: resource.category_id,
            title: resource.title,
            description: resource.description ?? "",
            url: resource.url,
            resource_type: resource.resource_type as (typeof RESOURCE_TYPES)[number],
            display_order: resource.display_order,
          });
        } else {
          setForm((current) => ({ ...current, category_id: first }));
        }
      })
      .catch(() => setCategories([]));
  }, [open, scope, resource]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        category_id: form.category_id,
        division_id: divisionId,
        title: form.title,
        description: form.description || null,
        url: form.url,
        resource_type: form.resource_type,
        display_order: form.display_order,
      };
      if (resource) {
        await updateResource(resource.id, body);
      } else {
        await createResource(body);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save resource.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={resource ? "Edit resource" : "Add resource"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="resource-editor-form" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <form id="resource-editor-form" onSubmit={(e) => void onSubmit(e)}>
        <FormField label="Category">
          <Select
            value={form.category_id}
            onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
            required
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Title">
          <TextInput
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </FormField>
        <FormField label="Description">
          <TextArea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
          />
        </FormField>
        <FormField label="URL">
          <TextInput
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            required
            type="url"
          />
        </FormField>
        <FormField label="Type">
          <Select
            value={form.resource_type}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                resource_type: e.target.value as (typeof RESOURCE_TYPES)[number],
              }))
            }
          >
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </FormField>
        {error ? <p className="text-sm text-[var(--danger-text)]">{error}</p> : null}
      </form>
    </Modal>
  );
}
