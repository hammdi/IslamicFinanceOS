import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Spinner from "../components/Spinner";

const CATS = ["teaching", "tech", "health", "crafts", "transport", "cooking", "legal", "other"];

export default function TimeBank() {
  const { t } = useTranslation();
  const [balance, setBalance] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [myOffers, setMyOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ skill: "", category: "teaching", description: "", hours_available: "" });
  const [requestHours, setRequestHours] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` };

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("http://localhost:8000/timebank/balance", { headers }).then(r => r.json()),
      fetch("http://localhost:8000/timebank/offers", { headers }).then(r => r.json()),
      fetch("http://localhost:8000/timebank/my-offers", { headers }).then(r => r.json()),
    ]).then(([b, o, m]) => { setBalance(b); setOffers(o); setMyOffers(m); }).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("http://localhost:8000/timebank/offers", { method: "POST", headers, body: JSON.stringify({ ...form, hours_available: parseFloat(form.hours_available) }) });
    setForm({ skill: "", category: "teaching", description: "", hours_available: "" });
    setMessage(t("common.success")); loadData();
  };

  const handleRequest = async (offerId: string) => {
    const res = await fetch(`http://localhost:8000/timebank/offers/${offerId}/request`, { method: "POST", headers, body: JSON.stringify({ hours: parseFloat(requestHours[offerId]) }) });
    if (!res.ok) { setMessage((await res.json()).detail); return; }
    setRequestHours(p => ({ ...p, [offerId]: "" }));
    setMessage(t("common.success")); loadData();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary-800">{t("timebank.title")}</h1>

      {/* Balance */}
      {balance && (
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-800 rounded-2xl p-6 text-white text-center">
          <p className="text-sm opacity-80">{t("timebank.balance")}</p>
          <p className="text-5xl font-bold mt-1">{balance.balance} <span className="text-2xl opacity-70">hours</span></p>
          <div className="flex justify-center gap-8 mt-4 text-sm opacity-80">
            <div><p>{t("timebank.earned")}</p><p className="font-semibold text-lg">{balance.earned}h</p></div>
            <div><p>{t("timebank.spent")}</p><p className="font-semibold text-lg">{balance.spent}h</p></div>
          </div>
        </div>
      )}

      {message && <div className="bg-primary-50 text-primary-700 p-3 rounded-lg text-sm">{message}<button onClick={() => setMessage("")} className="float-right">&times;</button></div>}

      {/* Offer a skill */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("timebank.offer_skill")}</h2>
        <form onSubmit={handleCreate} className="grid md:grid-cols-4 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("timebank.skill")}</label>
            <input type="text" value={form.skill} onChange={e => setForm(f => ({ ...f, skill: e.target.value }))} required placeholder="e.g. Arabic tutoring" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("timebank.category")}</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              {CATS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("timebank.hours")}</label>
            <input type="number" value={form.hours_available} onChange={e => setForm(f => ({ ...f, hours_available: e.target.value }))} required min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
          <div className="flex items-end"><button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 rounded-lg">{t("timebank.submit")}</button></div>
          <div className="md:col-span-4"><label className="block text-sm font-medium text-gray-700 mb-1">{t("timebank.desc")}</label>
            <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
        </form>
      </div>

      {/* Browse Offers */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("timebank.available")}</h2>
        {offers.length === 0 ? <p className="text-gray-500 text-center py-8">{t("timebank.no_offers")}</p> : (
          <div className="grid md:grid-cols-2 gap-4">
            {offers.map(o => (
              <div key={o.id} className="bg-white rounded-xl shadow p-5 border-l-4 border-cyan-400">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{o.skill}</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-100 text-cyan-800">{o.category}</span>
                </div>
                <p className="text-sm text-gray-600">{o.description}</p>
                <p className="text-sm text-gray-500 mt-1">{o.hours_available}h available</p>
                <div className="flex gap-2 mt-3">
                  <input type="number" placeholder="Hours" value={requestHours[o.id] || ""} onChange={e => setRequestHours(p => ({ ...p, [o.id]: e.target.value }))} min="0.5" step="0.5" max={o.hours_available} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <button onClick={() => handleRequest(o.id)} disabled={!requestHours[o.id]} className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-300 text-white text-sm px-4 py-2 rounded-lg">{t("timebank.request")}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
