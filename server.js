const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'database.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database Helper Functions
function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database:', err);
    return null;
  }
}

function writeDB(data) {
  try {
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('Error writing database:', err);
    return false;
  }
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const cleanBase = path.basename(file.originalname, ext).replace(/[^\w-]/g, '_');
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1E6)}`;
    cb(null, `${cleanBase}_${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ storage });

// Simple token auth middleware for admin endpoints
const ADMIN_TOKEN = 'albatati_admin_secure_session_token_2026';

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === ADMIN_TOKEN) {
      return next();
    }
  }
  return res.status(401).json({ success: false, error: 'غير مصرح لك بالدخول، يرجى تسجيل الدخول أولاً' });
}

// -----------------------------------------------------------
// PUBLIC API ENDPOINTS
// -----------------------------------------------------------

// 1. Get Public Website Data (Stripped of admin secrets)
app.get('/api/public/data', (req, res) => {
  const db = readDB();
  if (!db) {
    return res.status(500).json({ success: false, error: 'تعذر قراءة قاعدة البيانات' });
  }

  // Hide admin password from public
  const publicSettings = { ...db.settings };
  delete publicSettings.admin_password;

  res.json({
    success: true,
    data: {
      settings: publicSettings,
      profile: db.profile,
      cv: db.cv,
      books: db.books,
      articles: db.articles,
      subjects: db.subjects,
      events: db.events,
    }
  });
});

// 2. Public Contact Form Submission
app.post('/api/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ success: false, error: 'يرجى كتابة الاسم والرسالة' });
  }

  const db = readDB();
  if (!db) return res.status(500).json({ success: false, error: 'خطأ في الخادم' });

  const newMessage = {
    id: Date.now(),
    name: String(name).trim(),
    email: String(email || '').trim(),
    phone: String(phone || '').trim(),
    subject: String(subject || 'رسالة جديدة من الموقع').trim(),
    message: String(message).trim(),
    date: new Date().toLocaleString('ar-SA'),
    read: false
  };

  db.messages = db.messages || [];
  db.messages.unshift(newMessage);

  if (writeDB(db)) {
    res.json({ success: true, message: 'تم إرسال رسالتك بنجاح، شكراً لتواصلك.' });
  } else {
    res.status(500).json({ success: false, error: 'تعذر حفظ الرسالة، يرجى المحاولة لاحقاً' });
  }
});

// -----------------------------------------------------------
// ADMIN AUTHENTICATION
// -----------------------------------------------------------

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  const db = readDB();
  if (!db) return res.status(500).json({ success: false, error: 'خطأ في الخادم' });

  const currentPassword = db.settings.admin_password || 'admin';
  if (password === currentPassword) {
    res.json({
      success: true,
      token: ADMIN_TOKEN,
      message: 'تم تسجيل الدخول بنجاح'
    });
  } else {
    res.status(401).json({ success: false, error: 'كلمة المرور غير صحيحة' });
  }
});

// Verify token
app.get('/api/auth/verify', requireAdmin, (req, res) => {
  res.json({ success: true, valid: true });
});

// -----------------------------------------------------------
// ADMIN DASHBOARD CRUD ENDPOINTS
// -----------------------------------------------------------

// Get all admin data (including messages and raw settings)
app.get('/api/admin/data', requireAdmin, (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ success: false, error: 'خطأ في الخادم' });
  res.json({ success: true, data: db });
});

// File Upload endpoint (Images / PDFs)
app.post('/api/admin/upload', requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'لم يتم تحديد أي ملف للرفع' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
});

// Update Settings
app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ success: false, error: 'خطأ في الخادم' });

  const { site_title, contact_email, phone, address, hero_tagline, hero_bio, new_password, admin_password } = req.body;

  if (site_title) db.settings.site_title = site_title;
  if (contact_email) db.settings.contact_email = contact_email;
  if (phone) db.settings.phone = phone;
  if (address) db.settings.address = address;
  if (hero_tagline) db.settings.hero_tagline = hero_tagline;
  if (hero_bio) db.settings.hero_bio = hero_bio;

  const pass = new_password || admin_password;
  if (pass && pass.trim().length > 0) {
    db.settings.admin_password = pass.trim();
  }

  if (writeDB(db)) {
    res.json({ success: true, message: 'تم تحديث الإعدادات بنجاح' });
  } else {
    res.status(500).json({ success: false, error: 'تعذر الحفظ' });
  }
});

