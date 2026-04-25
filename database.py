# =====================================================================
# database.py — قاعدة البيانات (SQLite)
# جدولين رئيسيين:
#   1) reports  — يحفظ دراسات الجدوى الكاملة كـ JSON
#   2) projects — يحفظ مشاريع المستخدمين، ويربط كل مشروع بدراسة جدوى
# نستخدم SQLite لأنه خفيف وما يحتاج إعداد سيرفر
# =====================================================================

import sqlite3
import json

DB_PATH = "muqaddim.db"  # الملف نفسه يحتوي قاعدة البيانات (بدون سيرفر)


def init_db():
    """إنشاء الجداول لو ما كانت موجودة (يُنادى عند بدء تشغيل السيرفر)"""
    conn = sqlite3.connect(DB_PATH)

    # جدول التقارير: نخزن الدراسة كاملة كـ JSON عشان نقدر نضيف حقول مستقبلاً بدون migration
    conn.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            title         TEXT,
            city          TEXT,
            business_type TEXT,
            report_json   TEXT,                                        -- التقرير كاملاً كـ JSON
            created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # جدول المشاريع: كل مستخدم له مشاريع، وكل مشروع مربوط بتقرير دراسة جدوى
    conn.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id             TEXT,                  -- معرّف المستخدم من Firebase
            project_name        TEXT,                  -- اسم المشروع بالعربي
            project_name_en     TEXT,                  -- اسم المشروع بالإنجليزي
            project_type        TEXT,                  -- نوع المشروع (cafe, restaurant, ...)
            restaurant_type     TEXT,                  -- التخصص (مثلاً: قهوة مختصة)
            city                TEXT,
            city_en             TEXT,
            capital             REAL,                  -- رأس المال
            rent                REAL,                  -- الإيجار الشهري
            employees           INTEGER,
            avg_price           REAL,                  -- متوسط سعر المنتج
            customers_per_day   REAL,
            target_customers    TEXT,                  -- وصف العملاء المستهدفين
            main_products       TEXT,                  -- المنتجات الرئيسية كـ JSON array
            lat                 REAL,                  -- إحداثيات الموقع
            lng                 REAL,
            report_id           INTEGER,               -- ربط مع جدول reports
            created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


# =====================================================================
# دوال الـ Reports — حفظ، استرجاع، حذف دراسات الجدوى
# =====================================================================

def save_report(report: dict) -> int:
    """يحفظ التقرير كـ JSON ويرجع رقمه عشان نربطه بالمشروع"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute(
        "INSERT INTO reports (title, city, business_type, report_json) VALUES (?,?,?,?)",
        (
            report.get("title", "دراسة جدوى"),
            report.get("business_overview", {}).get("city", ""),
            report.get("business_overview", {}).get("business_type", ""),
            json.dumps(report, ensure_ascii=False),  # ensure_ascii=False يحفظ العربي بشكل صحيح
        )
    )
    conn.commit()
    report_id = cur.lastrowid
    conn.close()
    return report_id


def get_all_reports() -> list:
    """قائمة بكل الدراسات (للوحة الإدارة) — بدون تفاصيل JSON"""
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute(
        "SELECT id, title, city, business_type, created_at FROM reports ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    return [
        {
            "id":            r[0],
            "title":         r[1],
            "city":          r[2],
            "business_type": r[3],
            "created_at":    r[4],
        }
        for r in rows
    ]


def get_report_by_id(report_id: int) -> dict | None:
    """جلب دراسة كاملة بالـ JSON (يستخدمها المستشار وعارض التقرير)"""
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute(
        "SELECT report_json FROM reports WHERE id = ?", (report_id,)
    ).fetchone()
    conn.close()
    return json.loads(row[0]) if row else None


def delete_report(report_id: int) -> bool:
    """يرجع True لو فعلاً انحذف، False لو الدراسة مو موجودة"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute("DELETE FROM reports WHERE id = ?", (report_id,))
    conn.commit()
    deleted = cur.rowcount > 0
    conn.close()
    return deleted


# =====================================================================
# دوال الـ Projects — حفظ، استرجاع، تحديث، حذف مشاريع المستخدمين
# =====================================================================

