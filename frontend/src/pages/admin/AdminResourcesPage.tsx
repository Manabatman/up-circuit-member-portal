import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { fetchDivisions, type Division } from "../../api/divisions";
import {
  createResource,
  createResourceCategory,
  deactivateResource,
  fetchResourceCategories,
  fetchResources,
  updateResource,
  updateResourceCategory,
  type Resource,
  type ResourceCategory,
} from "../../api/resources";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  PageHeader,
  SegmentedControl,
  Select,
  Spinner,
  SuccessBanner,
  TextInput,
  TextArea,
} from "../../components/ui";
import styles from "../../components/ui.module.css";

const RESOURCE_TYPES = [
  "GOOGLE_DRIVE",
  "GOOGLE_FORM",
  "GOOGLE_SHEET",
  "GOOGLE_DOC",
  "EXTERNAL_LINK",
] as const;

const SCOPE_API = {
  academic: "ACADEMIC" as const,
  organizational: "ORGANIZATIONAL" as const,
};

export function AdminResourcesPage() {
  const [scope, setScope] = useState<"academic" | "organizational">("academic");
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    display_order: 0,
    is_active: true,
  });
  const [form, setForm] = useState({
    category_id: "",
    division_id: "",
    title: "",
    description: "",
    url: "",
    resource_type: "GOOGLE_DRIVE",
    display_order: 0,
  });

  async function loadData(selectedScope: "academic" | "organizational") {
    setLoading(true);
    setError(null);
    try {
      const requests = [
        fetchResources(selectedScope, true),
        fetchResourceCategories(selectedScope, true),
      ] as const;
      const [resourceData, categoryData] = await Promise.all(requests);
      setResources(resourceData.items);
      setCategories(categoryData.items);
      if (selectedScope === "organizational") {
        const divisionData = await fetchDivisions(true);
        setDivisions(divisionData.items);
      } else {
        setDivisions([]);
      }
      if (!form.category_id && categoryData.items[0]) {
        setForm((current) => ({ ...current, category_id: categoryData.items[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load admin resources.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData(scope);
  }, [scope]);

  function resetForm() {
    setEditingId(null);
    setForm({
      category_id: categories[0]?.id ?? "",
      division_id: "",
      title: "",
      description: "",
      url: "",
      resource_type: "GOOGLE_DRIVE",
      display_order: 0,
    });
  }

  function resetCategoryForm() {
    setEditingCategoryId(null);
    setCategoryForm({
      name: "",
      description: "",
      display_order: 0,
      is_active: true,
    });
  }

  function startEdit(resource: Resource) {
    setEditingId(resource.id);
    setForm({
      category_id: resource.category_id,
      division_id: resource.division_id ?? "",
      title: resource.title,
      description: resource.description ?? "",
      url: resource.url,
      resource_type: resource.resource_type,
      display_order: resource.display_order,
    });
  }

  function startEditCategory(category: ResourceCategory) {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      description: category.description ?? "",
      display_order: category.display_order,
      is_active: category.is_active,
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const divisionId = form.division_id || null;
    try {
      if (editingId) {
        await updateResource(editingId, {
          category_id: form.category_id,
          division_id: divisionId,
          title: form.title,
          description: form.description || null,
          url: form.url,
          resource_type: form.resource_type,
          display_order: form.display_order,
        });
        setSuccess("Resource updated.");
      } else {
        await createResource({
          category_id: form.category_id,
          division_id: divisionId,
          title: form.title,
          description: form.description || null,
          url: form.url,
          resource_type: form.resource_type,
          display_order: form.display_order,
        });
        setSuccess("Resource created.");
      }
      resetForm();
      await loadData(scope);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    }
  }

  async function onCategorySubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      if (editingCategoryId) {
        await updateResourceCategory(editingCategoryId, {
          name: categoryForm.name,
          description: categoryForm.description || null,
          display_order: categoryForm.display_order,
          is_active: categoryForm.is_active,
        });
        setSuccess("Category updated.");
      } else {
        await createResourceCategory({
          scope: SCOPE_API[scope],
          name: categoryForm.name,
          description: categoryForm.description || null,
          display_order: categoryForm.display_order,
        });
        setSuccess("Category created.");
      }
      resetCategoryForm();
      await loadData(scope);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Category save failed.");
    }
  }

  async function onDeactivate(resourceId: string) {
    setError(null);
    setSuccess(null);
    try {
      await deactivateResource(resourceId);
      setSuccess("Resource deactivated.");
      await loadData(scope);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deactivate failed.");
    }
  }

  return (
    <Card>
      <PageHeader
        title="Admin — Resources"
        subtitle="Manage categories and resource links shown to members without redeploying the app."
        actions={
          <SegmentedControl
            value={scope}
            options={[
              { value: "academic", label: "Academic" },
              { value: "organizational", label: "Organizational" },
            ]}
            onChange={setScope}
            ariaLabel="Resource scope"
          />
        }
      />

      <p className={styles.adminHelpText}>
        A <strong>category</strong> is a section on a member page. A <strong>resource</strong> is one
        link (Drive, Form, Sheet, Doc, or external URL). Optionally assign a{" "}
        <strong>division</strong> so the link appears on that division&apos;s page instead of global
        Resources. Use <strong>display order</strong> to control sort order (lower numbers appear
        first).
      </p>

      {loading ? <Spinner /> : null}
      {error ? <ErrorState message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      {!loading ? (
        <>
          <section className={styles.categoryAdminPanel}>
            <h2 className={styles.adminPanelTitle}>
              {editingCategoryId ? "Edit category" : "Create category"}
            </h2>
            <form className={styles.formGrid} onSubmit={onCategorySubmit}>
              <FormField label="Name">
                <TextInput
                  value={categoryForm.name}
                  onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
                  required
                />
              </FormField>
              <FormField label="Description">
                <TextArea
                  value={categoryForm.description}
                  onChange={(event) =>
                    setCategoryForm({ ...categoryForm, description: event.target.value })
                  }
                />
              </FormField>
              <FormField label="Display order">
                <TextInput
                  type="number"
                  value={String(categoryForm.display_order)}
                  onChange={(event) =>
                    setCategoryForm({
                      ...categoryForm,
                      display_order: Number(event.target.value) || 0,
                    })
                  }
                />
              </FormField>
              {editingCategoryId ? (
                <FormField label="Active">
                  <Select
                    value={categoryForm.is_active ? "true" : "false"}
                    onChange={(event) =>
                      setCategoryForm({
                        ...categoryForm,
                        is_active: event.target.value === "true",
                      })
                    }
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Select>
                </FormField>
              ) : null}
              <div className={styles.btnRow}>
                <Button type="submit" variant="primary">
                  {editingCategoryId ? "Save category" : "Create category"}
                </Button>
                {editingCategoryId ? (
                  <Button type="button" variant="secondary" onClick={resetCategoryForm}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
            {categories.length > 0 ? (
              <ul className={styles.categoryAdminList}>
                {categories.map((category) => (
                  <li key={category.id} className={styles.categoryAdminRow}>
                    <div>
                      <div className={styles.categoryAdminName}>{category.name}</div>
                      <div className={styles.categoryAdminMeta}>
                        Order {category.display_order} · {category.is_active ? "Active" : "Inactive"}
                      </div>
                    </div>
                    <Button type="button" variant="secondary" onClick={() => startEditCategory(category)}>
                      Edit
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState message="No categories in this scope yet." />
            )}
          </section>

          <div className={styles.adminLayout}>
            <div className={styles.adminPanel}>
              <h2 className={styles.adminPanelTitle}>
                {editingId ? "Edit resource" : "Create resource"}
              </h2>
              <form className={styles.formGrid} onSubmit={onSubmit}>
                <FormField label="Category">
                  <Select
                    value={form.category_id}
                    onChange={(event) => setForm({ ...form, category_id: event.target.value })}
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
                {scope === "organizational" ? (
                  <FormField label="Division (optional)">
                    <Select
                      value={form.division_id}
                      onChange={(event) => setForm({ ...form, division_id: event.target.value })}
                    >
                      <option value="">Global Resources page</option>
                      {divisions.map((division) => (
                        <option key={division.id} value={division.id}>
                          {division.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                ) : null}
                <FormField label="Title">
                  <TextInput
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    required
                  />
                </FormField>
                <FormField label="Description">
                  <TextArea
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                  />
                </FormField>
                <FormField label="URL">
                  <TextInput
                    value={form.url}
                    onChange={(event) => setForm({ ...form, url: event.target.value })}
                    required
                  />
                </FormField>
                <FormField label="Type">
                  <Select
                    value={form.resource_type}
                    onChange={(event) => setForm({ ...form, resource_type: event.target.value })}
                  >
                    {RESOURCE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.replaceAll("_", " ")}
                      </option>
                    ))}
                  </Select>
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
                <div className={styles.btnRow}>
                  <Button type="submit" variant="primary">
                    {editingId ? "Save changes" : "Create resource"}
                  </Button>
                  {editingId ? (
                    <Button type="button" variant="secondary" onClick={resetForm}>
                      Cancel edit
                    </Button>
                  ) : null}
                </div>
              </form>
            </div>

            <div>
              {!resources.length ? (
                <EmptyState message="No resources in this scope yet." />
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Division</th>
                        <th>URL</th>
                        <th>Active</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resources.map((resource) => (
                        <tr key={resource.id}>
                          <td>{resource.title}</td>
                          <td className={styles.muted}>
                            {resource.division_id
                              ? divisions.find((d) => d.id === resource.division_id)?.name ?? "Division"
                              : "Global"}
                          </td>
                          <td className={`${styles.muted} ${styles.tableUrlCell}`}>
                            {resource.url}
                          </td>
                          <td>{resource.is_active ? "Yes" : "No"}</td>
                          <td>
                            <div className={styles.btnRow}>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => startEdit(resource)}
                              >
                                Edit
                              </Button>
                              {resource.is_active ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => void onDeactivate(resource.id)}
                                >
                                  Deactivate
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </Card>
  );
}