// Dedicated Change Password Endpoint
app.put('/api/admin/change-password', requireAdmin, (req, res) => {
  const { new_password, confirm_password } = req.body;
  if (!new_password || new_password.trim().length < 4) {
    return res.status(400).json({ success: false, error: 'كلمة المرور يجب أن لا تقل عن 4 خانات' });
  }
  if (confirm_password && new_password.trim() !== confirm_password.trim()) {
    return res.status(400).json({ success: false, error: 'كلمة المرور وتأكيدها غير متطابقين' });
  }

  const db = readDB();
  if (!db) return res.status(500).json({ success: false, error: 'خطأ في قراءة الخادم' });

  db.settings.admin_password = new_password.trim();
  if (writeDB(db)) {
    res.json({ success: true, message: 'تم تغيير كلمة مرور المدير بنجاح!' });
  } else {
    res.status(500).json({ success: false, error: 'تعذر حفظ كلمة المرور' });
  }
});

// Update Profile & Qualifications
app.put('/api/admin/profile', requireAdmin, (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ success: false, error: 'خطأ في الخادم' });

  const { name, titles, photo, qualifications, cv_summary } = req.body;

  if (name) db.profile.name = name;
  if (titles) db.profile.titles = titles;
  if (photo) db.profile.photo = photo;
  if (qualifications) db.profile.academic_qualifications = qualifications;
  if (cv_summary) db.cv.summary = cv_summary;

  if (writeDB(db)) {
    res.json({ success: true, message: 'تم تحديث البيانات الشخصية والمؤهلات بنجاح' });
  } else {
    res.status(500).json({ success: false, error: 'تعذر الحفظ' });
  }
});

// BOOKS CRUD
app.post('/api/admin/books', requireAdmin, (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ success: false, error: 'خطأ في الخادم' });

  const { title, date, description, cover_image, pdf_file } = req.body;
  if (!title) return res.status(400).json({ success: false, error: 'عنوان الكتاب مطلوب' });

  const nextId = db.books.length > 0 ? Math.max(...db.books.map(b => b.id || 0)) + 1 : 1;
  const newBook = {
    id: nextId,
    key: `book_${nextId}`,
    title: title.trim(),
    date: date ? date.trim() : new Date().getFullYear().toString(),
    description: (description || '').trim(),
    cover_image: cover_image || '',
    pdf_file: pdf_file || ''
  };

  db.books.push(newBook);
  if (writeDB(db)) {
    res.json({ success: true, message: 'تمت إضافة الكتاب بنجاح', book: newBook });
  } else {
    res.status(500).json({ success: false, error: 'تعذر الحفظ' });
  }
});

app.put('/api/admin/books/:id', requireAdmin, (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ success: false, error: 'خطأ في الخادم' });

  const bookId = parseInt(req.params.id, 10);
  const bookIndex = db.books.findIndex(b => b.id === bookId);
  if (bookIndex === -1) return res.status(404).json({ success: false, error: 'الكتاب غير موجود' });

  const { title, date, description, cover_image, pdf_file } = req.body;
  if (title) db.books[bookIndex].title = title.trim();
  if (date !== undefined) db.books[bookIndex].date = date.trim();
  if (description !== undefined) db.books[bookIndex].description = description.trim();
  if (cover_image !== undefined) db.books[bookIndex].cover_image = cover_image;
  if (pdf_file !== undefined) db.books[bookIndex].pdf_file = pdf_file;

  if (writeDB(db)) {
    res.json({ success: true, message: 'تم تحديث الكتاب بنجاح', book: db.books[bookIndex] });
  } else {
    res.status(500).json({ success: false, error: 'تعذر الحفظ' });
  }
});

app.delete('/api/admin/books/:id', requireAdmin, (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ success: false, error: 'خطأ في الخادم' });

  const bookId = parseInt(req.params.id, 10);
  const initialLen = db.books.length;
  db.books = db.books.filter(b => b.id !== bookId);

  if (db.books.length === initialLen) {
    return res.status(404).json({ success: false, error: 'الكتاب غير موجود' });
  }

  if (writeDB(db)) {
    res.json({ success: true, message: 'تم حذف الكتاب بنجاح' });
  } else {
    res.status(500).json({ success: false, error: 'تعذر الحفظ' });
  }
});

