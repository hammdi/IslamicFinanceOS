import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import Spinner from "../components/Spinner";

export default function Marketplace() {
  const { t } = useTranslation();
  const [listings, setListings] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"market" | "shura">("market");
  const [form, setForm] = useState({ title: "", description: "", category: "electronics", price: "", location: "" });
  const [proposalForm, setProposalForm] = useState({ title: "", description: "", category: "community", amount: "" });
  const [message, setMessage] = useState("");

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("http://localhost:8000/marketplace/listings", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(r => r.json()),
      fetch("http://localhost:8000/marketplace/shura/proposals", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then(r => r.json()),
    ]).then(([l, p]) => { setListings(l); setProposals(p); }).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { loadData(); }, []);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8000/marketplace/listings", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
      });
      if (!res.ok) throw new Error((await res.json()).detail);
      setForm({ title: "", description: "", category: "electronics", price: "", location: "" });
      setMessage(t("common.success")); loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  const handleBuy = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8000/marketplace/listings/${id}/buy`, {
        method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail);
      setMessage(t("common.success")); loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("http://localhost:8000/marketplace/shura/propose", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ ...proposalForm, amount: proposalForm.amount ? parseFloat(proposalForm.amount) : null }),
      });
      setProposalForm({ title: "", description: "", category: "community", amount: "" });
      setMessage(t("common.success")); loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  const handleVote = async (id: string, approve: boolean) => {
    try {
      await fetch(`http://localhost:8000/marketplace/shura/${id}/vote?approve=${approve}`, {
        method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary-800">{t("marketplace.title")}</h1>
      {message && <div className="bg-primary-50 text-primary-700 p-3 rounded-lg text-sm">{message}<button onClick={() => setMessage("")} className="float-right">&times;</button></div>}

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab("market")} className={`px-6 py-2 rounded-lg font-medium ${tab === "market" ? "bg-primary-600 text-white" : "bg-white text-gray-700 border"}`}>{t("marketplace.browse")}</button>
        <button onClick={() => setTab("shura")} className={`px-6 py-2 rounded-lg font-medium ${tab === "shura" ? "bg-primary-600 text-white" : "bg-white text-gray-700 border"}`}>{t("marketplace.shura")}</button>
      </div>

      {tab === "market" && (
        <>
          {/* Create Listing */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("marketplace.create_listing")}</h2>
            <form onSubmit={handleCreateListing} className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("marketplace.item_title")}</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("marketplace.price")}</label>
                <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">{t("marketplace.item_desc")}</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
              <div className="md:col-span-2"><button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-8 rounded-lg">{t("marketplace.submit")}</button></div>
            </form>
          </div>

          {/* Listings */}
          <div className="grid md:grid-cols-3 gap-4">
            {listings.map(l => (
              <div key={l.id} className="bg-white rounded-xl shadow-md p-4 border-t-4 border-primary-400">
                <h3 className="font-semibold">{l.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{l.description}</p>
                <p className="text-lg font-bold text-primary-700 mt-2">{l.price} USD</p>
                {l.location && <p className="text-xs text-gray-400">{l.location}</p>}
                <button onClick={() => handleBuy(l.id)} className="mt-3 w-full bg-primary-600 hover:bg-primary-700 text-white text-sm py-2 rounded-lg">{t("marketplace.buy")}</button>
              </div>
            ))}
            {listings.length === 0 && <p className="text-gray-500 col-span-3 text-center py-8">{t("marketplace.no_listings")}</p>}
          </div>
        </>
      )}

      {tab === "shura" && (
        <>
          {/* Create Proposal */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("marketplace.propose")}</h2>
            <form onSubmit={handlePropose} className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("marketplace.proposal_title")}</label>
                <input type="text" value={proposalForm.title} onChange={e => setProposalForm(f => ({ ...f, title: e.target.value }))} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("marketplace.proposal_amount")}</label>
                <input type="number" value={proposalForm.amount} onChange={e => setProposalForm(f => ({ ...f, amount: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">{t("marketplace.proposal_desc")}</label>
                <textarea value={proposalForm.description} onChange={e => setProposalForm(f => ({ ...f, description: e.target.value }))} required rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
              <div className="md:col-span-2"><button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-8 rounded-lg">{t("marketplace.submit_proposal")}</button></div>
            </form>
          </div>

          {/* Proposals */}
          <div className="space-y-4">
            {proposals.map(p => (
              <div key={p.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-start">
                  <div><h3 className="font-semibold text-lg">{p.title}</h3><p className="text-sm text-gray-600">{p.description}</p>
                    {p.amount && <p className="text-sm text-primary-600 mt-1">{p.amount} USD</p>}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{p.votes_for} for / {p.votes_against} against</span>
                    <button onClick={() => handleVote(p.id, true)} className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded">Yes</button>
                    <button onClick={() => handleVote(p.id, false)} className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded">No</button>
                  </div>
                </div>
              </div>
            ))}
            {proposals.length === 0 && <p className="text-gray-500 text-center py-8">{t("marketplace.no_proposals")}</p>}
          </div>
        </>
      )}
    </div>
  );
}
