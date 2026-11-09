// State & Cache
let siteData = null;
let currentTab = 'about';

// URL Helper for GitHub Pages & Localhost
function resolveAssetUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const clean = url.replace(/^\/+/, '');
  // If running in /admin or a subpath
  if (window.location.pathname.includes('/admin')) {
    return '../' + clean;
  }
  return clean;
}

// Check localStorage for any custom updates made in the browser (GitHub Pages preview)
function getLocalSiteData() {
  try {
    const raw = localStorage.getItem('albatati_local_db');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        settings: parsed.settings || {},
        profile: parsed.profile || {},
        cv: parsed.cv || {},
        books: parsed.books || [],
        articles: parsed.articles || [],
        subjects: parsed.subjects || [],
        events: parsed.events || []
      };
    }
  } catch (e) {}
  return null;
}

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

// 21 Dynamic Rotating Hero Images from original website (switches on every reload)
const HERO_ROTATING_IMAGES = [
  'extracted_data/rotating_hero_images/main.png',
  'extracted_data/rotating_hero_images/2.jpeg',
  'extracted_data/rotating_hero_images/3.jpg',
  'extracted_data/rotating_hero_images/4.jpg',
  'extracted_data/rotating_hero_images/5.jpg',
  'extracted_data/rotating_hero_images/6.jpg',
  'extracted_data/rotating_hero_images/7.jpg',
  'extracted_data/rotating_hero_images/8.jpg',
  'extracted_data/rotating_hero_images/9.jpg',
  'extracted_data/rotating_hero_images/10.jpg',
  'extracted_data/rotating_hero_images/11.jpg',
  'extracted_data/rotating_hero_images/12.jpg',
  'extracted_data/rotating_hero_images/13.jpg',
  'extracted_data/rotating_hero_images/14.jpg',
  'extracted_data/rotating_hero_images/15.jpg',
  'extracted_data/rotating_hero_images/16.jpg',
  'extracted_data/rotating_hero_images/17.jpg',
  'extracted_data/rotating_hero_images/18.jpg',
  'extracted_data/rotating_hero_images/19.jpg',
  'extracted_data/rotating_hero_images/20.jpg',
  'extracted_data/rotating_hero_images/21.jpg'
];

function rotateHeroPhoto() {
  const hp = document.getElementById('hero-photo');
  if (!hp) return;
  const rand = Math.floor(Math.random() * HERO_ROTATING_IMAGES.length);
  hp.src = resolveAssetUrl(HERO_ROTATING_IMAGES[rand]);
}

// Mobile Menu Handler
function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const dropdown = document.getElementById('mobile-nav-dropdown');
  if (!btn || !dropdown) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });
}

function closeMobileMenu() {
  const dropdown = document.getElementById('mobile-nav-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
}

// Fetch Public Website Data (Hybrid: Backend API with Static/LocalStorage Fallback)
async function fetchWebsiteData() {
  // 1. Try Backend API
  try {
    const res = await fetch('/api/public/data');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const localOverrides = getLocalSiteData();
        siteData = localOverrides || json.data;
        renderWebsite(siteData);
        return;
      }
    }
  } catch (err) {
    // Backend API not reachable (e.g. running on GitHub Pages static preview)
  }

  // 2. Fallback to static database.json
  try {
    const localOverrides = getLocalSiteData();
    if (localOverrides) {
      siteData = localOverrides;
      renderWebsite(siteData);
      return;
    }

    const res = await fetch('data/database.json');
    if (res.ok) {
      const db = await res.json();
      siteData = {
        settings: db.settings || {},
        profile: db.profile || {},
        cv: db.cv || {},
        books: db.books || [],
        articles: db.articles || [],
        subjects: db.subjects || [],
        events: db.events || []
      };
      renderWebsite(siteData);
      return;
    }
  } catch (err) {
    console.error('Static database load error:', err);
  }

  showToast('تعذر تحميل بيانات الموقع', 'error');
}

