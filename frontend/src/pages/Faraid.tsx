import { useState } from "react";
import { useTranslation } from "react-i18next";
import Spinner from "../components/Spinner";
import PageHeader from "../components/PageHeader";

export default function Faraid() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState({
    estate_value: "", debts: "0", funeral_costs: "0", wasiyya: "0",
    has_husband: false, has_wife: 0, sons: 0, daughters: 0,
    has_father: false, has_mother: false, brothers: 0, sisters: 0,
  });

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/faraid/calculate", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({
          ...form, estate_value: parseFloat(form.estate_value), debts: parseFloat(form.debts),
          funeral_costs: parseFloat(form.funeral_costs), wasiyya: parseFloat(form.wasiyya),
          has_wife: form.has_wife,
        }),
      });
      setResult(await res.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title={t("faraid.title")} description={t("faraid.description")}
        icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        color="from-gray-600 to-gray-800" />

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("faraid.calculator")}</h2>
        <form onSubmit={handleCalculate} className="space-y-6">
          {/* Estate */}
          <div className="grid md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("faraid.estate_value")}</label>
              <input type="number" value={form.estate_value} onChange={e => setForm(f => ({ ...f, estate_value: e.target.value }))} required min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("faraid.debts")}</label>
              <input type="number" value={form.debts} onChange={e => setForm(f => ({ ...f, debts: e.target.value }))} min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("faraid.funeral")}</label>
              <input type="number" value={form.funeral_costs} onChange={e => setForm(f => ({ ...f, funeral_costs: e.target.value }))} min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("faraid.wasiyya")}</label>
              <input type="number" value={form.wasiyya} onChange={e => setForm(f => ({ ...f, wasiyya: e.target.value }))} min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
          </div>

          {/* Heirs */}
          <div>
            <h3 className="font-medium text-gray-800 mb-3">{t("faraid.heirs")}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.has_husband} onChange={e => setForm(f => ({ ...f, has_husband: e.target.checked }))} /> {t("faraid.husband")}</label>
              <div className="flex items-center gap-2"><span className="text-sm">{t("faraid.wives")}:</span>
                <input type="number" value={form.has_wife} onChange={e => setForm(f => ({ ...f, has_wife: parseInt(e.target.value) || 0 }))} min="0" max="4" className="w-16 px-2 py-1 border border-gray-300 rounded" /></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.has_father} onChange={e => setForm(f => ({ ...f, has_father: e.target.checked }))} /> {t("faraid.father")}</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.has_mother} onChange={e => setForm(f => ({ ...f, has_mother: e.target.checked }))} /> {t("faraid.mother")}</label>
              <div className="flex items-center gap-2"><span className="text-sm">{t("faraid.sons")}:</span>
                <input type="number" value={form.sons} onChange={e => setForm(f => ({ ...f, sons: parseInt(e.target.value) || 0 }))} min="0" className="w-16 px-2 py-1 border border-gray-300 rounded" /></div>
              <div className="flex items-center gap-2"><span className="text-sm">{t("faraid.daughters")}:</span>
                <input type="number" value={form.daughters} onChange={e => setForm(f => ({ ...f, daughters: parseInt(e.target.value) || 0 }))} min="0" className="w-16 px-2 py-1 border border-gray-300 rounded" /></div>
              <div className="flex items-center gap-2"><span className="text-sm">{t("faraid.brothers")}:</span>
                <input type="number" value={form.brothers} onChange={e => setForm(f => ({ ...f, brothers: parseInt(e.target.value) || 0 }))} min="0" className="w-16 px-2 py-1 border border-gray-300 rounded" /></div>
              <div className="flex items-center gap-2"><span className="text-sm">{t("faraid.sisters")}:</span>
                <input type="number" value={form.sisters} onChange={e => setForm(f => ({ ...f, sisters: parseInt(e.target.value) || 0 }))} min="0" className="w-16 px-2 py-1 border border-gray-300 rounded" /></div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-8 rounded-lg">
            {loading ? t("common.loading") : t("faraid.calculate")}
          </button>
        </form>
      </div>

      {/* Result */}
      {result?.shares && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-primary-800 mb-4">{t("faraid.result")}</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-6 text-center">
            <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">{t("faraid.estate_value")}</p><p className="text-xl font-bold">{result.estate_value} USD</p></div>
            <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Net Estate</p><p className="text-xl font-bold">{result.net_estate} USD</p></div>
            <div className="bg-primary-50 rounded-lg p-3"><p className="text-xs text-gray-500">{t("faraid.distributable")}</p><p className="text-xl font-bold text-primary-700">{result.distributable} USD</p></div>
          </div>
          <div className="space-y-3">
            {Object.entries(result.shares).map(([heir, data]: [string, any]) => (
              <div key={heir} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div>
                  <p className="font-semibold capitalize">{heir} {data.count > 1 ? `(x${data.count})` : ""}</p>
                  <p className="text-sm text-gray-500">Share: {data.fraction}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary-700">{data.amount} USD</p>
                  {data.each && data.count > 1 && <p className="text-xs text-gray-400">{data.each} USD each</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
