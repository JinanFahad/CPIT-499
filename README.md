# مُقدِّم (Muqaddim)

منصة سعودية لإنشاء دراسات جدوى احترافية للمطاعم والكافيهات بالذكاء الاصطناعي،
مع مستشار ذكي، تحليل سوق من قوقل بلايسز، شات للإجراءات الحكومية،
وتوليد عروض تقديمية جاهزة للمستثمرين.

## المميزات

- ✅ دراسة جدوى كاملة بـ PDF (مالي + سوق + مخاطر + خطوات)
- ✅ تحليل المنافسين من Google Places (دبوس على الخريطة)
- ✅ مستشار ذكي يجاوب على أسئلتك بناءً على دراستك
- ✅ شات الإجراءات الحكومية السعودية
- ✅ توليد Pitch Deck (عرض تقديمي للمستثمرين)
- ✅ واجهة عربية كاملة (RTL) + دعم إنجليزي + الوضع الليلي

## التقنيات المستخدمة

**الباك اند:** Python 3.10 + Flask + SQLite + OpenAI (GPT-4o) + Google Places API + Playwright
**الفرونت اند:** React 18 + TypeScript + Vite + Tailwind + Firebase Authentication

---

## 📋 متطلبات التشغيل

قبل البدء، تأكدي من تثبيت:

- **Python 3.10+** → https://www.python.org/downloads/
- **Node.js 18+** → https://nodejs.org/
- **Git** → https://git-scm.com/

---

## 🚀 خطوات التشغيل (لأول مرة)

### 1️⃣ نسخ المشروع

```bash
git clone https://github.com/JinanFahad/CPIT-499.git
cd CPIT-499
```

### 2️⃣ إعداد الباك اند (Flask)

```bash
# إنشاء بيئة بايثون افتراضية
python -m venv venv

# تفعيل البيئة
# على Windows:
venv\Scripts\activate
# على Mac/Linux:
source venv/bin/activate

# تثبيت المكتبات
pip install -r requirements.txt

# تثبيت متصفح Playwright (مطلوب لتوليد PDF)
playwright install chromium
```

### 3️⃣ إعداد متغيرات البيئة

```bash
# انسخي ملف القالب
# على Windows:
copy .env.example .env
# على Mac/Linux:
cp .env.example .env
```

ثم **افتحي ملف `.env`** وعبّي المفتاح الحقيقي:

```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx
```

> 💡 **من أين تحصلين على المفتاح؟** اطلبيه من صاحبة المشروع (جنان/الجوهرة)، أو أنشئي مفتاحاً خاصاً من https://platform.openai.com/api-keys

### 4️⃣ إعداد الفرونت اند (React)

```bash
# افتحي طرفية (terminal) جديدة
cd frontend/muqqdimWeb-master

# تثبيت مكتبات npm
npm install
```

---

## ▶️ تشغيل البرنامج

المشروع يحتاج **طرفيتين مفتوحتين** في نفس الوقت:

### الطرفية الأولى — الباك اند:

```bash
# من مجلد المشروع الرئيسي
# فعّلي البيئة الافتراضية أولاً
venv\Scripts\activate       # Windows
source venv/bin/activate     # Mac/Linux

# شغّلي السيرفر
python app.py
```

**المتوقع:** `Running on http://127.0.0.1:5000`

### الطرفية الثانية — الفرونت اند:

```bash
cd frontend/muqqdimWeb-master
npm run dev
```

**المتوقع:** `Local: http://localhost:5173/`

### 🌐 افتحي المتصفح على:

**http://localhost:5173**

---

## 🗂️ هيكل المشروع

```
CPIT-499/
├── app.py                      # السيرفر الرئيسي (Flask)
├── database.py                 # قاعدة البيانات (SQLite)
├── ai_report_engine.py         # محرك توليد دراسة الجدوى
├── ai_pitch_engine.py          # محرك توليد العرض التقديمي
├── gov_consultant.py           # شات الإجراءات الحكومية
├── market_ai.py                # تحليل المنافسين
├── financial_engine.py         # حسابات المالية
├── decision_engine.py          # تصنيف المشروع
├── pdf_generator.py            # تحويل التقرير إلى PDF
├── ppt_builder.py              # توليد PowerPoint
├── assets/                     # الشعارات
├── templates/                  # قوالب HTML + pptx
├── requirements.txt            # مكتبات بايثون
│
└── frontend/muqqdimWeb-master/
    ├── src/app/
    │   ├── pages/              # صفحات التطبيق
    │   ├── components/         # المكونات المشتركة
    │   ├── firebase.ts         # إعدادات Firebase
    │   └── routes.tsx          # مسارات التنقل
    ├── package.json
    └── vite.config.ts
```

---

## 🔑 الملفات الحساسة (غير مرفوعة على GitHub)

هذي الملفات **لازم تحصلي عليها من عضوة الفريق**، مو موجودة في القيت هب:

| الملف | الوصف | كيف تحصلين عليه |
|------|-------|-----------------|
| `.env` | مفتاح OpenAI | اطلبيه خاص أو استخدمي مفتاحك |
| `muqaddim.db` | قاعدة البيانات | تنشأ تلقائياً عند أول تشغيل |

---

## 🐛 حل المشاكل الشائعة

**المشكلة:** `ModuleNotFoundError: No module named 'flask'`
**الحل:** تأكدي إنك فعّلتي البيئة الافتراضية (`venv\Scripts\activate`)

**المشكلة:** `OPENAI_API_KEY not set`
**الحل:** تأكدي من وجود ملف `.env` في مجلد المشروع الرئيسي (مو في مجلد فرعي)

**المشكلة:** الـ PDF ما يتولّد
**الحل:** شغّلي `playwright install chromium`

**المشكلة:** `CORS error` في المتصفح
**الحل:** تأكدي إن الباك اند شغّال على `http://localhost:5000`

**المشكلة:** `Failed to load resource`
**الحل:** تأكدي إن الاثنين شغالين (الباك اند + الفرونت اند) في نفس الوقت

---

## 👥 فريق العمل

- الجوهرة العريني
- جنان فهد
- نورة الصويد

**مشروع CPIT-499** — جامعة الملك عبدالعزيز
