import sqlite3
import json

DB_PATH = "muqaddim.db"


def init_db():
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
    conn.commit()
    conn.close()


def save_report(report: dict) -> int:
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
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute(
        "SELECT report_json FROM reports WHERE id = ?", (report_id,)
    ).fetchone()
    conn.close()
    return json.loads(row[0]) if row else None


def delete_report(report_id: int) -> bool:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute("DELETE FROM reports WHERE id = ?", (report_id,))
    conn.commit()
    deleted = cur.rowcount > 0
    conn.close()
    return deleted