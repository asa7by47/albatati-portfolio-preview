import os
import re
import json
import shutil
import subprocess
import urllib.parse

BASE_DIR = '/home/omar/.gemini/antigravity/scratch/albatati-portfolio/www.asalbatati.net'
OUTPUT_DIR = '/home/omar/.gemini/antigravity/scratch/albatati-portfolio/extracted_data'

os.makedirs(OUTPUT_DIR, exist_ok=True)

def clean_html_text(raw_html):
    if not raw_html:
        return ""
    # remove scripts and styles
    clean = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', raw_html, flags=re.DOTALL|re.IGNORECASE)
    # convert breaks and paragraph closes to newlines
    clean = re.sub(r'<(br|p|/p|h\d|/h\d|div|/div|li|/li)[^>]*>', '\n', clean, flags=re.IGNORECASE)
    clean = re.sub(r'<[^>]+>', '', clean)
    clean = clean.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&quot;', '"').replace('&#32;', ' ')
    lines = [l.strip() for l in clean.split('\n') if l.strip()]
    return '\n\n'.join(lines)

def get_tag_inner(html, tag, class_pattern=None):
    if class_pattern:
        pattern = rf'<{tag}[^>]*class=[\'"][^\'"]*{class_pattern}[^\'"]*[\'"][^>]*>(.*?)</{tag}>'
    else:
        pattern = rf'<{tag}[^>]*>(.*?)</{tag}>'
    m = re.search(pattern, html, flags=re.DOTALL|re.IGNORECASE)
    return m.group(1).strip() if m else ""

# ----------------------------------------------------
# 1. EXTRACT CV
# ----------------------------------------------------
print("Extracting CV...")
cv_dir = os.path.join(OUTPUT_DIR, 'cv')
os.makedirs(cv_dir, exist_ok=True)
cv_img_dir = os.path.join(cv_dir, 'scans')
os.makedirs(cv_img_dir, exist_ok=True)

# Copy CV PDFs
ar_cv_src = os.path.join(BASE_DIR, 'images/cv/abdelmged elbtaty arabic.pdf')
en_cv_src = os.path.join(BASE_DIR, 'images/cv/abdelmged elbtaty English.pdf')

ar_cv_dst = os.path.join(cv_dir, 'Abdulmajeed_Albatati_CV_Arabic.pdf')
en_cv_dst = os.path.join(cv_dir, 'Abdulmajeed_Albatati_CV_English.pdf')

if os.path.exists(ar_cv_src):
    shutil.copy2(ar_cv_src, ar_cv_dst)
if os.path.exists(en_cv_src):
    shutil.copy2(en_cv_src, en_cv_dst)

# Extract text with pdftotext
ar_cv_txt = subprocess.check_output(['pdftotext', ar_cv_dst, '-']).decode('utf-8', errors='ignore')
en_cv_txt = subprocess.check_output(['pdftotext', en_cv_dst, '-']).decode('utf-8', errors='ignore')

with open(os.path.join(cv_dir, 'cv_arabic.txt'), 'w', encoding='utf-8') as f:
    f.write(ar_cv_txt)
with open(os.path.join(cv_dir, 'cv_english.txt'), 'w', encoding='utf-8') as f:
    f.write(en_cv_txt)

# Copy CV scans
cv_images = []
for scan in sorted(os.listdir(os.path.join(BASE_DIR, 'images/cv'))):
    if scan.endswith(('.jpg', '.png', '.jpeg')):
        src = os.path.join(BASE_DIR, 'images/cv', scan)
        dst = os.path.join(cv_img_dir, scan)
        shutil.copy2(src, dst)
        cv_images.append(f'cv/scans/{scan}')

