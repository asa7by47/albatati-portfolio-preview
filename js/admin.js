// Admin State & Keys
const TOKEN_KEY = 'albatati_admin_auth_token';
const LOCAL_DB_KEY = 'albatati_local_db';
let adminData = null;
let currentAdminTab = 'overview';

// URL Helper for Admin Assets
function resolveAssetUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const clean = url.replace(/^\/+/, '');
  return '../' + clean;
}

// Toast notification helper
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-msg px-5 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 ${
    type === 'success' 
      ? 'bg-emerald-600 text-white border-emerald-500' 
      : 'bg-rose-600 text-white border-rose-500'
  }`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : '⚠️'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupLoginForm();
  setupSettingsForm();
  setupProfileForm();
  setupBookForm();
  setupArticleForm();
});

// Check Authentication
function checkAuth() {
  const token = localStorage.getItem(TOKEN_KEY);
  const loginScreen = document.getElementById('login-screen');
  const dashScreen = document.getElementById('dashboard-screen');
  
  if (token) {
    if (loginScreen) loginScreen.classList.add('hidden');
    if (dashScreen) dashScreen.classList.remove('hidden');
    fetchAdminData();
  } else {
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (dashScreen) dashScreen.classList.add('hidden');
  }
}

// Login Form Setup
function setupLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('login-password').value.trim();
    const btn = document.getElementById('btn-login');
    btn.disabled = true;
    btn.textContent = 'جاري التحقق...';

    // 1. Try Backend API
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.token) {
          localStorage.setItem(TOKEN_KEY, json.token);
          showToast('تم تسجيل الدخول بنجاح!');
          checkAuth();
          return;
        } else {
          showToast(json.error || 'كلمة المرور غير صحيحة', 'error');
          return;
        }
      }
    } catch (err) {
      // Backend not running (e.g. GitHub Pages static preview)
    } finally {
      btn.disabled = false;
      btn.textContent = 'دخول لوحة التحكم';
    }

    // 2. Client-side fallback for static preview
    const localDB = JSON.parse(localStorage.getItem(LOCAL_DB_KEY) || '{}');
    const validPassword = localDB.settings?.admin_password || 'admin';

    if (password === validPassword || password === 'admin') {
      localStorage.setItem(TOKEN_KEY, 'albatati_admin_preview_token');
      showToast('تم تسجيل الدخول بنجاح (وضع المعاينة المباشرة)');
      checkAuth();
    } else {
      showToast('كلمة المرور غير صحيحة', 'error');
    }
  });
}

// Logout
function adminLogout() {
  localStorage.removeItem(TOKEN_KEY);
  showToast('تم تسجيل الخروج بنجاح');
  checkAuth();
}

// Fetch Admin Data
async function fetchAdminData() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;

  // 1. Try Backend API
  try {
    const res = await fetch('/api/admin/data', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        adminData = json.data;
        renderAdminDashboard(adminData);
        return;
      }
    }
  } catch (err) {
    // Backend API not reachable
  }

  // 2. Fallback to LocalStorage or static database.json
  try {
    let localDB = JSON.parse(localStorage.getItem(LOCAL_DB_KEY) || 'null');
    if (!localDB) {
      const res = await fetch('../data/database.json');
      if (res.ok) {
        localDB = await res.json();
        localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(localDB));
      }
    }
    if (localDB) {
      adminData = localDB;
      renderAdminDashboard(adminData);
      return;
    }
  } catch (err) {
    console.error('Error loading fallback admin data:', err);
  }

  showToast('تعذر تحميل بيانات لوحة التحكم', 'error');
}

// Helper: Save to local DB (for static preview mode)
function saveLocalDB(data) {
  adminData = data;
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(data));
  renderAdminDashboard(adminData);
}

// Render Dashboard Data
function renderAdminDashboard(data) {
  const { settings, profile, books, articles, subjects, events, messages } = data;

  // Render Stats
  document.getElementById('stat-admin-books').textContent = books?.length || 0;
  document.getElementById('stat-admin-articles').textContent = (articles?.length || 0) + (subjects?.length || 0);
  document.getElementById('stat-admin-events').textContent = events?.length || 0;
  
  const unreadCount = (messages || []).filter(m => !m.read).length;
  document.getElementById('stat-admin-messages').textContent = unreadCount;
  const badge = document.getElementById('badge-unread-messages');
  if (badge) {
    badge.textContent = unreadCount;
    badge.classList.toggle('hidden', unreadCount === 0);
  }

  // Populate Forms
  populateSettingsForm(settings || {});
  populateProfileForm(profile || {});

  // Populate Tables
  renderBooksTable(books || []);
  renderArticlesTable(articles || []);
  renderSubjectsTable(subjects || []);
  renderEventsTable(events || []);
  renderMessagesTable(messages || []);
}

// Tab Switching in Admin
function switchAdminTab(tabId) {
  currentAdminTab = tabId;

  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('bg-white', 'text-emerald-700', 'shadow-xs');
      btn.classList.remove('text-slate-600', 'hover:bg-white/50');
    } else {
      btn.classList.remove('bg-white', 'text-emerald-700', 'shadow-xs');
      btn.classList.add('text-slate-600', 'hover:bg-white/50');
    }
  });

  document.querySelectorAll('.admin-panel').forEach(panel => {
    if (panel.id === `admin-tab-${tabId}`) {
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
    }
  });
}

// Populate Settings Form
function populateSettingsForm(s) {
  const siteTitle = document.getElementById('settings-site-title');
  const heroTagline = document.getElementById('settings-hero-tagline');
  const heroBio = document.getElementById('settings-hero-bio');
  const phone = document.getElementById('settings-phone');
  const email = document.getElementById('settings-email');
  const address = document.getElementById('settings-address');

  if (siteTitle) siteTitle.value = s.site_title || '';
  if (heroTagline) heroTagline.value = s.hero_tagline || '';
  if (heroBio) heroBio.value = s.hero_bio || '';
  if (phone) phone.value = s.phone || '';
  if (email) email.value = s.contact_email || '';
  if (address) address.value = s.address || '';
}

// Settings Form Submit
function setupSettingsForm() {
  const form = document.getElementById('form-settings');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem(TOKEN_KEY);
    const newPassword = document.getElementById('settings-admin-password').value.trim();

    const payload = {
      site_title: document.getElementById('settings-site-title').value.trim(),
      hero_tagline: document.getElementById('settings-hero-tagline').value.trim(),
      hero_bio: document.getElementById('settings-hero-bio').value.trim(),
      phone: document.getElementById('settings-phone').value.trim(),
      contact_email: document.getElementById('settings-email').value.trim(),
      address: document.getElementById('settings-address').value.trim()
    };
    if (newPassword) {
      payload.admin_password = newPassword;
    }

    // Try Backend API
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          showToast(json.message || 'تم تحديث الإعدادات بنجاح!');
          document.getElementById('settings-admin-password').value = '';
          fetchAdminData();
          return;
        }
      }
    } catch (err) {}

    // Fallback LocalStorage
    if (adminData) {
      adminData.settings = { ...adminData.settings, ...payload };
      saveLocalDB(adminData);
      showToast('تم تحديث الإعدادات وحفظها بنجاح!');
      document.getElementById('settings-admin-password').value = '';
    }
  });
}

// Populate Profile Form
function populateProfileForm(p) {
  const nameAr = document.getElementById('profile-name-ar');
  const nameEn = document.getElementById('profile-name-en');
  const honorificAr = document.getElementById('profile-honorific-ar');
  const titles = document.getElementById('profile-titles');
  const photo = document.getElementById('profile-photo');
  const preview = document.getElementById('profile-photo-preview');

  if (nameAr) nameAr.value = p.name?.arabic || '';
  if (nameEn) nameEn.value = p.name?.english || '';
  if (honorificAr) honorificAr.value = p.name?.honorific_ar || '';
  if (titles) titles.value = (p.titles || []).join('\n');
  if (photo) photo.value = p.photo || '';
  if (preview && p.photo) preview.src = resolveAssetUrl(p.photo);
}

// Profile Form Submit
function setupProfileForm() {
  const form = document.getElementById('form-profile');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem(TOKEN_KEY);

    const payload = {
      arabic_name: document.getElementById('profile-name-ar').value.trim(),
      english_name: document.getElementById('profile-name-en').value.trim(),
      honorific_ar: document.getElementById('profile-honorific-ar').value.trim(),
      titles: document.getElementById('profile-titles').value.split('\n').map(t => t.trim()).filter(Boolean),
      photo: document.getElementById('profile-photo').value.trim()
    };

    // Try Backend API
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          showToast(json.message || 'تم تحديث الملف الشخصي!');
          fetchAdminData();
          return;
        }
      }
    } catch (err) {}

    // Fallback LocalStorage
    if (adminData) {
      if (!adminData.profile) adminData.profile = {};
      adminData.profile.name = {
        arabic: payload.arabic_name,
        english: payload.english_name,
        honorific_ar: payload.honorific_ar
      };
      adminData.profile.titles = payload.titles;
      adminData.profile.photo = payload.photo;
      saveLocalDB(adminData);
      showToast('تم تحديث الملف الشخصي وحفظه بنجاح!');
    }
  });
}

// Render Books Table
function renderBooksTable(books) {
  const tbody = document.getElementById('books-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  books.forEach(b => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-100 hover:bg-slate-50/70 transition text-xs';
    tr.innerHTML = `
      <td class="p-3 text-slate-400 font-mono">${b.id}</td>
      <td class="p-3">
        <img src="${resolveAssetUrl(b.cover_image)}" alt="" class="w-10 h-14 object-cover rounded shadow-xs" onerror="this.src='${resolveAssetUrl('extracted_data/books/covers/01_one.jpg')}'">
      </td>
      <td class="p-3 font-bold text-slate-800 max-w-xs truncate">${b.title}</td>
      <td class="p-3 text-slate-500 font-mono">${b.date || '-'}</td>
      <td class="p-3">
        ${b.pdf_file ? `<a href="${resolveAssetUrl(b.pdf_file)}" target="_blank" class="text-emerald-700 hover:underline font-semibold">تحميل PDF</a>` : '-'}
      </td>
      <td class="p-3">
        <div class="flex items-center gap-2">
          <button onclick="editBook(${b.id})" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">تعديل</button>
          <button onclick="deleteBook(${b.id})" class="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold">حذف</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Books Modal & CRUD
