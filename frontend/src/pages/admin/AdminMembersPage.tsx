import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

import { fetchCurrentAcademicYear } from "../../api/academicYear";
import type { MeResponse } from "../../api/auth";
import {
  fetchMembers,
  updateMemberAccount,
  updateMemberRoles,
  updateMembershipStatus,
  type MemberAdmin,
} from "../../api/members";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  Modal,
  PageHeader,
  PageShell,
  SearchInput,
  Select,
  Spinner,
  StatusBadge,
  SuccessBanner,
  TextArea,
  TextInput,
} from "../../components/ui";
import styles from "../../components/ui.module.css";

const ROLE_OPTIONS = [
  "MEMBER",
  "SUPER_ADMIN",
  "RENEWALS_ADMIN",
  "ACADEMIC_ADMIN",
  "FINANCE_ADMIN",
  "PUBLICITY_ADMIN",
];

export function AdminMembersPage() {
  const me = useOutletContext<MeResponse | null>();
  const canManageRoles = Boolean(me?.permissions.includes("manage_roles"));
  const [members, setMembers] = useState<MemberAdmin[]>([]);
  const [query, setQuery] = useState("");
  const [yearLabel, setYearLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState<MemberAdmin | null>(null);
  const [rolesModal, setRolesModal] = useState<MemberAdmin | null>(null);
  const [deactivateModal, setDeactivateModal] = useState<MemberAdmin | null>(null);
  const [status, setStatus] = useState("RENEWED");
  const [reason, setReason] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [rolesDraft, setRolesDraft] = useState<string[]>(["MEMBER"]);

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

  function openStatus(member: MemberAdmin) {
    setStatusModal(member);
    setStatus(member.membership_status);
  }

  function openRoles(member: MemberAdmin) {
    setRolesModal(member);
    setRolesDraft(member.roles?.length ? member.roles : ["MEMBER"]);
  }

  async function approveMember(member: MemberAdmin) {
    setError(null);
    try {
      await updateMembershipStatus(member.user_id, {
        status: "RENEWED",
        academic_year: yearLabel,
        reason: "Approved by admin",
        confirm_full_name: member.full_name,
      });
      setSuccess(`Approved ${member.full_name}.`);
      await loadMembers(query || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed.");
    }
  }

  async function onStatusSubmit(event: FormEvent) {
    event.preventDefault();
    if (!statusModal) return;
    try {
      await updateMembershipStatus(statusModal.user_id, {
        status,
        academic_year: yearLabel,
        reason,
        confirm_full_name: confirmName,
      });
      setSuccess(`Updated membership for ${statusModal.full_name}.`);
      setStatusModal(null);
      setConfirmName("");
      setReason("");
      await loadMembers(query || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    }
  }

  async function onRolesSubmit(event: FormEvent) {
    event.preventDefault();
    if (!rolesModal) return;
    try {
      await updateMemberRoles(rolesModal.user_id, rolesDraft);
      setSuccess(`Updated roles for ${rolesModal.full_name}.`);
      setRolesModal(null);
      await loadMembers(query || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Role update failed.");
    }
  }

  async function confirmDeactivate() {
    if (!deactivateModal) return;
    try {
      await updateMemberAccount(deactivateModal.user_id, false);
      setSuccess(`Deactivated ${deactivateModal.full_name}.`);
      setDeactivateModal(null);
      await loadMembers(query || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deactivate failed.");
    }
  }

  return (
    <PageShell>
      <Card>
        <PageHeader
          title="Admin — Members"
          subtitle={`Review registrations and manage membership for ${yearLabel || "the current year"}.`}
        />
        <SearchInput value={query} onChange={setQuery} placeholder="Search by name or email…" />
        {loading ? <Spinner /> : null}
        {error ? <ErrorState message={error} /> : null}
        {success ? <SuccessBanner message={success} /> : null}
        {!loading && members.length === 0 ? (
          <EmptyState message="No members matched your search." />
        ) : null}

        {!loading && members.length > 0 ? (
          <>
            <div className={styles.tableWrap}>
              <table className={`${styles.table} ${styles.adminMembersTable}`}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Roles</th>
                    <th>Registered</th>
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
                      <td className={styles.muted}>{(member.roles ?? ["MEMBER"]).join(", ")}</td>
                      <td className={styles.muted}>
                        {member.registered_at
                          ? new Date(member.registered_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className={styles.tableActions}>
                        {member.membership_status === "PENDING" ? (
                          <Button type="button" variant="primary" onClick={() => void approveMember(member)}>
                            Approve
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => openStatus(member)}
                        >
                          Status
                        </Button>
                        {canManageRoles ? (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => openRoles(member)}
                          >
                            Roles
                          </Button>
                        ) : null}
                        <Button type="button" variant="danger" onClick={() => setDeactivateModal(member)}>
                          Deactivate
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.adminMemberCards}>
              {members.map((member) => (
                <article key={member.user_id} className={styles.adminMemberCard}>
                  <h3 className="m-0 text-base text-circuit-navy">{member.full_name}</h3>
                  <p className={styles.muted}>{member.email}</p>
                  <StatusBadge status={member.membership_status} />
                  <div className={styles.adminMemberCardActions}>
                    {member.membership_status === "PENDING" ? (
                      <Button type="button" variant="primary" onClick={() => void approveMember(member)}>
                        Approve
                      </Button>
                    ) : null}
                    <Button type="button" variant="secondary" onClick={() => openStatus(member)}>
                      Status
                    </Button>
                    {canManageRoles ? (
                      <Button type="button" variant="secondary" onClick={() => openRoles(member)}>
                        Roles
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </Card>

      <Modal open={statusModal !== null} title="Change membership status" onClose={() => setStatusModal(null)}>
        {statusModal ? (
          <form className={styles.formGrid} onSubmit={onStatusSubmit}>
            <FormField label="New status">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="RENEWED">RENEWED</option>
                <option value="NOT_RENEWED">NOT_RENEWED</option>
                <option value="PENDING">PENDING</option>
              </Select>
            </FormField>
            <FormField label="Reason">
              <TextArea value={reason} onChange={(e) => setReason(e.target.value)} required />
            </FormField>
            <FormField label="Confirm member full name">
              <TextInput value={confirmName} onChange={(e) => setConfirmName(e.target.value)} required />
            </FormField>
            <Button type="submit" variant="primary">
              Save status
            </Button>
          </form>
        ) : null}
      </Modal>

      <Modal open={canManageRoles && rolesModal !== null} title="Change roles" onClose={() => setRolesModal(null)}>
        {rolesModal ? (
          <form className={styles.formGrid} onSubmit={onRolesSubmit}>
            <FormField label="Roles (comma-separated)">
              <Select
                multiple
                value={rolesDraft}
                onChange={(e) => {
                  const selected = [...e.target.selectedOptions].map((o) => o.value);
                  setRolesDraft(selected.length ? selected : ["MEMBER"]);
                }}
                size={6}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </Select>
            </FormField>
            <Button type="submit" variant="primary">
              Save roles
            </Button>
          </form>
        ) : null}
      </Modal>

      <Modal open={deactivateModal !== null} title="Deactivate member?" onClose={() => setDeactivateModal(null)}>
        <p className="text-sm text-text-secondary">
          Deactivate <strong>{deactivateModal?.full_name}</strong>? They will not be able to sign in.
        </p>
        <div className={styles.modalActions}>
          <Button type="button" variant="secondary" onClick={() => setDeactivateModal(null)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={() => void confirmDeactivate()}>
            Deactivate
          </Button>
        </div>
      </Modal>
    </PageShell>
  );
}
