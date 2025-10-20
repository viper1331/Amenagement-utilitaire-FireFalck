import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../state/useEditorStore';

export const useI18nSync = (): void => {
  const { i18n } = useTranslation();
  const language = useEditorStore((state) => state.project?.settings.language ?? 'fr');

  useEffect(() => {
    if (typeof i18n.changeLanguage === 'function') {
      void i18n.changeLanguage(language);
    }
  }, [language, i18n]);
};
