import 'fake-indexeddb/auto';

document.body.innerHTML = '<div id="app"></div>';

if (!globalThis.matchMedia) {
  globalThis.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {}
  });
}
