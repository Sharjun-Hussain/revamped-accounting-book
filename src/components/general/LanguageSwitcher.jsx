"use client";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const handleLanguageChange = (newLocale) => {
    if (newLocale === currentLocale) return;
    
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';
    router.push(`/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`);
  };

  return (
    <select 
      value={currentLocale} 
      onChange={(e) => handleLanguageChange(e.target.value)}
      className="bg-white border border-slate-200 rounded-md px-2 py-1 text-sm font-medium focus:outline-none cursor-pointer hover:bg-slate-50 transition-colors"
    >
      <option value="en">EN</option>
      <option value="ta">TA</option>
      <option value="si">SI</option>
    </select>
  );
}
