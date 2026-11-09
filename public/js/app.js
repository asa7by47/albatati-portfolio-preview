// State & Cache
let siteData = null;
let currentTab = 'about';

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  fetchWebsiteData();
  setupContactForm();
  setupSearchListeners();
  handleHashNavigation();
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

// Mobile Menu Handler
function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const nav = document.getElementById('nav-menu');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    nav.classList.toggle('hidden');
    nav.classList.toggle('flex');
    nav.classList.toggle('flex-col');
  });
}

// Fetch Public Website Data
async function fetchWebsiteData() {
  try {
    const res = await fetch('/api/public/data');
    const json = await res.json();
    if (json.success && json.data) {
      siteData = json.data;
      renderWebsite(siteData);
    } else {
      showToast('تعذر تحميل بيانات الموقع من الخادم', 'error');
    }
  } catch (err) {
    console.error('Fetch error:', err);
    showToast('حدث خطأ في الاتصال بالخادم', 'error');
  }
}

// Render All Components
function renderWebsite(data) {
  const { settings, profile, cv, books, articles, subjects, events } = data;

  // Document Title & Meta
  if (settings.site_title) {
    document.title = settings.site_title;
  }

  // Header Elements
  if (profile.name?.arabic) {
    document.getElementById('header-name').textContent = profile.name.arabic;
  }
  if (settings.hero_tagline) {
    document.getElementById('header-subtitle').textContent = settings.hero_tagline;
    document.getElementById('hero-tagline').textContent = settings.hero_tagline;
  }

  // Hero Section
  if (profile.name?.arabic) {
    document.getElementById('hero-title').textContent = profile.name.arabic;
  }
  if (settings.hero_bio) {
    document.getElementById('hero-bio').textContent = settings.hero_bio;
  }
  if (profile.photo) {
    document.getElementById('hero-photo').src = profile.photo;
  }

  // CV Download Button
  if (cv.pdf_ar) {
    document.getElementById('btn-cv-download').href = cv.pdf_ar;
  }

  // Stats Counters
  document.getElementById('stat-books').textContent = books ? books.length : 0;
  document.getElementById('stat-articles').textContent = (articles?.length || 0) + (subjects?.length || 0);
  document.getElementById('stat-events').textContent = events ? `${events.length}+` : '0';

  // About Section Summary
  if (cv.summary) {
    document.getElementById('about-summary').textContent = cv.summary;
  }

  // Render Qualifications
  renderQualifications(profile.academic_qualifications || []);

  // Render Titles / Memberships
  renderTitles(profile.titles || []);

  // Render Books
  renderBooks(books || []);

  // Render Articles
  renderArticles(articles || []);

  // Render Subjects
  renderSubjects(subjects || []);

  // Render Events & Galleries
  renderEvents(events || []);

  // Render Contact Info
  renderContact(settings, profile);
}

// Render Qualifications
function renderQualifications(list) {
  const container = document.getElementById('qualifications-list');
  if (!container) return;
  container.innerHTML = '';

  list.forEach(q => {
    const card = document.createElement('div');
    card.className = 'p-4 rounded-2xl bg-white/70 border border-slate-200/70 hover:bg-white transition space-y-1.5';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <h5 class="text-sm font-bold text-slate-900">${q.degree}</h5>
        ${q.year ? `<span class="text-[11px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">${q.year}</span>` : ''}
      </div>
      <p class="text-xs text-slate-600 font-medium">${q.institution || ''}</p>
      ${q.details ? `<p class="text-[11px] text-slate-500">${q.details}</p>` : ''}
      ${q.topic ? `<p class="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-1 mt-1"><strong>موضوع البحث:</strong> ${q.topic}</p>` : ''}
    `;
    container.appendChild(card);
  });
}

// Render Titles & Memberships
function renderTitles(titles) {
  const container = document.getElementById('titles-list');
  if (!container) return;
  container.innerHTML = '';

  titles.forEach(t => {
    const pill = document.createElement('div');
    pill.className = 'p-3 rounded-xl bg-white/70 border border-slate-200/70 flex items-center gap-2.5 text-xs font-semibold text-slate-800';
    pill.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
      <span>${t}</span>
    `;
    container.appendChild(pill);
  });
}

