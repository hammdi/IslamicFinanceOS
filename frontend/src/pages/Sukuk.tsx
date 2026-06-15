import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import Spinner from "../components/Spinner";
import PageHeader from "../components/PageHeader";

export default function Sukuk() {
  const { t } = useTranslation();
  const [offerings, setOfferings] = useState<any[]>([]);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", description: "", asset_type: "real_estate", total_value: "", unit_price: "100", expected_return_percent: "", maturity_months: "12" });
  const [buyUnits, setBuyUnits] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const loadData = () => {
    setLoading(true);
    Promise.all([api.listTransactions(), api.listTransactions()]).catch(() => {});
    Promise.all([
      fetch("http://localhost:8000/sukuk/available", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(r => r.json()),
      fetch("http://localhost:8000/sukuk/my", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(r => r.json()),
    ]).then(([a, h]) => { setOfferings(a); setHoldings(h); }).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("http://localhost:8000/sukuk/create", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ ...form, total_value: parseFloat(form.total_value), unit_price: parseFloat(form.unit_price), expected_return_percent: parseFloat(form.expected_return_percent), maturity_months: parseInt(form.maturity_months) }),
      });
      setForm({ name: "", description: "", asset_type: "real_estate", total_value: "", unit_price: "100", expected_return_percent: "", maturity_months: "12" });
      setMessage(t("common.success")); loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  const handleBuy = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8000/sukuk/${id}/buy`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ units: parseInt(buyUnits[id]) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setBuyUnits(p => ({ ...p, [id]: "" }));
      setMessage(t("common.success")); loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title={t("sukuk.title")} description="Asset-backed Islamic bonds. Buy units of real assets and receive proportional returns from genuine economic activity." icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" color="from-violet-500 to-violet-700" />
      {message && <div className="bg-primary-50 text-primary-700 p-3 rounded-lg text-sm">{message}<button onClick={() => setMessage("")} className="float-right">&times;</button></div>}

      {/* Create Offering */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("sukuk.create")}</h2>
        <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("sukuk.name")}</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("sukuk.asset_type")}</label>
            <select value={form.asset_type} onChange={e => setForm(f => ({ ...f, asset_type: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              {["real_estate","infrastructure","trade","project","mixed"].map(t => <option key={t} value={t}>{t}</option>)}
            </select></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">{t("sukuk.description")}</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("sukuk.total_value")}</label>
            <input type="number" value={form.total_value} onChange={e => setForm(f => ({ ...f, total_value: e.target.value }))} required min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("sukuk.unit_price")}</label>
            <input type="number" value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))} required min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("sukuk.expected_return")}</label>
            <input type="number" value={form.expected_return_percent} onChange={e => setForm(f => ({ ...f, expected_return_percent: e.target.value }))} required min="0" step="0.1" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("sukuk.maturity")}</label>
            <input type="number" value={form.maturity_months} onChange={e => setForm(f => ({ ...f, maturity_months: e.target.value }))} required min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
          <div className="md:col-span-2"><button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-8 rounded-lg">{t("sukuk.submit")}</button></div>
        </form>
      </div>

      {/* My Holdings */}
      {holdings.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("sukuk.my_holdings")}</h2>
          <div className="grid gap-3">
            {holdings.map((h: any) => (
              <div key={h.holding_id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                <div><p className="font-semibold">{h.offering}</p><p className="text-sm text-gray-500">{h.units} units | {h.status}</p></div>
                <div className="text-right"><p className="font-bold">{h.invested} USD</p><p className="text-xs text-green-600">Returns: {h.returns} USD</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available */}
      {offerings.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("sukuk.available")}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {offerings.map(o => (
              <div key={o.id} className="bg-white rounded-xl shadow-md p-6 border-t-4 border-violet-400">
                <h3 className="font-semibold text-lg">{o.name}</h3>
                <p className="text-gray-600 text-sm">{o.description}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-500">
                  <span>{t("sukuk.unit_price")}: {o.unit_price} USD</span>
                  <span>Return: {o.expected_return_percent}%</span>
                  <span>Available: {o.available_units} units</span>
                  <span>Maturity: {o.maturity_months}m</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <input type="number" placeholder="Units" value={buyUnits[o.id] || ""} onChange={e => setBuyUnits(p => ({ ...p, [o.id]: e.target.value }))} min="1" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <button onClick={() => handleBuy(o.id)} disabled={!buyUnits[o.id]} className="bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 text-white text-sm px-4 py-2 rounded-lg">{t("sukuk.buy")}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
