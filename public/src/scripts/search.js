(function(){
  const form  = document.querySelector('#searchForm') || document.querySelector('[data-search-form]');
  const input = document.querySelector('[data-search-input]');
  const cnt   = document.getElementById('resultsCount');

  async function doSearch(q){
    if(!q) q = (input && input.value) || '';
    const url = (window.APP_CONFIG?.API_BASE || '') + '/search?q=' + encodeURIComponent(q.trim());
    try{
      const res = await fetch(url);
      const data = await res.json();
      if (cnt) cnt.textContent = data?.total != null ? `Found ${data.total} results` : '';
      const items = Array.isArray(data?.items) ? data.items : [];
      window.dispatchEvent(new CustomEvent('news:searched', { detail: { items } }));
    }catch(e){
      if (cnt) cnt.textContent = 'Search error';
      console.error('Search error:', e);
      window.dispatchEvent(new CustomEvent('news:searched', { detail: { items: [] } }));
    }
  }

  if (form) form.addEventListener('submit', (ev)=>{ ev.preventDefault(); doSearch(); });
  window.__search = { doSearch };
})();
