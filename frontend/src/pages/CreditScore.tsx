import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Spinner from "../components/Spinner";

export default function CreditScore() {
  const { t } = useTranslation();
  const [score, setScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/credit-score/my", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(r => r.json()).then(setScore).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const gradeColor = (g: string) =>
    g === "A+" ? "text-green-600" : g === "A" ? "text-emerald-600" : g === "B" ? "text-blue-600" : g === "C" ? "text-amber-600" : "text-red-600";
  const barColor = (pct: number) =>
    pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-emerald-500" : pct >= 40 ? "bg-blue-500" : pct >= 20 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary-800">{t("creditscore.title")}</h1>

      {score && (
        <>
          {/* Score Hero */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-sm text-gray-500 uppercase tracking-wide">{t("creditscore.your_score")}</p>
            <p className="text-7xl font-bold mt-2">{score.score}</p>
            <p className={`text-3xl font-bold mt-1 ${gradeColor(score.grade)}`}>{score.grade}</p>
            <p className="text-sm text-gray-400 mt-2">/ 1000</p>
            <div className="w-full max-w-md mx-auto mt-4 bg-gray-200 rounded-full h-4">
              <div className={`h-4 rounded-full transition-all ${barColor(score.score / 10)}`} style={{ width: `${score.score / 10}%` }} />
            </div>
          </div>

          {/* Components */}
          <div className="grid md:grid-cols-5 gap-4">
            {Object.entries(score.components).map(([key, data]: [string, any]) => {
              const pct = (data.score / data.max) * 100;
              return (
                <div key={key} className="bg-white rounded-xl shadow p-4 text-center">
                  <p className="text-2xl font-bold">{data.score}</p>
                  <p className="text-xs text-gray-400">/ {data.max}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className={`h-2 rounded-full ${barColor(pct)}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-600 mt-2 capitalize">{key}</p>
                </div>
              );
            })}
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("creditscore.breakdown")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(score.breakdown).map(([k, v]: [string, any]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-primary-700">{v}</p>
                  <p className="text-xs text-gray-500">{k.replace(/_/g, " ")}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
