import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Spinner from "../components/Spinner";

export default function Community() {
  const { t } = useTranslation();
  const [impact, setImpact] = useState<any>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", story: "", product_type: "qard", anonymous: true });
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:8000/community/impact").then(r => r.json()),
      fetch("http://localhost:8000/community/stories").then(r => r.json()),
    ]).then(([i, s]) => { setImpact(i); setStories(s); }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("http://localhost:8000/community/stories", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify(form),
    });
    setForm({ title: "", story: "", product_type: "qard", anonymous: true });
    setMessage(t("common.success"));
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary-800">{t("community.title")}</h1>

      {/* Impact Metrics */}
      {impact && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("community.impact")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-4 text-white text-center">
              <p className="text-3xl font-bold">{impact.community.total_users}</p>
              <p className="text-xs opacity-80">{t("community.total_users")}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl p-4 text-white text-center">
              <p className="text-3xl font-bold">{impact.lives_impacted.families_helped}</p>
              <p className="text-xs opacity-80">{t("community.families_helped")}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-4 text-white text-center">
              <p className="text-3xl font-bold">{impact.community.total_transactions}</p>
              <p className="text-xs opacity-80">{t("community.total_tx")}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-4 text-white text-center">
              <p className="text-3xl font-bold">{impact.lives_impacted.total_charity.toFixed(0)}</p>
              <p className="text-xs opacity-80">{t("community.total_charity")} USD</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white rounded-lg shadow p-3 text-center">
              <p className="text-lg font-bold text-green-600">{impact.lives_impacted.zakat_distributed.toFixed(0)}</p>
              <p className="text-xs text-gray-500">{t("nav.zakat")} USD</p>
            </div>
            <div className="bg-white rounded-lg shadow p-3 text-center">
              <p className="text-lg font-bold text-purple-600">{impact.lives_impacted.waqf_donated.toFixed(0)}</p>
              <p className="text-xs text-gray-500">{t("nav.waqf")} USD</p>
            </div>
            <div className="bg-white rounded-lg shadow p-3 text-center">
              <p className="text-lg font-bold text-pink-600">{impact.lives_impacted.sadaqa_donated.toFixed(0)}</p>
              <p className="text-xs text-gray-500">{t("nav.sadaqa")} USD</p>
            </div>
          </div>
        </div>
      )}

      {/* Share Story */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("community.share_story")}</h2>
        {message && <p className="text-green-600 text-sm mb-2">{message}</p>}
        <form onSubmit={handleShare} className="space-y-4">
          <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder={t("community.story_title")} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          <textarea value={form.story} onChange={e => setForm(f => ({ ...f, story: e.target.value }))} required rows={3} placeholder={t("community.story_body")} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.anonymous} onChange={e => setForm(f => ({ ...f, anonymous: e.target.checked }))} /> {t("community.anonymous")}</label>
            <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg">{t("community.submit_story")}</button>
          </div>
        </form>
      </div>

      {/* Stories */}
      {stories.length > 0 && (
        <div><h2 className="text-xl font-semibold text-gray-800 mb-4">{t("community.stories")}</h2>
          <div className="space-y-4">
            {stories.map(s => (
              <div key={s.id} className="bg-white rounded-xl shadow p-5">
                <h3 className="font-semibold text-lg">{s.title}</h3>
                <p className="text-gray-600 mt-1">{s.story}</p>
                <div className="flex items-center gap-3 mt-3 text-sm text-gray-400">
                  <span className="px-2 py-0.5 rounded bg-gray-100">{s.product_type}</span>
                  <span>{new Date(s.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
