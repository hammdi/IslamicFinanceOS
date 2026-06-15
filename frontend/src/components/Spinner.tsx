import { useTranslation } from "react-i18next";

export default function Spinner() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4" />
      <p className="text-gray-500 text-sm">{t("common.loading")}</p>
    </div>
  );
}
