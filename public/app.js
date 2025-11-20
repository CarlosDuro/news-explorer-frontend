const API_BASE = 'http://localhost:8080';

const state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
};

// Estado del modal de autenticación
const authState = {
  mode: 'login', // 'login' o 'register'
  isOpen: false,
};

// Referencias del modal de auth
const authModal = document.getElementById('authModal');
const authTitle = authModal ? authModal.querySelector('[data-auth-title]') : null;
const authMessage = authModal ? authModal.querySelector('[data-auth-message]') : null;
const authForm = authModal ? authModal.querySelector('[data-auth-form]') : null;
const authEmailInput = authModal ? authModal.querySelector('[data-auth-email]') : null;
const authPasswordInput = authModal ? authModal.querySelector('[data-auth-password]') : null;
const authNameWrapper = authModal ? authModal.querySelector('[data-auth-name-wrapper]') : null;
const authNameInput = authModal ? authModal.querySelector('[data-auth-name]') : null;
const authSubmitBtn = authModal ? authModal.querySelector('[data-auth-submit]') : null;
const authEmailError = authModal ? authModal.querySelector('[data-auth-error-email]') : null;
const authPasswordError = authModal ? authModal.querySelector('[data-auth-error-password]') : null;
const authNameError = authModal ? authModal.querySelector('[data-auth-error-name]') : null;

// Modal de éxito de registro
const authSuccessModal = document.getElementById('authSuccess');
const authSuccessGoLoginBtn = authSuccessModal
  ? authSuccessModal.querySelector('[data-auth-success-go-login]')
  : null;

// Estado para paginar resultados de búsqueda
const searchState = {
  allItems: [],
  visibleCount: 0,
};

// Conjunto de links de artículos ya guardados
const savedLinks = new Set();

// Referencias DOM para resultados
const resultsSection = document.getElementById('results');
const resultsBox = document.querySelector('[data-results]');
const countLabel = document.getElementById('resultsCount');
const resultsStatus = document.getElementById('resultsStatus');
const showMoreBtn = document.getElementById('showMoreBtn');

async function api(path, opts) {
  const options = opts || {};
  const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
  if (state.token) {
    headers['Authorization'] = 'Bearer ' + state.token;
  }
  const res = await fetch(API_BASE + path, Object.assign({}, options, { headers }));
  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    data = {};
  }
  if (!res.ok) {
    throw Object.assign(new Error(data.message || 'Request error'), {
      status: res.status,
      data: data,
    });
  }
  return data;
}

/* ---------- MODAL AUTH ---------- */

function resetAuthFormErrors() {
  if (authEmailError) authEmailError.textContent = '';
  if (authPasswordError) authPasswordError.textContent = '';
  if (authNameError) authNameError.textContent = '';
  if (authMessage) {
    authMessage.textContent = '';
    authMessage.hidden = true;
  }
}

function resetAuthFormFields() {
  if (authEmailInput) authEmailInput.value = '';
  if (authPasswordInput) authPasswordInput.value = '';
  if (authNameInput) authNameInput.value = '';
}

function setAuthMode(mode) {
  if (!authModal) return;
  authState.mode = mode === 'register' ? 'register' : 'login';

  const loginTab = authModal.querySelector('[data-auth-switch="login"]');
  const registerTab = authModal.querySelector('[data-auth-switch="register"]');

  if (loginTab && registerTab) {
    loginTab.classList.toggle('modal__tab--active', authState.mode === 'login');
    registerTab.classList.toggle('modal__tab--active', authState.mode === 'register');
  }

  if (authTitle) {
    authTitle.textContent = authState.mode === 'login' ? 'Iniciar sesión' : 'Inscribirse';
  }

  if (authSubmitBtn) {
    authSubmitBtn.textContent = authState.mode === 'login' ? 'Iniciar sesión' : 'Inscribirse';
  }

  // Nombre solo en register
  if (authNameWrapper) {
    authNameWrapper.hidden = authState.mode !== 'register';
  }

  resetAuthFormFields();
  resetAuthFormErrors();
  if (authSubmitBtn) authSubmitBtn.disabled = true;
}

function openAuthModal(mode = 'login') {
  if (!authModal) return;
  setAuthMode(mode);
  authState.isOpen = true;
  authModal.hidden = false;
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    authEmailInput && authEmailInput.focus();
  }, 0);
}

