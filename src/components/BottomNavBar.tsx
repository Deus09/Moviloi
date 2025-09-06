import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import iconHome from '../assets/icon-home.svg';
import iconExplore from '../assets/icon-explore.svg';
import iconSocial from '../assets/icon-social.svg';
import iconLists from '../assets/icon-lists.svg';
import iconProfile from '../assets/icon-profile.svg';

const BottomNavBar: React.FC<{ className?: string }> = ({ className = '' }) => {
  const history = useHistory();
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { icon: iconHome, label: t('navigation.home'), path: '/home' },
    { icon: iconExplore, label: t('navigation.explore'), path: '/explore' },
    { icon: iconSocial, label: t('navigation.social'), path: '/social' },
    { icon: iconLists, label: t('navigation.lists'), path: '/lists' },
    { icon: iconProfile, label: t('navigation.profile'), path: '/profile' },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 w-full bg-background border-t border-border z-50 rounded-t-[27px] safe-area-bottom bottom-nav-bar ${className}`} style={{ minHeight: 'calc(50px + var(--ion-safe-area-bottom, 0px))' }}>
      {navItems.map((item) => {
        const isActive = item.path && location.pathname.startsWith(item.path);
        return (
          <button
            key={item.label}
            className={`flex-1 focus:outline-none transition-colors hover:bg-muted ${isActive ? 'text-primary bg-white rounded-[27px]' : 'text-foreground bg-transparent'} mx-[2px]`}
            onClick={() => item.path && history.push(item.path)}
            disabled={!item.path}
            style={{ 
              cursor: item.path ? 'pointer' : 'default', 
              background: 'none', 
              border: 'none'
            }}
          >
            <img src={item.icon} alt={item.label} className={`w-[32px] h-[32px] mb-1 ${isActive ? '' : 'opacity-70'}`} />
            <span className={`text-tiny font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavBar; 