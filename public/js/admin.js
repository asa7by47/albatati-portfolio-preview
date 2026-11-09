// Admin State
const TOKEN_KEY = 'albatati_admin_auth_token';
let adminData = null;
let currentAdminTab = 'overview';

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupLoginForm();
  setupSettingsForm();
  setupProfileForm();
  setupBookForm();
  setupArticleForm();
});

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

// Check Authentication on Page Load
function checkAuth() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
    fetchAdminData();
  } else {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('dashboard-screen').classList.add('hidden');
  }
}

// Login Form
function setupLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('btn-login');
    btn.disabled = true;
    btn.textContent = 'جاري التحقق...';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const json = await res.json();
      if (json.success && json.token) {
        localStorage.setItem(TOKEN_KEY, json.token);
        showToast('تم تسجيل الدخول بنجاح!');
        checkAuth();
      } else {
        showToast(json.error || 'كلمة المرور غير صحيحة', 'error');
      }
    } catch (err) {
      showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'دخول لوحة التحكم';
    }
  });
}

// Admin Logout
function adminLogout() {
  localStorage.removeItem(TOKEN_KEY);
  showToast('تم تسجيل الخروج');
  checkAuth();
}

// Fetch Admin Data
async function fetchAdminData() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;

  try {
    const res = await fetch('/api/admin/data', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (json.success && json.data) {
      adminData = json.data;
      renderAdminDashboard(adminData);
    } else {
      adminLogout();
    }
  } catch (err) {
    console.error('Admin fetch error:', err);
    showToast('تعذر تحميل بيانات الإدارة', 'error');
  }
}

// Render Admin Dashboard
function renderAdminDashboard(data) {
  const { settings, profile, books, articles, subjects, events, messages } = data;

  // Sidebar Counts
  document.getElementById('count-books').textContent = books?.length || 0;
  document.getElementById('count-articles').textContent = articles?.length || 0;
  document.getElementById('count-subjects').textContent = subjects?.length || 0;
  document.getElementById('count-events').textContent = events?.length || 0;
  
  const unreadCount = (messages || []).filter(m => !m.read).length;
  document.getElementById('count-inbox').textContent = unreadCount;
  
  // Overview Tab Widgets
  document.getElementById('dash-books-count').textContent = books?.length || 0;
  document.getElementById('dash-articles-count').textContent = articles?.length || 0;
  document.getElementById('dash-events-count').textContent = events?.length || 0;
  document.getElementById('dash-messages-count').textContent = messages?.length || 0;

  renderOverviewMessages(messages || []);
  renderBooksTable(books || []);
  renderArticlesTable(articles || []);
  renderSubjectsTable(subjects || []);
  renderEventsTable(events || []);
  renderMessagesList(messages || []);
  fillProfileForm(profile, data.cv);
  fillSettingsForm(settings);
}

// Render Overview Messages
function renderOverviewMessages(messages) {
  const container = document.getElementById('overview-messages-list');
  if (!container) return;
  container.innerHTML = '';

  const recents = messages.slice(0, 3);
  if (recents.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400 py-3 text-center">لا توجد رسائل واردة حالياً</p>';
    return;
  }

  recents.forEach(m => {
    const row = document.createElement('div');
    row.className = 'p-3 rounded-xl bg-white/80 border border-slate-200/80 flex justify-between items-center text-xs';
    row.innerHTML = `
      <div>
        <span class="font-bold text-slate-900">${m.name}</span>
        <span class="text-slate-400 mr-2 text-[10px]">${m.date}</span>
        <p class="text-slate-600 text-[11px] truncate max-w-md mt-0.5">${m.message}</p>
      </div>
      <span class="px-2 py-0.5 rounded text-[10px] ${m.read ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-800 font-bold'}">
        ${m.read ? 'مقروءة' : 'جديدة'}
      </span>
    `;
    container.appendChild(row);
  });
}