cv_data = {
    "name_ar": "عبدالمجيد بن سعيد بن طالب البطاطي",
    "name_en": "Abdulmajeed Saeed Albatati",
    "title_ar": "عضو مجلس إدارة جمعية التعاون للمشاريع البيئية | مهندس استشاري معتمد",
    "title_en": "Board member for Environmental Projects Cooperation Association | Consultant Engineer",
    "pdf_arabic": "cv/Abdulmajeed_Albatati_CV_Arabic.pdf",
    "pdf_english": "cv/Abdulmajeed_Albatati_CV_English.pdf",
    "scans": cv_images,
    "raw_text_ar": ar_cv_txt,
    "raw_text_en": en_cv_txt
}

# ----------------------------------------------------
# 2. EXTRACT BOOKS / RESEARCH PAPERS
# ----------------------------------------------------
print("Extracting Books & Research...")
books_dir = os.path.join(OUTPUT_DIR, 'books')
books_covers_dir = os.path.join(books_dir, 'covers')
books_pdfs_dir = os.path.join(books_dir, 'pdfs')
os.makedirs(books_covers_dir, exist_ok=True)
os.makedirs(books_pdfs_dir, exist_ok=True)

word_to_num = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10, 'eleven': 11
}

books_data = []
single_books_dir = os.path.join(BASE_DIR, 'pages/books single pages')
if os.path.exists(single_books_dir):
    for f in sorted(os.listdir(single_books_dir)):
        if not f.endswith('.html'):
            continue
        key = f.replace('.html', '').lower()
        order_num = word_to_num.get(key, 99)
        path = os.path.join(single_books_dir, f)
        with open(path, 'r', encoding='utf-8', errors='ignore') as fp:
            html = fp.read()
            
        # extract col-md-8 content
        col_m = re.search(r'col-md-8\b[^>]*>(.*?)(?:</div>\s*</div>\s*</div>\s*</div>\s*</div>|<script)', html, flags=re.DOTALL)
        content_area = col_m.group(1) if col_m else html

        title = get_tag_inner(content_area, 'h5')
        title = re.sub(r'<[^>]+>', '', title).strip()

        date_m = re.search(r'<p\b[^>]*class=[\'"][^\'"]*my-3[^\'"]*[\'"][^>]*>(.*?)</p>', content_area, flags=re.DOTALL)
        date = date_m.group(1).strip() if date_m else ""

        desc_m = re.search(r'<p\b[^>]*class=[\'"][^\'"]*break-line[^\'"]*[\'"][^>]*>(.*?)</p>', content_area, flags=re.DOTALL)
        desc = clean_html_text(desc_m.group(1)) if desc_m else ""

        # Cover image
        img_m = re.search(r'<img\b[^>]*src=[\'"]([^\'"]+)[\'"]', content_area)
        cover_rel = ""
        if img_m:
            raw_img = img_m.group(1).replace('&#32;', ' ')
            raw_img = urllib.parse.unquote(raw_img)
            # resolve relative to pages/books single pages/
            resolved_img = os.path.normpath(os.path.join(single_books_dir, raw_img))
            if os.path.exists(resolved_img):
                img_name = f"{order_num:02d}_{os.path.basename(resolved_img)}"
                dst_img = os.path.join(books_covers_dir, img_name)
                shutil.copy2(resolved_img, dst_img)
                cover_rel = f"books/covers/{img_name}"

        # PDF download
        pdf_m = re.search(r'<a\b[^>]*href=[\'"]([^\'"]+\.pdf)[\'"]', content_area, flags=re.IGNORECASE)
        pdf_rel = ""
        if pdf_m:
            raw_pdf = urllib.parse.unquote(pdf_m.group(1))
            resolved_pdf = os.path.normpath(os.path.join(single_books_dir, raw_pdf))
            if os.path.exists(resolved_pdf):
                safe_title = re.sub(r'[^\w\s-]', '', title)[:30].strip().replace(' ', '_')
                pdf_name = f"{order_num:02d}_{safe_title}.pdf"
                dst_pdf = os.path.join(books_pdfs_dir, pdf_name)
                shutil.copy2(resolved_pdf, dst_pdf)
                pdf_rel = f"books/pdfs/{pdf_name}"

        books_data.append({
            "id": order_num,
            "key": key,
            "title": title,
            "date": date,
            "description": desc,
            "cover_image": cover_rel,
            "pdf_file": pdf_rel
        })

