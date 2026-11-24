/* Android app only: files the editor "downloads" (PDF, Word, PNG…) are saved and handed to Android's share sheet,
   because a WebView cannot download blob: links by itself. Loaded before the editor. */
(function(){
  var C=window.Capacitor; if(!C||!C.isNativePlatform||!C.isNativePlatform()) return;
  function P(n){ return C.Plugins&&C.Plugins[n]; }
  function b64(buf){ var s='',a=new Uint8Array(buf),k=0x8000; for(var i=0;i<a.length;i+=k) s+=String.fromCharCode.apply(null,a.subarray(i,i+k)); return btoa(s); }
  function msg(t){ try{ var m=document.getElementById('status'); if(m) m.textContent=t; }catch(e){} }
  async function saveShare(blob,name){
    name=(name||'file').replace(/[\\/:*?"<>|]+/g,'_');
    var fs=P('Filesystem'), sh=P('Share');
    if(!fs||!sh){ msg('تعذّر الحفظ: مكوّنات التطبيق غير جاهزة.'); return; }
    await fs.writeFile({path:name,data:b64(await blob.arrayBuffer()),directory:'CACHE',recursive:true});
    var u=await fs.getUri({path:name,directory:'CACHE'});
    await sh.share({title:name,url:u.uri,dialogTitle:name});
  }
  function isLocal(h){ return h&&(h.indexOf('blob:')===0||h.indexOf('data:')===0); }
  function go(a){ fetch(a.href).then(function(r){return r.blob();}).then(function(b){return saveShare(b,a.download);}).catch(function(e){ if(!(e&&/cancel/i.test(String(e.message||e)))) msg('تعذّر حفظ الملف.'); }); }
  var orig=HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click=function(){ if(this.download&&isLocal(this.href)){ go(this); return; } return orig.apply(this,arguments); };
  document.addEventListener('click',function(e){ var a=e.target&&e.target.closest&&e.target.closest('a[download]'); if(a&&isLocal(a.href)){ e.preventDefault(); go(a); } },true);
})();
