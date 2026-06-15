import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import Spinner from "../components/Spinner";

export default function Admin() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.adminStats(), api.adminUsers()])
      .then(([s, u]) => { setStats(s); setUsers(u); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleVerify = async (userId: string) => {
    try {
      await api.adminVerifyUser(userId);
      setUsers((us) => us.map((u) => u.id === userId ? { ...u, verified: true } : u));
    } catch (err: any) { setError(err.message); }
  };

  if (loading) return <Spinner />;
  if (error) return (
    <div className="text-center py-12">
      <p className="text-red-600 font-medium">{error}</p>
      <p className="text-gray-500 text-sm mt-2">Admin access required</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary-800">{t("admin.title")}</h1>

      {/* Platform Stats */}
      {stats && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("admin.platform_stats")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t("admin.total_users"), value: stats.users?.total, color: "text-gray-700" },
              { label: t("admin.total_balance"), value: `${stats.wallets?.total_balance?.toFixed(0)} USD`, color: "text-primary-700" },
              { label: "Qard Hasan", value: `${stats.qard_hasan?.count} (${stats.qard_hasan?.total_amount?.toFixed(0)})`, color: "text-emerald-700" },
              { label: "Musharaka", value: `${stats.musharaka?.count} (${stats.musharaka?.total_invested?.toFixed(0)})`, color: "text-blue-700" },
              { label: "Tontine", value: stats.tontine?.count, color: "text-amber-700" },
              { label: "Waqf", value: `${stats.waqf?.count} (${stats.waqf?.total_donated?.toFixed(0)})`, color: "text-purple-700" },
              { label: "Zakat", value: `${stats.zakat?.total_distributed?.toFixed(0)} USD`, color: "text-green-700" },
              { label: t("nav.transactions"), value: stats.transactions?.count, color: "text-gray-700" },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl shadow p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("admin.users")}</h2>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("auth.name")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("auth.email")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("transactions.date")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("qard.status")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.verified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {u.verified ? t("admin.verified") : t("admin.unverified")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {!u.verified && (
                      <button onClick={() => handleVerify(u.id)}
                        className="text-sm text-primary-600 hover:text-primary-800">
                        {t("admin.verify")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