books_data.sort(key=lambda x: x['id'])

with open(os.path.join(books_dir, 'books.json'), 'w', encoding='utf-8') as f:
    json.dump(books_data, f, ensure_ascii=False, indent=2)

# Generate markdown for books
with open(os.path.join(books_dir, 'books.md'), 'w', encoding='utf-8') as f:
    f.write("# كتب وأبحاث د. م. عبدالمجيد البطاطي\n\n")
    for b in books_data:
        f.write(f"## {b['id']}. {b['title']}\n")
        f.write(f"- **التاريخ:** {b['date']}\n")
        if b['cover_image']:
            f.write(f"- **صورة الغلاف:** `{b['cover_image']}`\n")
        if b['pdf_file']:
            f.write(f"- **الملف:** [{os.path.basename(b['pdf_file'])}]({b['pdf_file']})\n")
        f.write(f"\n{b['description']}\n\n---\n\n")

# ----------------------------------------------------
# 3. EXTRACT ARTICLES (المقالات)
# ----------------------------------------------------
print("Extracting Articles...")
articles_dir = os.path.join(OUTPUT_DIR, 'articles')
articles_imgs_dir = os.path.join(articles_dir, 'images')
articles_md_dir = os.path.join(articles_dir, 'markdown')
os.makedirs(articles_imgs_dir, exist_ok=True)
os.makedirs(articles_md_dir, exist_ok=True)

articles_data = []
single_articles_dir = os.path.join(BASE_DIR, 'pages/articles single page')
if os.path.exists(single_articles_dir):
    for f in sorted(os.listdir(single_articles_dir)):
        if not f.endswith('.html'):
            continue
        key = f.replace('.html', '').lower()
        order_num = word_to_num.get(key, 99)
        path = os.path.join(single_articles_dir, f)
        with open(path, 'r', encoding='utf-8', errors='ignore') as fp:
            html = fp.read()

        col_m = re.search(r'col-md-8\b[^>]*>(.*?)(?:</div>\s*</div>\s*</div>\s*</div>\s*</div>|<script)', html, flags=re.DOTALL)
        content_area = col_m.group(1) if col_m else html

        title = get_tag_inner(content_area, 'h5')
        title = re.sub(r'<[^>]+>', '', title).strip()

        date_m = re.search(r'<p\b[^>]*class=[\'"][^\'"]*my-3[^\'"]*[\'"][^>]*>(.*?)</p>', content_area, flags=re.DOTALL)
        date = date_m.group(1).strip() if date_m else ""

        desc_m = re.search(r'<p\b[^>]*class=[\'"][^\'"]*break-line[^\'"]*[\'"][^>]*>(.*?)</p>', content_area, flags=re.DOTALL)
        content = clean_html_text(desc_m.group(1)) if desc_m else ""

        img_m = re.search(r'<img\b[^>]*src=[\'"]([^\'"]+)[\'"]', content_area)
        img_rel = ""
        if img_m:
            raw_img = img_m.group(1).replace('&#32;', ' ')
            raw_img = urllib.parse.unquote(raw_img)
            resolved_img = os.path.normpath(os.path.join(single_articles_dir, raw_img))
            if os.path.exists(resolved_img):
                img_name = f"{order_num:02d}_{os.path.basename(resolved_img)}"
                dst_img = os.path.join(articles_imgs_dir, img_name)
                shutil.copy2(resolved_img, dst_img)
                img_rel = f"articles/images/{img_name}"

        safe_slug = re.sub(r'[^\w\s-]', '', title)[:40].strip().replace(' ', '_')
        md_filename = f"{order_num:02d}_{safe_slug}.md"
        with open(os.path.join(articles_md_dir, md_filename), 'w', encoding='utf-8') as mdf:
            mdf.write(f"# {title}\n\n**التاريخ:** {date}\n\n")
            if img_rel:
                mdf.write(f"![{title}](../{img_rel})\n\n")
            mdf.write(content + "\n")

        articles_data.append({
            "id": order_num,
            "key": key,
            "title": title,
            "date": date,
            "image": img_rel,
            "markdown_file": f"articles/markdown/{md_filename}",
            "content": content
        })

