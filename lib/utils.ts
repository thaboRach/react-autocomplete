export function getScrollOffset() {
  return {
    x:
      window.scrollX !== undefined
        ? window.scrollX
        : (document.documentElement || document.body.parentNode || document.body).scrollLeft,
    y:
      window.scrollY !== undefined
        ? window.scrollY
        : (document.documentElement || document.body.parentNode || document.body).scrollTop,
  };
}