// Render Books Table
function renderBooksTable(books) {
  const tbody = document.getElementById('admin-books-table');
  if (!tbody) return;
  tbody.innerHTML = '';

  books.forEach(b => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50/50 transition';
    tr.innerHTML = `
      <td class="p-3">
        <img src="${b.cover_image || '/extracted_data/books/covers/01_one.jpg'}" class="w-10 h-14 object-cover rounded shadow-xs" onerror="this.src='/extracted_data/books/covers/01_one.jpg'">
      </td>
      <td class="p-3 font-bold text-slate-900">${b.title}</td>
      <td class="p-3 font-mono text-slate-500">${b.date || ''}</td>
      <td class="p-3">
        ${b.pdf_file ? `<a href="${b.pdf_file}" target="_blank" class="text-emerald-700 font-bold hover:underline">تحميل PDF</a>` : '<span class="text-slate-400">غير متوفر</span>'}
      </td>
      <td class="p-3 text-center space-x-2 space-x-reverse">
        <button onclick="editBook(${b.id})" class="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition">تعديل</button>
        <button onclick="deleteBook(${b.id})" class="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition">حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Render Articles Table
function renderArticlesTable(articles) {
  const tbody = document.getElementById('admin-articles-table');
  if (!tbody) return;
  tbody.innerHTML = '';

  articles.forEach(a => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50/50 transition';
    tr.innerHTML = `
      <td class="p-3 font-bold text-slate-900">${a.title}</td>
      <td class="p-3 font-mono text-slate-500">${a.date || ''}</td>
      <td class="p-3 text-slate-600 line-clamp-1 max-w-xs">${a.content || ''}</td>
      <td class="p-3 text-center space-x-2 space-x-reverse">
        <button onclick="editArticle(${a.id})" class="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition">تعديل</button>
        <button onclick="deleteArticle(${a.id})" class="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition">حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Render Subjects Table
function renderSubjectsTable(subjects) {
  const tbody = document.getElementById('admin-subjects-table');
  if (!tbody) return;
  tbody.innerHTML = '';

  subjects.forEach(s => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50/50 transition';
    tr.innerHTML = `
      <td class="p-3 font-bold text-slate-900">${s.title}</td>
      <td class="p-3 text-slate-500">${s.subtitle || '-'}</td>
      <td class="p-3 font-mono text-slate-500">${s.date || ''}</td>
      <td class="p-3 text-center space-x-2 space-x-reverse">
        <button onclick="deleteSubject(${s.id})" class="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition">حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Render Events Table
function renderEventsTable(events) {
  const tbody = document.getElementById('admin-events-table');
  if (!tbody) return;
  tbody.innerHTML = '';

  events.forEach(e => {
    const firstImg = e.images?.[0] || '/extracted_data/brand_assets/home_1.JPG';
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50/50 transition';
    tr.innerHTML = `
      <td class="p-3">
        <img src="${firstImg}" class="w-12 h-10 object-cover rounded shadow-xs" onerror="this.src='/extracted_data/brand_assets/home_1.JPG'">
      </td>
      <td class="p-3 font-bold text-slate-900">${e.title}</td>
      <td class="p-3 font-mono text-slate-500">${e.date || ''}</td>
      <td class="p-3 font-mono font-bold text-emerald-700">${e.image_count || 1}</td>
      <td class="p-3 text-center space-x-2 space-x-reverse">
        <button onclick="deleteEvent(${e.id})" class="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition">حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Render Messages List
function renderMessagesList(messages) {
  const container = document.getElementById('admin-messages-list');
  if (!container) return;
  container.innerHTML = '';

  if (messages.length === 0) {
    container.innerHTML = '<div class="p-8 text-center text-slate-400 text-xs">لا توجد رسائل واردة حتى الآن</div>';
    return;
  }

  messages.forEach(m => {
    const card = document.createElement('div');
    card.className = `p-5 rounded-2xl border transition space-y-2 ${
      m.read ? 'bg-white/70 border-slate-200/70' : 'bg-emerald-50/70 border-emerald-300 shadow-xs'
    }`;
    card.innerHTML = `
      <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div>
          <span class="font-bold text-slate-900 text-sm">${m.name}</span>
          <span class="text-slate-500 text-xs mr-2 font-mono">(${m.phone || 'بدون هاتف'})</span>
          <span class="text-slate-400 text-xs font-mono mr-2">${m.email || ''}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-slate-400 text-[11px] font-mono">${m.date}</span>
          ${!m.read ? `<button onclick="markMessageRead(${m.id})" class="text-xs text-emerald-700 font-bold hover:underline">تعليم كمقروءة</button>` : ''}
          <button onclick="deleteMessage(${m.id})" class="text-xs text-rose-600 font-bold hover:underline">حذف</button>
        </div>
      </div>
      <div class="text-xs font-semibold text-emerald-800 bg-white/80 px-2.5 py-1 rounded-lg inline-block">
        الموضوع: ${m.subject || 'عام'}
      </div>
      <p class="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white/60 p-3 rounded-xl border border-slate-100">
        ${m.message}
      </p>
      <div class="flex gap-2 pt-1">
        ${m.phone ? `<a href="tel:${m.phone}" class="px-3 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold">اتصال 📞</a>` : ''}
        ${m.email ? `<a href="mailto:${m.email}" class="px-3 py-1 rounded-lg bg-slate-800 text-white text-[11px] font-bold">إرسال إيميل ✉️</a>` : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

// Fill Profile Form
function fillProfileForm(profile, cv) {
  if (profile.name?.arabic) document.getElementById('prof-name-ar').value = profile.name.arabic;
  if (profile.name?.english) document.getElementById('prof-name-en').value = profile.name.english;
  if (profile.photo) document.getElementById('prof-photo').value = profile.photo;
  if (cv?.summary) document.getElementById('prof-summary').value = cv.summary;
  if (profile.titles) document.getElementById('prof-titles').value = profile.titles.join('\n');
}

// Fill Settings Form
function fillSettingsForm(settings) {
  if (settings.site_title) document.getElementById('set-site-title').value = settings.site_title;
  if (settings.hero_tagline) document.getElementById('set-hero-tagline').value = settings.hero_tagline;
  if (settings.hero_bio) document.getElementById('set-hero-bio').value = settings.hero_bio;
  if (settings.contact_email) document.getElementById('set-contact-email').value = settings.contact_email;
  if (settings.phone) document.getElementById('set-phone').value = settings.phone;
  if (settings.address) document.getElementById('set-address').value = settings.address;
}

// Direct File Upload Helper
async function uploadFileDirect(inputEl, targetInputId) {
  if (!inputEl.files || !inputEl.files[0]) return;
  const file = inputEl.files[0];
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem(TOKEN_KEY);
  showToast('جاري رفع الملف...');

  try {
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const json = await res.json();
    if (json.success && json.fileUrl) {
      document.getElementById(targetInputId).value = json.fileUrl;
      showToast('تم رفع الملف بنجاح!');
    } else {
      showToast(json.error || 'فشل رفع الملف', 'error');
    }
  } catch (err) {
    showToast('خطأ في رفع الملف', 'error');
  }
}

// Switch Admin Tab
function switchAdminTab(tabId) {
  currentAdminTab = tabId;
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('bg-white', 'text-emerald-700', 'shadow-xs');
    } else {
      btn.classList.remove('bg-white', 'text-emerald-700', 'shadow-xs');
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

// Profile Form Submit
function setupProfileForm() {
  const form = document.getElementById('profile-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem(TOKEN_KEY);
    const payload = {
      name: {
        arabic: document.getElementById('prof-name-ar').value.trim(),
        english: document.getElementById('prof-name-en').value.trim()
      },
      photo: document.getElementById('prof-photo').value.trim(),
      cv_summary: document.getElementById('prof-summary').value.trim(),
      titles: document.getElementById('prof-titles').value.split('\n').map(t => t.trim()).filter(Boolean)
    };

    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        fetchAdminData();
      } else {
        showToast(json.error || 'فشل الحفظ', 'error');
      }
    } catch (err) {
      showToast('خطأ في الاتصال', 'error');
    }
  });
}

// Settings Form Submit
function setupSettingsForm() {
  const form = document.getElementById('settings-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem(TOKEN_KEY);
    const payload = {
      site_title: document.getElementById('set-site-title').value.trim(),
      hero_tagline: document.getElementById('set-hero-tagline').value.trim(),
      hero_bio: document.getElementById('set-hero-bio').value.trim(),
      contact_email: document.getElementById('set-contact-email').value.trim(),
      phone: document.getElementById('set-phone').value.trim(),
      address: document.getElementById('set-address').value.trim(),
      new_password: document.getElementById('set-new-password').value.trim()
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        document.getElementById('set-new-password').value = '';
        fetchAdminData();
      } else {
        showToast(json.error || 'فشل التحديث', 'error');
      }
    } catch (err) {
      showToast('خطأ في الاتصال', 'error');
    }
  });
}

// Books Modal & Actions
function openBookModal(book = null) {
  document.getElementById('modal-book').classList.remove('hidden');
  const titleEl = document.getElementById('modal-book-title');
  const form = document.getElementById('form-book');
  form.reset();

  if (book) {
    titleEl.textContent = 'تعديل كتاب أو بحث';
    document.getElementById('book-edit-id').value = book.id;
    document.getElementById('book-title').value = book.title;
    document.getElementById('book-date').value = book.date || '';
    document.getElementById('book-desc').value = book.description || '';
    document.getElementById('book-cover').value = book.cover_image || '';
    document.getElementById('book-pdf').value = book.pdf_file || '';
  } else {
    titleEl.textContent = 'إضافة كتاب أو بحث جديد';
    document.getElementById('book-edit-id').value = '';
  }
}

function closeBookModal() {
  document.getElementById('modal-book').classList.add('hidden');
}

function editBook(id) {
  const b = adminData?.books?.find(x => x.id === id);
  if (b) openBookModal(b);
}

async function deleteBook(id) {
  if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الكتاب؟')) return;
  const token = localStorage.getItem(TOKEN_KEY);

  try {
    const res = await fetch(`/api/admin/books/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (json.success) {
      showToast('تم حذف الكتاب بنجاح');
      fetchAdminData();
    }
  } catch (err) {
    showToast('حدث خطأ أثناء الحذف', 'error');
  }
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
      description: document.getElementById('book-desc').value.trim(),
      cover_image: document.getElementById('book-cover').value.trim(),
      pdf_file: document.getElementById('book-pdf').value.trim()
    };

    const url = isEdit ? `/api/admin/books/${id}` : '/api/admin/books';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        closeBookModal();
        fetchAdminData();
      } else {
        showToast(json.error || 'فشل الحفظ', 'error');
      }
    } catch (err) {
      showToast('خطأ في الاتصال', 'error');
    }
  });
}

