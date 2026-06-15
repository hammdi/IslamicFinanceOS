import { useState } from "react";

interface InfoLabelProps {
  label: string;
  info: string;
  required?: boolean;
  htmlFor?: string;
}

export default function InfoLabel({ label, info, required, htmlFor }: InfoLabelProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="flex items-center gap-1.5 mb-1 relative">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="text-gray-400 hover:text-primary-500 transition-colors focus:outline-none"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {show && (
        <div className="absolute left-0 top-full mt-1 z-50 animate-fade-in">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 max-w-xs shadow-lg leading-relaxed">
            {info}
            <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}
