// app/admin/(dashboard)/admins/page.tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  listAdmins,
  createAdmin,
  deactivateAdmin,
  deleteAdmin,
  getAdminProfile,
  ApiError,
  type AdminSummary,
  type SortOrder,
} from "../../../../lib/admin/api";
import { downloadCsv, todayForFilename } from "../../../../lib/admin/csv";

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
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const myProfile = getAdminProfile();
  const canCreateSuperAdmin = myProfile?.role === "system_owner";
  const isSystemOwner = myProfile?.role === "system_owner";
  // Plain "admin" accounts only ever get their fellow admins back from
  // the API — the backend does the actual filtering, this is just the
  // heads-up so it doesn't look like admins are missing.
  const isTierRestricted = myProfile?.role === "admin";

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
      });
      setFullName("");
      setUsername("");
      setTempPassword("");
      setRole("admin");
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

  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl text-cream">Admins</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="font-body text-sm bg-gold text-ink rounded-sm px-4 py-2 hover:bg-gold/90"
        >
          {showForm ? "Cancel" : "Create admin"}
        </button>
      </div>

      {isTierRestricted && (
        <p className="font-body text-xs text-muted mb-6">
          You're viewing fellow Admin accounts only.
        </p>
      )}
      {!isTierRestricted && <div className="mb-6" />}

      {showForm && (
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
          {canCreateSuperAdmin && (
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

      <div className="flex items-center justify-end gap-3 mb-3">
        <button
          onClick={() =>
            downloadCsv(`admins-${todayForFilename()}`, admins, [
              { header: "Full name", value: (a) => a.full_name },
              { header: "Username", value: (a) => a.username },
              { header: "Role", value: (a) => a.role },
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
        <div className="border border-ink-raised rounded-sm overflow-hidden">
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="border-b border-ink-raised text-left">
                <th className="px-4 py-3 text-muted-on-paper font-medium">Name</th>
                <th className="px-4 py-3 text-muted-on-paper font-medium">Username</th>
                <th className="px-4 py-3 text-muted-on-paper font-medium">Role</th>
                <th className="px-4 py-3 text-muted-on-paper font-medium">Status</th>
                <th className="px-4 py-3 text-muted-on-paper font-medium"></th>
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
                    <td className="px-4 py-3 text-cream">{a.full_name}</td>
                    <td className="px-4 py-3 text-muted">{a.username}</td>
                    <td className="px-4 py-3 text-muted capitalize">
                      {a.role.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3">
                      {!a.is_active ? (
                        <span className="text-red">Deactivated</span>
                      ) : a.must_change_password ? (
                        <span className="text-gold">Awaiting first login</span>
                      ) : (
                        <span className="text-teal">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      {a.is_active && a.role !== "system_owner" && (
                        <button
                          onClick={() => handleDeactivate(a)}
                          className="font-body text-xs text-red hover:underline"
                        >
                          Deactivate
                        </button>
                      )}
                      {isSystemOwner && a.role !== "system_owner" && (
                        <button
                          onClick={() => handleDelete(a)}
                          className="font-body text-xs text-red hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
