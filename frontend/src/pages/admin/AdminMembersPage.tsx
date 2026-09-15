import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { fetchCurrentAcademicYear } from "../../api/academicYear";
import { fetchMembers, updateMembershipStatus, type MemberAdmin } from "../../api/members";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  PageHeader,
  SearchInput,
  Select,
  Spinner,
  StatusBadge,
  SuccessBanner,
  TextArea,
  TextInput,
} from "../../components/ui";
import styles from "../../components/ui.module.css";

export function AdminMembersPage() {
  const [members, setMembers] = useState<MemberAdmin[]>([]);
  const [query, setQuery] = useState("");
  const [yearLabel, setYearLabel] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState("RENEWED");
  const [reason, setReason] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadMembers(search?: string) {
    setLoading(true);
    setError(null);
    try {
      const [memberData, year] = await Promise.all([
        fetchMembers(search),
        fetchCurrentAcademicYear(),
      ]);
      setMembers(memberData.items as MemberAdmin[]);
      setYearLabel(year.label);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load members.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMembers(query || undefined);
  }, [query]);

  const selected = members.find((member) => member.user_id === selectedId) ?? null;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setError(null);
    setSuccess(null);
    try {
      await updateMembershipStatus(selected.user_id, {
        status,
        academic_year: yearLabel,
        reason,
        confirm_full_name: confirmName,
      });
      setSuccess(`Updated membership for ${selected.full_name}.`);
      setConfirmName("");
      setReason("");
      await loadMembers(query || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    }
  }

  return (
    <Card>
      <PageHeader
        title="Admin — Membership"
        subtitle={`Manage membership status for ${yearLabel || "the current academic year"}.`}
      />

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search by name or email…"
      />

      {loading ? <Spinner /> : null}
      {error ? <ErrorState message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      {!loading && members.length === 0 ? (
        <EmptyState message="No members matched your search." />
      ) : null}

      {!loading && members.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.user_id}>
                  <td>{member.full_name}</td>
                  <td className={styles.muted}>{member.email}</td>
                  <td>
                    <StatusBadge status={member.membership_status} />
                  </td>
                  <td>
                    <Button
                      type="button"
                      variant={selectedId === member.user_id ? "primary" : "secondary"}
                      onClick={() => setSelectedId(member.user_id)}
                    >
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {selected ? (
        <form className={styles.statusEditor} onSubmit={onSubmit}>
          <h2>Update {selected.full_name}</h2>
          <div className={styles.formGrid}>
            <FormField label="New status">
              <Select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="RENEWED">RENEWED</option>
                <option value="NOT_RENEWED">NOT_RENEWED</option>
                <option value="PENDING">PENDING</option>
              </Select>
            </FormField>
            <FormField label="Reason">
              <TextArea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
              />
            </FormField>
            <FormField label="Confirm member full name">
              <TextInput
                value={confirmName}
                onChange={(event) => setConfirmName(event.target.value)}
                placeholder={selected.full_name}
                required
              />
            </FormField>
            <Button type="submit" variant="primary">
              Save membership status
            </Button>
          </div>
        </form>
      ) : null}
    </Card>
  );
}
