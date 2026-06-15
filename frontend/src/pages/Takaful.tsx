import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import Spinner from "../components/Spinner";

export default function Takaful() {
  const { t } = useTranslation();
  const [pools, setPools] = useState<any[]>([]);
  const [myPools, setMyPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", category: "health", monthly_contribution: "", max_members: "50" });
  const [claimForm, setClaimForm] = useState<Record<string, { amount: string; reason: string }>>({});
  const [message, setMessage] = useState("");

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch(`http://localhost:8000/takaful/available`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(r => r.json()),
      fetch(`http://localhost:8000/takaful/my`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(r => r.json()),
    ]).then(([a, m]) => { setPools(a); setMyPools(m); }).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = `http://localhost:8000/takaful/create?name=${encodeURIComponent(form.name)}&category=${form.category}&monthly_contribution=${form.monthly_contribution}&max_members=${form.max_members}`;
      await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      setForm({ name: "", category: "health", monthly_contribution: "", max_members: "50" });
      setMessage(t("common.success")); loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  const handleContribute = async (poolId: string) => {
    try {
      await fetch(`http://localhost:8000/takaful/${poolId}/contribute`, {
        method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setMessage(t("common.success")); loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  const handleClaim = async (poolId: string) => {
    const c = claimForm[poolId];
    if (!c?.amount || !c?.reason) return;
    try {
      await fetch(`http://localhost:8000/takaful/${poolId}/claim?amount=${c.amount}&reason=${encodeURIComponent(c.reason)}`, {
        method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setClaimForm(p => ({ ...p, [poolId]: { amount: "", reason: "" } }));
      setMessage(t("common.success")); loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  const handleVote = async (claimId: string, approve: boolean) => {
    try {
      await fetch(`http://localhost:8000/takaful/claims/${claimId}/vote?approve=${approve}`, {
        method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setMessage(t("common.success")); loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary-800">{t("takaful.title")}</h1>
      {message && <div className="bg-primary-50 text-primary-700 p-3 rounded-lg text-sm">{message}<button onClick={() => setMessage("")} className="float-right">&times;</button></div>}

      {/* Create Pool */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("takaful.create")}</h2>
        <form onSubmit={handleCreate} className="grid md:grid-cols-4 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("takaful.pool_name")}</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("takaful.category")}</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              {["health","education","agriculture","disaster","funeral","general"].map(c => <option key={c} value={c}>{c}</option>)}
            </select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("takaful.monthly")}</label>
            <input type="number" value={form.monthly_contribution} onChange={e => setForm(f => ({ ...f, monthly_contribution: e.target.value }))} required min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
          <div className="flex items-end"><button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium py-2 rounded-lg">{t("takaful.submit")}</button></div>
        </form>
      </div>

      {/* My Pools */}
      {myPools.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("takaful.my_pools")}</h2>
          <div className="grid gap-4">
            {myPools.map(pool => (
              <div key={pool.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-rose-500">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{pool.name}</h3>
                    <p className="text-sm text-gray-500">{pool.category} | {pool.members_count} members | Balance: {pool.pool_balance} USD</p>
                  </div>
                  <button onClick={() => handleContribute(pool.id)} className="bg-rose-600 hover:bg-rose-700 text-white text-sm px-4 py-2 rounded-lg">{t("takaful.contribute")} ({pool.monthly_contribution} USD)</button>
                </div>
                {/* Claims */}
                {pool.claims?.filter((c: any) => c.status === "pending").map((claim: any) => (
                  <div key={claim.id} className="bg-rose-50 rounded-lg p-3 mb-2">
                    <p className="text-sm font-medium">Claim: {claim.amount} USD — {claim.reason}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">Votes: {claim.votes_for} for / {claim.votes_against} against</span>
                      <button onClick={() => handleVote(claim.id, true)} className="bg-green-500 text-white text-xs px-3 py-1 rounded">Approve</button>
                      <button onClick={() => handleVote(claim.id, false)} className="bg-red-500 text-white text-xs px-3 py-1 rounded">Reject</button>
                    </div>
                  </div>
                ))}
                {/* File claim */}
                <div className="flex gap-2 mt-3">
                  <input type="number" placeholder="Amount" value={claimForm[pool.id]?.amount || ""}
                    onChange={e => setClaimForm(p => ({ ...p, [pool.id]: { ...p[pool.id], amount: e.target.value, reason: p[pool.id]?.reason || "" } }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <input type="text" placeholder="Reason" value={claimForm[pool.id]?.reason || ""}
                    onChange={e => setClaimForm(p => ({ ...p, [pool.id]: { ...p[pool.id], reason: e.target.value, amount: p[pool.id]?.amount || "" } }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <button onClick={() => handleClaim(pool.id)} className="bg-amber-600 text-white text-sm px-4 py-2 rounded-lg">{t("takaful.file_claim")}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available */}
      {pools.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("takaful.available")}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {pools.map(p => (
              <div key={p.id} className="bg-white rounded-xl shadow p-4 border-l-4 border-rose-300">
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-gray-500">{p.category} | {p.monthly_contribution} USD/mo | {p.members_count}/{p.max_members} members</p>
                <button onClick={() => fetch(`http://localhost:8000/takaful/${p.id}/join`, { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(() => { setMessage(t("common.success")); loadData(); })}
                  className="mt-2 bg-rose-600 hover:bg-rose-700 text-white text-sm px-4 py-1 rounded-lg">{t("takaful.join")}</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
