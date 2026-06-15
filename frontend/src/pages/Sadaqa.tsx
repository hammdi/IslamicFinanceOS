import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import Spinner from "../components/Spinner";
import PageHeader from "../components/PageHeader";

const CATEGORIES = ["education", "health", "food", "shelter", "orphans", "disaster", "general"];
const catColors: Record<string, string> = {
  education: "bg-blue-100 text-blue-800", health: "bg-red-100 text-red-800",
  food: "bg-amber-100 text-amber-800", shelter: "bg-gray-100 text-gray-800",
  orphans: "bg-purple-100 text-purple-800", disaster: "bg-orange-100 text-orange-800",
  general: "bg-green-100 text-green-800",
};

export default function Sadaqa() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", description: "", category: "general", target_amount: "" });
  const [donateAmounts, setDonateAmounts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const loadData = () => {
    setLoading(true);
    api.listCampaigns().then(setCampaigns).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCampaign({ ...form, target_amount: parseFloat(form.target_amount) });
      setForm({ title: "", description: "", category: "general", target_amount: "" });
      setMessage(t("common.success")); loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  const handleDonate = async (id: string) => {
    try {
      await api.donateCampaign(id, { amount: parseFloat(donateAmounts[id]) });
      setDonateAmounts(p => ({ ...p, [id]: "" }));
      setMessage(t("common.success")); loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title={t("sadaqa.title")} description="Create or fund transparent charity campaigns. Every donation tracked, every expenditure documented with evidence." icon="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" color="from-pink-500 to-pink-700" />

      {message && (
        <div className="bg-primary-50 text-primary-700 p-3 rounded-lg text-sm">
          {message}<button onClick={() => setMessage("")} className="float-right">&times;</button>
        </div>
      )}

      {/* Create Campaign */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("sadaqa.create")}</h2>
        <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("sadaqa.campaign_title")}</label>
            <input type="text" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("sadaqa.category")}</label>
            <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
              {CATEGORIES.map(c => <option key={c} value={c}>{t(`sadaqa.categories.${c}`)}</option>)}
            </select></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">{t("sadaqa.description")}</label>
            <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} required rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("sadaqa.target")}</label>
            <input type="number" value={form.target_amount} onChange={(e) => setForm(f => ({ ...f, target_amount: e.target.value }))} required min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" /></div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 rounded-lg">{t("sadaqa.submit")}</button></div>
        </form>
      </div>

      {/* Campaigns */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("sadaqa.active_campaigns")}</h2>
        {campaigns.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t("sadaqa.no_campaigns")}</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {campaigns.map(c => {
              const progress = (c.current_amount / c.target_amount) * 100;
              return (
                <div key={c.id} className="bg-white rounded-xl shadow-md p-6 border-t-4 border-pink-400">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{c.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${catColors[c.category] || catColors.general}`}>
                      {t(`sadaqa.categories.${c.category}`)}
                    </span>
                    {c.verified && <span className="text-green-600 text-xs">Verified</span>}
                  </div>
                  <p className="text-gray-600 text-sm">{c.description}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">{c.donors_count} {t("waqf.donors")}</span>
                      <span className="font-medium">{c.current_amount} / {c.target_amount} USD</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-pink-500 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                  </div>
                  {/* Updates */}
                  {c.updates?.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-1">{t("sadaqa.updates")}</p>
                      {c.updates.slice(0, 2).map((u: any) => (
                        <p key={u.id} className="text-xs text-gray-400">{u.title} — {u.amount_spent} USD spent</p>
                      ))}
                    </div>
                  )}
                  {c.status === "active" && (
                    <div className="flex items-center gap-2 mt-4">
                      <input type="number" placeholder={t("sadaqa.donate_amount")}
                        value={donateAmounts[c.id] || ""}
                        onChange={(e) => setDonateAmounts(p => ({ ...p, [c.id]: e.target.value }))}
                        min="1" step="0.01"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      <button onClick={() => handleDonate(c.id)} disabled={!donateAmounts[c.id]}
                        className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white text-sm px-4 py-2 rounded-lg">
                        {t("sadaqa.donate")}
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