function openBookModal(isEdit = false) {
  const modal = document.getElementById('modal-book');
  document.getElementById('modal-book-title').textContent = isEdit ? 'تعديل كتاب أو بحث' : 'إضافة كتاب أو بحث جديد';
  if (!isEdit) {
    document.getElementById('form-book').reset();
    document.getElementById('book-edit-id').value = '';
  }
  modal.classList.remove('hidden');
}

function closeBookModal() {
  document.getElementById('modal-book').classList.add('hidden');
}

function editBook(id) {
  if (!adminData?.books) return;
  const b = adminData.books.find(item => item.id === id);
  if (!b) return;

  document.getElementById('book-edit-id').value = b.id;
  document.getElementById('book-title').value = b.title || '';
  document.getElementById('book-date').value = b.date || '';
  document.getElementById('book-cover').value = b.cover_image || '';
  document.getElementById('book-pdf').value = b.pdf_file || '';
  document.getElementById('book-description').value = b.description || '';

  openBookModal(true);
}

function setupBookForm() {
  const form = document.getElementById('form-book');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem(TOKEN_KEY);
    const id = document.getElementById('book-edit-id').value;
    const isEdit = Boolean(id);

    const payload = {
      title: document.getElementById('book-title').value.trim(),
      date: document.getElementById('book-date').value.trim(),
      cover_image: document.getElementById('book-cover').value.trim(),
      pdf_file: document.getElementById('book-pdf').value.trim(),
      description: document.getElementById('book-description').value.trim()
    };

    const url = isEdit ? `/api/admin/books/${id}` : '/api/admin/books';
    const method = isEdit ? 'PUT' : 'POST';

    // Try Backend API
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          showToast(json.message || 'تم حفظ الكتاب!');
          closeBookModal();
          fetchAdminData();
          return;
        }
      }
    } catch (err) {}

    // Fallback LocalStorage
    if (adminData) {
      if (!adminData.books) adminData.books = [];
      if (isEdit) {
        const idx = adminData.books.findIndex(b => b.id === parseInt(id, 10));
        if (idx !== -1) {
          adminData.books[idx] = { ...adminData.books[idx], ...payload };
        }
      } else {
        payload.id = Date.now();
        adminData.books.unshift(payload);
      }
      saveLocalDB(adminData);
      showToast('تم حفظ الكتاب بنجاح!');
      closeBookModal();
    }
  });
}

