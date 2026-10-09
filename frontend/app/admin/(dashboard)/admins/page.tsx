// app/admin/(dashboard)/admins/page.tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  listAdmins,
  createAdmin,
  deactivateAdmin,
  deleteAdmin,
  updateAdminDepartments,
  updateAdminMailboxes,
  changeAdminRole,
  getAdminProfile,
  ApiError,
  type AdminSummary,
  type SortOrder,
} from "../../../../lib/admin/api";
import { downloadCsv, todayForFilename } from "../../../../lib/admin/csv";
import {
  MAILBOXES,
  coveredByDepartments,
  departmentLabel,
  mailboxLabel,
  sectionLabel,
  visibleSectionKeys,
} from "../../../../lib/admin/permissions";
import AccessPicker from "../../../components/admin/AccessPicker";
import RowMenu, { type MenuItem } from "../../../components/admin/RowMenu";
import ConfirmDialog from "../../../components/admin/ConfirmDialog";

const inputClass =
  "w-full bg-ink border border-ink-raised rounded-sm px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold";

const labelClass = "block font-body text-sm text-muted-on-paper mb-1.5";

function sameSet(a: string[], b: string[]) {
  return a.length === b.length && a.every((x) => b.includes(x));
}

// Plain-text version, used for the CSV download.
function accessText(a: AdminSummary): string {
  if (a.role !== "admin") return "Full access";
  const parts = [
    ...(a.departments ?? []).map(departmentLabel),
    ...(a.extra_permissions ?? []).map((k) => `+ ${sectionLabel(k)}`),
  ];
  return parts.length > 0 ? parts.join("; ") : "None assigned";
}

// Plain-text mailbox access, used for the CSV download.
function mailboxText(a: AdminSummary): string {
  if (a.role === "system_owner") return "All mailboxes";
  const send = a.mailboxes_send ?? [];
  const readOnly = (a.mailboxes_read ?? []).filter((k) => !send.includes(k));
  const parts = [
    ...send.map((k) => `${mailboxLabel(k)} (read + send)`),
    ...readOnly.map((k) => `${mailboxLabel(k)} (read)`),
  ];
  return parts.length > 0 ? parts.join("; ") : "None assigned";
}

// One quiet line: the pages this person can open, first three then "+N more".
// The full list is in the tooltip and in the Edit access panel.
function AccessSummary({ admin }: { admin: AdminSummary }) {
  if (admin.role !== "admin") {
    return <span className="font-body text-xs text-teal">Full access</span>;
  }

  const labels = visibleSectionKeys(
    admin.departments ?? [],
    admin.extra_permissions ?? []
  ).map(sectionLabel);

  if (labels.length === 0) {
    return <span className="font-body text-xs text-muted">None assigned</span>;
  }

  const more = labels.length - 3;

  return (
    <span
      title={labels.join(", ")}
      className="block max-w-[18rem] truncate font-body text-xs text-muted"
    >
      {labels.slice(0, 3).join(" · ")}
      {more > 0 ? ` · +${more} more` : ""}
    </span>
  );
}

// Which shared mailboxes this person has. Seniors only (plain admins never
// get this data from the API).
function MailboxSummary({ admin }: { admin: AdminSummary }) {
  if (admin.role === "system_owner") {
    return <span className="font-body text-xs text-teal">Mailboxes: all</span>;
  }

  const send = admin.mailboxes_send ?? [];
  const read = admin.mailboxes_read ?? [];

  if (read.length === 0 && send.length === 0) {
    return <span className="font-body text-xs text-muted">Mailboxes: none</span>;
  }

  const labels = read.map((k) =>
    send.includes(k) ? mailboxLabel(k) : `${mailboxLabel(k)} (read)`
  );

  return (
    <span
      title={labels.join(", ")}
      className="block max-w-[18rem] truncate font-body text-xs text-muted"
    >
      Mailboxes: {labels.join(" · ")}
    </span>
  );
}

type PendingAction = {
  kind: "upgrade" | "downgrade" | "deactivate" | "delete";
  admin: AdminSummary;
};

