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
  arabicClassName = 'font-poppins text-amber-600 dark:text-amber-300 text-xs font-semibold dir-rtl',
  inline = false,
}) => {
  if (!arabic) {
    return <span className={englishClassName}>{english}</span>;
  }

  if (inline) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className={englishClassName}>{english}</span>
        <span className="text-slate-400 font-normal">•</span>
        <span className={arabicClassName} dir="rtl">{arabic}</span>
      </span>
    );
  }

  return (
    <div className={`space-y-0.5 ${className}`}>
      <div className={englishClassName}>{english}</div>
      <div className={arabicClassName} dir="rtl">{arabic}</div>
    </div>
  );
};