// Articles Modal & Actions
function openArticleModal(article = null) {
  document.getElementById('modal-article').classList.remove('hidden');
  const titleEl = document.getElementById('modal-article-title');
  const form = document.getElementById('form-article');
  form.reset();

  if (article) {
    titleEl.textContent = 'تعديل مقال';
    document.getElementById('article-edit-id').value = article.id;
    document.getElementById('article-title').value = article.title;
    document.getElementById('article-date').value = article.date || '';
    document.getElementById('article-image').value = article.image || '';
    document.getElementById('article-content').value = article.content || '';
  } else {
    titleEl.textContent = 'كتابة مقال جديد';
    document.getElementById('article-edit-id').value = '';
  }
}

function closeArticleModal() {
  document.getElementById('modal-article').classList.add('hidden');
}

function editArticle(id) {
  const a = adminData?.articles?.find(x => x.id === id);
  if (a) openArticleModal(a);
}

async function deleteArticle(id) {
  if (!confirm('هل أنت متأكد من حذف هذا المقال؟')) return;
  const token = localStorage.getItem(TOKEN_KEY);

  try {
    const res = await fetch(`/api/admin/articles/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (json.success) {
      showToast('تم حذف المقال بنجاح');
      fetchAdminData();
    }
  } catch (err) {
    showToast('خطأ أثناء الحذف', 'error');
  }
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

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        closeArticleModal();
        fetchAdminData();
      } else {
        showToast(json.error || 'فشل الحفظ', 'error');
      }
    } catch (err) {
      showToast('خطأ في الاتصال', 'error');
    }
  });
}

// Delete Subjects & Events
async function deleteSubject(id) {
  if (!confirm('هل ترغب في حذف هذا الموضوع؟')) return;
  const token = localStorage.getItem(TOKEN_KEY);
  try {
    const res = await fetch(`/api/admin/subjects/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (json.success) {
      showToast('تم حذف الموضوع');
      fetchAdminData();
    }
  } catch (err) {
    showToast('خطأ أثناء الحذف', 'error');
  }
}

async function deleteEvent(id) {
  if (!confirm('هل ترغب في حذف هذا المشروع؟')) return;
  const token = localStorage.getItem(TOKEN_KEY);
  try {
    const res = await fetch(`/api/admin/events/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (json.success) {
      showToast('تم حذف المشروع');
      fetchAdminData();
    }
  } catch (err) {
    showToast('خطأ أثناء الحذف', 'error');
  }
}

// Mark Message as Read
async function markMessageRead(id) {
  const token = localStorage.getItem(TOKEN_KEY);
  await fetch(`/api/admin/messages/${id}/read`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  fetchAdminData();
}

// Delete Message
async function deleteMessage(id) {
  if (!confirm('هل ترغب في حذف هذه الرسالة؟')) return;
  const token = localStorage.getItem(TOKEN_KEY);
  await fetch(`/api/admin/messages/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  fetchAdminData();
}
