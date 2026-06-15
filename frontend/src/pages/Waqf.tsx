import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import Spinner from "../components/Spinner";
import PageHeader from "../components/PageHeader";

const CATEGORIES = ["mosque", "school", "hospital", "water", "orphanage", "general"];

const categoryColors: Record<string, string> = {
  mosque: "bg-emerald-100 text-emerald-800",
  school: "bg-blue-100 text-blue-800",
  hospital: "bg-red-100 text-red-800",
  water: "bg-cyan-100 text-cyan-800",
  orphanage: "bg-purple-100 text-purple-800",
  general: "bg-gray-100 text-gray-800",
};

export default function Waqf() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [waqfs, setWaqfs] = useState<any[]>([]);
  const [myWaqfs, setMyWaqfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", description: "", category: "general", target_amount: "" });
  const [donateAmounts, setDonateAmounts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const loadData = () => {
    setLoading(true);
    Promise.all([api.listWaqf(), api.myWaqf()])
      .then(([available, mine]) => { setWaqfs(available); setMyWaqfs(mine); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createWaqf({
        name: form.name, description: form.description,
        category: form.category, target_amount: parseFloat(form.target_amount),
      });
      setForm({ name: "", description: "", category: "general", target_amount: "" });
      setMessage(t("common.success"));
      loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  const handleDonate = async (waqfId: string) => {
    try {
      await api.donateWaqf(waqfId, { amount: parseFloat(donateAmounts[waqfId]) });
      setDonateAmounts((p) => ({ ...p, [waqfId]: "" }));
      setMessage(t("common.success"));
      loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  if (loading) return <Spinner />;

  const allWaqfs = [...myWaqfs, ...waqfs.filter((w) => !myWaqfs.find((m) => m.id === w.id))];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title={t("waqf.title")} description="Permanent endowment for community benefit — fund mosques, schools, hospitals. Your sadaqa jariya that benefits generations." icon="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" color="from-purple-500 to-purple-700" />

      {message && (
        <div className="bg-primary-50 text-primary-700 p-3 rounded-lg text-sm">
          {message}
          <button onClick={() => setMessage("")} className="float-right">&times;</button>
        </div>
      )}

      {/* Create */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("waqf.create")}</h2>
        <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("waqf.name")}</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("waqf.category")}</label>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{t(`waqf.categories.${c}`)}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("waqf.description")}</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("waqf.target_amount")}</label>
            <input type="number" value={form.target_amount} onChange={(e) => setForm((f) => ({ ...f, target_amount: e.target.value }))} required min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-lg">
              {t("waqf.submit")}
            </button>
          </div>
        </form>
      </div>

      {/* Projects */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("waqf.available")}</h2>
        {allWaqfs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t("waqf.no_projects")}</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {allWaqfs.map((waqf) => {
              const progress = (waqf.current_amount / waqf.target_amount) * 100;
              return (
                <div key={waqf.id} className="bg-white rounded-xl shadow-md p-6 border-t-4 border-purple-400">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{waqf.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[waqf.category] || categoryColors.general}`}>
                      {t(`waqf.categories.${waqf.category}`)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{waqf.description}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">{t("waqf.progress")}</span>
                      <span className="font-medium">{waqf.current_amount} / {waqf.target_amount} USD</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{waqf.donors_count} {t("waqf.donors")}</p>
                  {waqf.status === "active" && (
                    <div className="flex items-center gap-2 mt-4">
                      <input type="number" placeholder={t("waqf.donate_amount")}
                        value={donateAmounts[waqf.id] || ""}
                        onChange={(e) => setDonateAmounts((p) => ({ ...p, [waqf.id]: e.target.value }))}
                        min="1" step="0.01"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      <button onClick={() => handleDonate(waqf.id)} disabled={!donateAmounts[waqf.id]}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white text-sm px-4 py-2 rounded-lg">
                        {t("waqf.donate")}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
