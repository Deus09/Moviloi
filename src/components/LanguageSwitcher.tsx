import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage as changeI18nLanguage } from '../i18n';
import { IonAccordion, IonAccordionGroup, IonItem, IonLabel, IonIcon } from '@ionic/react';
import { chevronDownOutline } from 'ionicons/icons';
import './LanguageSwitcher.css';

interface LanguageSwitcherProps {
  compact?: boolean;
  showAsButtons?: boolean; // Yeni prop: butonlar halinde göstermek için
  showAsAccordion?: boolean; // Yeni prop: accordion halinde göstermek için
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false, showAsButtons = false, showAsAccordion = false }) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language || 'en');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷', short: 'TR' },
    { code: 'en', label: 'English', flag: '🇺🇸', short: 'EN' },
    { code: 'es', label: 'Español', flag: '🇪🇸', short: 'ES' }
  ];

  // i18n dil değişikliklerini dinle
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      console.log('🌍 Language changed to:', lng);
      setCurrentLang(lng);
    };

    const handleCustomLanguageChange = (event: CustomEvent) => {
      console.log('🔄 Custom language change event:', event.detail);
      setCurrentLang(event.detail);
    };

    i18n.on('languageChanged', handleLanguageChange);
    window.addEventListener('languageChanged', handleCustomLanguageChange as EventListener);
    
    // İlk load'da da güncelle
    setCurrentLang(i18n.language || 'en');

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
      window.removeEventListener('languageChanged', handleCustomLanguageChange as EventListener);
    };
  }, [i18n]);

  const changeLanguage = async (lng: string) => {
    console.log('🔄 Changing language to:', lng);
    try {
      await changeI18nLanguage(lng);
      console.log('✅ Language changed successfully to:', lng);
    } catch (error) {
      console.error('❌ Failed to change language:', error);
    }
    setIsOpen(false);
  };

  // Mevcut dili doğru bulma - fallback dahil
  const getCurrentLanguage = () => {
    const currentLangCode = currentLang || 'en';
    console.log('🌍 Current language code:', currentLangCode);
    
    // Tam eşleşme ara
    const exactMatch = languages.find(lang => lang.code === currentLangCode);
    if (exactMatch) return exactMatch;
    
    // Kısaltma ile eşleşme ara (örn: en-US -> en)
    const shortMatch = languages.find(lang => currentLangCode.startsWith(lang.code));
    if (shortMatch) return shortMatch;
    
    // Fallback İngilizce
    return languages.find(lang => lang.code === 'en') || languages[0];
  };

  const currentLanguage = getCurrentLanguage();

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Compact version (minimal dropdown)
  if (compact) {
    return (
      <div className="language-switcher-minimal" ref={dropdownRef}>
        <button
          className="minimal-button"
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
          <span className="flag-text">{currentLanguage.flag}</span>
          <svg 
            className={`chevron-icon ${isOpen ? 'rotated' : ''}`} 
            width="8" 
            height="8" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </button>
        
        {isOpen && (
          <div className="minimal-dropdown">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`dropdown-item ${currentLang === lang.code ? 'active' : ''}`}
                onClick={() => changeLanguage(lang.code)}
                type="button"
              >
                <span className="flag-text">{lang.flag}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // showAsButtons true ise eski 3 buton görünümü
  if (showAsButtons) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400 font-poppins">{t('profile.language')}:</span>
        <div className="flex gap-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentLang === lang.code
                  ? 'bg-[#FE7743] text-white shadow-lg'
                  : 'bg-[#333] text-gray-300 hover:bg-[#444] hover:text-white'
              }`}
            >
              <span className="mr-1">{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // showAsAccordion true ise accordion görünümü
  if (showAsAccordion) {
    return (
      <div className="language-switcher-accordion">
        <IonAccordionGroup>
          <IonAccordion value="language">
            <IonItem slot="header" className="header-item">
              <IonLabel className="flex items-center gap-2">
                <span className="text-sm text-gray-400 font-poppins">{t('profile.language')}:</span>
                <span className="text-lg">{currentLanguage.flag}</span>
                <span className="text-white font-medium">{currentLanguage.label}</span>
              </IonLabel>
              <IonIcon icon={chevronDownOutline} slot="end" className="text-gray-400" />
            </IonItem>
            <div slot="content" className="content-container">
              {languages.map((lang) => (
                <IonItem
                  key={lang.code}
                  button
                  onClick={() => changeLanguage(lang.code)}
                  className={`content-item ${currentLang === lang.code ? 'active' : ''}`}
                >
                  <IonLabel className="flex items-center gap-3">
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-white font-medium">{lang.label}</span>
                    {currentLang === lang.code && (
                      <svg className="ml-auto" width="16" height="16" viewBox="0 0 24 24" fill="#FE7743">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    )}
                  </IonLabel>
                </IonItem>
              ))}
            </div>
          </IonAccordion>
        </IonAccordionGroup>
      </div>
    );
  }

  // Varsayılan: Modern dropdown görünümü
  return (
    <div className="language-switcher-dropdown" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400 font-poppins">{t('profile.language')}:</span>
        <div className="relative">
          <button
            className="dropdown-trigger-button flex items-center gap-2 bg-[#333] hover:bg-[#444] text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-[#444] hover:border-[#FE7743]/50"
            onClick={() => setIsOpen(!isOpen)}
            type="button"
          >
            <span className="text-lg">{currentLanguage.flag}</span>
            <span>{currentLanguage.label}</span>
            <svg 
              className={`chevron-icon transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
          
          {isOpen && (
            <div className="dropdown-menu absolute top-full left-0 mt-1 bg-[#333] border border-[#444] rounded-lg shadow-lg overflow-hidden z-50 min-w-full">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`dropdown-option w-full text-left px-3 py-2 text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${
                    currentLang === lang.code
                      ? 'bg-[#FE7743] text-white'
                      : 'text-gray-300 hover:bg-[#444] hover:text-white'
                  }`}
                  onClick={() => changeLanguage(lang.code)}
                  type="button"
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.label}</span>
                  {currentLang === lang.code && (
                    <svg className="ml-auto" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
