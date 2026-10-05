// app/admin/(dashboard)/admins/page.tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  listAdmins,
  createAdmin,
  deactivateAdmin,
  deleteAdmin,
  updateAdminDepartments,
  changeAdminRole,
  getAdminProfile,
  ApiError,
  type AdminSummary,
  type SortOrder,
} from "../../../../lib/admin/api";
import { downloadCsv, todayForFilename } from "../../../../lib/admin/csv";
import {
  coveredByDepartments,
  departmentLabel,
  sectionLabel,
} from "../../../../lib/admin/permissions";
import AccessPicker from "../../../components/admin/AccessPicker";
import RowMenu, { type MenuItem } from "../../../components/admin/RowMenu";

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

// Departments as quiet chips, single pages as gold "+" chips.
function AccessChips({ admin }: { admin: AdminSummary }) {
  if (admin.role !== "admin") {
    return (
      <span className="rounded-full border border-teal/40 bg-teal/10 px-2.5 py-0.5 font-body text-[11px] text-teal">
        Full access
      </span>
    );
  }

  const departments = admin.departments ?? [];
  const extras = admin.extra_permissions ?? [];

  if (departments.length === 0 && extras.length === 0) {
    return <span className="font-body text-xs text-muted">None assigned</span>;
  }

  return (
    <span className="flex flex-wrap gap-1.5">
      {departments.map((k) => (
        <span
          key={k}
          className="rounded-full bg-ink-raised px-2.5 py-0.5 font-body text-[11px] text-cream"
        >
          {departmentLabel(k)}
        </span>
      ))}
      {extras.map((k) => (
        <span
          key={k}
          className="rounded-full border border-gold/50 px-2.5 py-0.5 font-body text-[11px] text-gold"
        >
          + {sectionLabel(k)}
        </span>
      ))}
    </span>
  );
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  async function handleDeactivate(admin: AdminSummary) {
    if (!confirm(`Deactivate ${admin.full_name}? They won't be able to log in anymore.`)) {
      return;
    }
    try {
      await deactivateAdmin(admin.id);
      loadAdmins();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't deactivate admin.");
    }
  }

  async function handleDelete(admin: AdminSummary) {
    if (
      !confirm(
        `Permanently delete ${admin.full_name}? This can't be undone. Their username ("${admin.username}") will become available for reuse. Their name will still appear in past admin logs.`
      )
    ) {
      return;
    }
    try {
      await deleteAdmin(admin.id);
      loadAdmins();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't delete admin.");
    }
  }

  async function handleUpgrade(admin: AdminSummary) {
    if (
      !confirm(
        `Upgrade ${admin.full_name} to Super Admin? They'll get full access to everything, and only the system owner can undo this.`
      )
    ) {
      return;
    }
    try {
      await changeAdminRole(admin.id, "super_admin");
      loadAdmins();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't upgrade admin.");
    }
  }

  async function handleDowngrade(admin: AdminSummary) {
    if (
      !confirm(
        `Downgrade ${admin.full_name} to Admin? They'll lose full access and only see the departments you assign to them afterwards.`
      )
    ) {
      return;
    }
    try {
      await changeAdminRole(admin.id, "admin");
      loadAdmins();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't downgrade admin.");
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

  // Escape closes the access panel.
  useEffect(() => {
    if (!editing) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeAccess();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, editLoading]);

  // Pages a department already opens don't need to be saved on their own.
  const editCovered = coveredByDepartments(editDepartments);
  const editExtrasClean = editExtras.filter((k) => !editCovered.has(k));
  const dirty = editing
    ? !(
        sameSet(editDepartments, editing.departments ?? []) &&
        sameSet(editExtrasClean, editing.extra_permissions ?? [])
      )
    : false;

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

  function menuItems(a: AdminSummary): MenuItem[] {
    const items: MenuItem[] = [];
    if (canEditAccess(a)) {
      items.push({ label: "Edit access…", onClick: () => startEditing(a) });
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
          You're viewing fellow Admin accounts only. This page is view-only for your role.
        </p>
      ) : (
        <div className="mb-6" />
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
              { header: "Access", value: (a) => accessText(a) },
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
                  <div className="mt-2">
                    <AccessChips admin={a} />
                  </div>

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
                  <th className="px-4 py-3 text-muted-on-paper font-medium">Role</th>
                  <th className="px-4 py-3 text-muted-on-paper font-medium">Access</th>
                  <th className="px-4 py-3 text-muted-on-paper font-medium">Status</th>
                  {!isViewOnly && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted">
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
                        <span className="block text-xs text-muted">{a.username}</span>
                      </td>
                      <td className="px-4 py-3 text-muted capitalize">
                        {a.role.replace("_", " ")}
                      </td>
                      <td className="px-4 py-3">
                        <AccessChips admin={a} />
                      </td>
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
    </div>
  );
}
