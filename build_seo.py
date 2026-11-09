#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate complete SEO & GEO optimized index.html with Schema.org JSON-LD and pre-rendered semantic HTML
"""

import json
import html

DB_PATH = '/home/omar/.gemini/antigravity/scratch/albatati-portfolio/data/database.json'

with open(DB_PATH, 'r', encoding='utf-8') as f:
    db = json.load(f)

profile = db.get('profile', {})
settings = db.get('settings', {})
cv = db.get('cv', {})
books = db.get('books', [])
articles = db.get('articles', [])
subjects = db.get('subjects', [])
events = db.get('events', [])

# Helper for clean escaping
def e(s):
    return html.escape(str(s or ''))

# Build Qualifications HTML
qual_html_items = []
for q in profile.get('academic_qualifications', []):
    year_badge = f'<span class="text-[11px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">{e(q.get("year"))}</span>' if q.get('year') else ''
    details_p = f'<p class="text-[11px] text-slate-500">{e(q.get("details"))}</p>' if q.get('details') else ''
    topic_p = f'<p class="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-1 mt-1"><strong>موضوع البحث:</strong> {e(q.get("topic"))}</p>' if q.get('topic') else ''
    qual_html_items.append(f'''
      <div class="p-4 rounded-2xl bg-white/70 border border-slate-200/70 hover:bg-white transition space-y-1.5 shadow-xs">
        <div class="flex items-center justify-between">
          <h5 class="text-sm font-bold text-slate-900">{e(q.get("degree"))}</h5>
          {year_badge}
        </div>
        <p class="text-xs text-slate-600 font-medium">{e(q.get("institution"))}</p>
        {details_p}
        {topic_p}
      </div>''')
qual_html = '\n'.join(qual_html_items)

# Build Titles HTML
titles_html_items = []
for t in profile.get('titles', []):
    titles_html_items.append(f'''
      <div class="p-3 rounded-xl bg-white/70 border border-slate-200/70 flex items-center gap-2.5 text-xs font-semibold text-slate-800 shadow-xs">
        <span class="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
        <span>{e(t)}</span>
      </div>''')
titles_html = '\n'.join(titles_html_items)

# Build Books HTML
books_html_items = []
for b in books:
    cover = b.get('cover_image') or 'extracted_data/books/covers/01_one.jpg'
    if cover.startswith('/'):
        cover = cover[1:]
    pdf = b.get('pdf_file') or '#'
    if pdf.startswith('/'):
        pdf = pdf[1:]
    books_html_items.append(f'''
      <div class="card-interactive p-5 rounded-2xl bg-white/80 border border-slate-200/80 flex flex-col justify-between space-y-4 shadow-sm" itemscope itemtype="https://schema.org/Book">
        <div class="space-y-3">
          <div class="h-48 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-2 border border-slate-100 shadow-inner">
            <img src="{e(cover)}" alt="{e(b.get('title'))}" itemprop="image" class="max-h-full object-contain" onerror="this.src='extracted_data/books/covers/01_one.jpg'">
          </div>
          <div class="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span itemprop="datePublished">{e(b.get('date'))}</span>
            <span class="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">بحث / كتاب</span>
          </div>
          <h4 class="font-bold text-sm sm:text-base text-slate-900 leading-snug" itemprop="name">{e(b.get('title'))}</h4>
          <p class="text-xs text-slate-600 line-clamp-3 leading-relaxed" itemprop="description">{e(b.get('description'))}</p>
        </div>
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <a href="{e(pdf)}" target="_blank" download class="w-full text-center py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 shadow-xs">
            <span>تحميل البحث (PDF)</span>
            <svg class="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
          </a>
        </div>
      </div>''')
books_html = '\n'.join(books_html_items)

# Build Articles HTML
articles_html_items = []
for a in articles:
    articles_html_items.append(f'''
      <article class="card-interactive p-6 rounded-2xl bg-white/80 border border-slate-200/80 flex flex-col justify-between space-y-4 shadow-sm" itemscope itemtype="https://schema.org/Article">
        <div class="space-y-3">
          <div class="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span itemprop="datePublished">📅 {e(a.get('date'))}</span>
            <span class="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold">مقالة رأي</span>
          </div>
          <h4 class="text-lg font-bold text-slate-900 leading-snug" itemprop="headline">{e(a.get('title'))}</h4>
          <p class="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed" itemprop="articleBody">{e(a.get('content'))}</p>
        </div>
        <div class="pt-3 border-t border-slate-100 flex justify-between items-center">
          <button onclick="openReaderModal('article', {a.get('id')})" class="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group">
            <span>قراءة المقال كاملاً</span>
            <span class="group-hover:-translate-x-1 transition duration-200">←</span>
          </button>
          <span class="text-[11px] text-slate-400">صحيفة البلاد السعودية</span>
        </div>
      </article>''')
articles_html = '\n'.join(articles_html_items)

# Build Subjects HTML
subjects_html_items = []
for s in subjects:
    subtitle_h5 = f'<h5 class="text-xs font-semibold text-emerald-700">{e(s.get("subtitle"))}</h5>' if s.get('subtitle') else ''
    subjects_html_items.append(f'''
      <div class="card-interactive p-6 rounded-2xl bg-white/80 border border-slate-200/80 flex flex-col justify-between space-y-4 shadow-sm">
        <div class="space-y-2.5">
          <div class="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>{e(s.get('date'))}</span>
            <span class="text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded text-[11px] font-semibold">قضية مجتمعية</span>
          </div>
          <h4 class="text-lg font-bold text-slate-900 leading-snug">{e(s.get('title'))}</h4>
          {subtitle_h5}
          <p class="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">{e(s.get('content'))}</p>
        </div>
        <div class="pt-3 border-t border-slate-100 flex justify-between items-center">
          <button onclick="openReaderModal('subject', {s.get('id')})" class="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group">
            <span>قراءة الموضوع كاملاً</span>
            <span class="group-hover:-translate-x-1 transition duration-200">←</span>
          </button>
        </div>
      </div>''')
subjects_html = '\n'.join(subjects_html_items)

# Build Events HTML
events_html_items = []
for ev in events:
    images = ev.get('images', [])
    raw_img = images[0] if images else 'extracted_data/brand_assets/home_1.JPG'
    if raw_img.startswith('/'):
        raw_img = raw_img[1:]
    img_cnt = ev.get('image_count') or (len(images) if images else 1)
    events_html_items.append(f'''
      <div class="card-interactive p-5 rounded-2xl bg-white/80 border border-slate-200/80 flex flex-col justify-between space-y-4 shadow-sm">
        <div class="space-y-3">
          <div class="h-44 rounded-xl overflow-hidden bg-slate-900 relative shadow-inner group">
            <img src="{e(raw_img)}" alt="{e(ev.get('title'))}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" onerror="this.src='extracted_data/brand_assets/home_1.JPG'">
            <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent"></div>
            <span class="absolute bottom-2.5 right-2.5 text-white text-xs font-bold bg-black/40 backdrop-blur px-2.5 py-1 rounded-lg">
              📷 {img_cnt} صور
            </span>
          </div>
          <div class="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>{e(ev.get('date'))}</span>
            <span class="text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-semibold">ميداني / إشراف هندسي</span>
          </div>
          <h4 class="font-bold text-sm sm:text-base text-slate-900 leading-snug">{e(ev.get('title'))}</h4>
          <p class="text-xs text-slate-600 line-clamp-3 leading-relaxed">{e(ev.get('content') or 'مشروع وطني ضمن مشاريع أمانة محافظة جدة ووزارة الشؤون البلدية والقروية.')}</p>
        </div>
        <div class="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
          <button onclick="openEventGallery({ev.get('id')})" class="text-emerald-700 font-bold hover:underline flex items-center gap-1">
            <span>استعراض الألبوم المصور</span>
            <span>📸</span>
          </button>
        </div>
      </div>''')
events_html = '\n'.join(events_html_items)

# Generate Full HTML
html_content = f'''<!DOCTYPE html>
<html lang="ar" dir="rtl" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- ============================================== -->
  <!-- 1. PRIMARY SEO META TAGS                       -->
  <!-- ============================================== -->
  <title>د. م. عبدالمجيد البطاطي | مهندس استشاري ومحكم معتمد | جدة، السعودية</title>
  <meta name="title" content="د. م. عبدالمجيد البطاطي | مهندس استشاري ومحكم معتمد | جدة، السعودية">
  <meta name="description" content="الموقع الرسمي للمهندس الاستشاري د. م. عبدالمجيد بن سعيد البطاطي (ترخيص هيئة المهندسين #201226 ومحكم معتمد بوزارة العدل). استشارات هندسية، حوكمة الشركات العائلية، دراسات السيول والبنية التحتية، مؤلفات وأبحاث علمية بجدة والمملكة.">
  <meta name="keywords" content="عبدالمجيد البطاطي, دكتور عبدالمجيد البطاطي, مهندس عبدالمجيد البطاطي, عبدالمجيد بن سعيد بن طالب البطاطي, مهندس استشاري جدة, الهيئة السعودية للمهندسين 201226, محكم معتمد وزارة العدل, حوكمة الشركات العائلية, استشارات هندسية جدة, دراسات السيول جدة, إدارة المشاريع السعودية, جمعية التعاون للمشاريع البيئية, Dr. Abdulmajeed Albatati, Eng. Abdulmajeed Albatati, Consultant Engineer Saudi Arabia, Jeddah Arbitrator">
  <meta name="author" content="د. م. عبدالمجيد بن سعيد البطاطي">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <meta name="bingbot" content="index, follow">
  <link rel="canonical" href="https://asa7by47.github.io/albatati-portfolio-preview/">

  <!-- ============================================== -->
  <!-- 2. GEOTARGETING & LOCAL SEO (GEO)              -->
  <!-- ============================================== -->
  <meta name="geo.region" content="SA-02">
  <meta name="geo.placename" content="Jeddah, Makkah Province, Saudi Arabia">
  <meta name="geo.position" content="21.543333;39.172778">
  <meta name="ICBM" content="21.543333, 39.172778">
  <meta name="country" content="Saudi Arabia">
  <meta name="city" content="Jeddah">

  <!-- ============================================== -->
  <!-- 3. OPEN GRAPH / FACEBOOK / LINKEDIN / WHATSAPP -->
  <!-- ============================================== -->
  <meta property="og:type" content="profile">
  <meta property="og:url" content="https://asa7by47.github.io/albatati-portfolio-preview/">
  <meta property="og:title" content="د. م. عبدالمجيد البطاطي | مهندس استشاري ومحكم معتمد">
  <meta property="og:description" content="الموقع الرسمي للمهندس الاستشاري د. م. عبدالمجيد بن سعيد البطاطي. مؤلفات وأبحاث، مقالات رأي، وسجل المشاريع الهندسية وحوكمة الشركات بجدة.">
  <meta property="og:image" content="https://asa7by47.github.io/albatati-portfolio-preview/extracted_data/brand_assets/home_1.JPG">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="د. م. عبدالمجيد بن سعيد البطاطي">
  <meta property="og:site_name" content="منصة د. م. عبدالمجيد البطاطي">
  <meta property="og:locale" content="ar_SA">
  <meta property="og:locale:alternate" content="en_US">
  <meta property="profile:first_name" content="عبدالمجيد">
  <meta property="profile:last_name" content="البطاطي">

  <!-- ============================================== -->
  <!-- 4. TWITTER CARDS                               -->
  <!-- ============================================== -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="https://asa7by47.github.io/albatati-portfolio-preview/">
  <meta name="twitter:title" content="د. م. عبدالمجيد البطاطي | مهندس استشاري ومحكم معتمد">
  <meta name="twitter:description" content="الموقع الرسمي للدكتور المهندس عبدالمجيد بن سعيد البطاطي - استشارات هندسية، مؤلفات وأبحاث، وحوكمة شركات بجدة.">
  <meta name="twitter:image" content="https://asa7by47.github.io/albatati-portfolio-preview/extracted_data/brand_assets/home_1.JPG">

  <!-- ============================================== -->
  <!-- 5. SCHEMA.ORG JSON-LD (GOOGLE KNOWLEDGE GRAPH) -->
  <!-- ============================================== -->
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@graph": [
      {{
        "@type": "Person",
        "@id": "https://asa7by47.github.io/albatati-portfolio-preview/#person",
        "name": "د. م. عبدالمجيد بن سعيد بن طالب البطاطي",
        "alternateName": [
          "عبدالمجيد البطاطي",
          "د. عبدالمجيد البطاطي",
          "المهندس عبدالمجيد البطاطي",
          "Dr. Eng. Abdulmajeed Saeed Albatati",
          "Abdulmajeed Albatati"
        ],
        "jobTitle": "مهندس استشاري ومحكم معتمد وخبير تطوير مؤسسي",
        "description": "مهندس استشاري معتمد من الهيئة السعودية للمهندسين برقم 201226، ومحكم معتمد من وزارة العدل، حاصل على ماجستير إدارة الأعمال (MBA) من جامعة ويلز البريطانية، وباحث دكتوراه في الأداء المؤسسي والحوكمة.",
        "url": "https://asa7by47.github.io/albatati-portfolio-preview/",
        "image": "https://asa7by47.github.io/albatati-portfolio-preview/extracted_data/brand_assets/home_1.JPG",
        "telephone": "+966505626375",
        "email": "info@asalbatati.net",
        "address": {{
          "@type": "PostalAddress",
          "addressLocality": "جدة (Jeddah)",
          "addressRegion": "منطقة مكة المكرمة",
          "addressCountry": "SA"
        }},
        "hasCredential": [
          {{
            "@type": "EducationalOccupationalCredential",
            "name": "شهادة مهندس استشاري معتمد",
            "credentialCategory": "Professional License",
            "recognizedBy": {{
              "@type": "Organization",
              "name": "الهيئة السعودية للمهندسين (Saudi Council of Engineers)"
            }}
          }},
          {{
            "@type": "EducationalOccupationalCredential",
            "name": "محكم معتمد",
            "credentialCategory": "Certified Arbitrator",
            "recognizedBy": {{
              "@type": "GovernmentOrganization",
              "name": "وزارة العدل بالمملكة العربية السعودية"
            }}
          }}
        ],
        "alumnusOf": [
          {{
            "@type": "EducationalOrganization",
            "name": "جامعة الرياض (جامعة الملك سعود)"
          }},
          {{
            "@type": "EducationalOrganization",
            "name": "University of Wales, UK"
          }},
          {{
            "@type": "EducationalOrganization",
            "name": "Institute of Business Administration, Delaware USA"
          }}
        ],
        "memberOf": [
          {{
            "@type": "Organization",
            "name": "جمعية التعاون للمشاريع البيئية",
            "roleName": "عضو مجلس إدارة"
          }},
          {{
            "@type": "Organization",
            "name": "الهيئة السعودية للمهندسين",
            "roleName": "مهندس استشاري (عضوية 201226)"
          }}
        ],
        "knowsAbout": [
          "الهندسة الميكانيكية",
          "إدارة وتخطيط المشاريع الهندسية",
          "حوكمة الشركات العائلية",
          "التحكيم التجاري والهندسي",
          "هندسة البنية التحتية وحماية المدن من أخطار السيول",
          "التطوير الإداري والتنظيمي"
        ]
      }},
      {{
        "@type": "ProfessionalService",
        "@id": "https://asa7by47.github.io/albatati-portfolio-preview/#service",
        "name": "مكتب الاستشارات الهندسية والإدارية - د. م. عبدالمجيد البطاطي",
        "url": "https://asa7by47.github.io/albatati-portfolio-preview/",
        "logo": "https://asa7by47.github.io/albatati-portfolio-preview/extracted_data/brand_assets/home_1.JPG",
        "image": "https://asa7by47.github.io/albatati-portfolio-preview/extracted_data/brand_assets/home_1.JPG",
        "telephone": "+966505626375",
        "email": "info@asalbatati.net",
        "priceRange": "$$$",
        "address": {{
          "@type": "PostalAddress",
          "streetAddress": "طريق المدينة المنورة",
          "addressLocality": "جدة",
          "addressRegion": "منطقة مكة المكرمة",
          "postalCode": "21411",
          "addressCountry": "SA"
        }},
        "geo": {{
          "@type": "GeoCoordinates",
          "latitude": 21.543333,
          "longitude": 39.172778
        }},
        "areaServed": [
          {{
            "@type": "City",
            "name": "جدة"
          }},
          {{
            "@type": "City",
            "name": "مكة المكرمة"
          }},
          {{
            "@type": "Country",
            "name": "المملكة العربية السعودية"
          }}
        ]
      }},
      {{
        "@type": "WebSite",
        "@id": "https://asa7by47.github.io/albatati-portfolio-preview/#website",
        "url": "https://asa7by47.github.io/albatati-portfolio-preview/",
        "name": "د. م. عبدالمجيد البطاطي | المنصة الرسمية",
        "description": "الموقع الرسمي للمهندس الاستشاري د. م. عبدالمجيد بن سعيد البطاطي",
        "inLanguage": "ar-SA"
      }}
    ]
  }}
  </script>

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Google Fonts: Readex Pro & Plus Jakarta Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Readex+Pro:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  
  <link rel="stylesheet" href="css/styles.css">

  <script>
    tailwind.config = {{
      theme: {{
        extend: {{
          fontFamily: {{
            sans: ['Readex Pro', 'sans-serif'],
          }},
          colors: {{
            brand: {{
              50: '#ecfdf5',
              100: '#d1fae5',
              500: '#10b981',
              600: '#059669',
              700: '#047857',
              800: '#065f46',
              900: '#064e3b',
            }}
          }}
        }}
      }}
    }}
  </script>
</head>
<body class="text-slate-800 antialiased p-3 sm:p-6 lg:p-8 selection:bg-emerald-500 selection:text-white">

  <!-- Toast Notification Container -->
  <div id="toast-container" class="toast-container"></div>

  <div class="max-w-6xl mx-auto space-y-6 sm:space-y-8">
    
    <!-- Floating Glass Header -->
    <header class="glass-card rounded-2xl p-4 sm:px-8 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 sticky top-4 z-40">
      
      <!-- Logo / Monogram -->
      <div class="flex items-center justify-between w-full md:w-auto">
        <a href="#hero" class="flex items-center gap-3.5 group">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white flex items-center justify-center font-bold text-xl shadow-md group-hover:scale-105 transition">
            ع
          </div>
          <div>
            <div id="header-name" class="text-base sm:text-lg font-bold text-slate-900 leading-tight">د. م. عبدالمجيد البطاطي</div>
            <p id="header-subtitle" class="text-xs text-emerald-800 font-medium">مستشار هندسي وإداري | محكم معتمد</p>
          </div>
        </a>

        <!-- Mobile Menu Toggle Button -->
        <button id="mobile-menu-btn" class="md:hidden p-2 rounded-xl glass-pill text-slate-700 hover:bg-white transition" aria-label="القائمة">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
        </button>
      </div>

      <!-- Navigation Tabs (Pills) -->
      <nav id="nav-menu" class="hidden md:flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-700 w-full md:w-auto justify-center" aria-label="أقسام المنصة">
        <button onclick="switchTab('about')" class="tab-btn px-3.5 py-2 rounded-full glass-pill hover:bg-white transition" data-tab="about">نبذة ومؤهلات</button>
        <button onclick="switchTab('books')" class="tab-btn px-3.5 py-2 rounded-full glass-pill hover:bg-white transition" data-tab="books">المؤلفات والأبحاث</button>
        <button onclick="switchTab('articles')" class="tab-btn px-3.5 py-2 rounded-full glass-pill hover:bg-white transition" data-tab="articles">المقالات</button>
        <button onclick="switchTab('subjects')" class="tab-btn px-3.5 py-2 rounded-full glass-pill hover:bg-white transition" data-tab="subjects">مواضيع رأي</button>
        <button onclick="switchTab('events')" class="tab-btn px-3.5 py-2 rounded-full glass-pill hover:bg-white transition" data-tab="events">المشاريع والألبومات</button>
        <button onclick="switchTab('contact')" class="tab-btn px-3.5 py-2 rounded-full glass-pill hover:bg-white transition" data-tab="contact">تواصل واستشارات</button>
        <a href="admin/" class="md:hidden tab-btn px-3.5 py-2 rounded-full glass-pill hover:bg-white text-emerald-800 font-bold transition">⚙️ لوحة التحكم</a>
      </nav>

      <!-- Action Pill / Direct CV Link & Admin Link -->
      <div class="hidden md:flex items-center gap-2">
        <a id="btn-cv-download" href="extracted_data/cv/Abdulmajeed_Albatati_CV_Arabic.pdf" target="_blank" class="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition active:scale-95 flex items-center gap-1.5">
          <span>السيرة الذاتية PDF</span>
          <svg class="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
        </a>
        <a href="admin/" class="px-3.5 py-2 rounded-full glass-pill hover:bg-white text-slate-700 hover:text-emerald-700 text-xs font-semibold shadow-xs transition flex items-center gap-1.5" title="لوحة التحكم الإدارية">
          <span>⚙️</span>
          <span>الإدارة</span>
        </a>
      </div>

    </header>

    <!-- Hero Card (Sample 4 Signature Glassmorphic Hero) -->
    <section id="hero" class="glass-card rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm relative overflow-hidden" itemscope itemtype="https://schema.org/Person">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        <div class="md:col-span-8 space-y-5 text-center md:text-right">
          <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span id="hero-tagline">{e(settings.get('hero_tagline'))}</span>
          </div>

          <!-- Primary H1 for Google Search SEO -->
          <h1 id="hero-title" itemprop="name" class="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {e(profile.get('name', {}).get('arabic', 'د. م. عبدالمجيد بن سعيد البطاطي'))}
          </h1>

          <p id="hero-bio" itemprop="description" class="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
            {e(settings.get('hero_bio'))}
          </p>

          <!-- Credential Badges -->
          <div id="hero-badges" class="flex flex-wrap gap-2.5 justify-center md:justify-start pt-1">
            <span class="px-3.5 py-1.5 rounded-xl bg-white/80 border border-slate-200/80 text-xs text-slate-700 font-medium shadow-xs">🎓 باحث دكتوراه في إدارة الأعمال</span>
            <span class="px-3.5 py-1.5 rounded-xl bg-white/80 border border-slate-200/80 text-xs text-slate-700 font-medium shadow-xs">⚖️ محكم معتمد من وزارة العدل</span>
            <span class="px-3.5 py-1.5 rounded-xl bg-white/80 border border-slate-200/80 text-xs text-slate-700 font-medium shadow-xs">🏗️ مهندس استشاري معتمد (201226)</span>
          </div>

          <!-- Quick Stat Counters -->
          <div class="grid grid-cols-4 gap-3 pt-4 border-t border-slate-200/60 max-w-lg mx-auto md:mx-0">
            <div>
              <div id="stat-books" class="text-2xl sm:text-3xl font-black text-emerald-700">{len(books)}</div>
              <div class="text-[11px] text-slate-500">مؤلفاً وبحثاً</div>
            </div>
            <div>
              <div id="stat-articles" class="text-2xl sm:text-3xl font-black text-emerald-700">{len(articles) + len(subjects)}</div>
              <div class="text-[11px] text-slate-500">مقالة ودراسة</div>
            </div>
            <div>
              <div id="stat-events" class="text-2xl sm:text-3xl font-black text-emerald-700">{len(events)}+</div>
              <div class="text-[11px] text-slate-500">مشروعاً وسداً</div>
            </div>
            <div>
              <div class="text-2xl sm:text-3xl font-black text-emerald-700">+40</div>
              <div class="text-[11px] text-slate-500">عاماً خبرة</div>
            </div>
          </div>
        </div>

        <!-- Portrait Image Card -->
        <div class="md:col-span-4 flex justify-center">
          <div class="relative group">
            <div class="w-52 h-52 sm:w-60 sm:h-60 rounded-3xl p-2 bg-gradient-to-tr from-emerald-400 via-teal-300 to-amber-300 shadow-xl rotate-1 group-hover:rotate-0 transition duration-300">
              <img id="hero-photo" itemprop="image" src="extracted_data/brand_assets/home_1.JPG" alt="د. عبدالمجيد البطاطي - مهندس استشاري جدة" class="w-full h-full object-cover object-top rounded-2xl shadow-inner">
            </div>
            <div class="absolute -bottom-3 inset-x-4 bg-white/95 backdrop-blur rounded-xl py-1 px-3 text-center border border-slate-100 shadow-sm text-[11px] font-bold text-slate-700">
              جدة • منطقة مكة المكرمة • المملكة العربية السعودية
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Dynamic Main Content Container -->
    <main id="main-content" class="space-y-6">

      <!-- ============================================== -->
      <!-- TAB 1: ABOUT & QUALIFICATIONS                  -->
      <!-- ============================================== -->
      <section id="tab-about" class="tab-panel glass-card rounded-3xl p-6 sm:p-10 shadow-sm space-y-8" aria-labelledby="heading-about">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-emerald-700">المسيرة المهنية والعلمية</span>
          <h2 id="heading-about" class="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">المؤهلات الأكاديمية والخبرات الاستشارية</h2>
        </div>

        <!-- Summary paragraph -->
        <div class="p-5 rounded-2xl bg-white/80 border border-slate-200/80 leading-relaxed text-sm sm:text-base text-slate-700 shadow-xs">
          <p id="about-summary">
            {e(cv.get('summary'))}
          </p>
        </div>

        <!-- Qualifications Grid (Pre-rendered for Googlebot & Hydrated dynamically) -->
        <div class="space-y-4">
          <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>📜</span>
            <span>الشهادات والمؤهلات العلمية:</span>
          </h3>
          <div id="qualifications-list" class="grid grid-cols-1 md:grid-cols-2 gap-4">
{qual_html}
          </div>
        </div>

        <!-- Memberships & Committees -->
        <div class="space-y-4 pt-4 border-t border-slate-200/60">
          <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>🏛️</span>
            <span>المناصب وعضويات مجالس الإدارة:</span>
          </h3>
          <div id="titles-list" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
{titles_html}
          </div>
        </div>
      </section>

      <!-- ============================================== -->
      <!-- TAB 2: BOOKS & RESEARCH PAPERS                 -->
      <!-- ============================================== -->
      <section id="tab-books" class="tab-panel glass-card rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 hidden" aria-labelledby="heading-books">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-700">الإنتاج المعرفي والمحكّم</span>
            <h2 id="heading-books" class="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">الكتب والأبحاث العلمية</h2>
          </div>
          <!-- Search Input -->
          <div class="relative w-full sm:w-64">
            <input type="text" id="books-search" placeholder="بحث في الأبحاث والكتب..." class="w-full px-4 py-2 rounded-xl glass-pill text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-white">
          </div>
        </div>

        <p class="text-xs sm:text-sm text-slate-500">
          تشمل دراسات متخصصة في حوكمة الشركات العائلية، السلوك المؤسسي، التوطين، وربط استراتيجية المنظمة بثقافة العمل، متاحة للتحميل المباشر بصيغة PDF.
        </p>

        <!-- Books Grid (Pre-rendered for Googlebot & Hydrated dynamically) -->
        <div id="books-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
{books_html}
        </div>
      </section>

      <!-- ============================================== -->
      <!-- TAB 3: ARTICLES                                -->
      <!-- ============================================== -->
      <section id="tab-articles" class="tab-panel glass-card rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 hidden" aria-labelledby="heading-articles">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-700">طروحات فكرية وتنموية</span>
            <h2 id="heading-articles" class="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">المقالات والدراسات المنشورة</h2>
          </div>
          <div class="relative w-full sm:w-64">
            <input type="text" id="articles-search" placeholder="بحث في المقالات..." class="w-full px-4 py-2 rounded-xl glass-pill text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-white">
          </div>
        </div>

        <p class="text-xs sm:text-sm text-slate-500">
          مقالات ودراسات رأي نشرت في الصحف الرسمية بالمملكة (مثل جريدة البلاد) تناقش التعليم، القوة الشرائية، والمنفعة العامة.
        </p>

        <!-- Articles Grid (Pre-rendered for Googlebot & Hydrated dynamically) -->
        <div id="articles-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6">
{articles_html}
        </div>
      </section>

      <!-- ============================================== -->
      <!-- TAB 4: SUBJECTS                                -->
      <!-- ============================================== -->
      <section id="tab-subjects" class="tab-panel glass-card rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 hidden" aria-labelledby="heading-subjects">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-emerald-700">قضايا مجتمعية ورأي عام</span>
          <h2 id="heading-subjects" class="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">رؤى ومواضيع في الشأن العام</h2>
        </div>

        <p class="text-xs sm:text-sm text-slate-500">
          قضايا ونقاشات تركز على حماية المستهلك، جودة الخدمات، وحقوق العمالة بما يعزز جودة الحياة والمسؤولية المجتمعية.
        </p>

        <!-- Subjects Grid (Pre-rendered for Googlebot & Hydrated dynamically) -->
        <div id="subjects-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6">
{subjects_html}
        </div>
      </section>

      <!-- ============================================== -->
      <!-- TAB 5: EVENTS & GALLERIES                      -->
      <!-- ============================================== -->
      <section id="tab-events" class="tab-panel glass-card rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 hidden" aria-labelledby="heading-events">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-emerald-700">مشاريع وطنية وميدانية</span>
          <h2 id="heading-events" class="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">ألبومات المشاريع الميدانية وحماية السيول</h2>
        </div>

        <p class="text-xs sm:text-sm text-slate-500">
          توثيق ميداني مصور لأعمال حماية محافظة جدة من أخطار السيول وتطوير السدود وقنوات التصريف بالتنسيق مع أمانة محافظة جدة ووزارة الشؤون البلدية والقروية.
        </p>

        <!-- Events Grid (Pre-rendered for Googlebot & Hydrated dynamically) -->
        <div id="events-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
{events_html}
        </div>
      </section>

      <!-- ============================================== -->
      <!-- TAB 6: CONTACT & CONSULTATION                  -->
      <!-- ============================================== -->
      <section id="tab-contact" class="tab-panel glass-card rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 hidden" aria-labelledby="heading-contact">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-emerald-700">قنوات التواصل المباشر</span>
          <h2 id="heading-contact" class="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">طلب استشارة أو جلسة تحكيم</h2>
          <p class="text-xs sm:text-sm text-slate-500 mt-1">
            نسعد بتواصلكم لطلب استشارات الحوكمة المؤسسية، التحكيم الهندسي والتجاري، ودراسات المشاريع الكبرى.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          <!-- Contact Info Cards -->
          <div class="md:col-span-5 space-y-4">
            
            <a id="contact-phone-link" href="tel:{e(settings.get('phone', '0505626375'))}" class="card-interactive p-4 rounded-2xl bg-white/70 border border-slate-200/70 flex items-center gap-3.5 block shadow-xs">
              <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg font-bold">📞</div>
              <div>
                <span class="text-[11px] text-slate-400 font-medium">الهاتف المباشر</span>
                <h5 id="contact-phone" class="text-sm font-bold text-slate-900 font-mono" dir="ltr">{e(settings.get('phone', '0505626375'))}</h5>
              </div>
            </a>

            <a id="contact-email-link" href="mailto:{e(settings.get('contact_email', 'info@asalbatati.net'))}" class="card-interactive p-4 rounded-2xl bg-white/70 border border-slate-200/70 flex items-center gap-3.5 block shadow-xs">
              <div class="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-lg font-bold">✉️</div>
              <div>
                <span class="text-[11px] text-slate-400 font-medium">البريد الإلكتروني</span>
                <h5 id="contact-email" class="text-sm font-bold text-slate-900 font-mono">{e(settings.get('contact_email', 'info@asalbatati.net'))}</h5>
              </div>
            </a>

            <div class="p-4 rounded-2xl bg-white/70 border border-slate-200/70 flex items-center gap-3.5 shadow-xs">
              <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg font-bold">📍</div>
              <div>
                <span class="text-[11px] text-slate-400 font-medium">المقر والمكتب الاستشاري</span>
                <h5 id="contact-address" class="text-xs font-bold text-slate-800 leading-snug">{e(settings.get('address', 'المملكة العربية السعودية - منطقة مكة المكرمة - جدة'))}</h5>
              </div>
            </div>

            <!-- Certified SCE Badge -->
            <div class="p-4 rounded-2xl bg-gradient-to-tr from-emerald-50 to-teal-50 border border-emerald-200/70 space-y-1.5 shadow-xs">
              <span class="text-[10px] uppercase font-bold text-emerald-800">الاعتماد الرسمي</span>
              <p class="text-xs font-bold text-emerald-950">الهيئة السعودية للمهندسين - ترخيص استشاري #201226</p>
              <p class="text-[11px] text-emerald-800">محكم معتمد مسجل لدى وزارة العدل بالمملكة العربية السعودية</p>
            </div>

          </div>

          <!-- Contact Submission Form -->
          <div class="md:col-span-7">
            <form id="contact-form" class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">الاسم الكريم *</label>
                  <input type="text" name="name" required placeholder="الاسم الكامل" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-white">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">رقم الهاتف *</label>
                  <input type="tel" name="phone" required placeholder="05xxxxxxxx" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-white" dir="ltr">
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">البريد الإلكتروني</label>
                  <input type="email" name="email" placeholder="name@domain.com" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-white" dir="ltr">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">نوع الاستشارة</label>
                  <select name="subject" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-white">
                    <option value="استشارة حوكمة شركات عائلية">استشارة حوكمة شركات عائلية</option>
                    <option value="استشارة هندسية وبنية تحتية">استشارة هندسية وبنية تحتية</option>
                    <option value="طلب تحكيم تجاري وهندسي">طلب تحكيم تجاري وهندسي</option>
                    <option value="استشارة إدارية وتطوير استراتيجي">استشارة إدارية وتطوير استراتيجي</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">تفاصيل الرسالة أو الاستشارة *</label>
                <textarea name="message" rows="4" required placeholder="اكتب استفسارك أو تفاصيل المشروع هنا..." class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-white leading-relaxed"></textarea>
              </div>

              <button type="submit" id="btn-submit-contact" class="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2">
                <span>إرسال الرسالة</span>
                <span>✉️</span>
              </button>
            </form>
          </div>

        </div>
      </section>

    </main>

    <!-- Footer -->
    <footer class="pt-8 pb-12 border-t border-slate-200/60 text-center text-xs text-slate-500 space-y-3">
      <div class="flex flex-wrap justify-center items-center gap-4 text-xs font-semibold text-slate-600">
        <button onclick="switchTab('about')" class="hover:text-emerald-700">نبذة ومؤهلات</button>
        <span>•</span>
        <button onclick="switchTab('books')" class="hover:text-emerald-700">الأبحاث والكتب</button>
        <span>•</span>
        <button onclick="switchTab('articles')" class="hover:text-emerald-700">المقالات</button>
        <span>•</span>
        <button onclick="switchTab('subjects')" class="hover:text-emerald-700">قضايا رأي</button>
        <span>•</span>
        <button onclick="switchTab('events')" class="hover:text-emerald-700">المشاريع الميدانية</button>
        <span>•</span>
        <button onclick="switchTab('contact')" class="hover:text-emerald-700">تواصل</button>
        <span>•</span>
        <a href="admin/" class="text-emerald-700 hover:underline">لوحة التحكم (Admin)</a>
      </div>
      <p class="leading-relaxed">
        جميع الحقوق محفوظة © 2026 د. م. عبدالمجيد بن سعيد بن طالب البطاطي. مهندس استشاري معتمد (ترخيص 201226) • محكم معتمد • جدة، المملكة العربية السعودية.
      </p>
    </footer>

  </div>

  <!-- Reader Modal for Articles and Subjects -->
  <div id="reader-modal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 hidden">
    <div class="glass-card bg-white/95 max-w-2xl w-full max-h-[85vh] rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto space-y-5 border border-white">
      
      <div class="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span id="modal-date" class="text-xs text-slate-400 font-mono"></span>
          <h3 id="modal-title" class="text-xl sm:text-2xl font-bold text-slate-900 mt-1"></h3>
          <h4 id="modal-subtitle" class="text-xs font-semibold text-emerald-700 mt-1 hidden"></h4>
        </div>
        <button onclick="closeReaderModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm transition">
          ✕
        </button>
      </div>

      <div id="modal-image-wrapper" class="h-56 rounded-2xl overflow-hidden bg-slate-100 hidden shadow-inner">
        <img id="modal-image" src="" alt="" class="w-full h-full object-cover">
      </div>

      <div id="modal-content" class="text-xs sm:text-sm text-slate-700 leading-loose whitespace-pre-line font-normal">
      </div>

      <div class="pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
        <span>بقلم: د. م. عبدالمجيد البطاطي</span>
        <button onclick="closeReaderModal()" class="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition">
          إغلاق النافذة
        </button>
      </div>

    </div>
  </div>

  <!-- Front-end Logic -->
  <script src="js/app.js"></script>

</body>
</html>
'''

# Write to both locations
with open('/home/omar/.gemini/antigravity/scratch/albatati-portfolio/public/index.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

with open('/home/omar/.gemini/antigravity/scratch/albatati-portfolio/index.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("Successfully generated SEO & GEO optimized index.html with pre-rendered content!")