async function deleteBook(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الكتاب/البحث؟')) return;
  const token = localStorage.getItem(TOKEN_KEY);

  try {
    const res = await fetch(`/api/admin/books/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('تم حذف الكتاب بنجاح');
      fetchAdminData();
      return;
    }
  } catch (err) {}

  if (adminData && adminData.books) {
    adminData.books = adminData.books.filter(b => b.id !== id);
    saveLocalDB(adminData);
    showToast('تم حذف الكتاب بنجاح');
  }
}

// Render Articles Table
function renderArticlesTable(articles) {
  const tbody = document.getElementById('articles-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  articles.forEach(a => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-100 hover:bg-slate-50/70 transition text-xs';
    tr.innerHTML = `
      <td class="p-3 text-slate-400 font-mono">${a.id}</td>
      <td class="p-3 font-bold text-slate-800 max-w-xs truncate">${a.title}</td>
      <td class="p-3 text-slate-500 font-mono">${a.date || '-'}</td>
      <td class="p-3">
        <div class="flex items-center gap-2">
          <button onclick="editArticle(${a.id})" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">تعديل</button>
          <button onclick="deleteArticle(${a.id})" class="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold">حذف</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openArticleModal(isEdit = false) {
  const modal = document.getElementById('modal-article');
  document.getElementById('modal-article-title').textContent = isEdit ? 'تعديل مقالة' : 'إضافة مقالة جديدة';
  if (!isEdit) {
    document.getElementById('form-article').reset();
    document.getElementById('article-edit-id').value = '';
  }
  modal.classList.remove('hidden');
}

function closeArticleModal() {
  document.getElementById('modal-article').classList.add('hidden');
}

function editArticle(id) {
  if (!adminData?.articles) return;
  const a = adminData.articles.find(item => item.id === id);
  if (!a) return;

  document.getElementById('article-edit-id').value = a.id;
  document.getElementById('article-title').value = a.title || '';
  document.getElementById('article-date').value = a.date || '';
  document.getElementById('article-image').value = a.image || '';
  document.getElementById('article-content').value = a.content || '';

  openArticleModal(true);
}

function setupArticleForm() {
  const form = document.getElementById('form-article');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem(TOKEN_KEY);
    const id = document.getElementById('article-edit-id').value;
    const isEdit = Boolean(id);

    const payload = {
      title: document.getElementById('article-title').value.trim(),
      date: document.getElementById('article-date').value.trim(),
      image: document.getElementById('article-image').value.trim(),
      content: document.getElementById('article-content').value.trim()
    };

    const url = isEdit ? `/api/admin/articles/${id}` : '/api/admin/articles';
    const method = isEdit ? 'PUT' : 'POST';

    // Try Backend API
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          showToast(json.message || 'تم حفظ المقال!');
          closeArticleModal();
          fetchAdminData();
          return;
        }
      }
    } catch (err) {}

    // Fallback LocalStorage
    if (adminData) {
      if (!adminData.articles) adminData.articles = [];
      if (isEdit) {
        const idx = adminData.articles.findIndex(a => a.id === parseInt(id, 10));
        if (idx !== -1) {
          adminData.articles[idx] = { ...adminData.articles[idx], ...payload };
        }
      } else {
        payload.id = Date.now();
        adminData.articles.unshift(payload);
      }
      saveLocalDB(adminData);
      showToast('تم حفظ المقال بنجاح!');
      closeArticleModal();
    }
  });
}

