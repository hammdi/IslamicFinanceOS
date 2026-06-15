import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: string;
  color?: string;
}

export default function PageHeader({ title, description, icon, color = "from-primary-500 to-primary-700" }: PageHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="animate-fade-in mb-8">
      <div className={`bg-gradient-to-r ${color} rounded-2xl p-6 text-white shadow-lg relative overflow-hidden`}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full border-[20px] border-white/20" />
          <div className="absolute -left-5 -bottom-5 w-24 h-24 rounded-full border-[12px] border-white/20" />
        </div>
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-4">
            {icon && (
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                </svg>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="text-white/80 text-sm mt-1 max-w-xl leading-relaxed">{description}</p>
            </div>
          </div>
          <Link to="/help" className="text-white/60 hover:text-white transition-colors flex-shrink-0 mt-1" title={t("nav.help")}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