function dialogFor({ kind, admin }: PendingAction) {
  switch (kind) {
    case "upgrade":
      return {
        title: "Upgrade to Super Admin?",
        message: `${admin.full_name} will get full access to everything. Only the system owner can undo this.`,
        confirmText: "Upgrade",
        variant: "warning" as const,
      };
    case "downgrade":
      return {
        title: "Downgrade to Admin?",
        message: `${admin.full_name} will lose full access and only see the pages you give them afterwards.`,
        confirmText: "Downgrade",
        variant: "warning" as const,
      };
    case "deactivate":
      return {
        title: "Deactivate this admin?",
        message: `${admin.full_name} won't be able to sign in anymore.`,
        confirmText: "Deactivate",
        variant: "danger" as const,
      };
    case "delete":
      return {
        title: "Delete this admin permanently?",
        message: `This can't be undone. The username "${admin.username}" becomes available for reuse, and ${admin.full_name}'s name will still appear in past admin logs.`,
        confirmText: "Delete",
        variant: "danger" as const,
      };
  }
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOrder>("alpha");

  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [role, setRole] = useState<"super_admin" | "admin">("admin");
  const [newDepartments, setNewDepartments] = useState<string[]>([]);
  const [newExtras, setNewExtras] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [editing, setEditing] = useState<AdminSummary | null>(null);
  const [editDepartments, setEditDepartments] = useState<string[]>([]);
  const [editExtras, setEditExtras] = useState<string[]>([]);
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Mailbox access panel (system owner only)
  const [mbEditing, setMbEditing] = useState<AdminSummary | null>(null);
  const [mbRead, setMbRead] = useState<string[]>([]);
  const [mbSend, setMbSend] = useState<string[]>([]);
  const [mbError, setMbError] = useState<string | null>(null);
  const [mbLoading, setMbLoading] = useState(false);

  const [pending, setPending] = useState<PendingAction | null>(null);
  const [pendingLoading, setPendingLoading] = useState(false);

  const myProfile = getAdminProfile();
  const isOwner = myProfile?.role === "system_owner";
  const isSenior = isOwner || myProfile?.role === "super_admin";
  // Plain admins only get fellow admins back from the API (the backend does
  // the filtering) and have no actions at all.
  const isViewOnly = !isSenior;

  // The menu only hides things. The API enforces the same rules.
  function canBlockOrDelete(a: AdminSummary) {
    if (a.role === "system_owner") return false;
    return isOwner || (isSenior && a.role === "admin");
  }
  const canUpgrade = (a: AdminSummary) => isSenior && a.role === "admin";
  const canDowngrade = (a: AdminSummary) => isOwner && a.role === "super_admin";
  const canEditAccess = (a: AdminSummary) => isSenior && a.role === "admin";
  // Only the system owner assigns mailboxes, to anyone except themselves.
  const canEditMailboxes = (a: AdminSummary) => isOwner && a.role !== "system_owner";

  function loadAdmins(currentSort: SortOrder = sort) {
    setLoading(true);
    setError(null);
    listAdmins({ sort: currentSort })
      .then(setAdmins)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Couldn't load admins.")
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAdmins(sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (tempPassword.length < 8) {
      setFormError("Temporary password must be at least 8 characters.");
      return;
    }

    setFormLoading(true);
    try {
      await createAdmin({
        full_name: fullName,
        username,
        temp_password: tempPassword,
        role,
        departments: role === "admin" ? newDepartments : [],
        extra_permissions: role === "admin" ? newExtras : [],
      });
      setFullName("");
      setUsername("");
      setTempPassword("");
      setRole("admin");
      setNewDepartments([]);
      setNewExtras([]);
      setShowForm(false);
      loadAdmins();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Couldn't create admin.");
    } finally {
      setFormLoading(false);
    }
  }

  // The menu only picks the action; the dialog confirms it, then it runs.
  const handleUpgrade = (admin: AdminSummary) => setPending({ kind: "upgrade", admin });
  const handleDowngrade = (admin: AdminSummary) => setPending({ kind: "downgrade", admin });
  const handleDeactivate = (admin: AdminSummary) => setPending({ kind: "deactivate", admin });
  const handleDelete = (admin: AdminSummary) => setPending({ kind: "delete", admin });

  async function runPending() {
    if (!pending) return;
    const { kind, admin } = pending;

    setPendingLoading(true);
    try {
      if (kind === "upgrade") await changeAdminRole(admin.id, "super_admin");
      if (kind === "downgrade") await changeAdminRole(admin.id, "admin");
      if (kind === "deactivate") await deactivateAdmin(admin.id);
      if (kind === "delete") await deleteAdmin(admin.id);

      setPending(null);
      loadAdmins();
    } catch (err) {
      setPending(null);
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setPendingLoading(false);
    }
  }

  function startEditing(admin: AdminSummary) {
    setEditing(admin);
    setEditDepartments(admin.departments ?? []);
    setEditExtras(admin.extra_permissions ?? []);
    setEditError(null);
  }

  function closeAccess() {
    if (editLoading) return;
    setEditing(null);
    setEditError(null);
  }

  // --- Mailbox access panel ---

  function startEditingMailboxes(admin: AdminSummary) {
    const send = admin.mailboxes_send ?? [];
    // Sending implies reading, so the read list always includes send.
    const read = Array.from(new Set([...(admin.mailboxes_read ?? []), ...send]));
    setMbEditing(admin);
    setMbRead(read);
    setMbSend(send);
    setMbError(null);
  }

  function closeMailboxes() {
    if (mbLoading) return;
    setMbEditing(null);
    setMbError(null);
  }

  function toggleMbRead(key: string) {
    if (mbRead.includes(key)) {
      // No read access means no send access either.
      setMbRead(mbRead.filter((k) => k !== key));
      setMbSend(mbSend.filter((k) => k !== key));
    } else {
      setMbRead([...mbRead, key]);
    }
  }

  function toggleMbSend(key: string) {
    if (mbSend.includes(key)) {
      setMbSend(mbSend.filter((k) => k !== key));
    } else {
      setMbSend([...mbSend, key]);
      if (!mbRead.includes(key)) setMbRead([...mbRead, key]);
    }
  }

  // Escape closes whichever panel is open.
  useEffect(() => {
    if (!editing && !mbEditing) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (mbEditing) closeMailboxes();
      else closeAccess();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, editLoading, mbEditing, mbLoading]);

  // Pages a department already opens don't need to be saved on their own.
  const editCovered = coveredByDepartments(editDepartments);
  const editExtrasClean = editExtras.filter((k) => !editCovered.has(k));
  const dirty = editing
    ? !(
        sameSet(editDepartments, editing.departments ?? []) &&
        sameSet(editExtrasClean, editing.extra_permissions ?? [])
      )
    : false;

  const mbDirty = mbEditing
    ? !(
        sameSet(
          mbRead,
          Array.from(
            new Set([...(mbEditing.mailboxes_read ?? []), ...(mbEditing.mailboxes_send ?? [])])
          )
        ) && sameSet(mbSend, mbEditing.mailboxes_send ?? [])
      )
    : false;

  // Mailbox grants do nothing without the Messages section.
  const mbMissingMessages =
    mbEditing?.role === "admin" &&
    !visibleSectionKeys(
      mbEditing.departments ?? [],
      mbEditing.extra_permissions ?? []
    ).includes("messages");

  async function handleSaveAccess() {
    if (!editing) return;
    setEditError(null);
    setEditLoading(true);
    try {
      await updateAdminDepartments(editing.id, editDepartments, editExtrasClean);
      setEditing(null);
      loadAdmins();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "Couldn't save access.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleSaveMailboxes() {
    if (!mbEditing) return;
    setMbError(null);
    setMbLoading(true);
    try {
      const res = await updateAdminMailboxes(mbEditing.id, mbRead, mbSend);
      setNotice(res.message);
      setMbEditing(null);
      loadAdmins();
    } catch (err) {
      setMbError(err instanceof ApiError ? err.message : "Couldn't save mailbox access.");
    } finally {
      setMbLoading(false);
    }
  }

  function menuItems(a: AdminSummary): MenuItem[] {
    const items: MenuItem[] = [];
    if (canEditAccess(a)) {
      items.push({ label: "Edit access…", onClick: () => startEditing(a) });
    }
    if (canEditMailboxes(a)) {
      items.push({
        label: "Mailbox access…",
        onClick: () => startEditingMailboxes(a),
      });
    }
    if (canUpgrade(a)) {
      items.push({
        label: "Upgrade to super admin",
        tone: "gold",
        onClick: () => handleUpgrade(a),
      });
    }
    if (canDowngrade(a)) {
      items.push({
        label: "Downgrade to admin",
        tone: "gold",
        onClick: () => handleDowngrade(a),
      });
    }
    if (a.is_active && canBlockOrDelete(a)) {
      items.push({
        label: "Deactivate",
        tone: "danger",
        onClick: () => handleDeactivate(a),
      });
    }
    if (canBlockOrDelete(a)) {
      items.push({
        label: "Delete…",
        tone: "danger",
        onClick: () => handleDelete(a),
      });
    }
    return items;
  }

  function statusText(a: AdminSummary) {
    if (!a.is_active) return <span className="text-red">Deactivated</span>;
    if (a.must_change_password)
      return <span className="text-gold">Awaiting first login</span>;
    return <span className="text-teal">Active</span>;
  }

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl text-cream">Admins</h1>
        {isSenior && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="font-body text-sm bg-gold text-ink rounded-sm px-4 py-2 hover:bg-gold/90"
          >
            {showForm ? "Cancel" : "Create admin"}
          </button>
        )}
      </div>

      {isViewOnly ? (
        <p className="font-body text-xs text-muted mb-6">
          You can see who your fellow admins are, but not the pages they've been given. This page is view-only for your role.
        </p>
      ) : (
        <div className="mb-6" />
      )}

      {notice && (
        <p className="font-body text-sm text-teal mb-4">{notice}</p>
      )}

      {showForm && isSenior && (
        <form
          onSubmit={handleCreate}
          className="border border-ink-raised rounded-sm p-5 sm:p-6 mb-8 space-y-6"
        >
          <div>
            <h2 className="font-display text-xl text-cream">New admin</h2>
            <p className="font-body text-xs text-muted mt-1">
              Tell them the temporary password directly. They'll be asked to
              choose their own on first sign-in.
              {isOwner && " Mailboxes can be assigned from the menu once they're created."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Full name</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Username</label>
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Temporary password</label>
              <input
                required
                type="text"
                minLength={8}
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "super_admin" | "admin")}
                className={inputClass}
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>

          {role === "admin" ? (
            <div className="border-t border-ink-raised pt-6">
              <h3 className="font-body text-sm text-muted-on-paper mb-4">
                What can they open?
              </h3>
              <AccessPicker
                departments={newDepartments}
                extras={newExtras}
                onDepartmentsChange={setNewDepartments}
                onExtrasChange={setNewExtras}
              />
            </div>
          ) : (
            <p className="border-t border-ink-raised pt-6 font-body text-xs text-muted">
              Super admins get full access to every section.
            </p>
          )}

          {formError && <p className="font-body text-sm text-red">{formError}</p>}

          <button
            type="submit"
            disabled={formLoading}
            className="font-body text-sm bg-gold text-ink rounded-sm px-5 py-2 disabled:opacity-60"
          >
            {formLoading ? "Creating…" : "Create admin"}
          </button>
        </form>
      )}

      <div className="flex items-center justify-end gap-3 mb-3">
        <button
          onClick={() =>
            downloadCsv(`admins-${todayForFilename()}`, admins, [
              { header: "Full name", value: (a) => a.full_name },
              { header: "Username", value: (a) => a.username },
              { header: "Role", value: (a) => a.role },
              ...(isViewOnly
                ? []
                : [
                    { header: "Access", value: (a: AdminSummary) => accessText(a) },
                    { header: "Mailboxes", value: (a: AdminSummary) => mailboxText(a) },
                  ]),
              {
                header: "Status",
                value: (a) =>
                  !a.is_active
                    ? "Deactivated"
                    : a.must_change_password
                    ? "Awaiting first login"
                    : "Active",
              },
              { header: "Last login", value: (a) => a.last_login_at || "" },
            ])
          }
          disabled={admins.length === 0}
          className="font-body text-xs rounded-sm px-3 py-1.5 border border-ink-raised text-muted hover:text-cream hover:border-teal/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ⭳ Download CSV
        </button>

        <div className="flex items-center gap-1.5">
          <span className="font-body text-xs text-muted mr-1">Sort:</span>
          {(["alpha", "recent"] as SortOrder[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`font-body text-xs rounded-sm px-3 py-1.5 border transition-colors ${
                sort === s
                  ? "border-gold text-gold bg-gold/10"
                  : "border-ink-raised text-muted hover:text-cream"
              }`}
            >
              {s === "alpha" ? "A–Z" : "Most recent"}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="font-body text-sm text-muted">Loading…</p>}
      {error && <p className="font-body text-sm text-red">{error}</p>}

      {!loading && (
        <>
          {/* Phones: one card per admin */}
          <div className="md:hidden space-y-3">
            {admins.length === 0 ? (
              <p className="border border-ink-raised rounded-sm px-4 py-8 text-center font-body text-sm text-muted">
                No admins found.
              </p>
            ) : (
              admins.map((a) => (
                <div
                  key={a.id}
                  className="border border-ink-raised rounded-sm p-4 font-body text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-cream break-words">{a.full_name}</p>
                      <p className="text-xs text-muted break-all">{a.username}</p>
                    </div>
                    <span className="shrink-0 text-xs text-right">
                      {statusText(a)}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-muted capitalize">
                    {a.role.replace("_", " ")}
                  </p>
                  {!isViewOnly && (
                    <>
                      <p className="mt-1">
                        <AccessSummary admin={a} />
                      </p>
                      <p className="mt-1">
                        <MailboxSummary admin={a} />
                      </p>
                    </>
                  )}

                  {!isViewOnly && menuItems(a).length > 0 && (
                    <div className="mt-3 flex justify-end">
                      <RowMenu items={menuItems(a)} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Larger screens: table */}
          <div className="hidden md:block border border-ink-raised rounded-sm overflow-x-auto">
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="border-b border-ink-raised text-left">
                  <th className="px-4 py-3 text-muted-on-paper font-medium">Name</th>
                  {!isViewOnly && (
                    <th className="px-4 py-3 text-muted-on-paper font-medium">Access</th>
                  )}
                  <th className="px-4 py-3 text-muted-on-paper font-medium">Status</th>
                  {!isViewOnly && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={isViewOnly ? 2 : 4} className="px-4 py-8 text-center text-muted">
                      No admins found.
                    </td>
                  </tr>
                ) : (
                  admins.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-ink-raised last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <span className="text-cream">{a.full_name}</span>
                        <span className="block text-xs text-muted">
                          {a.username} ·{" "}
                          <span className="capitalize">{a.role.replace("_", " ")}</span>
                        </span>
                      </td>
                      {!isViewOnly && (
                        <td className="px-4 py-3 space-y-1">
                          <AccessSummary admin={a} />
                          <MailboxSummary admin={a} />
                        </td>
                      )}
                      <td className="px-4 py-3">{statusText(a)}</td>
                      {!isViewOnly && (
                        <td className="px-4 py-3 text-right">
                          <RowMenu items={menuItems(a)} />
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Access panel: slides in from the right, like the registrant panel */}
      <div
        className={`fixed inset-0 z-40 bg-ink/70 transition-opacity duration-300 ${
          editing ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeAccess}
        aria-hidden="true"
      />

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-lg transform flex-col border-l border-ink-raised bg-ink transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          editing ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Edit access"
      >
        {editing && (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-ink-raised px-6 py-5">
              <div className="min-w-0">
                <p className="mb-1 font-body text-xs uppercase tracking-wide text-muted">
                  Edit access
                </p>
                <h2 className="font-display text-2xl text-cream break-words">
                  {editing.full_name}
                </h2>
                <p className="font-body text-sm text-muted break-all">
                  {editing.username}
                </p>
              </div>

              <button
                type="button"
                onClick={closeAccess}
                aria-label="Close"
                className="rounded-sm px-2 text-xl leading-none text-muted hover:text-cream focus:outline-none focus:ring-2 focus:ring-gold"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <AccessPicker
                departments={editDepartments}
                extras={editExtras}
                onDepartmentsChange={setEditDepartments}
                onExtrasChange={setEditExtras}
              />

              {editError && (
                <p className="mt-5 font-body text-sm text-red">{editError}</p>
              )}
            </div>

            <div className="border-t border-ink-raised px-6 py-4">
              <p className="mb-3 font-body text-xs text-muted">
                Changes show on their screen within about 30 seconds. They don't
                need to sign out.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveAccess}
                  disabled={editLoading || !dirty}
                  className="flex-1 rounded-sm bg-gold py-2.5 font-body text-sm text-ink disabled:opacity-50"
                >
                  {editLoading ? "Saving…" : dirty ? "Save access" : "No changes yet"}
                </button>
                <button
                  type="button"
                  onClick={closeAccess}
                  disabled={editLoading}
                  className="rounded-sm border border-ink-raised px-5 py-2.5 font-body text-sm text-muted hover:text-cream disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mailbox access panel (system owner only) */}
      <div
        className={`fixed inset-0 z-40 bg-ink/70 transition-opacity duration-300 ${
          mbEditing ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeMailboxes}
        aria-hidden="true"
      />

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-lg transform flex-col border-l border-ink-raised bg-ink transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          mbEditing ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mailbox access"
      >
        {mbEditing && (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-ink-raised px-6 py-5">
              <div className="min-w-0">
                <p className="mb-1 font-body text-xs uppercase tracking-wide text-muted">
                  Mailbox access
                </p>
                <h2 className="font-display text-2xl text-cream break-words">
                  {mbEditing.full_name}
                </h2>
                <p className="font-body text-sm text-muted break-all">
                  {mbEditing.username}
                </p>
              </div>

              <button
                type="button"
                onClick={closeMailboxes}
                aria-label="Close"
                className="rounded-sm px-2 text-xl leading-none text-muted hover:text-cream focus:outline-none focus:ring-2 focus:ring-gold"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <p className="mb-4 font-body text-xs text-muted">
                <strong className="text-cream">Read</strong> lets them see and open mail
                in that mailbox. <strong className="text-cream">Send</strong> also lets
                them reply, close conversations and write new emails from it.
              </p>

              {mbMissingMessages && (
                <p className="mb-4 rounded-sm border border-gold/50 bg-gold/10 px-3 py-2 font-body text-xs text-gold">
                  {mbEditing.full_name} doesn't have the Messages section yet, so these
                  mailboxes won't show up for them. Give them Messaging &amp; Support (or
                  the Messages section) in Edit access.
                </p>
              )}

              <div className="border border-ink-raised rounded-sm">
                <div className="grid grid-cols-[1fr_4rem_4rem] gap-2 border-b border-ink-raised px-4 py-2 font-body text-xs text-muted">
                  <span>Mailbox</span>
                  <span className="text-center">Read</span>
                  <span className="text-center">Send</span>
                </div>

                {MAILBOXES.map((m) => (
                  <div
                    key={m.key}
                    className="grid grid-cols-[1fr_4rem_4rem] items-center gap-2 border-b border-ink-raised px-4 py-3 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="font-body text-sm text-cream">{m.label}</p>
                      <p className="font-body text-xs text-muted truncate">{m.address}</p>
                    </div>
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        aria-label={`Read ${m.label}`}
                        checked={mbRead.includes(m.key)}
                        onChange={() => toggleMbRead(m.key)}
                        className="h-4 w-4 accent-gold"
                      />
                    </div>
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        aria-label={`Send from ${m.label}`}
                        checked={mbSend.includes(m.key)}
                        onChange={() => toggleMbSend(m.key)}
                        className="h-4 w-4 accent-gold"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {mbError && (
                <p className="mt-5 font-body text-sm text-red">{mbError}</p>
              )}
            </div>

            <div className="border-t border-ink-raised px-6 py-4">
              <p className="mb-3 font-body text-xs text-muted">
                Changes take effect on their very next action. Only the System Owner can
                change mailbox access.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveMailboxes}
                  disabled={mbLoading || !mbDirty}
                  className="flex-1 rounded-sm bg-gold py-2.5 font-body text-sm text-ink disabled:opacity-50"
                >
                  {mbLoading
                    ? "Saving…"
                    : mbDirty
                    ? "Save mailbox access"
                    : "No changes yet"}
                </button>
                <button
                  type="button"
                  onClick={closeMailboxes}
                  disabled={mbLoading}
                  className="rounded-sm border border-ink-raised px-5 py-2.5 font-body text-sm text-muted hover:text-cream disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {pending && (
        <ConfirmDialog
          open
          title={dialogFor(pending).title}
          message={dialogFor(pending).message}
          confirmText={dialogFor(pending).confirmText}
          cancelText="Cancel"
          loading={pendingLoading}
          variant={dialogFor(pending).variant}
          onConfirm={runPending}
          onCancel={() => {
            if (!pendingLoading) setPending(null);
          }}
        />
      )}
    </div>
  );
}