// ARTICLES CRUD
app.post('/api/admin/articles', requireAdmin, (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ success: false, error: 'خطأ في الخادم' });

  const { title, date, content, image } = req.body;
  if (!title || !content) return res.status(400).json({ success: false, error: 'عنوان المقال والمحتوى مطلوبان' });

  const nextId = db.articles.length > 0 ? Math.max(...db.articles.map(a => a.id || 0)) + 1 : 1;
  const newArticle = {
    id: nextId,
    key: `article_${nextId}`,
    title: title.trim(),
    date: date ? date.trim() : new Date().toLocaleDateString('ar-SA'),
    content: content.trim(),
    image: image || ''
  };

  db.articles.unshift(newArticle);
  if (writeDB(db)) {
    res.json({ success: true, message: 'تمت إضافة المقال بنجاح', article: newArticle });
  } else {
    res.status(500).json({ success: false, error: 'تعذر الحفظ' });
  }
});

app.put('/api/admin/articles/:id', requireAdmin, (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ success: false, error: 'خطأ في الخادم' });

  const artId = parseInt(req.params.id, 10);
  const artIndex = db.articles.findIndex(a => a.id === artId);
  if (artIndex === -1) return res.status(404).json({ success: false, error: 'المقال غير موجود' });

  const { title, date, content, image } = req.body;
  if (title) db.articles[artIndex].title = title.trim();
  if (date !== undefined) db.articles[artIndex].date = date.trim();
  if (content !== undefined) db.articles[artIndex].content = content.trim();
  if (image !== undefined) db.articles[artIndex].image = image;

  if (writeDB(db)) {
    res.json({ success: true, message: 'تم تحديث المقال بنجاح', article: db.articles[artIndex] });
  } else {
    res.status(500).json({ success: false, error: 'تعذر الحفظ' });
  }
});

app.delete('/api/admin/articles/:id', requireAdmin, (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ success: false, error: 'خطأ في الخادم' });

  const artId = parseInt(req.params.id, 10);
  const initialLen = db.articles.length;
  db.articles = db.articles.filter(a => a.id !== artId);

  if (db.articles.length === initialLen) {
    return res.status(404).json({ success: false, error: 'المقال غير موجود' });
  }

  if (writeDB(db)) {
    res.json({ success: true, message: 'تم حذف المقال بنجاح' });
  } else {
    res.status(500).json({ success: false, error: 'تعذر الحفظ' });
  }
});

// SUBJECTS CRUD
app.post('/api/admin/subjects', requireAdmin, (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ success: false, error: 'خطأ في الخادم' });

  const { title, subtitle, date, content, image } = req.body;
  if (!title) return res.status(400).json({ success: false, error: 'عنوان الموضوع مطلوب' });

  const nextId = db.subjects.length > 0 ? Math.max(...db.subjects.map(s => s.id || 0)) + 1 : 1;
  const newSubject = {
    id: nextId,
    key: `subject_${nextId}`,
    title: title.trim(),
    subtitle: (subtitle || '').trim(),
    date: date ? date.trim() : new Date().toLocaleDateString('ar-SA'),
    content: (content || '').trim(),
    image: image || ''
  };

  db.subjects.unshift(newSubject);
  if (writeDB(db)) {
    res.json({ success: true, message: 'تمت إضافة الموضوع بنجاح', subject: newSubject });
  } else {
    res.status(500).json({ success: false, error: 'تعذر الحفظ' });
  }
});

app.put('/api/admin/subjects/:id', requireAdmin, (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ success: false, error: 'خطأ في الخادم' });

  const subId = parseInt(req.params.id, 10);
  const subIndex = db.subjects.findIndex(s => s.id === subId);
  if (subIndex === -1) return res.status(404).json({ success: false, error: 'الموضوع غير موجود' });

  const { title, subtitle, date, content, image } = req.body;
  if (title) db.subjects[subIndex].title = title.trim();
  if (subtitle !== undefined) db.subjects[subIndex].subtitle = subtitle.trim();
  if (date !== undefined) db.subjects[subIndex].date = date.trim();
  if (content !== undefined) db.subjects[subIndex].content = content.trim();
  if (image !== undefined) db.subjects[subIndex].image = image;

  if (writeDB(db)) {
    res.json({ success: true, message: 'تم تحديث الموضوع بنجاح', subject: db.subjects[subIndex] });
  } else {
    res.status(500).json({ success: false, error: 'تعذر الحفظ' });
  }
});

app.delete('/api/admin/subjects/:id', requireAdmin, (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ success: false, error: 'خطأ في الخادم' });

  const subId = parseInt(req.params.id, 10);
  const initialLen = db.subjects.length;
  db.subjects = db.subjects.filter(s => s.id !== subId);

  if (db.subjects.length === initialLen) {
    return res.status(404).json({ success: false, error: 'الموضوع غير موجود' });
  }

  if (writeDB(db)) {
    res.json({ success: true, message: 'تم حذف الموضوع بنجاح' });
  } else {
    res.status(500).json({ success: false, error: 'تعذر الحفظ' });
  }
});