// Render Books
function renderBooks(books) {
  const container = document.getElementById('books-grid');
  if (!container) return;
  container.innerHTML = '';

  if (books.length === 0) {
    container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-sm">لا توجد كتب مطابقة لطلب البحث</div>`;
    return;
  }

  books.forEach(b => {
    const card = document.createElement('div');
    card.className = 'card-interactive p-5 rounded-2xl bg-white/80 border border-slate-200/80 flex flex-col justify-between space-y-4';
    
    const coverSrc = b.cover_image || '/extracted_data/books/covers/01_one.jpg';
    const pdfSrc = b.pdf_file || '#';

    card.innerHTML = `
      <div class="space-y-3">
        <div class="h-48 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-2 border border-slate-100 shadow-inner">
          <img src="${coverSrc}" alt="${b.title}" class="max-h-full object-contain" onerror="this.src='/extracted_data/books/covers/01_one.jpg'">
        </div>
        <div class="flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>${b.date || ''}</span>
          <span class="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">بحث / كتاب</span>
        </div>
        <h4 class="font-bold text-sm sm:text-base text-slate-900 leading-snug">${b.title}</h4>
        <p class="text-xs text-slate-600 line-clamp-3 leading-relaxed">${b.description || ''}</p>
      </div>

      <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <a href="${pdfSrc}" target="_blank" download class="w-full text-center py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 shadow-xs">
          <span>تحميل البحث (PDF)</span>
          <svg class="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
        </a>
      </div>
    `;
    container.appendChild(card);
  });
}

// Render Articles
function renderArticles(articles) {
  const container = document.getElementById('articles-grid');
  if (!container) return;
  container.innerHTML = '';

  if (articles.length === 0) {
    container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-sm">لا توجد مقالات مطابقة للبحث</div>`;
    return;
  }

  articles.forEach(a => {
    const card = document.createElement('article');
    card.className = 'card-interactive p-6 rounded-2xl bg-white/80 border border-slate-200/80 flex flex-col justify-between space-y-4';
    
    card.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>📅 ${a.date || ''}</span>
          <span class="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold">مقالة رأي</span>
        </div>
        <h4 class="text-lg font-bold text-slate-900 leading-snug">${a.title}</h4>
        <p class="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">${a.content || ''}</p>
      </div>

      <div class="pt-3 border-t border-slate-100 flex justify-between items-center">
        <button onclick="openReaderModal('article', ${a.id})" class="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group">
          <span>قراءة المقال كاملاً</span>
          <span class="group-hover:-translate-x-1 transition duration-200">←</span>
        </button>
        <span class="text-[11px] text-slate-400">بقلم: د. عبدالمجيد البطاطي</span>
      </div>
    `;
    container.appendChild(card);
  });
}

// Render Subjects
function renderSubjects(subjects) {
  const container = document.getElementById('subjects-grid');
  if (!container) return;
  container.innerHTML = '';

  subjects.forEach(s => {
    const card = document.createElement('div');
    card.className = 'card-interactive p-6 rounded-2xl bg-white/80 border border-slate-200/80 flex flex-col justify-between space-y-4';
    
    card.innerHTML = `
      <div class="space-y-2.5">
        <div class="flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>${s.date || ''}</span>
          <span class="text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded text-[11px] font-semibold">قضية مجتمعية</span>
        </div>
        <h4 class="text-lg font-bold text-slate-900 leading-snug">${s.title}</h4>
        ${s.subtitle ? `<h5 class="text-xs font-semibold text-emerald-700">${s.subtitle}</h5>` : ''}
        <p class="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">${s.content || ''}</p>
      </div>

      <div class="pt-3 border-t border-slate-100 flex justify-between items-center">
        <button onclick="openReaderModal('subject', ${s.id})" class="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group">
          <span>قراءة الموضوع كاملاً</span>
          <span class="group-hover:-translate-x-1 transition duration-200">←</span>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Render Events & Galleries
function renderEvents(events) {
  const container = document.getElementById('events-grid');
  if (!container) return;
  container.innerHTML = '';

  events.forEach(ev => {
    const card = document.createElement('div');
    card.className = 'card-interactive p-5 rounded-2xl bg-white/80 border border-slate-200/80 flex flex-col justify-between space-y-4';
    
    const firstImg = (ev.images && ev.images.length > 0) ? ev.images[0] : '/extracted_data/brand_assets/home_1.JPG';

    card.innerHTML = `
      <div class="space-y-3">
        <div class="h-44 rounded-xl overflow-hidden bg-slate-900 relative shadow-inner group">
          <img src="${firstImg}" alt="${ev.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" onerror="this.src='/extracted_data/brand_assets/home_1.JPG'">
          <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent"></div>
          <span class="absolute bottom-2.5 right-2.5 text-white text-xs font-bold bg-black/40 backdrop-blur px-2.5 py-1 rounded-lg">
            📷 ${ev.image_count || 1} صور
          </span>
        </div>
        <div class="flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>${ev.date || ''}</span>
          <span class="text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-semibold">ميداني / حماية</span>
        </div>
        <h4 class="font-bold text-sm sm:text-base text-slate-900 leading-snug">${ev.title}</h4>
        <p class="text-xs text-slate-600 line-clamp-3 leading-relaxed">${ev.content || 'مشروع وطني ضمن مشاريع أمانة محافظة جدة ووزارة الشؤون البلدية والقروية.'}</p>
      </div>

      <div class="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
        <button onclick="openEventGallery(${ev.id})" class="text-emerald-700 font-bold hover:underline flex items-center gap-1">
          <span>استعراض الألبوم المصور</span>
          <span>📸</span>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Render Contact Info
function renderContact(settings, profile) {
  const phone = settings.phone || profile.phone || '0505626375';
  const email = settings.contact_email || profile.emails?.[0] || 'info@asalbatati.net';
  const address = settings.address || 'المملكة العربية السعودية - منطقة مكة المكرمة - جدة';

  document.getElementById('contact-phone').textContent = phone;
  document.getElementById('contact-phone-link').href = `tel:${phone}`;
  document.getElementById('contact-email').textContent = email;
  document.getElementById('contact-email-link').href = `mailto:${email}`;
  document.getElementById('contact-address').textContent = address;
}

// Tab Switching
function switchTab(tabId) {
  currentTab = tabId;

  // Toggle Tab Buttons Active State
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('bg-white', 'text-emerald-700', 'shadow-sm');
      btn.classList.remove('glass-pill');
    } else {
      btn.classList.remove('bg-white', 'text-emerald-700', 'shadow-sm');
      btn.classList.add('glass-pill');
    }
  });

  // Toggle Tab Panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    if (panel.id === `tab-${tabId}`) {
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
    }
  });

  // Update URL hash without jumping
  window.history.replaceState(null, '', `#${tabId}`);
}

// Hash Navigation
function handleHashNavigation() {
  const hash = window.location.hash.replace('#', '');
  const validTabs = ['about', 'books', 'articles', 'subjects', 'events', 'contact'];
  if (validTabs.includes(hash)) {
    switchTab(hash);
  } else {
    switchTab('about');
  }
}

// Search Listeners
function setupSearchListeners() {
  // Books Search
  const bSearch = document.getElementById('books-search');
  if (bSearch) {
    bSearch.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!siteData?.books) return;
      const filtered = siteData.books.filter(b => 
        b.title.toLowerCase().includes(q) || 
        (b.description && b.description.toLowerCase().includes(q))
      );
      renderBooks(filtered);
    });
  }

  // Articles Search
  const aSearch = document.getElementById('articles-search');
  if (aSearch) {
    aSearch.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!siteData?.articles) return;
      const filtered = siteData.articles.filter(a => 
        a.title.toLowerCase().includes(q) || 
        (a.content && a.content.toLowerCase().includes(q))
      );
      renderArticles(filtered);
    });
  }
}