articles_data.sort(key=lambda x: x['id'])
with open(os.path.join(articles_dir, 'articles.json'), 'w', encoding='utf-8') as f:
    json.dump(articles_data, f, ensure_ascii=False, indent=2)

# ----------------------------------------------------
# 4. EXTRACT SUBJECTS (مواضيع أخرى)
# ----------------------------------------------------
print("Extracting Other Subjects...")
subjects_dir = os.path.join(OUTPUT_DIR, 'subjects')
subjects_imgs_dir = os.path.join(subjects_dir, 'images')
subjects_md_dir = os.path.join(subjects_dir, 'markdown')
os.makedirs(subjects_imgs_dir, exist_ok=True)
os.makedirs(subjects_md_dir, exist_ok=True)

subjects_data = []
single_subjects_dir = os.path.join(BASE_DIR, 'pages/subjects single page')
if os.path.exists(single_subjects_dir):
    for f in sorted(os.listdir(single_subjects_dir)):
        if not f.endswith('.html'):
            continue
        key = f.replace('.html', '').lower()
        order_num = word_to_num.get(key, 99)
        path = os.path.join(single_subjects_dir, f)
        with open(path, 'r', encoding='utf-8', errors='ignore') as fp:
            html = fp.read()

        col_m = re.search(r'col-md-8\b[^>]*>(.*?)(?:</div>\s*</div>\s*</div>\s*</div>\s*</div>|<script)', html, flags=re.DOTALL)
        content_area = col_m.group(1) if col_m else html

        title = get_tag_inner(content_area, 'h5')
        title = re.sub(r'<[^>]+>', '', title).strip()

        subtitle = get_tag_inner(content_area, 'h6')
        subtitle = re.sub(r'<[^>]+>', '', subtitle).strip()

        date_m = re.search(r'<p\b[^>]*class=[\'"][^\'"]*my-3[^\'"]*[\'"][^>]*>(.*?)</p>', content_area, flags=re.DOTALL)
        date = date_m.group(1).strip() if date_m else ""

        desc_m = re.search(r'<p\b[^>]*class=[\'"][^\'"]*break-line[^\'"]*[\'"][^>]*>(.*?)</p>', content_area, flags=re.DOTALL)
        content = clean_html_text(desc_m.group(1)) if desc_m else ""

        img_m = re.search(r'<img\b[^>]*src=[\'"]([^\'"]+)[\'"]', content_area)
        img_rel = ""
        if img_m:
            raw_img = img_m.group(1).replace('&#32;', ' ')
            raw_img = urllib.parse.unquote(raw_img)
            resolved_img = os.path.normpath(os.path.join(single_subjects_dir, raw_img))
            if os.path.exists(resolved_img):
                img_name = f"{order_num:02d}_{os.path.basename(resolved_img)}"
                dst_img = os.path.join(subjects_imgs_dir, img_name)
                shutil.copy2(resolved_img, dst_img)
                img_rel = f"subjects/images/{img_name}"

        safe_slug = re.sub(r'[^\w\s-]', '', title)[:40].strip().replace(' ', '_')
        md_filename = f"{order_num:02d}_{safe_slug}.md"
        with open(os.path.join(subjects_md_dir, md_filename), 'w', encoding='utf-8') as mdf:
            mdf.write(f"# {title}\n\n")
            if subtitle:
                mdf.write(f"### {subtitle}\n\n")
            mdf.write(f"**التاريخ:** {date}\n\n")
            if img_rel:
                mdf.write(f"![{title}](../{img_rel})\n\n")
            mdf.write(content + "\n")

        subjects_data.append({
            "id": order_num,
            "key": key,
            "title": title,
            "subtitle": subtitle,
            "date": date,
            "image": img_rel,
            "markdown_file": f"subjects/markdown/{md_filename}",
            "content": content
        })