function closeAuthModal() {
  if (!authModal) return;
  authState.isOpen = false;
  authModal.hidden = true;
  document.body.style.overflow = '';
}

/* ---------- MODAL ÉXITO REGISTRO ---------- */

function openAuthSuccessModal() {
  if (!authSuccessModal) return;
  authSuccessModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeAuthSuccessModal() {
  if (!authSuccessModal) return;
  authSuccessModal.hidden = true;
  document.body.style.overflow = '';
}

function validateAuthForm() {
  if (!authForm) return false;

  let isValid = true;
  resetAuthFormErrors();

  const email = authEmailInput ? authEmailInput.value.trim() : '';
  const password = authPasswordInput ? authPasswordInput.value : '';
  const name = authNameInput ? authNameInput.value.trim() : '';

  // Email
  if (!email) {
    if (authEmailError) authEmailError.textContent = 'El email es obligatorio.';
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    if (authEmailError) authEmailError.textContent = 'Introduce un email válido.';
    isValid = false;
  }

  // Password
  if (!password) {
    if (authPasswordError) authPasswordError.textContent = 'La contraseña es obligatoria.';
    isValid = false;
  } else if (password.length < 6) {
    if (authPasswordError) authPasswordError.textContent = 'Mínimo 6 caracteres.';
    isValid = false;
  }

  // Name solo en register
  if (authState.mode === 'register') {
    if (!name) {
      if (authNameError) authNameError.textContent = 'El nombre es obligatorio.';
      isValid = false;
    } else if (name.length < 2) {
      if (authNameError) authNameError.textContent = 'Mínimo 2 caracteres.';
      isValid = false;
    }
  }

  if (authSubmitBtn) {
    authSubmitBtn.disabled = !isValid;
  }

  return isValid;
}

async function handleAuthSubmit(ev) {
  ev.preventDefault();
  if (!validateAuthForm()) return;

  const email = authEmailInput ? authEmailInput.value.trim() : '';
  const password = authPasswordInput ? authPasswordInput.value : '';
  const name = authNameInput ? authNameInput.value.trim() : '';

  if (!authSubmitBtn) return;
  authSubmitBtn.disabled = true;

  if (authMessage) {
    authMessage.hidden = true;
    authMessage.textContent = '';
  }

  try {
    if (authState.mode === 'login') {
      const data = await api('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('token', state.token);
      localStorage.setItem('user', JSON.stringify(state.user));

      updateAuthUI();
      savedLinks.clear();
      closeAuthModal();

      if (location.hash === '#saved') {
        showSaved();
      }
    } else {
      // Registro
      await api('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });

      // Dejamos preparado el modal de login para la próxima vez
      setAuthMode('login');
      resetAuthFormFields();
      resetAuthFormErrors();

      // Cerramos modal de auth y abrimos modal de éxito
      closeAuthModal();
      openAuthSuccessModal();
    }
  } catch (err) {
    console.error(err);
    if (authMessage) {
      authMessage.hidden = false;
      authMessage.textContent =
        err.data && err.data.message
          ? err.data.message
          : 'Error en la petición. Inténtalo de nuevo.';
      authMessage.style.color = '#dc2626';
    }
  } finally {
    if (authSubmitBtn) {
      authSubmitBtn.disabled = !validateAuthForm();
    }
  }
}

/* ---------- AUTH HEADER / ESTADO ---------- */

function updateAuthUI() {
  const guestBox = document.querySelector('[data-auth-guest]');
  const userBox = document.querySelector('[data-auth-user]');
  const nameSpan = document.querySelector('[data-username]');
  const logoutBar = document.querySelector('[data-logout-bar]');
  const savedLink = document.querySelector('.link-saved');
  const isAuthed = !!state.token;

  if (guestBox) guestBox.style.display = isAuthed ? 'none' : '';
  if (userBox) userBox.style.display = isAuthed ? '' : 'none';

  if (nameSpan) {
    nameSpan.textContent = state.user && state.user.name ? state.user.name : '';
  }

  if (logoutBar) logoutBar.style.display = isAuthed ? '' : 'none';

  if (savedLink) {
    savedLink.style.display = isAuthed ? '' : 'none';
  }

  document.body.classList.toggle('is-authenticated', isAuthed);
}

function handleLogout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  savedLinks.clear();
  updateAuthUI();
  setRoute('');
}

/* ---------- RUTAS Y SAVED ---------- */

function setRoute(hash) {
  const homeLink = document.querySelector('.link-home');
  const savedLink = document.querySelector('.link-saved');
  const resultsSec = document.getElementById('results');
  const savedSection = document.getElementById('saved');
  const isSaved = hash === '#saved';

  if (homeLink) homeLink.classList.toggle('is-active', !isSaved);
  if (savedLink) savedLink.classList.toggle('is-active', isSaved);

  if (resultsSec) resultsSec.style.display = isSaved ? 'none' : '';
  if (savedSection) savedSection.style.display = isSaved ? '' : 'none';

  if (isSaved) {
    if (!state.token) {
      alert('Inicia sesión para ver tus artículos guardados.');
      location.hash = '';
      setRoute('');
      return;
    }
    showSaved();
  }
}

async function showSaved() {
  const container = document.querySelector('[data-saved]');
  if (!container) return;
  container.innerHTML = 'Loading...';

  try {
    const items = await api('/articles');
    if (!Array.isArray(items) || items.length === 0) {
      container.innerHTML = '<p>No saved articles.</p>';
      const headerInfoEmpty = document.getElementById('savedHeaderInfo');
      if (headerInfoEmpty) {
        const name = (state.user && state.user.name) || '';
        headerInfoEmpty.textContent = `${name}, no tienes artículos guardados todavía.`;
      }
      savedLinks.clear();
      return;
    }

    container.innerHTML = '';

    savedLinks.clear();
    items.forEach((item) => {
      if (item.link) {
        savedLinks.add(item.link);
      }
    });

    const headerInfo = document.getElementById('savedHeaderInfo');
    if (headerInfo) {
      const total = items.length;
      const keywordsCount = {};
      items.forEach((item) => {
        const kw = (item.keyword || '').trim();
        if (!kw) return;
        keywordsCount[kw] = (keywordsCount[kw] || 0) + 1;
      });
      const sorted = Object.entries(keywordsCount)
        .sort((a, b) => b[1] - a[1])
        .map(([kw]) => kw);

      let keywordsText = '';
      if (sorted.length <= 3) {
        keywordsText = sorted.join(', ');
      } else {
        const rest = sorted.length - 2;
        keywordsText = `${sorted[0]}, ${sorted[1]} y ${rest} más`;
      }

      const name = (state.user && state.user.name) || '';
      headerInfo.textContent =
        `${name}, tienes ${total} artículos guardados. ` +
        (sorted.length ? `Por palabras clave: ${keywordsText}.` : '');
    }

    items.forEach(function (item) {
      const card = document.createElement('article');
      card.className = 'news-card';

      card.innerHTML =
        '<div class="card-topline">' +
        (item.keyword ? '<span class="card-tag">' + item.keyword + '</span>' : '') +
        '<button class="icon-btn icon-trash" data-delete="' +
        item._id +
        '"></button>' +
        '</div>' +
        '<h3>' +
        item.title +
        '</h3>' +
        '<p class="meta">' +
        item.source +
        ' • ' +
        item.date +
        '</p>' +
        '<p>' +
        item.text +
        '</p>' +
        '<div class="actions">' +
        '<a class="btn-outline" href="' +
        item.link +
        '" target="_blank" rel="noreferrer">Read</a>' +
        '</div>';

      container.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    if (err.status === 401) {
      container.innerHTML = '<p>Inicia sesión para ver tus artículos guardados.</p>';
      return;
    }
    container.innerHTML = '<p>Error loading saved.</p>';
  }
}

/* ---------- RESULTADOS DE BÚSQUEDA ---------- */

function renderSearchResults(list) {
  searchState.allItems = list;
  searchState.visibleCount = 0;

  if (!resultsSection || !resultsBox) return;

  resultsSection.style.display = '';
  resultsBox.innerHTML = '';

  if (resultsStatus) {
    resultsStatus.hidden = true;
    resultsStatus.textContent = '';
  }

  if (countLabel) {
    countLabel.textContent = list.length ? list.length + ' results' : 'No results';
  }

  if (!list.length) {
    if (resultsStatus) {
      resultsStatus.hidden = false;
      resultsStatus.textContent = 'No se ha encontrado nada';
    }
    if (showMoreBtn) showMoreBtn.style.display = 'none';
    return;
  }

  renderMoreResults();
}

function renderMoreResults() {
  if (!resultsBox || !searchState.allItems.length) return;

  const start = searchState.visibleCount;
  const end = start + 3;
  const batch = searchState.allItems.slice(start, end);

  batch.forEach(function (item) {
    const card = document.createElement('article');
    card.className = 'news-card';

    const kw = item.keyword || '';
    const img = item.image || '';
    const link = item.link || '';
    const isSaved = savedLinks.has(link);

    const tooltipAttr = !state.token ? ' title="Inicia sesión para guardar artículos"' : '';

    card.innerHTML =
      '<h3>' +
      item.title +
      '</h3>' +
      '<p class="meta">' +
      item.source +
      ' • ' +
      item.date +
      '</p>' +
      '<p>' +
      item.text +
      '</p>' +
      '<div class="actions">' +
      '<a class="btn-outline" href="' +
      link +
      '" target="_blank" rel="noreferrer">Read</a>' +
      '<button class="icon-btn icon-bookmark' +
      (isSaved ? ' icon-bookmark--active' : '') +
      '"' +
      ' data-save="1"' +
      ' data-kw="' +
      kw +
      '"' +
      ' data-title="' +
      item.title +
      '"' +
      ' data-text="' +
      item.text +
      '"' +
      ' data-date="' +
      item.date +
      '"' +
      ' data-source="' +
      item.source +
      '"' +
      ' data-link="' +
      link +
      '"' +
      ' data-image="' +
      img +
      '"' +
      tooltipAttr +
      '></button>' +
      '</div>';

    resultsBox.appendChild(card);
  });

  searchState.visibleCount += batch.length;

  if (!showMoreBtn) return;

  if (searchState.visibleCount >= searchState.allItems.length) {
    showMoreBtn.style.display = 'none';
  } else {
    showMoreBtn.style.display = 'inline-flex';
  }
}

async function doSearch(q) {
  const query = (q || '').trim();
  if (!query) {
    alert('Por favor, introduzca una palabra clave');
    return;
  }

  if (resultsSection) resultsSection.style.display = '';
  if (resultsBox) resultsBox.innerHTML = '';
  if (showMoreBtn) showMoreBtn.style.display = 'none';

  if (resultsStatus) {
    resultsStatus.hidden = false;
    resultsStatus.textContent = 'Buscando noticias...';
  }
  if (countLabel) countLabel.textContent = '';

  try {
    const res = await api('/search?q=' + encodeURIComponent(query));
    const items = Array.isArray(res.items) ? res.items : [];

    try {
      localStorage.setItem('lastSearch', JSON.stringify({ query, items }));
    } catch (e) {}

    if (resultsStatus) {
      resultsStatus.hidden = true;
      resultsStatus.textContent = '';
    }

    renderSearchResults(items);
  } catch (err) {
    console.error(err);
    if (resultsStatus) {
      resultsStatus.hidden = false;
      resultsStatus.textContent =
        'Lo sentimos, algo ha salido mal durante la solicitud. ' +
        'Es posible que haya un problema de conexión o que el servidor no funcione. ' +
        'Por favor, inténtalo más tarde.';
    }
    if (countLabel) countLabel.textContent = 'Error';
  }
}

/* ---------- CLICK GLOBAL: DELETE + SAVE ---------- */

document.addEventListener('click', async function (ev) {
  const delBtn = ev.target.closest('[data-delete]');
  if (delBtn) {
    const id = delBtn.getAttribute('data-delete');
    if (!id) return;
    if (!confirm('Delete this article?')) return;
    try {
      await api('/articles/' + id, { method: 'DELETE' });
      showSaved();
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
    return;
  }

  const saveBtn = ev.target.closest('[data-save]');
  if (saveBtn) {
    if (!state.token) {
      alert('Inicia sesión para guardar artículos.');
      return;
    }

    const link = saveBtn.getAttribute('data-link') || '';
    if (link && savedLinks.has(link)) {
      alert('Este artículo ya está guardado. Puedes gestionarlo en "Saved Articles".');
      return;
    }

    const payload = {
      keyword: saveBtn.getAttribute('data-kw') || '',
      title: saveBtn.getAttribute('data-title') || '',
      text: saveBtn.getAttribute('data-text') || '',
      date: saveBtn.getAttribute('data-date') || '',
      source: saveBtn.getAttribute('data-source') || '',
      link: link,
      image: saveBtn.getAttribute('data-image') || '',
    };

    if (!payload.date) {
      payload.date = new Date().toISOString().slice(0, 10);
    }
    if (!payload.source) {
      payload.source = 'Web';
    }
    if (!payload.image) {
      payload.image = 'https://picsum.photos/400';
    }
    if (!payload.text) {
      payload.text = 'demo';
    }
    if (!payload.keyword) {
      const q = document.querySelector('[data-search-input]')?.value || '';
      payload.keyword = q || 'news';
    }

    try {
      await api('/articles', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      alert('Article saved');

      if (link) {
        savedLinks.add(link);
      }
      saveBtn.classList.add('icon-bookmark--active');
    } catch (err) {
      alert('Save error: ' + err.message);
    }
  }
});

/* ---------- INIT DOM ---------- */

document.addEventListener('DOMContentLoaded', function () {
  const signBtn = document.querySelector('[data-signin-btn]');
  const logoutBtn = document.querySelector('[data-logout-btn]');
  const logoutBtn2 = document.querySelector('[data-logout-btn-secondary]');

  if (signBtn) {
    signBtn.addEventListener('click', function () {
      openAuthModal('login');
    });
  }
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  if (logoutBtn2) logoutBtn2.addEventListener('click', handleLogout);

  const homeLink = document.querySelector('.link-home');
  const savedLink = document.querySelector('.link-saved');
  if (homeLink)
    homeLink.addEventListener('click', function (e) {
      e.preventDefault();
      location.hash = '';
      setRoute('');
    });
  if (savedLink)
    savedLink.addEventListener('click', function (e) {
      e.preventDefault();
      location.hash = '#saved';
      setRoute('#saved');
    });

  const form = document.querySelector('[data-search-form]');
  const input = document.querySelector('[data-search-input]');
  if (form && input) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      const q = input.value;
      doSearch(q);
    });
  }

  if (showMoreBtn) {
    showMoreBtn.addEventListener('click', function () {
      renderMoreResults();
    });
  }

  // Eventos del modal de auth
  if (authForm) {
    authForm.addEventListener('submit', handleAuthSubmit);

    ['input', 'change', 'blur'].forEach((evtName) => {
      authForm.addEventListener(evtName, function () {
        validateAuthForm();
      });
    });
  }

  if (authModal) {
    const loginTab = authModal.querySelector('[data-auth-switch="login"]');
    const registerTab = authModal.querySelector('[data-auth-switch="register"]');
    const closeBtn = authModal.querySelector('[data-modal-close]');
    const backdrop = authModal.querySelector('[data-modal-backdrop]');

    if (loginTab) {
      loginTab.addEventListener('click', function () {
        setAuthMode('login');
      });
    }

    if (registerTab) {
      registerTab.addEventListener('click', function () {
        setAuthMode('register');
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closeAuthModal();
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', function () {
        closeAuthModal();
      });
    }
  }

  // Modal de éxito: cerrar con X o overlay
  if (authSuccessModal) {
    authSuccessModal.addEventListener('click', (ev) => {
      if (ev.target.matches('[data-auth-success-close]')) {
        closeAuthSuccessModal();
      }
    });
  }

  // Modal de éxito: botón "Iniciar sesión" → abre modal de login
  if (authSuccessGoLoginBtn) {
    authSuccessGoLoginBtn.addEventListener('click', () => {
      closeAuthSuccessModal();
      openAuthModal('login');
    });
  }

  // Restaurar última búsqueda desde localStorage
  try {
    const stored = localStorage.getItem('lastSearch');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && Array.isArray(parsed.items) && parsed.items.length) {
        if (input && parsed.query) {
          input.value = parsed.query;
        }
        renderSearchResults(parsed.items);
      }
    }
  } catch (e) {
    console.warn('No se pudo restaurar la última búsqueda', e);
  }

  updateAuthUI();
  setRoute(location.hash || '');
});

window.addEventListener('hashchange', function () {
  setRoute(location.hash || '');
});

// Cerrar modal con tecla ESC
window.addEventListener('keydown', function (ev) {
  if (ev.key === 'Escape') {
    if (authState.isOpen) {
      closeAuthModal();
    } else if (authSuccessModal && !authSuccessModal.hidden) {
      closeAuthSuccessModal();
    }
  }
});