// EVENTS & GALLERIES CRUD
app.post('/api/admin/events', requireAdmin, (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ success: false, error: 'خطأ في الخادم' });

  const { title, date, content, images } = req.body;
  if (!title) return res.status(400).json({ success: false, error: 'عنوان المشروع/الفعالية مطلوب' });

  const nextId = db.events.length > 0 ? Math.max(...db.events.map(e => e.id || 0)) + 1 : 1;
  const imgList = Array.isArray(images) ? images : (images ? [images] : []);

  const newEvent = {
    id: nextId,
    title: title.trim(),
    date: date ? date.trim() : new Date().toLocaleDateString('ar-SA'),
    content: (content || '').trim(),
    is_gallery: imgList.length > 1,
    image_count: imgList.length,
    images: imgList
  };

  db.events.unshift(newEvent);
  if (writeDB(db)) {
    res.json({ success: true, message: 'تمت إضافة الفعالية/المشروع بنجاح', event: newEvent });
  } else {
    res.status(500).json({ success: false, error: 'تعذر الحفظ' });
  }
});

app.put('/api/admin/events/:id', requireAdmin, (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ success: false, error: 'خطأ في الخادم' });

  const evId = parseInt(req.params.id, 10);
  const evIndex = db.events.findIndex(e => e.id === evId);
  if (evIndex === -1) return res.status(404).json({ success: false, error: 'المشروع غير موجود' });

  const { title, date, content, images } = req.body;
  if (title) db.events[evIndex].title = title.trim();
  if (date !== undefined) db.events[evIndex].date = date.trim();
  if (content !== undefined) db.events[evIndex].content = content.trim();
  if (images !== undefined && Array.isArray(images)) {
    db.events[evIndex].images = images;
    db.events[evIndex].image_count = images.length;
    db.events[evIndex].is_gallery = images.length > 1;
  }

  if (writeDB(db)) {
    res.json({ success: true, message: 'تم تحديث المشروع بنجاح', event: db.events[evIndex] });
  } else {
    res.status(500).json({ success: false, error: 'تعذر الحفظ' });
  }
});

app.delete('/api/admin/events/:id', requireAdmin, (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ success: false, error: 'خطأ في الخادم' });

  const evId = parseInt(req.params.id, 10);
  const initialLen = db.events.length;
  db.events = db.events.filter(e => e.id !== evId);

  if (db.events.length === initialLen) {
    return res.status(404).json({ success: false, error: 'المشروع غير موجود' });
  }

  if (writeDB(db)) {
    res.json({ success: true, message: 'تم حذف المشروع بنجاح' });
  } else {
    res.status(500).json({ success: false, error: 'تعذر الحفظ' });
  }
});

// MESSAGES MANAGEMENT
app.put('/api/admin/messages/:id/read', requireAdmin, (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ success: false, error: 'خطأ في الخادم' });

  const msgId = parseInt(req.params.id, 10);
  const msg = db.messages.find(m => m.id === msgId);
  if (msg) {
    msg.read = true;
    writeDB(db);
  }
  res.json({ success: true });
});

app.delete('/api/admin/messages/:id', requireAdmin, (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ success: false, error: 'خطأ في الخادم' });

  const msgId = parseInt(req.params.id, 10);
  db.messages = (db.messages || []).filter(m => m.id !== msgId);
  writeDB(db);
  res.json({ success: true, message: 'تم حذف الرسالة' });
});

// -----------------------------------------------------------
// STATIC ASSETS & SPA ROUTING
// -----------------------------------------------------------

// Serve extracted media from the parent repository
app.use('/extracted_data', express.static(path.join(__dirname, 'extracted_data')));

// Serve uploaded user files
app.use('/uploads', express.static(UPLOADS_DIR));

// Serve public website files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Admin SPA route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Fallback route for SPA & 404 handler
app.use((req, res) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  res.status(404).json({ success: false, error: 'المسار المطلوب غير موجود (404)' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ success: false, error: 'حدث خطأ غير متوقع في الخادم' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 منصة د. م. عبدالمجيد البطاطي تعمل الآن بنجاح!`);
  console.log(`🌐 الموقع العام:       http://localhost:${PORT}`);
  console.log(`🔐 لوحة التحكم الإدارية: http://localhost:${PORT}/admin`);
  console.log(`🔑 كلمة مرور المدير:    admin`);
  console.log(`====================================================`);
});
