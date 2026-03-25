"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, Loader2, RefreshCw, Pencil, Trash2 } from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/20 text-red-400 border-red-500/30",
  premium: "bg-albion-gold/20 text-albion-gold border-albion-gold/30",
  free: "bg-albion-blue/20 text-gray-400 border-albion-blue/30",
};

// ─── Edit Dialog ────────────────────────────────────────────────────────────

function EditUserDialog({
  user,
  currentUserId,
  onClose,
  onSaved,
}: {
  user: UserRow;
  currentUserId: string;
  onClose: () => void;
  onSaved: (updated: UserRow) => void;
}) {
  const t = useTranslations("admin.users");
  const [email, setEmail] = useState(user.email);
  const [name, setName] = useState(user.name ?? "");
  const [role, setRole] = useState(user.role);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setIsLoading(true);
    setError("");

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name: name || null, role }),
    });

    if (res.ok) {
      onSaved({ ...user, email, name: name || null, role });
      onClose();
    } else {
      const data = await res.json();
      if (data.error === "email_taken") setError(t("errorEmailTaken"));
      else setError(data.error ?? "error");
    }
    setIsLoading(false);
  };

  const isSelf = user.id === currentUserId;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-albion-darker border-albion-blue/30 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-albion-gold">{t("editTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded px-3 py-2">
              {error}
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-albion-dark border-albion-blue/30"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">{t("colPseudo")}</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-albion-dark border-albion-blue/30"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("colRole")}</Label>
            <Select
              value={role}
              onValueChange={setRole}
              disabled={isSelf}
            >
              <SelectTrigger className="bg-albion-dark border-albion-blue/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-albion-darker border-albion-blue/30">
                <SelectItem value="free">free</SelectItem>
                <SelectItem value="premium">premium</SelectItem>
                <SelectItem value="admin">admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-albion-blue/30 text-gray-400"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-albion-gold text-albion-dark hover:bg-albion-gold/90"
          >
            {isLoading ? t("saving") : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Dialog ───────────────────────────────────────────────────────────

function DeleteUserDialog({
  user,
  onClose,
  onDeleted,
}: {
  user: UserRow;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const t = useTranslations("admin.users");
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted(user.id);
      onClose();
    }
    setIsLoading(false);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-albion-darker border-albion-blue/30 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-red-400">{t("deleteTitle")}</DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-2">
          <p className="text-sm text-gray-300">
            {t("deleteConfirm")}
          </p>
          <p className="text-sm font-medium text-white">{user.email}</p>
          <p className="text-xs text-gray-500">{t("deleteWarning")}</p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-albion-blue/30 text-gray-400"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isLoading ? t("deleting") : t("confirmDelete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function UsersClient({ currentUserId }: { currentUserId: string }) {
  const t = useTranslations("admin.users");
  const [userList, setUserList] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserRow | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUserList(data.users ?? []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = userList.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          currentUserId={currentUserId}
          onClose={() => setEditingUser(null)}
          onSaved={(updated) => {
            setUserList((prev) =>
              prev.map((u) => (u.id === updated.id ? updated : u))
            );
          }}
        />
      )}

      {deletingUser && (
        <DeleteUserDialog
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onDeleted={(id) =>
            setUserList((prev) => prev.filter((u) => u.id !== id))
          }
        />
      )}

      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-albion-dark border-albion-blue/30"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchUsers}
            disabled={isLoading}
            className="border-albion-blue/30 text-gray-400 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <span className="text-sm text-gray-500">
            {filtered.length} {t("usersCount")}
          </span>
        </div>

        {/* Table */}
        <div className="border border-albion-blue/30 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-albion-blue/30 bg-albion-darker/50">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">{t("colEmail")}</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">{t("colPseudo")}</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">{t("colRole")}</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">{t("colCreated")}</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    {t("loading")}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    {t("noResults")}
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const isSelf = user.id === currentUserId;
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-albion-blue/10 hover:bg-albion-blue/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-white">
                        {user.email}
                        {isSelf && (
                          <span className="ml-2 text-xs text-gray-500">({t("you")})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {user.name ?? (
                          <span className="text-gray-600 italic">{t("noPseudo")}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={ROLE_COLORS[user.role] ?? ""}
                          variant="outline"
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-white hover:bg-albion-blue/30"
                            onClick={() => setEditingUser(user)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isSelf}
                            className="h-7 w-7 text-gray-400 hover:text-red-400 hover:bg-red-900/20 disabled:opacity-30"
                            onClick={() => setDeletingUser(user)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
