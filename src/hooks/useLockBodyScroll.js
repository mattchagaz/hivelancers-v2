import { useEffect } from 'react';

// Trava o scroll do fundo enquanto um modal está aberto — inclusive no
// touch/iOS, onde só "overflow: hidden" no body não é suficiente e o
// gesto de scroll ainda vaza pra página por trás do modal.
export function useLockBodyScroll(active) {
  useEffect(() => {
    if (!active) return undefined;

    const scrollY = window.scrollY;
    const { body } = document;
    const previousBodyStyle = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      overflow: body.style.overflow,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';

    return () => {
      body.style.position = previousBodyStyle.position;
      body.style.top = previousBodyStyle.top;
      body.style.left = previousBodyStyle.left;
      body.style.right = previousBodyStyle.right;
      body.style.overflow = previousBodyStyle.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}
