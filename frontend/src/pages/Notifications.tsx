import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import Spinner from "../components/Spinner";

const typeIcons: Record<string, string> = {
  wallet: "bg-primary-100 text-primary-700",
  qard: "bg-emerald-100 text-emerald-700",
  musharaka: "bg-blue-100 text-blue-700",
  tontine: "bg-amber-100 text-amber-700",
  zakat: "bg-green-100 text-green-700",
  waqf: "bg-purple-100 text-purple-700",
  system: "bg-gray-100 text-gray-700",
};

export default function Notifications() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.listNotifications().then(setNotifications).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleMarkRead = async (id: string) => {
    await api.markRead(id);
    setNotifications((ns) => ns.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllRead = async () => {
    await api.markAllRead();
    setNotifications((ns) => ns.map((n) => ({ ...n, is_read: true })));
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary-800">{t("notifications.title")}</h1>
        {notifications.some((n) => !n.is_read) && (
          <button onClick={handleMarkAllRead}
            className="text-sm text-primary-600 hover:text-primary-800">
            {t("notifications.mark_all_read")}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-500 text-center py-12">{t("notifications.no_notifications")}</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
              className={`bg-white rounded-lg shadow p-4 flex items-start gap-4 cursor-pointer transition-colors ${!n.is_read ? "border-l-4 border-primary-500 bg-primary-50/30" : ""}`}>
              <span className={`px-2 py-1 rounded text-xs font-medium ${typeIcons[n.type] || typeIcons.system}`}>
                {n.type}
              </span>
              <div className="flex-1">
                <p className={`font-medium ${!n.is_read ? "text-gray-900" : "text-gray-600"}`}>{n.title}</p>
                <p className="text-sm text-gray-500">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.is_read && (
                <span className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
