import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function Help() {
  const { t } = useTranslation();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportForm, setReportForm] = useState({ subject: "", description: "", type: "bug" });
  const [sent, setSent] = useState(false);

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    // In production: send to backend
    console.log("Report submitted:", reportForm);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setReportForm({ subject: "", description: "", type: "bug" });
    setReportOpen(false);
  };

  const guides = [
    { key: "qard", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 10v1", color: "text-emerald-600" },
    { key: "musharaka", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0", color: "text-blue-600" },
    { key: "tontine", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581", color: "text-amber-600" },
    { key: "murabaha", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2", color: "text-teal-600" },
    { key: "zakat", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364", color: "text-green-600" },
    { key: "waqf", icon: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z", color: "text-purple-600" },
    { key: "takaful", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944", color: "text-rose-600" },
    { key: "hawala", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945", color: "text-cyan-600" },
    { key: "faraid", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2", color: "text-gray-600" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-primary-800">{t("help.title")}</h1>
        <p className="text-gray-600 mt-1">{t("help.subtitle")}</p>
      </div>

      {sent && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl animate-fade-in">
          {t("help.report_sent")}
        </div>
      )}

      {/* Product Guides */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("help.guides")}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {guides.map((g) => (
            <div key={g.key} className="bg-white rounded-xl shadow p-5 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <div className="flex items-center gap-3 mb-3">
                <svg className={`w-6 h-6 ${g.color} group-hover:scale-110 transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={g.icon} />
                </svg>
                <h3 className="font-semibold">{t(`dashboard.${g.key}_title`)}</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">{t(`dashboard.${g.key}_desc`)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("help.faq")}</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <details key={i} className="bg-white rounded-xl shadow group">
              <summary className="px-5 py-4 cursor-pointer font-medium text-gray-800 flex items-center justify-between hover:bg-gray-50 rounded-xl transition-colors">
                {t(`help.faq${i}_q`)}
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{t(`help.faq${i}_a`)}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Report Problem */}
      <div>
        <button onClick={() => setReportOpen(!reportOpen)}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {t("help.report_problem")}
        </button>

        {reportOpen && (
          <form onSubmit={handleReport} className="mt-4 bg-white rounded-xl shadow-md p-6 animate-fade-in space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("help.report_type")}</label>
              <select value={reportForm.type} onChange={(e) => setReportForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="bug">Bug</option>
                <option value="feature">Feature Request</option>
                <option value="security">Security Issue</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("help.report_subject")}</label>
              <input type="text" value={reportForm.subject} onChange={(e) => setReportForm((f) => ({ ...f, subject: e.target.value }))} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("help.report_desc")}</label>
              <textarea value={reportForm.description} onChange={(e) => setReportForm((f) => ({ ...f, description: e.target.value }))} required rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
              {t("help.report_submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
