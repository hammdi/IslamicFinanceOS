import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Spinner from "../components/Spinner";

const GOAL_TYPES = ["hajj", "wedding", "education", "emergency", "home", "custom"];
const typeIcons: Record<string, string> = {
  hajj: "bg-amber-100 text-amber-700", wedding: "bg-pink-100 text-pink-700",
  education: "bg-blue-100 text-blue-700", emergency: "bg-red-100 text-red-700",
  home: "bg-green-100 text-green-700", custom: "bg-gray-100 text-gray-700",
};

export default function Family() {
  const { t } = useTranslation();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", goal_type: "hajj", target_amount: "", monthly_contribution: "" });
  const [contributions, setContributions] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const loadData = () => {
    fetch("http://localhost:8000/family/goals", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(r => r.json()).then(setGoals).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("http://localhost:8000/family/goals", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ ...form, target_amount: parseFloat(form.target_amount), monthly_contribution: parseFloat(form.monthly_contribution || "0") }),
      });
      setForm({ name: "", goal_type: "hajj", target_amount: "", monthly_contribution: "" });
      setMessage(t("common.success")); loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  const handleContribute = async (goalId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/family/goals/${goalId}/contribute`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ amount: parseFloat(contributions[goalId]) }),
      });
      if (!res.ok) throw new Error((await res.json()).detail);
      setContributions(p => ({ ...p, [goalId]: "" }));
      setMessage(t("common.success")); loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary-800">{t("family.title")}</h1>
      {message && <div className="bg-primary-50 text-primary-700 p-3 rounded-lg text-sm">{message}<button onClick={() => setMessage("")} className="float-right">&times;</button></div>}

      {/* Create Goal */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("family.create_goal")}</h2>
        <form onSubmit={handleCreate} className="grid md:grid-cols-4 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("family.goal_name")}</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Hajj 2027" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("family.goal_type")}</label>
            <select value={form.goal_type} onChange={e => setForm(f => ({ ...f, goal_type: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              {GOAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("family.target")}</label>
            <input type="number" value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} required min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
          <div className="flex items-end"><button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg">{t("family.submit")}</button></div>
        </form>
      </div>

      {/* Goals */}
      {goals.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {goals.map(g => (
            <div key={g.id} className={`bg-white rounded-xl shadow-md p-6 border-t-4 ${g.status === "completed" ? "border-green-400" : "border-amber-400"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeIcons[g.goal_type] || typeIcons.custom}`}>{g.goal_type}</span>
                <h3 className="font-semibold text-lg">{g.name}</h3>
                {g.status === "completed" && <span className="text-green-600 text-sm font-medium">Complete!</span>}
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">{g.progress}%</span>
                  <span className="font-medium">{g.current_amount} / {g.target_amount} USD</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className={`h-3 rounded-full transition-all ${g.status === "completed" ? "bg-green-500" : "bg-amber-500"}`} style={{ width: `${g.progress}%` }} />
                </div>
              </div>
              {g.status === "active" && (
                <div className="flex gap-2 mt-4">
                  <input type="number" placeholder="Amount" value={contributions[g.id] || ""} onChange={e => setContributions(p => ({ ...p, [g.id]: e.target.value }))} min="1" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <button onClick={() => handleContribute(g.id)} disabled={!contributions[g.id]} className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white text-sm px-4 py-2 rounded-lg">{t("family.save")}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : <p className="text-gray-500 text-center py-8">{t("family.no_goals")}</p>}
    </div>
  );
}
