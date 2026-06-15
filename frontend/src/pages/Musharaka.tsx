import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import Spinner from "../components/Spinner";
import PageHeader from "../components/PageHeader";
import InfoLabel from "../components/InfoLabel";

export default function Musharaka() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    project_name: "", description: "", target_amount: "",
    expected_profit_percent: "", duration_months: "",
  });
  const [investAmounts, setInvestAmounts] = useState<Record<string, string>>({});
  const [profitAmounts, setProfitAmounts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const loadData = () => {
    setLoading(true);
    Promise.all([api.listMusharaka(), api.myMusharaka()])
      .then(([available, mine]) => { setProjects(available); setMyProjects(mine); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMusharaka({
        project_name: form.project_name, description: form.description,
        target_amount: parseFloat(form.target_amount),
        expected_profit_percent: parseFloat(form.expected_profit_percent),
        duration_months: parseInt(form.duration_months),
      });
      setForm({ project_name: "", description: "", target_amount: "", expected_profit_percent: "", duration_months: "" });
      setMessage(t("common.success"));
      loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  const handleInvest = async (projectId: string) => {
    try {
      await api.investMusharaka(projectId, { amount: parseFloat(investAmounts[projectId]) });
      setInvestAmounts((p) => ({ ...p, [projectId]: "" }));
      setMessage(t("common.success"));
      loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  const handleProfit = async (projectId: string) => {
    try {
      await api.distributeProfit(projectId, { total_profit: parseFloat(profitAmounts[projectId]) });
      setProfitAmounts((p) => ({ ...p, [projectId]: "" }));
      setMessage(t("common.success"));
      loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title={t("musharaka.title")}
        description="Joint venture where all partners contribute capital and share profits AND losses proportionally. No guaranteed return — real risk, real partnership."
        icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        color="from-blue-500 to-blue-700" />

      {message && (
        <div className="bg-primary-50 text-primary-700 p-4 rounded-xl text-sm flex items-center gap-2 animate-fade-in shadow-sm">
          <svg className="w-5 h-5 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="flex-1">{message}</span>
          <button onClick={() => setMessage("")} className="text-primary-400 hover:text-primary-600">&times;</button>
        </div>
      )}

      {/* Create Project */}
      <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("musharaka.create")}</h2>
        <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
          <div>
            <InfoLabel label={t("musharaka.project_name")} info="Name of the business project or venture seeking investment from the community." required />
            <input type="text" value={form.project_name} onChange={(e) => setForm((f) => ({ ...f, project_name: e.target.value }))} required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl transition-all hover:border-primary-300" />
          </div>
          <div>
            <InfoLabel label={t("musharaka.target_amount")} info="Total capital needed for the project. Investors contribute portions of this amount." required />
            <input type="number" value={form.target_amount} onChange={(e) => setForm((f) => ({ ...f, target_amount: e.target.value }))} required min="1"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl transition-all hover:border-primary-300" />
          </div>
          <div className="md:col-span-2">
            <InfoLabel label={t("musharaka.description")} info="Detailed description of the project, business plan, and expected outcomes." required />
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl transition-all hover:border-primary-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("musharaka.expected_profit")}</label>
            <input type="number" value={form.expected_profit_percent} onChange={(e) => setForm((f) => ({ ...f, expected_profit_percent: e.target.value }))} required min="0" step="0.1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("musharaka.duration")}</label>
            <input type="number" value={form.duration_months} onChange={(e) => setForm((f) => ({ ...f, duration_months: e.target.value }))} required min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-8 rounded-lg">
              {t("musharaka.submit")}
            </button>
          </div>
        </form>
      </div>

      {/* My Projects */}
      {myProjects.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("musharaka.title").split("—")[0].trim()} — {user?.name}</h2>
          <div className="grid gap-4">
            {myProjects.map((project) => {
              const isOwner = project.entrepreneur_id === user?.id;
              const progress = (project.current_amount / project.target_amount) * 100;
              const canDistribute = isOwner && (project.status === "funded" || project.status === "active");

              return (
                <div key={project.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
                  <div className="flex flex-col md:flex-row md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{project.project_name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          project.status === "completed" ? "bg-green-100 text-green-800" :
                          project.status === "funded" ? "bg-blue-100 text-blue-800" :
                          project.status === "active" ? "bg-purple-100 text-purple-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>{project.status}</span>
                      </div>
                      <p className="text-gray-600 text-sm">{project.description}</p>
                      <div className="mt-2 flex gap-4 text-xs text-gray-500">
                        <span>{t("musharaka.expected_profit")}: {project.expected_profit_percent}%</span>
                        <span>{t("musharaka.duration")}: {project.duration_months}m</span>
                        <span>{isOwner ? "Owner" : "Investor"}</span>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{t("musharaka.progress")}</span>
                          <span className="font-medium">{project.current_amount} / {project.target_amount}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                      </div>
                      {project.investments?.length > 0 && (
                        <p className="text-xs text-gray-400 mt-2">{project.investments.length} investor(s)</p>
                      )}
                    </div>
                    {canDistribute && (
                      <div className="flex items-center gap-2">
                        <input type="number" placeholder={t("musharaka.profit_amount")}
                          value={profitAmounts[project.id] || ""}
                          onChange={(e) => setProfitAmounts((p) => ({ ...p, [project.id]: e.target.value }))}
                          step="0.01"
                          className="w-36 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        <button onClick={() => handleProfit(project.id)} disabled={!profitAmounts[project.id]}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm px-4 py-2 rounded-lg">
                          {t("musharaka.distribute")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Projects */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("musharaka.available")}</h2>
        {projects.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t("musharaka.no_projects")}</p>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => {
              const progress = (project.current_amount / project.target_amount) * 100;
              return (
                <div key={project.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                  <div className="flex flex-col md:flex-row md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{project.project_name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{project.description}</p>
                      <div className="mt-2 flex gap-4 text-sm text-gray-500">
                        <span>{t("musharaka.expected_profit")}: {project.expected_profit_percent}%</span>
                        <span>{t("musharaka.duration")}: {project.duration_months}m</span>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{t("musharaka.progress")}</span>
                          <span className="font-medium">{project.current_amount} / {project.target_amount}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                    {project.entrepreneur_id !== user?.id && (
                      <div className="flex items-center gap-2">
                        <input type="number" placeholder={t("musharaka.invest_amount")}
                          value={investAmounts[project.id] || ""}
                          onChange={(e) => setInvestAmounts((p) => ({ ...p, [project.id]: e.target.value }))}
                          min="1" step="0.01"
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        <button onClick={() => handleInvest(project.id)} disabled={!investAmounts[project.id]}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm px-4 py-2 rounded-lg">
                          {t("musharaka.invest")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
