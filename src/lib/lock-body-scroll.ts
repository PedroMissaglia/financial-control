type BodyScrollLock = {
  unlock: () => void;
};

/**
 * Locks document scroll in a way that works on iOS / Capacitor WebViews
 * (overflow:hidden alone often still allows background scroll).
 */
export function lockBodyScroll(): BodyScrollLock {
  const { body } = document;
  const scrollY = window.scrollY;

  const previous = {
    position: body.style.position,
    top: body.style.top,
    width: body.style.width,
    overflow: body.style.overflow,
  };

  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
  body.style.width = '100%';
  body.style.overflow = 'hidden';

  return {
    unlock() {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      window.scrollTo(0, scrollY);
    },
  };
}
