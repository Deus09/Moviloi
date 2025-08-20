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
}) => (
  <div className="flex flex-row items-center justify-between bg-background w-full h-[80px] p-4 relative safe-area-top">
    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#f8f8ff]"></div>
    <div className="flex flex-row items-center gap-2 flex-1">
      {showBackButton && (
        <button 
          onClick={onBackClick}
          className="text-foreground hover:text-primary hover:bg-muted transition-colors p-1 rounded"
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
        <LanguageSwitcher />
      </div>
    )}
  </div>
);

export default TopHeaderBar; 