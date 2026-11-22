/* Cakes and Core class widget. Paste on any page:
   <div data-twerkdivas data-state="TX" data-city="Killeen"></div>
   <script async src="https://YOUR-APP/embed.js"></script> */
(function () {
  var origin = (document.currentScript && new URL(document.currentScript.src).origin) || '';
  function mount(el) {
    if (el.getAttribute('data-ready')) return; el.setAttribute('data-ready', '1');
    var q = []; ['state', 'city', 'program', 'instructor', 'limit', 'popups'].forEach(function (k) { var v = el.getAttribute('data-' + k); if (v) q.push(k + '=' + encodeURIComponent(v)); });
    var f = document.createElement('iframe'); f.src = origin + '/embed/classes' + (q.length ? '?' + q.join('&') : ''); f.title = 'Cakes and Core classes'; f.loading = 'lazy';
    f.style.cssText = 'width:100%;border:0;min-height:160px;display:block'; el.appendChild(f);
    window.addEventListener('message', function (e) { if (e.source === f.contentWindow && e.data && e.data.twerkdivasHeight) f.style.height = e.data.twerkdivasHeight + 'px'; });
  }
  function run() { var l = document.querySelectorAll('[data-twerkdivas]'); for (var i = 0; i < l.length; i++) mount(l[i]); }
  if (document.readyState !== 'loading') run(); else document.addEventListener('DOMContentLoaded', run);
})();
