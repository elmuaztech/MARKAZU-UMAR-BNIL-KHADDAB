import React from 'react';

interface BilingualTextProps {
  english: string;
  arabic?: string;
  className?: string;
  englishClassName?: string;
  arabicClassName?: string;
  inline?: boolean;
}

export const BilingualText: React.FC<BilingualTextProps> = ({
  english,
  arabic,
  className = '',
  englishClassName = 'font-poppins font-bold text-slate-900 dark:text-white',
  arabicClassName = 'font-arabic text-amber-600 dark:text-amber-300 text-xs font-semibold',
  inline = false,
}) => {
  if (!arabic || !arabic.trim()) {
    return <span className={`break-words ${englishClassName}`}>{english}</span>;
  }

  if (inline) {
    return (
      <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
        <span className={`break-words ${englishClassName}`}>{english}</span>
        <span className="text-slate-400 font-normal select-none">•</span>
        <span className={`break-words ${arabicClassName}`} dir="rtl">
          {arabic}
        </span>
      </span>
    );
  }

  return (
    <div className={`space-y-0.5 min-w-0 ${className}`}>
      <div className={`break-words ${englishClassName}`}>{english}</div>
      <div className={`break-words leading-relaxed ${arabicClassName}`} dir="rtl">
        {arabic}
      </div>
    </div>
  );
};

