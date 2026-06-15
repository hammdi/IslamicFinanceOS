import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader";
import Spinner from "../components/Spinner";

const API = "http://localhost:8000";
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` });

export default function EmployeePortal() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"dashboard" | "kyc" | "tickets" | "campaigns" | "logs" | "team">("dashboard");
  const [dashboard, setDashboard] = useState<any>(null);
  const [kyc, setKyc] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const h = headers();
      const [d, p] = await Promise.all([
        fetch(`${API}/employee/dashboard`, { headers: h }).then(r => { if (!r.ok) throw new Error("Access denied"); return r.json(); }),
        fetch(`${API}/employee/performance`, { headers: h }).then(r => r.json()),
      ]);
      setDashboard(d); setPerformance(p);
      if (tab === "kyc") setKyc(await fetch(`${API}/employee/kyc/pending`, { headers: h }).then(r => r.json()));
      if (tab === "tickets") setTickets(await fetch(`${API}/employee/tickets/queue`, { headers: h }).then(r => r.json()));
      if (tab === "campaigns") setCampaigns(await fetch(`${API}/employee/campaigns/unverified`, { headers: h }).then(r => r.json()));
      if (tab === "logs") setLogs(await fetch(`${API}/employee/logs`, { headers: h }).then(r => r.json()));
      if (tab === "team") setTeam(await fetch(`${API}/employee/team`, { headers: h }).then(r => r.json()));
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab]);

  const reviewKyc = async (id: string, status: string) => {
    await fetch(`${API}/employee/kyc/${id}/review`, { method: "POST", headers: headers(), body: JSON.stringify({ status, notes: status === "rejected" ? "Insufficient documentation" : "" }) });
    setMessage(t("common.success")); load();
  };

  const assignTicket = async (id: string) => {
    await fetch(`${API}/employee/tickets/${id}/assign`, { method: "POST", headers: headers() });
    setMessage(t("common.success")); load();
  };

  const respondTicket = async (id: string) => {
    const response = prompt("Response:");
    if (!response) return;
    await fetch(`${API}/employee/tickets/${id}/respond`, { method: "POST", headers: headers(), body: JSON.stringify({ response, status: "resolved" }) });
    setMessage(t("common.success")); load();
  };

  const verifyCampaign = async (id: string) => {
    await fetch(`${API}/employee/campaigns/${id}/verify`, { method: "POST", headers: headers() });
    setMessage(t("common.success")); load();
  };

  if (error) return (
    <div className="text-center py-12 animate-fade-in">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11-7a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>
      <p className="text-red-600 font-medium text-lg">{error}</p>
      <p className="text-gray-500 text-sm mt-2">{t("employee.access_required")}</p>
    </div>
  );

  if (loading && !dashboard) return <Spinner />;

  const tabs = [
    { key: "dashboard", icon: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" },
    { key: "kyc", icon: "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" },
    { key: "tickets", icon: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" },
    { key: "campaigns", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { key: "logs", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { key: "team", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t("employee.title")}
        description={t("employee.description")}
        icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        color="from-gray-700 to-gray-900"
      />

      {message && <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm animate-fade-in">{message}<button onClick={() => setMessage("")} className="float-right">&times;</button></div>}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${tab === tb.key ? "bg-gray-800 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tb.icon} /></svg>
            {t(`employee.tab_${tb.key}`)}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {tab === "dashboard" && dashboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
            {[
              { label: t("employee.kyc_pending"), value: dashboard.kyc_pending, color: "text-amber-600", bg: "bg-amber-50" },
              { label: t("employee.tickets_open"), value: dashboard.tickets_open, color: "text-red-600", bg: "bg-red-50" },
              { label: t("employee.murabaha_pending"), value: dashboard.murabaha_pending, color: "text-teal-600", bg: "bg-teal-50" },
              { label: t("employee.disputes_open"), value: dashboard.disputes_open, color: "text-purple-600", bg: "bg-purple-50" },
              { label: t("employee.campaigns_unverified"), value: dashboard.campaigns_unverified, color: "text-pink-600", bg: "bg-pink-50" },
              { label: t("employee.total_users"), value: dashboard.total_users, color: "text-blue-600", bg: "bg-blue-50" },
              { label: t("employee.total_tx"), value: dashboard.total_transactions, color: "text-gray-600", bg: "bg-gray-50" },
              { label: t("employee.total_balance"), value: `${dashboard.total_wallet_balance?.toFixed(0)}$`, color: "text-green-600", bg: "bg-green-50" },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} rounded-xl p-4 text-center animate-count-up card-hover`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          {performance && (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-3">{t("employee.my_performance")}</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><p className="text-2xl font-bold text-primary-600">{performance.kyc_reviewed}</p><p className="text-xs text-gray-500">KYC Reviewed</p></div>
                <div><p className="text-2xl font-bold text-green-600">{performance.tickets_resolved}</p><p className="text-xs text-gray-500">Tickets Resolved</p></div>
                <div><p className="text-2xl font-bold text-gray-600">{performance.total_actions}</p><p className="text-xs text-gray-500">Total Actions</p></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KYC Tab */}
      {tab === "kyc" && (
        <div className="space-y-3">
          {kyc.length === 0 ? <p className="text-gray-500 text-center py-8">{t("employee.no_pending")}</p> : kyc.map(k => (
            <div key={k.id} className="bg-white rounded-xl shadow p-5 animate-fade-in card-hover">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{k.full_name}</p>
                  <p className="text-sm text-gray-500">{k.nationality} | {k.id_type}: {k.id_number}</p>
                  <p className="text-xs text-gray-400 mt-1">{k.address}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => reviewKyc(k.id, "approved")} className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition-all">{t("employee.approve")}</button>
                  <button onClick={() => reviewKyc(k.id, "rejected")} className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg transition-all">{t("employee.reject")}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tickets Tab */}
      {tab === "tickets" && (
        <div className="space-y-3">
          {tickets.length === 0 ? <p className="text-gray-500 text-center py-8">{t("employee.no_tickets")}</p> : tickets.map(tk => (
            <div key={tk.id} className="bg-white rounded-xl shadow p-5 animate-fade-in card-hover">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tk.priority === "urgent" ? "bg-red-100 text-red-800" : tk.priority === "high" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800"}`}>{tk.priority}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tk.status === "open" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>{tk.status}</span>
                  </div>
                  <p className="font-semibold">{tk.subject}</p>
                  <p className="text-sm text-gray-500">{tk.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{tk.user_name} — {tk.user_email}</p>
                </div>
                <div className="flex gap-2">
                  {tk.status === "open" && <button onClick={() => assignTicket(tk.id)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded-lg transition-all">{t("employee.assign_me")}</button>}
                  {(tk.status === "assigned" || tk.status === "in_progress") && <button onClick={() => respondTicket(tk.id)} className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-2 rounded-lg transition-all">{t("employee.respond")}</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Campaigns Tab */}
      {tab === "campaigns" && (
        <div className="space-y-3">
          {campaigns.length === 0 ? <p className="text-gray-500 text-center py-8">{t("employee.no_campaigns")}</p> : campaigns.map(c => (
            <div key={c.id} className="bg-white rounded-xl shadow p-5 animate-fade-in card-hover flex justify-between items-center">
              <div><p className="font-semibold">{c.title}</p><p className="text-sm text-gray-500">{c.category} | Target: {c.target} USD</p></div>
              <button onClick={() => verifyCampaign(c.id)} className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition-all">{t("employee.verify")}</button>
            </div>
          ))}
        </div>
      )}

      {/* Logs Tab */}
      {tab === "logs" && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50"><tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("employee.employee_name")}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("employee.action")}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("employee.target")}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("employee.details")}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("employee.time")}</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(l => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{l.employee}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-gray-100 text-xs">{l.action}</span></td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">{l.target_type}/{l.target_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{l.details}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(l.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Team Tab */}
      {tab === "team" && (
        <div className="grid md:grid-cols-2 gap-4">
          {team.map(e => (
            <div key={e.id} className="bg-white rounded-xl shadow p-5 flex items-center gap-4 animate-fade-in card-hover">
              <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-lg font-bold">{e.name?.charAt(0)}</div>
              <div>
                <p className="font-semibold">{e.name}</p>
                <p className="text-sm text-gray-500">{e.email}</p>
                <div className="flex gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-primary-100 text-primary-700 font-medium">{e.role}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{e.department}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