// Render All Components
function renderWebsite(data) {
  const { settings, profile, cv, books, articles, subjects, events } = data;

  // Document Title & Meta
  if (settings && settings.site_title) {
    document.title = settings.site_title;
  }

  // Header Elements (Keep concise so navbar stays strictly in one line)
  const headerNameEl = document.getElementById('header-name');
  if (headerNameEl) {
    headerNameEl.textContent = profile?.name?.honorific_ar || 'د. م. عبدالمجيد البطاطي';
  }
  const headerSubEl = document.getElementById('header-subtitle');
  if (headerSubEl) {
    headerSubEl.textContent = 'دكتوراه إدارة أعمال | استشاري ومحكم';
  }
  const heroTaglineEl = document.getElementById('hero-tagline');
  if (heroTaglineEl && settings && settings.hero_tagline) {
    heroTaglineEl.textContent = settings.hero_tagline;
  }

  // Hero Section
  if (profile && profile.name?.arabic) {
    const ht = document.getElementById('hero-title');
    if (ht) ht.textContent = profile.name.arabic;
  }
  if (settings && settings.hero_bio) {
    const hb = document.getElementById('hero-bio');
    if (hb) hb.textContent = settings.hero_bio;
  }
  // Randomly rotate hero photo from 21 downloaded images
  rotateHeroPhoto();

  // CV Download Button
  if (cv && cv.pdf_ar) {
    const btnCv = document.getElementById('btn-cv-download');
    if (btnCv) btnCv.href = resolveAssetUrl(cv.pdf_ar);
  }

  // Stats Counters
  const sBooks = document.getElementById('stat-books');
  const sArticles = document.getElementById('stat-articles');
  const sEvents = document.getElementById('stat-events');
  if (sBooks) sBooks.textContent = books ? books.length : 0;
  if (sArticles) sArticles.textContent = (articles?.length || 0) + (subjects?.length || 0);
  if (sEvents) sEvents.textContent = events ? `${events.length}+` : '0';

  // About Section Summary
  if (cv && cv.summary) {
    const as = document.getElementById('about-summary');
    if (as) as.textContent = cv.summary;
  }

  // Render Subcomponents
  renderQualifications(profile?.academic_qualifications || []);
  renderTitles(profile?.titles || []);
  renderBooks(books || []);
  renderArticles(articles || []);
  renderSubjects(subjects || []);
  renderEvents(events || []);
  renderContact(settings || {}, profile || {});
}

