import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Spinner from "../components/Spinner";

export default function Sulh() {
  const { t } = useTranslation();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [openDisputes, setOpenDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ respondent_id: "", product_type: "qard", product_id: "", amount_in_dispute: "", description: "" });
  const [message, setMessage] = useState("");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` };

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("http://localhost:8000/sulh/disputes", { headers }).then(r => r.json()),
      fetch("http://localhost:8000/sulh/open", { headers }).then(r => r.json()),
    ]).then(([my, open]) => { setDisputes(my); setOpenDisputes(open); }).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8000/sulh/disputes", { method: "POST", headers, body: JSON.stringify({ ...form, amount_in_dispute: parseFloat(form.amount_in_dispute) }) });
      if (!res.ok) throw new Error((await res.json()).detail);
      setForm({ respondent_id: "", product_type: "qard", product_id: "", amount_in_dispute: "", description: "" });
      setMessage(t("common.success")); loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  const handleVolunteer = async (id: string) => {
    await fetch(`http://localhost:8000/sulh/disputes/${id}/volunteer`, { method: "POST", headers });
    setMessage(t("common.success")); loadData();
  };

  if (loading) return <Spinner />;

  const statusColor = (s: string) => s === "resolved" ? "bg-green-100 text-green-800" : s === "mediation" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800";

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary-800">{t("sulh.title")}</h1>
      <p className="text-gray-600">{t("sulh.description")}</p>
      {message && <div className="bg-primary-50 text-primary-700 p-3 rounded-lg text-sm">{message}<button onClick={() => setMessage("")} className="float-right">&times;</button></div>}

      {/* File Dispute */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("sulh.file")}</h2>
        <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("sulh.respondent")}</label>
            <input type="text" value={form.respondent_id} onChange={e => setForm(f => ({ ...f, respondent_id: e.target.value }))} required placeholder="User ID" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("sulh.amount")}</label>
            <input type="number" value={form.amount_in_dispute} onChange={e => setForm(f => ({ ...f, amount_in_dispute: e.target.value }))} required min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">{t("sulh.desc")}</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
          <div className="md:col-span-2"><button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-8 rounded-lg">{t("sulh.submit")}</button></div>
        </form>
      </div>

      {/* My Disputes */}
      {disputes.length > 0 && (
        <div><h2 className="text-xl font-semibold text-gray-800 mb-4">{t("sulh.my_disputes")}</h2>
          <div className="grid gap-4">
            {disputes.map(d => (
              <div key={d.id} className="bg-white rounded-xl shadow p-5 border-l-4 border-red-400">
                <div className="flex justify-between items-start">
                  <div><p className="font-semibold">{d.description}</p>
                    <p className="text-sm text-gray-500 mt-1">{d.amount} USD | {d.product_type} | Mediators: {d.mediators_count}/3</p>
                    {d.resolution && <p className="text-sm text-green-700 mt-2 font-medium">Resolution: {d.resolution}</p>}
                    {d.hashgraph_id && <p className="text-xs text-gray-400 font-mono mt-1">Hash: {d.hashgraph_id}</p>}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(d.status)}`}>{d.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Disputes needing mediators */}
      {openDisputes.length > 0 && (
        <div><h2 className="text-xl font-semibold text-gray-800 mb-4">{t("sulh.need_mediators")}</h2>
          <div className="grid gap-3">
            {openDisputes.map(d => (
              <div key={d.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                <div><p className="font-medium">{d.description}</p>
                  <p className="text-sm text-gray-500">{d.amount} USD | Mediators: {d.mediators_count}/3</p></div>
                <button onClick={() => handleVolunteer(d.id)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">{t("sulh.volunteer")}</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