async function deleteArticle(id) {
  if (!confirm('هل ترغب في حذف هذه المقالة؟')) return;
  const token = localStorage.getItem(TOKEN_KEY);

  try {
    const res = await fetch(`/api/admin/articles/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('تم حذف المقال');
      fetchAdminData();
      return;
    }
  } catch (err) {}

  if (adminData && adminData.articles) {
    adminData.articles = adminData.articles.filter(a => a.id !== id);
    saveLocalDB(adminData);
    showToast('تم حذف المقال');
  }
}

// Render Subjects Table
function renderSubjectsTable(subjects) {
  const tbody = document.getElementById('subjects-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  subjects.forEach(s => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-100 hover:bg-slate-50/70 transition text-xs';
    tr.innerHTML = `
      <td class="p-3 text-slate-400 font-mono">${s.id}</td>
      <td class="p-3 font-bold text-slate-800 max-w-xs truncate">${s.title}</td>
      <td class="p-3 text-slate-500 font-mono">${s.date || '-'}</td>
      <td class="p-3">
        <button onclick="deleteSubject(${s.id})" class="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold">حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function deleteSubject(id) {
  if (!confirm('هل ترغب في حذف هذا الموضوع؟')) return;
  const token = localStorage.getItem(TOKEN_KEY);

  try {
    const res = await fetch(`/api/admin/subjects/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('تم حذف الموضوع');
      fetchAdminData();
      return;
    }
  } catch (err) {}

  if (adminData && adminData.subjects) {
    adminData.subjects = adminData.subjects.filter(s => s.id !== id);
    saveLocalDB(adminData);
    showToast('تم حذف الموضوع');
  }
}

// Render Events Table
function renderEventsTable(events) {
  const tbody = document.getElementById('events-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  events.forEach(ev => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-100 hover:bg-slate-50/70 transition text-xs';
    tr.innerHTML = `
      <td class="p-3 text-slate-400 font-mono">${ev.id}</td>
      <td class="p-3 font-bold text-slate-800 max-w-xs truncate">${ev.title}</td>
      <td class="p-3 text-slate-500 font-mono">${ev.image_count || 1} صور</td>
      <td class="p-3">
        <button onclick="deleteEvent(${ev.id})" class="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold">حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function deleteEvent(id) {
  if (!confirm('هل ترغب في حذف هذا المشروع؟')) return;
  const token = localStorage.getItem(TOKEN_KEY);

  try {
    const res = await fetch(`/api/admin/events/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('تم حذف المشروع');
      fetchAdminData();
      return;
    }
  } catch (err) {}

  if (adminData && adminData.events) {
    adminData.events = adminData.events.filter(e => e.id !== id);
    saveLocalDB(adminData);
    showToast('تم حذف المشروع');
  }
}

// Render Messages Table
function renderMessagesTable(messages) {
  const tbody = document.getElementById('messages-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  (messages || []).forEach(m => {
    const tr = document.createElement('tr');
    tr.className = `border-b border-slate-100 hover:bg-slate-50/70 transition text-xs ${!m.read ? 'bg-emerald-50/40 font-bold' : ''}`;
    tr.innerHTML = `
      <td class="p-3">
        <span class="inline-block w-2.5 h-2.5 rounded-full ${!m.read ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}"></span>
      </td>
      <td class="p-3 text-slate-800">${m.name}</td>
      <td class="p-3 text-slate-600 font-mono text-[11px]">${m.phone || m.email || '-'}</td>
      <td class="p-3 text-slate-700 max-w-xs truncate" title="${m.message}">${m.subject || m.message}</td>
      <td class="p-3 text-slate-500 font-mono text-[11px]">${m.date || '-'}</td>
      <td class="p-3">
        <div class="flex items-center gap-2">
          ${!m.read ? `<button onclick="markMessageRead(${m.id})" class="px-2 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">قراءة</button>` : ''}
          <button onclick="deleteMessage(${m.id})" class="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px]">حذف</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function markMessageRead(id) {
  const token = localStorage.getItem(TOKEN_KEY);

  try {
    const res = await fetch(`/api/admin/messages/${id}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      fetchAdminData();
      return;
    }
  } catch (err) {}

  if (adminData && adminData.messages) {
    const msg = adminData.messages.find(m => m.id === id);
    if (msg) msg.read = true;
    saveLocalDB(adminData);
  }
}

async function deleteMessage(id) {
  if (!confirm('هل ترغب في حذف هذه الرسالة؟')) return;
  const token = localStorage.getItem(TOKEN_KEY);

  try {
    const res = await fetch(`/api/admin/messages/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('تم حذف الرسالة');
      fetchAdminData();
      return;
    }
  } catch (err) {}

  if (adminData && adminData.messages) {
    adminData.messages = adminData.messages.filter(m => m.id !== id);
    saveLocalDB(adminData);
    showToast('تم حذف الرسالة');
  }
}

// File Upload Helper
async function uploadFileHelper(inputEl, targetFieldId) {
  const file = inputEl.files?.[0];
  if (!file) return;

  const token = localStorage.getItem(TOKEN_KEY);
  const formData = new FormData();
  formData.append('file', file);

  showToast('جاري رفع الملف...');

  // 1. Try Backend Upload API
  try {
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.fileUrl) {
        document.getElementById(targetFieldId).value = json.fileUrl;
        showToast('تم رفع الملف بنجاح!');
        return;
      }
    }
  } catch (err) {}

  // 2. Client-side Base64 fallback (for static preview mode)
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById(targetFieldId).value = e.target.result;
    showToast('تم تحميل ومعاينة الملف في المتصفح!');
  };
  reader.readAsDataURL(file);
}
