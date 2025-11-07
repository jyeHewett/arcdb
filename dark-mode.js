// Preflight: set theme class before anything else when this script loads
(function(){
  try{
    var t = localStorage.getItem('theme')
    if (t === 'dark') document.documentElement.classList.add('dark')
    else if (!t && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark')
  }catch(e){}
})();

// Toggle helper exposed globally
function _applyTheme(enable){
  try{
    if (enable) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }catch(e){}
}
window.toggleTheme = function(){
  try{
    var has = document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', has ? 'dark' : 'light')
    updateToggleButton(has)
  }catch(e){}
}

function updateToggleButton(isDark){
  try{
    var btnFloating = document.getElementById('dark-toggle-btn')
    var btnHeader = document.getElementById('theme-toggle')
    if (btnFloating) {
      btnFloating.textContent = isDark ? '☀️' : '🌙'
      btnFloating.title = isDark ? 'Switch to light' : 'Switch to dark'
    }
    if (btnHeader) {
      btnHeader.textContent = isDark ? '☀️' : '🌙'
      btnHeader.title = isDark ? 'Switch to light' : 'Switch to dark'
      try { btnHeader.setAttribute('aria-pressed', isDark ? 'true' : 'false') } catch(e){}
    }
  }catch(e){}
}

// Insert a small floating toggle button so static pages can switch themes
;(function(){
  try{
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', create)
    else create()
  }catch(e){ }
  function create(){
    try{
      if (document.getElementById('dark-toggle-btn')) return
      var btn = document.createElement('button')
      btn.id = 'dark-toggle-btn'
      btn.className = 'dark-toggle'
      var isDark = document.documentElement.classList.contains('dark')
      btn.textContent = isDark ? '☀️' : '🌙'
      btn.title = isDark ? 'Switch to light' : 'Switch to dark'
      btn.onclick = function(e){ e.preventDefault(); window.toggleTheme() }
      document.body.appendChild(btn)
      // Also update header toggle if present
      updateToggleButton(isDark)
    }catch(e){ }
  }
})()

// Ensure header toggle state is correct on DOM ready
;(function(){
  try{
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ updateToggleButton(document.documentElement.classList.contains('dark')) })
    else updateToggleButton(document.documentElement.classList.contains('dark'))
  }catch(e){}
})();
