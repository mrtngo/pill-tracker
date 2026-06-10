export const isPWA = () => {
  if (typeof window === 'undefined') return false;
  return !!(
    window.matchMedia('(display-mode: standalone)').matches || 
    window.navigator.standalone
  );
};
