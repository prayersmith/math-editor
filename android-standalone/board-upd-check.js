/* Whiteboard Android app: when online, download the newest board and editor from the site in the background.
   The new copy is used from the next start; a small bar offers to restart now. */
(function(){
  var REMOTE = localStorage.getItem('upd-remote') || 'https://prayersmith.github.io/math-editor/';
  var FILES = { board: { url: 'board/index.html', min: 50000, mark: 'السبورة الرياضية' },
                editor: { url: 'index.html', min: 500000, mark: 'محرر المعادلات' } };
  function db(){ return new Promise(function(res, rej){ var r = indexedDB.open('board-app-upd', 1);
    r.onupgradeneeded = function(){ r.result.createObjectStore('h'); };
    r.onsuccess = function(){ res(r.result); }; r.onerror = function(){ rej(r.error); }; }); }
  function get(k){ return db().then(function(d){ return new Promise(function(res){ var q = d.transaction('h').objectStore('h').get(k);
    q.onsuccess = function(){ res(q.result); }; q.onerror = function(){ res(null); }; }); }).catch(function(){ return null; }); }
  function put(k, v){ return db().then(function(d){ return new Promise(function(res){ var t = d.transaction('h', 'readwrite');
    t.objectStore('h').put(v, k); t.oncomplete = function(){ res(true); }; t.onerror = function(){ res(false); }; }); }).catch(function(){ return false; }); }
  function sha(t){ return crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)).then(function(b){
    return Array.prototype.map.call(new Uint8Array(b), function(x){ return ('0' + x.toString(16)).slice(-2); }).join(''); }); }
  function base(){ return fetch('../upd-base.json', { cache: 'no-store' }).then(function(r){ return r.json(); }).catch(function(){ return {}; }); }
  function check(){
    if (navigator.onLine === false) return;
    base().then(function(B){
      return Promise.all(Object.keys(FILES).map(function(k){
        var F = FILES[k];
        return fetch(REMOTE + F.url, { cache: 'no-cache' }).then(function(r){ return r.ok ? r.text() : null; }).then(function(h){
          if (!h || h.length < F.min || h.indexOf(F.mark) < 0) return false;
          return Promise.all([sha(h), get(k)]).then(function(x){
            var s = x[0], rec = x[1], cur = rec && rec.sha ? rec.sha : B[k];
            if (s === cur || s === localStorage.getItem('upd-bad-' + k)) return false;   // same as now, or a copy that failed to start
            return put(k, { html: h, sha: s, at: Date.now() }).then(function(ok){
              if (ok) { try { localStorage.removeItem('upd-try-' + k); } catch (e) {} }
              return ok;
            });
          });
        }).catch(function(){ return false; });
      }));
    }).then(function(r){ if (r && r.some(Boolean)) bar(); });
  }
  function bar(){
    if (document.getElementById('updBar')) return;
    var d = document.createElement('div'); d.id = 'updBar';
    d.style.cssText = 'position:fixed;top:58px;left:50%;transform:translateX(-50%);z-index:999;background:#0e6658;color:#fff;border-radius:12px;padding:8px 12px;display:flex;gap:8px;align-items:center;font:14px "IBM Plex Sans Arabic",sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.25);direction:rtl';
    d.innerHTML = '<span>تم تنزيل تحديث جديد للسبورة</span><button id="updNow" style="border:0;border-radius:8px;padding:6px 10px;background:#fff;color:#0e6658;font:inherit;font-weight:700">تحديث الآن</button><button id="updLater" style="border:0;border-radius:8px;padding:6px 10px;background:rgba(255,255,255,.15);color:#fff;font:inherit">لاحقًا</button>';
    document.body.appendChild(d);
    document.getElementById('updNow').onclick = function(){ location.reload(); };
    document.getElementById('updLater').onclick = function(){ d.remove(); };
  }
  setTimeout(check, 4000);
  window.addEventListener('online', function(){ setTimeout(check, 2000); });
})();
