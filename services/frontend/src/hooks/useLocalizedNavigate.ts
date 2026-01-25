import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SUPPORTED_LANGS = ['de', 'es', 'fr'];
const DEFAULT_LANG = 'en';

/**
 * Extract language from URL path
 */
export function getLangFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && SUPPORTED_LANGS.includes(firstSegment)) {
    return firstSegment;
  }
  return DEFAULT_LANG;
}

/**
 * Get path without language prefix
 */
export function getPathWithoutLang(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && SUPPORTED_LANGS.includes(firstSegment)) {
    return '/' + segments.slice(1).join('/') || '/';
  }
  return pathname;
}

/**
 * Build localized path
 */
export function buildLocalizedPath(path: string, lang: string): string {
  // Remove any existing language prefix
  const cleanPath = getPathWithoutLang(path);

  // English uses no prefix
  if (lang === DEFAULT_LANG) {
    return cleanPath;
  }

  // Other languages get prefix
  if (cleanPath === '/') {
    return `/${lang}`;
  }
  return `/${lang}${cleanPath}`;
}

/**
 * Hook for localized navigation
 */
export function useLocalizedNavigate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();

  const currentLang = i18n.language?.split('-')[0] || DEFAULT_LANG;

  /**
   * Navigate to a path with current language
   */
  const localizedNavigate = (path: string) => {
    const localizedPath = buildLocalizedPath(path, currentLang);
    navigate(localizedPath);
  };

  /**
   * Get localized path for Link components
   */
  const getLocalizedPath = (path: string): string => {
    return buildLocalizedPath(path, currentLang);
  };

  /**
   * Change language and navigate to same page in new language
   */
  const changeLanguage = (newLang: string) => {
    const currentPath = getPathWithoutLang(location.pathname);
    const newPath = buildLocalizedPath(currentPath, newLang);
    i18n.changeLanguage(newLang);
    navigate(newPath);
  };

  return {
    navigate: localizedNavigate,
    getLocalizedPath,
    changeLanguage,
    currentLang,
  };
}

export { SUPPORTED_LANGS, DEFAULT_LANG };
