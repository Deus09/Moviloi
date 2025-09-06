import React from 'react';
import logo from '../assets/logo.png';
import LanguageSwitcher from './LanguageSwitcher';

interface TopHeaderBarProps {
  title?: string;
  showBackButton?: boolean;
  showLogo?: boolean;
  showLanguageSwitcher?: boolean;
  onBackClick?: () => void;
  isProfilePage?: boolean;
}

const TopHeaderBar: React.FC<TopHeaderBarProps> = ({ 
  title = "Moviloi", 
  showBackButton = false, 
  showLogo = true,
  showLanguageSwitcher = false,
  isProfilePage = false,
  onBackClick
}) => {
  return (
    <div className="flex flex-row items-center justify-between bg-background w-full relative ios-header-safe-area">
      {/* Alt çizgi */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#f8f8ff]"></div>
      
      {/* Header içeriği */}
      <div className="flex flex-row items-center justify-between w-full px-4 pb-4">
        <div className="flex flex-row items-center gap-3 flex-1">
          {showBackButton && (
            <button 
              onClick={onBackClick}
              className="text-foreground hover:text-primary hover:bg-muted transition-colors p-2 rounded-lg"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
          )}
          {showLogo && (
            <img src={logo} alt="Logo" className="w-[40px] h-[40px] rounded-full bg-[#f8f8ff]" />
          )}
          <span className="text-h2 font-bold text-foreground truncate">
            {title}
          </span>
        </div>
        
        {/* Sağ taraf - LanguageSwitcher (sadece profil sayfası için) */}
        {showLanguageSwitcher && isProfilePage && (
          <div className="flex items-center justify-end relative z-10">
            <LanguageSwitcher showAsAccordion={true} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TopHeaderBar; 