def save_project(project: dict) -> int:
    """يحفظ مشروع جديد بعد إنشاء دراسة الجدوى"""
    conn = sqlite3.connect(DB_PATH)
    # main_products قائمة، نخزنها كـ JSON string في عمود نصي واحد
    main_products = project.get("main_products") or []
    if isinstance(main_products, list):
        main_products = json.dumps(main_products, ensure_ascii=False)
    cur = conn.execute(
        """INSERT INTO projects
        (user_id, project_name, project_name_en, project_type, restaurant_type,
         city, city_en, capital, rent, employees, avg_price, customers_per_day,
         target_customers, main_products, lat, lng, report_id)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (
            project.get("user_id", ""),
            project.get("project_name", ""),
            project.get("project_name_en", ""),
            project.get("project_type", ""),
            project.get("restaurant_type", ""),
            project.get("city", ""),
            project.get("city_en", ""),
            project.get("capital"),
            project.get("rent"),
            project.get("employees"),
            project.get("avg_price"),
            project.get("customers_per_day"),
            project.get("target_customers", ""),
            main_products,
            project.get("lat"),
            project.get("lng"),
            project.get("report_id"),
        )
    )
    conn.commit()
    project_id = cur.lastrowid
    conn.close()
    return project_id


def get_projects_by_user(user_id: str) -> list:
    """قائمة مشاريع مستخدم محدد، الأحدث أولاً"""
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute(
        "SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,)
    ).fetchall()
    conn.close()
    return [_row_to_project(r) for r in rows]


def get_project_by_id(project_id: int) -> dict | None:
    """جلب مشروع واحد بكل تفاصيله (للتعديل أو الشات)"""
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute(
        "SELECT * FROM projects WHERE id = ?", (project_id,)
    ).fetchone()
    conn.close()
    return _row_to_project(row) if row else None


def update_project(project_id: int, project: dict) -> bool:
    """تحديث بيانات مشروع — يستخدم بعد إعادة توليد الدراسة"""
    conn = sqlite3.connect(DB_PATH)
    main_products = project.get("main_products") or []
    if isinstance(main_products, list):
        main_products = json.dumps(main_products, ensure_ascii=False)
    cur = conn.execute(
        """UPDATE projects SET
        project_name=?, project_name_en=?, project_type=?, restaurant_type=?,
        city=?, city_en=?, capital=?, rent=?, employees=?, avg_price=?,
        customers_per_day=?, target_customers=?, main_products=?,
        lat=?, lng=?, report_id=?, updated_at=CURRENT_TIMESTAMP
        WHERE id=?""",
        (
            project.get("project_name"),
            project.get("project_name_en"),
            project.get("project_type"),
            project.get("restaurant_type", ""),
            project.get("city"),
            project.get("city_en"),
            project.get("capital"),
            project.get("rent"),
            project.get("employees"),
            project.get("avg_price"),
            project.get("customers_per_day"),
            project.get("target_customers", ""),
            main_products,
            project.get("lat"),
            project.get("lng"),
            project.get("report_id"),
            project_id,
        )
    )
    conn.commit()
    updated = cur.rowcount > 0
    conn.close()
    return updated


def delete_project(project_id: int) -> bool:
    """حذف مشروع (ملاحظة: التقرير المرتبط ما يُحذف تلقائياً)"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    deleted = cur.rowcount > 0
    conn.close()
    return deleted


def _row_to_project(r) -> dict:
    """يحوّل صف من قاعدة البيانات (tuple) إلى قاموس بأسماء الحقول
    main_products يُفك من JSON string ليرجع قائمة"""
    main_products_raw = r[14] or "[]"
    try:
        main_products = json.loads(main_products_raw) if main_products_raw else []
    except (ValueError, TypeError):
        main_products = []  # لو الـ JSON تالف، نرجع قائمة فاضية بدل ما نطيح
    return {
        "id":                r[0],
        "user_id":           r[1],
        "project_name":      r[2],
        "project_name_en":   r[3],
        "project_type":      r[4],
        "restaurant_type":   r[5],
        "city":              r[6],
        "city_en":           r[7],
        "capital":           r[8],
        "rent":              r[9],
        "employees":         r[10],
        "avg_price":         r[11],
        "customers_per_day": r[12],
        "target_customers":  r[13],
        "main_products":     main_products,
        "lat":               r[15],
        "lng":               r[16],
        "report_id":         r[17],
        "created_at":        r[18],
        "updated_at":        r[19],
    }