subjects_data.sort(key=lambda x: x['id'])
with open(os.path.join(subjects_dir, 'subjects.json'), 'w', encoding='utf-8') as f:
    json.dump(subjects_data, f, ensure_ascii=False, indent=2)

# ----------------------------------------------------
# 5. EXTRACT EVENTS, VISITS & MEDIA (صفحات الرئيسية والألبومات)
# ----------------------------------------------------
print("Extracting Events, Projects & Galleries...")
events_dir = os.path.join(OUTPUT_DIR, 'events_and_media')
events_imgs_dir = os.path.join(events_dir, 'images')
os.makedirs(events_imgs_dir, exist_ok=True)

events_data = []
single_home_dir = os.path.join(BASE_DIR, 'pages/home single page')
if os.path.exists(single_home_dir):
    for f in sorted(os.listdir(single_home_dir)):
        if not f.endswith('.html'):
            continue
        try:
            num = int(f.replace('.html', ''))
        except:
            num = 99
        path = os.path.join(single_home_dir, f)
        with open(path, 'r', encoding='utf-8', errors='ignore') as fp:
            html = fp.read()

        col_m = re.search(r'col-md-8\b[^>]*>(.*?)(?:</div>\s*</div>\s*</div>\s*</div>\s*</div>|<script)', html, flags=re.DOTALL)
        content_area = col_m.group(1) if col_m else html

        title = get_tag_inner(content_area, 'h5')
        title = re.sub(r'<[^>]+>', '', title).strip()

        date_m = re.search(r'<p\b[^>]*class=[\'"][^\'"]*my-3[^\'"]*[\'"][^>]*>(.*?)</p>', content_area, flags=re.DOTALL)
        date = date_m.group(1).strip() if date_m else ""

        desc_m = re.search(r'<p\b[^>]*class=[\'"][^\'"]*break-line[^\'"]*[\'"][^>]*>(.*?)</p>', content_area, flags=re.DOTALL)
        content = clean_html_text(desc_m.group(1)) if desc_m else ""

        # Find gallery images or main image
        img_matches = re.findall(r'(?:href|src)=[\'"]([^\'"]+\.(?:jpg|jpeg|png|gif|JPG))[\'"]', content_area)
        saved_imgs = []
        event_sub_img_dir = os.path.join(events_imgs_dir, f"event_{num:02d}")
        os.makedirs(event_sub_img_dir, exist_ok=True)

        for img_p in set(img_matches):
            raw_img = img_p.replace('&#32;', ' ')
            raw_img = urllib.parse.unquote(raw_img)
            resolved_img = os.path.normpath(os.path.join(single_home_dir, raw_img))
            if os.path.exists(resolved_img) and not os.path.isdir(resolved_img):
                img_name = os.path.basename(resolved_img)
                dst = os.path.join(event_sub_img_dir, img_name)
                shutil.copy2(resolved_img, dst)
                saved_imgs.append(f"events_and_media/images/event_{num:02d}/{img_name}")

        events_data.append({
            "id": num,
            "title": title,
            "date": date,
            "content": content,
            "is_gallery": len(saved_imgs) > 1,
            "image_count": len(saved_imgs),
            "images": sorted(saved_imgs)
        })

events_data.sort(key=lambda x: x['id'])
with open(os.path.join(events_dir, 'events.json'), 'w', encoding='utf-8') as f:
    json.dump(events_data, f, ensure_ascii=False, indent=2)

