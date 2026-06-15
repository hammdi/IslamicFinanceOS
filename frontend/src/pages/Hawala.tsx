import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import Spinner from "../components/Spinner";
import PageHeader from "../components/PageHeader";

export default function Hawala() {
  const { t } = useTranslation();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ recipient_name: "", recipient_phone: "", recipient_country: "", amount: "", note: "" });
  const [trackCode, setTrackCode] = useState("");
  const [trackResult, setTrackResult] = useState<any>(null);
  const [message, setMessage] = useState("");

  const loadData = () => {
    fetch("http://localhost:8000/hawala/my", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(r => r.json()).then(setTransfers).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { loadData(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8000/hawala/send", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setMessage(`${t("common.success")} — Code: ${data.hawala_code}`);
      setForm({ recipient_name: "", recipient_phone: "", recipient_country: "", amount: "", note: "" });
      loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  const handleTrack = async () => {
    try {
      const res = await fetch(`http://localhost:8000/hawala/track/${trackCode}`);
      setTrackResult(await res.json());
    } catch { setTrackResult(null); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title={t("hawala.title")} description={t("hawala.description")} icon="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" color="from-cyan-600 to-cyan-800" />

      {message && <div className="bg-primary-50 text-primary-700 p-3 rounded-lg text-sm font-mono">{message}<button onClick={() => setMessage("")} className="float-right">&times;</button></div>}

      {/* Send */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("hawala.send")}</h2>
        <form onSubmit={handleSend} className="grid md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("hawala.recipient_name")}</label>
            <input type="text" value={form.recipient_name} onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("hawala.phone")}</label>
            <input type="tel" value={form.recipient_phone} onChange={e => setForm(f => ({ ...f, recipient_phone: e.target.value }))} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("hawala.country")}</label>
            <input type="text" value={form.recipient_country} onChange={e => setForm(f => ({ ...f, recipient_country: e.target.value }))} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. Morocco, Egypt, Pakistan" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("hawala.amount")}</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
          <div className="md:col-span-2 flex gap-4 items-end">
            <div className="flex-1"><label className="block text-sm font-medium text-gray-700 mb-1">{t("hawala.note")}</label>
              <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
            <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-8 rounded-lg">{t("hawala.send_btn")}</button>
          </div>
        </form>
        <p className="text-xs text-gray-400 mt-2">{t("hawala.fee_note")}</p>
      </div>

      {/* Track */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("hawala.track")}</h2>
        <div className="flex gap-2">
          <input type="text" value={trackCode} onChange={e => setTrackCode(e.target.value)} placeholder="HW-XXXXXXXX" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono" />
          <button onClick={handleTrack} className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg">{t("hawala.track_btn")}</button>
        </div>
        {trackResult && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <p className="font-mono text-lg font-bold">{trackResult.hawala_code}</p>
            <p>{trackResult.amount} USD &rarr; {trackResult.recipient} ({trackResult.country})</p>
            <p className={`font-semibold mt-1 ${trackResult.status === "collected" ? "text-green-600" : "text-amber-600"}`}>{trackResult.status}</p>
          </div>
        )}
      </div>

      {/* My Transfers */}
      {transfers.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("hawala.my_transfers")}</h2>
          <div className="grid gap-3">
            {transfers.map(t => (
              <div key={t.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{t.recipient} ({t.country})</p>
                  <p className="text-sm text-gray-500 font-mono">{t.hawala_code}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{t.amount} USD</p>
                  <p className={`text-xs font-medium ${t.status === "collected" ? "text-green-600" : "text-amber-600"}`}>{t.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