// Contact Form Handler
function setupContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-contact');
    btn.disabled = true;
    btn.innerHTML = `<span>جاري الإرسال...</span>`;

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'تم إرسال رسالتك بنجاح!');
        form.reset();
      } else {
        showToast(json.error || 'تعذر إرسال الرسالة', 'error');
      }
    } catch (err) {
      showToast('حدث خطأ أثناء الإرسال', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<span>إرسال الرسالة</span><span>✉️</span>`;
    }
  });
}

// Modal Reader for Articles and Subjects
function openReaderModal(type, id) {
  if (!siteData) return;
  const item = (type === 'article') 
    ? siteData.articles.find(a => a.id === id)
    : siteData.subjects.find(s => s.id === id);

  if (!item) return;

  document.getElementById('modal-title').textContent = item.title;
  document.getElementById('modal-date').textContent = item.date || 'منشور في الصحف السعودية';
  
  const subEl = document.getElementById('modal-subtitle');
  if (item.subtitle) {
    subEl.textContent = item.subtitle;
    subEl.classList.remove('hidden');
  } else {
    subEl.classList.add('hidden');
  }

  const imgWrapper = document.getElementById('modal-image-wrapper');
  const imgEl = document.getElementById('modal-image');
  if (item.image) {
    imgEl.src = item.image;
    imgWrapper.classList.remove('hidden');
  } else {
    imgWrapper.classList.add('hidden');
  }

  document.getElementById('modal-content').textContent = item.content || '';

  const modal = document.getElementById('reader-modal');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeReaderModal() {
  const modal = document.getElementById('reader-modal');
  modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
}

// Simple Event Gallery Lightbox (Opens first image or all)
function openEventGallery(eventId) {
  if (!siteData?.events) return;
  const ev = siteData.events.find(e => e.id === eventId);
  if (!ev) return;

  if (ev.images && ev.images.length > 0) {
    window.open(ev.images[0], '_blank');
  } else {
    showToast('لا توجد صور متوفرة لهذا الألبوم حالياً', 'error');
  }
}
