/**
 * קטעי הקוד של מדריך העוגיות - מקור אחד שמוצג בדף (בתוך <pre>, כטקסט בלבד)
 * ונבדק אוטומטית בדפדפן אמיתי (Playwright) מול הפופאפ המיוצא.
 * החוזה מול הפופאפ: localStorage["wbp-cookie"] = "accepted" | "declined",
 * ואירוע document "weblok:consent" עם detail.choice (ר' popup/generator.ts).
 * הערות הקוד באנגלית בכוונה - הקוד מועתק לאתרים בכל שפה.
 */

export const SNIPPET_CONTRACT = `// Stored choice (read it on every page load):
localStorage.getItem('wbp-cookie')   // 'accepted' | 'declined' | null (not chosen yet)

// Fired on the document every time the visitor clicks accept / decline:
document.addEventListener('weblok:consent', function (e) {
  console.log(e.detail.choice);      // 'accepted' | 'declined'
});`;

export const SNIPPET_GA = `<!-- Put this AFTER the WEblok popup code, just before </body>.
     Remove any other Google Analytics tag from the page. -->
<script>
(function () {
  var GA_ID = 'G-XXXXXXXXXX';       // your GA4 measurement ID
  var STORAGE_KEY = 'wbp-cookie';   // where the WEblok popup stores the choice
  var loaded = false;

  // 1. Load Google Analytics - called ONLY after consent
  function loadAnalytics() {
    window['ga-disable-' + GA_ID] = false;
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }

  // 2. Delete analytics cookies (_ga, _ga_*, _gid, _gat*)
  //    on this host, its parent domains and the current path
  function deleteAnalyticsCookies() {
    window['ga-disable-' + GA_ID] = true; // stops an already loaded GA
    var names = document.cookie.split(';')
      .map(function (c) { return c.split('=')[0].trim(); })
      .filter(function (n) { return /^(_ga|_ga_.+|_gid|_gat.*)$/.test(n); });
    var parts = location.hostname.split('.');
    var domains = [''];               // '' = host-only cookie
    for (var i = 0; i < parts.length - 1; i++) {
      domains.push('.' + parts.slice(i).join('.'));
    }
    var paths = ['/'];
    var segs = location.pathname.split('/').filter(Boolean);
    for (var j = 1; j <= segs.length; j++) {
      paths.push('/' + segs.slice(0, j).join('/'));
    }
    names.forEach(function (name) {
      domains.forEach(function (d) {
        paths.forEach(function (p) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=' + p +
            (d ? '; domain=' + d : '');
        });
      });
    });
  }

  function apply(choice) {
    if (choice === 'accepted') loadAnalytics();
    else if (choice === 'declined') deleteAnalyticsCookies();
  }

  // 3. Returning visitor: the popup stays hidden, so read the stored choice
  var stored = null;
  try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  apply(stored);

  // 4. A new choice (first visit, or the "change my choice" cookie button)
  document.addEventListener('weblok:consent', function (e) {
    apply(e.detail && e.detail.choice);
  });
})();
</script>`;

export const SNIPPET_BLOCKED = `<!-- 1. Any third-party script: change type to "text/plain"
        and add data-consent - the browser will NOT run it -->
<script type="text/plain" data-consent="analytics"
        src="https://example.com/tracker.js"></script>
<script type="text/plain" data-consent="analytics">
  window.myPixelLoaded = true; // runs only after consent
</script>

<!-- 2. Enable them after consent (put after the WEblok popup code) -->
<script>
(function () {
  function enableConsentScripts() {
    var list = document.querySelectorAll('script[type="text/plain"][data-consent]');
    Array.prototype.forEach.call(list, function (old) {
      var s = document.createElement('script');
      for (var i = 0; i < old.attributes.length; i++) {
        var a = old.attributes[i];
        if (a.name !== 'type') s.setAttribute(a.name, a.value);
      }
      s.text = old.text;
      old.parentNode.replaceChild(s, old);
    });
  }
  var stored = null;
  try { stored = localStorage.getItem('wbp-cookie'); } catch (e) {}
  if (stored === 'accepted') enableConsentScripts();
  document.addEventListener('weblok:consent', function (e) {
    if (e.detail && e.detail.choice === 'accepted') enableConsentScripts();
  });
})();
</script>`;

export const SNIPPET_CONSENT_MODE = `<!-- In <head>, BEFORE any other Google tag -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }

  // 1. Default: everything denied until the visitor chooses
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });

  // 2. Returning visitor who already accepted
  (function () {
    var stored = null;
    try { stored = localStorage.getItem('wbp-cookie'); } catch (e) {}
    if (stored === 'accepted') {
      gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        analytics_storage: 'granted'
      });
    }
  })();

  // 3. Every new choice from the WEblok popup
  document.addEventListener('weblok:consent', function (e) {
    var v = e.detail && e.detail.choice === 'accepted' ? 'granted' : 'denied';
    gtag('consent', 'update', {
      ad_storage: v,
      ad_user_data: v,
      ad_personalization: v,
      analytics_storage: v
    });
  });
</script>

<!-- 4. The regular Google tag. While consent is "denied"
        it does not read or write analytics cookies. -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>`;

export const SNIPPET_RESET = `// DevTools console - forget the choice and show the popup again:
localStorage.removeItem('wbp-cookie'); location.reload();`;

export const SNIPPETS = {
  contract: SNIPPET_CONTRACT,
  ga: SNIPPET_GA,
  blocked: SNIPPET_BLOCKED,
  consentMode: SNIPPET_CONSENT_MODE,
  reset: SNIPPET_RESET,
} as const;

export type SnippetId = keyof typeof SNIPPETS;