// Render Qualifications
function renderQualifications(list) {
  const container = document.getElementById('qualifications-list');
  if (!container) return;
  container.innerHTML = '';

  list.forEach(q => {
    const card = document.createElement('div');
    card.className = 'p-4 rounded-2xl bg-white/70 border border-slate-200/70 hover:bg-white transition space-y-1.5 shadow-xs';
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
    pill.className = 'p-3 rounded-xl bg-white/70 border border-slate-200/70 flex items-center gap-2.5 text-xs font-semibold text-slate-800 shadow-xs';
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
    container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-sm">لا توجد أبحاث أو كتب مطابقة لطلب البحث</div>`;
    return;
  }

  books.forEach(b => {
    const card = document.createElement('div');
    card.className = 'card-interactive p-5 rounded-2xl bg-white/80 border border-slate-200/80 flex flex-col justify-between space-y-4 shadow-sm';
    
    const coverSrc = resolveAssetUrl(b.cover_image || 'extracted_data/books/covers/01_one.jpg');
    const pdfSrc = resolveAssetUrl(b.pdf_file || '#');

    card.innerHTML = `
      <div class="space-y-3">
        <div class="h-48 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-2 border border-slate-100 shadow-inner">
          <img src="${coverSrc}" alt="${b.title}" class="max-h-full object-contain" onerror="this.src='${resolveAssetUrl('extracted_data/books/covers/01_one.jpg')}'">
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
    card.className = 'card-interactive rounded-2xl bg-white/80 border border-slate-200/80 overflow-hidden flex flex-col justify-between shadow-sm group';
    
    const imgSrc = resolveAssetUrl(a.image || '');
    const imgBanner = imgSrc ? `
      <div class="h-44 sm:h-48 overflow-hidden bg-slate-100 relative shadow-inner">
        <img src="${imgSrc}" alt="${a.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" onerror="this.parentElement.style.display='none'">
        <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        <span class="absolute bottom-2.5 right-2.5 text-[10px] font-bold text-white bg-black/40 backdrop-blur px-2.5 py-0.5 rounded-lg whitespace-nowrap">
          صحيفة البلاد
        </span>
      </div>
    ` : '';

    card.innerHTML = `
      ${imgBanner}
      <div class="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
        <div class="space-y-2.5">
          <div class="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>📅 ${a.date || ''}</span>
            <span class="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap">مقالة رأي</span>
          </div>
          <h4 class="text-base sm:text-lg font-bold text-slate-900 leading-snug break-words-safe group-hover:text-emerald-800 transition">${a.title}</h4>
          <p class="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed break-words-safe">${a.content || ''}</p>
        </div>

        <div class="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
          <button onclick="openReaderModal('article', ${a.id})" class="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group whitespace-nowrap">
            <span>قراءة المقال كاملاً</span>
            <span class="group-hover:-translate-x-1 transition duration-200">←</span>
          </button>
          <span class="text-[11px] text-slate-400 whitespace-nowrap">جريدة البلاد</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Render Subjects (مواضيع رأي)
function renderSubjects(subjects) {
  const container = document.getElementById('subjects-grid');
  if (!container) return;
  container.innerHTML = '';

  if (subjects.length === 0) {
    container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 text-sm">لا توجد مواضيع رأي مطابقة للبحث</div>`;
    return;
  }

  subjects.forEach(s => {
    const card = document.createElement('div');
    card.className = 'card-interactive rounded-2xl bg-white/80 border border-slate-200/80 overflow-hidden flex flex-col justify-between shadow-sm group';
    
    const imgSrc = resolveAssetUrl(s.image || '');
    const imgBanner = imgSrc ? `
      <div class="h-44 sm:h-48 overflow-hidden bg-slate-100 relative shadow-inner">
        <img src="${imgSrc}" alt="${s.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" onerror="this.parentElement.style.display='none'">
        <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        <span class="absolute bottom-2.5 right-2.5 text-[10px] font-bold text-white bg-emerald-900/60 backdrop-blur px-2.5 py-0.5 rounded-lg whitespace-nowrap">
          قضية مجتمعية
        </span>
      </div>
    ` : '';

    card.innerHTML = `
      ${imgBanner}
      <div class="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>📅 ${s.date || ''}</span>
            <span class="text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap">موضوع رأي</span>
          </div>
          <h4 class="text-base sm:text-lg font-bold text-slate-900 leading-snug break-words-safe group-hover:text-emerald-800 transition">${s.title}</h4>
          ${s.subtitle ? `<h5 class="text-xs font-semibold text-emerald-700 break-words-safe">${s.subtitle}</h5>` : ''}
          <p class="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed break-words-safe">${s.content || ''}</p>
        </div>

        <div class="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
          <button onclick="openReaderModal('subject', ${s.id})" class="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group whitespace-nowrap">
            <span>قراءة الموضوع كاملاً</span>
            <span class="group-hover:-translate-x-1 transition duration-200">←</span>
          </button>
        </div>
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
    card.className = 'card-interactive p-5 rounded-2xl bg-white/80 border border-slate-200/80 flex flex-col justify-between space-y-4 shadow-sm';
    
    const rawImg = (ev.images && ev.images.length > 0) ? ev.images[0] : 'extracted_data/brand_assets/home_1.JPG';
    const firstImg = resolveAssetUrl(rawImg);

    card.innerHTML = `
      <div class="space-y-3">
        <div class="h-44 rounded-xl overflow-hidden bg-slate-900 relative shadow-inner group">
          <img src="${firstImg}" alt="${ev.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" onerror="this.src='${resolveAssetUrl('extracted_data/brand_assets/home_1.JPG')}'">
          <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent"></div>
          <span class="absolute bottom-2.5 right-2.5 text-white text-xs font-bold bg-black/40 backdrop-blur px-2.5 py-1 rounded-lg">
            📷 ${ev.image_count || (ev.images ? ev.images.length : 1)} صور
          </span>
        </div>
        <div class="flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>${ev.date || ''}</span>
          <span class="text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-semibold">ميداني / إشراف هندسي</span>
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

  const pEl = document.getElementById('contact-phone');
  const plEl = document.getElementById('contact-phone-link');
  const eEl = document.getElementById('contact-email');
  const elEl = document.getElementById('contact-email-link');
  const aEl = document.getElementById('contact-address');

  if (pEl) pEl.textContent = phone;
  if (plEl) plEl.href = `tel:${phone}`;
  if (eEl) eEl.textContent = email;
  if (elEl) elEl.href = `mailto:${email}`;
  if (aEl) aEl.textContent = address;
}

// Tab Switching
function switchTab(tabId, shouldScroll = false) {
  currentTab = tabId;

  // Close mobile dropdown if open
  closeMobileMenu();

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

  // If invoked from mobile or requested, scroll smoothly to section
  if (shouldScroll) {
    const mainEl = document.getElementById('main-content');
    if (mainEl) {
      mainEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
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

// Contact Form Handler (Backend API + Client-side Fallback)
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

    // 1. Try Backend API
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          showToast(json.message || 'تم إرسال رسالتك بنجاح!');
          form.reset();
          btn.disabled = false;
          btn.innerHTML = `<span>إرسال الرسالة</span><span>✉️</span>`;
          return;
        }
      }
    } catch (err) {
      // Backend not running (e.g. GitHub Pages)
    }

    // 2. Client-side localStorage fallback for live static preview
    try {
      let localDB = JSON.parse(localStorage.getItem('albatati_local_db') || '{}');
      if (!localDB.messages) localDB.messages = [];
      localDB.messages.unshift({
        id: Date.now(),
        name: String(payload.name).trim(),
        email: String(payload.email || '').trim(),
        phone: String(payload.phone || '').trim(),
        subject: String(payload.subject || 'رسالة جديدة من الموقع').trim(),
        message: String(payload.message).trim(),
        date: new Date().toLocaleString('ar-SA'),
        read: false
      });
      localStorage.setItem('albatati_local_db', JSON.stringify(localDB));
      showToast('تم إرسال رسالتك بنجاح وحفظها في صندوق الرسائل!');
      form.reset();
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
    imgEl.src = resolveAssetUrl(item.image);
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

// Event Gallery Lightbox (Opens first image or all)
function openEventGallery(eventId) {
  if (!siteData?.events) return;
  const ev = siteData.events.find(e => e.id === eventId);
  if (!ev) return;

  if (ev.images && ev.images.length > 0) {
    window.open(resolveAssetUrl(ev.images[0]), '_blank');
  } else {
    showToast('لا توجد صور متوفرة لهذا الألبوم حالياً', 'error');
  }
}
