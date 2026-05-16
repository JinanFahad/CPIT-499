# database.py
# SQLite layer for the platform. Two tables:
#   - reports:  stores the full feasibility report as a JSON blob
#   - projects: stores user projects and links each one to a report
# SQLite was chosen because it is file-based and needs no separate server.

import sqlite3
import json

DB_PATH = "muqaddim.db"


def init_db():
    """Create the tables if they do not exist yet. Called once on server start."""
    conn = sqlite3.connect(DB_PATH)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            title         TEXT,
            city          TEXT,
            business_type TEXT,
            report_json   TEXT,
            created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id             TEXT,
            project_name        TEXT,
            project_name_en     TEXT,
            project_type        TEXT,
            restaurant_type     TEXT,
            city                TEXT,
            city_en             TEXT,
            capital             REAL,
            rent                REAL,
            employees           INTEGER,
            avg_price           REAL,
            customers_per_day   REAL,
            target_customers    TEXT,
            main_products       TEXT,
            lat                 REAL,
            lng                 REAL,
            report_id           INTEGER,
            pitch_deck_generated INTEGER DEFAULT 0,
            created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # SQLite does not support "ADD COLUMN IF NOT EXISTS", so the migration
    # for pitch_deck_generated is wrapped in a try/except. The OperationalError
    # is raised when the column already exists, which is the expected case
    # on every run after the first.
    try:
        conn.execute("ALTER TABLE projects ADD COLUMN pitch_deck_generated INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass
    conn.commit()
    conn.close()


# Reports CRUD

def save_report(report: dict) -> int:
    """Insert a new report and return its auto-generated id."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute(
        "INSERT INTO reports (title, city, business_type, report_json) VALUES (?,?,?,?)",
        (
            report.get("title", "دراسة جدوى"),
            report.get("business_overview", {}).get("city", ""),
            report.get("business_overview", {}).get("business_type", ""),
            json.dumps(report, ensure_ascii=False),
        )
    )
    conn.commit()
    report_id = cur.lastrowid
    conn.close()
    return report_id


def get_all_reports() -> list:
    """Return a lightweight list of reports for admin/dashboard listings."""
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
    """Return the full parsed report JSON, or None if no such id."""
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute(
        "SELECT report_json FROM reports WHERE id = ?", (report_id,)
    ).fetchone()
    conn.close()
    return json.loads(row[0]) if row else None


def delete_report(report_id: int) -> bool:
    """Return True if a row was deleted, False if the id did not exist."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute("DELETE FROM reports WHERE id = ?", (report_id,))
    conn.commit()
    deleted = cur.rowcount > 0
    conn.close()
    return deleted


def update_report(report_id: int, report: dict) -> bool:
    """Replace the JSON body of an existing report (used by the translator
    cache, for example, after generating an English copy)."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute(
        "UPDATE reports SET report_json = ? WHERE id = ?",
        (json.dumps(report, ensure_ascii=False), report_id),
    )
    conn.commit()
    updated = cur.rowcount > 0
    conn.close()
    return updated


# Projects CRUD

def save_project(project: dict) -> int:
    """Insert a new project row and return its id. The main_products field is
    serialized to JSON because SQLite has no native array column."""
    conn = sqlite3.connect(DB_PATH)
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
    """Return all projects belonging to a user, most recent first."""
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute(
        "SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,)
    ).fetchall()
    conn.close()
    return [_row_to_project(r) for r in rows]


def get_project_by_id(project_id: int) -> dict | None:
    """Return one project by id (used by the edit and chat pages)."""
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute(
        "SELECT * FROM projects WHERE id = ?", (project_id,)
    ).fetchone()
    conn.close()
    return _row_to_project(row) if row else None


def update_project(project_id: int, project: dict) -> bool:
    """Replace the row of an existing project."""
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
    """Delete a project. The linked report is NOT auto-deleted."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    deleted = cur.rowcount > 0
    conn.close()
    return deleted


def _row_to_project(r) -> dict:
    """Convert a database row tuple into a dict with named fields. The
    main_products column is parsed from its JSON string. The
    pitch_deck_generated column was added later via ALTER TABLE, so older
    rows may not have it — handled defensively."""
    main_products_raw = r[14] or "[]"
    try:
        main_products = json.loads(main_products_raw) if main_products_raw else []
    except (ValueError, TypeError):
        main_products = []

    pitch_generated = 0
    if len(r) > 18 and r[18] is not None:
        try:
            pitch_generated = int(r[18])
        except (ValueError, TypeError):
            pitch_generated = 0

    created_at = r[19] if len(r) > 19 else None
    updated_at = r[20] if len(r) > 20 else None
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
        "pitch_deck_generated": pitch_generated,
        "created_at":        created_at,
        "updated_at":        updated_at,
    }


def mark_pitch_deck_generated(project_id: int) -> bool:
    """Set pitch_deck_generated=1 for the given project. Called after the user
    successfully generates a pitch deck from the Pitch Deck page; this is what
    enables the download/email buttons on the Projects page."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute(
        "UPDATE projects SET pitch_deck_generated = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (project_id,),
    )
    conn.commit()
    updated = cur.rowcount > 0
    conn.close()
    return updated
