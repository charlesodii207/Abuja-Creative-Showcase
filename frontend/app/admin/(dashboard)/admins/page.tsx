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
  DEPARTMENTS,
  SECTIONS,
  departmentLabel,
  sectionLabel,
} from "../../../../lib/admin/permissions";

function DepartmentPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(key: string) {
    onChange(
      selected.includes(key)
        ? selected.filter((k) => k !== key)
        : [...selected, key]
    );
  }

  return (
    <div className="space-y-3">
      {DEPARTMENTS.map((d) => (
        <label key={d.key} className="flex items-start gap-3 font-body text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(d.key)}
            onChange={() => toggle(d.key)}
            className="mt-1"
          />
          <span>
            <span className="text-cream">{d.label}</span>
            <span className="block text-xs text-muted">{d.sections}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

function SectionPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(key: string) {
    onChange(
      selected.includes(key)
        ? selected.filter((k) => k !== key)
        : [...selected, key]
    );
  }

  return (
    <div className="mt-6">
      <p className="font-body text-sm text-muted-on-paper mb-1">Extra sections</p>
      <p className="font-body text-xs text-muted mb-3">
        Give this person a single section on its own, without adding a whole
        department.
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {SECTIONS.map((x) => (
          <label
            key={x.key}
            className="flex items-center gap-3 font-body text-sm text-cream cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.includes(x.key)}
              onChange={() => toggle(x.key)}
            />
            {x.label}
          </label>
        ))}
      </div>
    </div>
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

  // The buttons only hide things. The API enforces the same rules.
  function canBlockOrDelete(a: AdminSummary) {
    if (a.role === "system_owner") return false;
    return isOwner || (isSenior && a.role === "admin");
  }
  const canUpgrade = (a: AdminSummary) => isSenior && a.role === "admin";
  const canDowngrade = (a: AdminSummary) => isOwner && a.role === "super_admin";
  const canEditDepartments = (a: AdminSummary) => isSenior && a.role === "admin";

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

  async function handleSaveDepartments() {
    if (!editing) return;
    setEditError(null);
    setEditLoading(true);
    try {
      await updateAdminDepartments(editing.id, editDepartments, editExtras);
      setEditing(null);
      loadAdmins();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "Couldn't save departments.");
    } finally {
      setEditLoading(false);
    }
  }

  function renderActions(a: AdminSummary) {
    return (
      <>
        {canEditDepartments(a) && (
          <button
            onClick={() => startEditing(a)}
            className="font-body text-xs text-teal hover:underline py-1"
          >
            Access
          </button>
        )}
        {canUpgrade(a) && (
          <button
            onClick={() => handleUpgrade(a)}
            className="font-body text-xs text-gold hover:underline py-1"
          >
            Upgrade
          </button>
        )}
        {canDowngrade(a) && (
          <button
            onClick={() => handleDowngrade(a)}
            className="font-body text-xs text-gold hover:underline py-1"
          >
            Downgrade
          </button>
        )}
        {a.is_active && canBlockOrDelete(a) && (
          <button
            onClick={() => handleDeactivate(a)}
            className="font-body text-xs text-red hover:underline py-1"
          >
            Deactivate
          </button>
        )}
        {canBlockOrDelete(a) && (
          <button
            onClick={() => handleDelete(a)}
            className="font-body text-xs text-red hover:underline py-1"
          >
            Delete
          </button>
        )}
      </>
    );
  }

  function statusText(a: AdminSummary) {
    if (!a.is_active) return <span className="text-red">Deactivated</span>;
    if (a.must_change_password)
      return <span className="text-gold">Awaiting first login</span>;
    return <span className="text-teal">Active</span>;
  }

  function departmentText(a: AdminSummary) {
    if (a.role !== "admin") return "Full access";
    const parts = [
      ...(a.departments ?? []).map(departmentLabel),
      ...(a.extra_permissions ?? []).map((k) => `+ ${sectionLabel(k)}`),
    ];
    return parts.length > 0 ? parts.join(", ") : "None assigned";
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
          className="border border-ink-raised rounded-sm p-6 mb-8 space-y-4"
        >
          <div>
            <label className="block font-body text-sm text-muted-on-paper mb-1.5">
              Full name
            </label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-ink border border-ink-raised rounded-sm px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
          <div>
            <label className="block font-body text-sm text-muted-on-paper mb-1.5">
              Username
            </label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-ink border border-ink-raised rounded-sm px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
          <div>
            <label className="block font-body text-sm text-muted-on-paper mb-1.5">
              Temporary password
            </label>
            <input
              required
              type="text"
              minLength={8}
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              className="w-full bg-ink border border-ink-raised rounded-sm px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <p className="mt-1.5 font-body text-xs text-muted">
              Tell them this password directly — they'll be forced to change it
              on first login.
            </p>
          </div>
          <div>
            <label className="block font-body text-sm text-muted-on-paper mb-1.5">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "super_admin" | "admin")}
              className="w-full bg-ink border border-ink-raised rounded-sm px-3 py-2 font-body text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          {role === "admin" ? (
            <div>
              <p className="font-body text-sm text-muted-on-paper mb-2">
                Departments
              </p>
              <p className="font-body text-xs text-muted mb-3">
                Overview, Registrants and Admins are visible to every admin.
                Tick the departments this admin works in.
              </p>
              <DepartmentPicker selected={newDepartments} onChange={setNewDepartments} />
              <SectionPicker selected={newExtras} onChange={setNewExtras} />
            </div>
          ) : (
            <p className="font-body text-xs text-muted">
              Super admins get full access to every section.
            </p>
          )}

          {formError && (
            <p className="font-body text-sm text-red">{formError}</p>
          )}

          <button
            type="submit"
            disabled={formLoading}
            className="font-body text-sm bg-gold text-ink rounded-sm px-4 py-2 disabled:opacity-60"
          >
            {formLoading ? "Creating…" : "Create admin"}
          </button>
        </form>
      )}

      {editing && (
        <div className="border border-ink-raised rounded-sm p-6 mb-8">
          <h2 className="font-body text-sm text-muted-on-paper mb-1">
            Access for {editing.full_name}
          </h2>
          <p className="font-body text-xs text-muted mb-4">
            Overview, Registrants and Admins are visible to every admin.
          </p>
          <DepartmentPicker selected={editDepartments} onChange={setEditDepartments} />
          <SectionPicker selected={editExtras} onChange={setEditExtras} />

          {editError && (
            <p className="font-body text-sm text-red mt-4">{editError}</p>
          )}

          <div className="flex gap-3 mt-5">
            <button
              onClick={handleSaveDepartments}
              disabled={editLoading}
              className="font-body text-sm bg-gold text-ink rounded-sm px-4 py-2 disabled:opacity-60"
            >
              {editLoading ? "Saving…" : "Save access"}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="font-body text-sm border border-ink-raised text-muted hover:text-cream rounded-sm px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 mb-3">
        <button
          onClick={() =>
            downloadCsv(`admins-${todayForFilename()}`, admins, [
              { header: "Full name", value: (a) => a.full_name },
              { header: "Username", value: (a) => a.username },
              { header: "Role", value: (a) => a.role },
              {
                header: "Departments",
                value: (a) =>
                  a.role === "admin"
                    ? [
                        ...(a.departments ?? []).map(departmentLabel),
                        ...(a.extra_permissions ?? []).map((k) => `+ ${sectionLabel(k)}`),
                      ].join("; ")
                    : "Full access",
              },
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
                  <p className="text-xs text-muted">{departmentText(a)}</p>
                  {!isViewOnly && (
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                      {renderActions(a)}
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
                  <th className="px-4 py-3 text-muted-on-paper font-medium">Username</th>
                  <th className="px-4 py-3 text-muted-on-paper font-medium">Role</th>
                  <th className="px-4 py-3 text-muted-on-paper font-medium">Departments</th>
                  <th className="px-4 py-3 text-muted-on-paper font-medium">Status</th>
                  {!isViewOnly && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted">
                      No admins found.
                    </td>
                  </tr>
                ) : (
                  admins.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-ink-raised last:border-b-0"
                    >
                      <td className="px-4 py-3 text-cream">{a.full_name}</td>
                      <td className="px-4 py-3 text-muted">{a.username}</td>
                      <td className="px-4 py-3 text-muted capitalize">
                        {a.role.replace("_", " ")}
                      </td>
                      <td className="px-4 py-3 text-muted">{departmentText(a)}</td>
                      <td className="px-4 py-3">{statusText(a)}</td>
                      {!isViewOnly && (
                        <td className="px-4 py-3 text-right whitespace-nowrap space-x-3">
                          {renderActions(a)}
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
    </div>
  );
}
