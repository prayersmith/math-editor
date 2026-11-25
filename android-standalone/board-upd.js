/* Whiteboard Android app: run the newest downloaded copy of this page (board or editor) if there is one.
   Loaded first in <head> of the bundled board/index.html and index.html. Downloaded copies live in IndexedDB,
   on the app's own origin, so saved boards and settings are never touched. */
(function(){
  if (window.__updDone || window.__booting) return;
  var KEY = /\/board\//.test(location.pathname) ? 'board' : 'editor';
  var tries = +(localStorage.getItem('upd-try-' + KEY) || 0);
  function db(){ return new Promise(function(res, rej){ var r = indexedDB.open('board-app-upd', 1);
    r.onupgradeneeded = function(){ r.result.createObjectStore('h'); };
    r.onsuccess = function(){ res(r.result); }; r.onerror = function(){ rej(r.error); }; }); }
  function get(k){ return db().then(function(d){ return new Promise(function(res){ var q = d.transaction('h').objectStore('h').get(k);
    q.onsuccess = function(){ res(q.result); }; q.onerror = function(){ res(null); }; }); }).catch(function(){ return null; }); }
  function del(k){ return db().then(function(d){ d.transaction('h', 'readwrite').objectStore('h').delete(k); }).catch(function(){}); }
  function write(h, downloaded){
    var add = '<script>window.__updDone=1;<\/script>'
      + (downloaded ? '<script src="' + (KEY === 'board' ? '../' : '') + 'cap-shim.js"><\/script>' : '')
      + (KEY === 'board' ? '<script src="../upd-check.js"><\/script>' : '');
    h = /<head[^>]*>/i.test(h) ? h.replace(/<head[^>]*>/i, function(m){ return m + add; }) : add + h;
    document.open(); document.write(h); document.close();
  }
  function bundled(){
    fetch(location.href.split('#')[0], { cache: 'no-store' }).then(function(r){ return r.text(); })
      .then(function(h){ write(h.replace(/<script src="[^"]*upd\.js"><\/script>/, '')); })
      .catch(function(){ location.reload(); });
  }
  document.write('<plaintext style="display:none">');   // swallow the rest of the built-in page; it is replaced below
  get(KEY).then(function(rec){
    if (rec && rec.html && tries < 3) {          // a downloaded copy that failed to start 3 times is dropped
      try { localStorage.setItem('upd-try-' + KEY, String(tries + 1)); } catch (e) {}
      write(rec.html, true);
    } else {
      if (rec && tries >= 3) { del(KEY); try { if (rec.sha) localStorage.setItem('upd-bad-' + KEY, rec.sha); localStorage.removeItem('upd-try-' + KEY); } catch (e) {} }
      bundled();
    }
  });
})();
