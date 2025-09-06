import { Capacitor } from '@capacitor/core';

export const DeviceUtils = {
  /**
   * iOS cihaz olup olmadığını kontrol eder
   */
  isIOS: (): boolean => {
    return Capacitor.getPlatform() === 'ios';
  },

  /**
   * Android cihaz olup olmadığını kontrol eder
   */
  isAndroid: (): boolean => {
    return Capacitor.getPlatform() === 'android';
  },

  /**
   * Native uygulama olup olmadığını kontrol eder
   */
  isNative: (): boolean => {
    return Capacitor.isNativePlatform();
  },

  /**
   * Web platform olup olmadığını kontrol eder
   */
  isWeb: (): boolean => {
    return Capacitor.getPlatform() === 'web';
  },

  /**
   * Platform bilgisini döndürür
   */
  getPlatform: (): string => {
    return Capacitor.getPlatform();
  },

  /**
   * iOS safe area için body'ye class ekler
   */
  applySafeAreaClasses: (): void => {
    const platform = Capacitor.getPlatform();
    document.body.classList.add(platform);
    
    if (platform === 'ios') {
      document.body.classList.add('ios-device');
      document.documentElement.classList.add('ios-device');
      
      // iOS için safe area CSS variable'larını zorla uygula
      document.documentElement.style.setProperty('--ios-safe-area-top', 'env(safe-area-inset-top)');
      document.documentElement.style.setProperty('--ios-header-min-height', 'calc(100px + env(safe-area-inset-top))');
      
      console.log('✅ iOS safe area classes applied');
    } else if (platform === 'android') {
      document.body.classList.add('android-device');
      document.documentElement.classList.add('android-device');
    }
  },

  /**
   * iOS için zorlayıcı safe area style'ları uygula
   */
  forceIOSSafeArea: (): void => {
    if (DeviceUtils.isIOS()) {
      const style = document.createElement('style');
      style.innerHTML = `
        .header-safe-area {
          /*
            ÇÖZÜM V4:
            1. Header'ın üst padding'ini SADECE çentik boşluğu (safe-area-inset-top) kadar yap.
            2. min-height'i daha makul bir değere düşürerek (95px -> 75px) boşluğu azalt.
          */
          padding-top: env(safe-area-inset-top) !important;
          min-height: 75px !important; /* Header'ın içeriğinin yüksekliğine daha yakın bir değer */
          box-sizing: content-box !important;

          /* --- TEŞHİS AMAÇLI --- */
          background-color: green !important; 
          /* --- Eğer bu yeşil renk görünürse, en son değişiklikler uygulanmış demektir. --- */
        }
      `;
      document.head.appendChild(style);
      console.log('✅ iOS safe area force styles applied (v4 - with debug color)');
    }
  }
};

export default DeviceUtils;