# ----------------------------------------------------
# 6. EXTRACT CONTACT INFO & METADATA
# ----------------------------------------------------
print("Extracting Contact & Metadata...")
contact_data = {
    "name": {
        "arabic": "عبدالمجيد بن سعيد بن طالب البطاطي",
        "english": "Abdulmajeed Saeed Albatati",
        "honorific_ar": "د. م. عبدالمجيد البطاطي",
        "honorific_en": "Eng. Dr. Abdulmajeed Albatati"
    },
    "titles": [
        "عضو مجلس إدارة جمعية التعاون للمشاريع البيئية",
        "مهندس استشاري معتمد من الهيئة السعودية للمهندسين (رقم: 201226)",
        "محكم معتمد من وزارة العدل",
        "مدير ومستشار إدارة وتطوير استراتيجي"
    ],
    "phone": "0505626375",
    "country_code": "+966",
    "emails": [
        "info@asalbatati.net",
        "a.albatati@asalbatati.net",
        "abdulmajeed@asalbatati.net"
    ],
    "location": {
        "city": "جدة (Jeddah)",
        "region": "منطقة مكة المكرمة",
        "country": "المملكة العربية السعودية (Saudi Arabia)"
    },
    "academic_qualifications": [
        {
            "degree": "دراسة دكتوراه في إدارة الأعمال",
            "institution": "أكاديمية اعمل بيزنس",
            "topic": "الأداء المؤسسي والتطويري لجمعيات المتقاعدين وعلاقته بالرضا والالتزام بالعضوية - دراسة تطبيقية على جمعية متقاعدي منطقة مكة المكرمة"
        },
        {
            "degree": "شهادة مهندس استشاري معتمد",
            "institution": "الهيئة السعودية للمهندسين",
            "details": "عضوية رقم 201226"
        },
        {
            "degree": "CBA (Certified Business Administrator)",
            "institution": "Institute of Business Administration, Delaware USA",
            "year": "2002"
        },
        {
            "degree": "M.B.A. (Master of Business Administration)",
            "institution": "University of Wales, UK",
            "year": "1998"
        },
        {
            "degree": "بكالوريوس هندسة ميكانيكية (B.Sc. Mechanical Engineering)",
            "institution": "جامعة الرياض (الملك سعود)",
            "grade": "جيد جداً",
            "year": "1977/1978"
        },
        {
            "degree": "الثانوية العامة",
            "institution": "مدارس الفلاح الثانوية بجدة",
            "year": "1972"
        }
    ]
}

with open(os.path.join(OUTPUT_DIR, 'contact.json'), 'w', encoding='utf-8') as f:
    json.dump(contact_data, f, ensure_ascii=False, indent=2)

# ----------------------------------------------------
# 7. MASTER PORTFOLIO DATA (COMPLETE UNIFIED JSON)
# ----------------------------------------------------
master_data = {
    "profile": contact_data,
    "cv": cv_data,
    "books_and_research": books_data,
    "articles": articles_data,
    "subjects": subjects_data,
    "events_and_galleries": events_data
}

with open(os.path.join(OUTPUT_DIR, 'portfolio_master_data.json'), 'w', encoding='utf-8') as f:
    json.dump(master_data, f, ensure_ascii=False, indent=2)

# Copy global logos / brand assets
logos_dir = os.path.join(OUTPUT_DIR, 'brand_assets')
os.makedirs(logos_dir, exist_ok=True)
src_logos = os.path.join(BASE_DIR, 'images/logos')
if os.path.exists(src_logos):
    for l in os.listdir(src_logos):
        shutil.copy2(os.path.join(src_logos, l), os.path.join(logos_dir, l))

# Copy main personal / home photos
home_img_dir = os.path.join(BASE_DIR, 'images')
for img in os.listdir(home_img_dir):
    p = os.path.join(home_img_dir, img)
    if os.path.isfile(p):
        shutil.copy2(p, os.path.join(logos_dir, img))

print("EXTRACTION COMPLETED SUCCESSFULLY!")
