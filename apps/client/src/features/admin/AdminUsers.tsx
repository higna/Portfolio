import { useState, useEffect } from "react";
import { Users, Mail, Shield, Calendar} from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  authProvider: string;
  isVerified: boolean;
  createdAt: string;
  picture?: string | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); 

  useEffect(() => {
    api
      .get("/users")
      .then((res) => setUsers(res.data))
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-sm text-base-content/60 mt-1">
            Manage all registered accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-base-200 rounded-lg">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{users.length} total</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="overflow-x-auto rounded-xl border border-base-content/10 bg-base-100 shadow-sm">
          <table className="table w-full">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Provider</th>
                <th>Verified</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-base-300" />
                      <div className="space-y-1.5">
                        <div className="h-4 bg-base-300 rounded w-32" />
                        <div className="h-3 bg-base-300 rounded w-40" />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="h-5 w-16 bg-base-300 rounded" />
                  </td>
                  <td>
                    <div className="h-4 w-12 bg-base-300 rounded" />
                  </td>
                  <td>
                    <div className="h-5 w-16 bg-base-300 rounded" />
                  </td>
                  <td>
                    <div className="h-4 w-24 bg-base-300 rounded" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-base-content/10 bg-base-100 shadow-sm">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50">
                <th className="font-semibold">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> User
                  </div>
                </th>
                <th className="font-semibold">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" /> Role
                  </div>
                </th>
                <th className="font-semibold">Provider</th>
                <th className="font-semibold">Verified</th>
                <th className="font-semibold">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" /> Joined
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-base-200/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/dashboard/users/${user.id}`)}
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-8 h-8">
                          {user.picture ? (
                            <img
                              src={user.picture}
                              alt={user.fullName || user.email}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium">
                              {user.fullName?.charAt(0) ||
                                user.email.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {user.fullName || "Unnamed User"}
                        </div>
                        <div className="text-xs text-base-content/50 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge badge-sm font-medium ${
                        user.role === "SUPERADMIN"
                          ? "badge-primary"
                          : "badge-ghost"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="text-sm capitalize">{user.authProvider}</td>
                  <td>
                    {user.isVerified ? (
                      <span className="badge badge-success badge-sm gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-success-content inline-block" />
                        Verified
                      </span>
                    ) : (
                      <span className="badge badge-warning badge-sm gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning-content inline-block" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="text-sm text-base-content/60">
                    {formatDate(user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
