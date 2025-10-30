# backend/app.py
from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from db_config import get_connection
import traceback

app = Flask(__name__)
CORS(app)


# -----------------------
# Health / Index
# -----------------------
@app.route("/ping", methods=["GET"])
def ping():
    return "pong", 200


@app.route("/", methods=["GET"])
def index():
    html = """
    <h2>Fake News Detection API</h2>
    <ul>
      <li><a href="/ping">/ping</a></li>
      <li><a href="/api/reports">/api/reports</a></li>
      <li><a href="/api/credibility">/api/credibility</a></li>
      <li>POST endpoints (use Postman/curl/Frontend)</li>
      <li>POST /api/users</li>
      <li>POST /api/sources</li>
      <li>POST /api/articles</li>
      <li>POST /api/reports</li>
      <li>POST /api/credibility</li>
    </ul>
    """
    return html, 200


# -----------------------
# Procedure / Function wrappers
# -----------------------
@app.route("/api/perform_check", methods=["POST"])
def api_perform_credibility_check():
    """
    Calls stored procedure perform_credibility_check
    expects JSON:
    {
      "article_id": int,
      "ai_score": float (0..1),
      "factcheck_score": float (0..1),
      "final_verdict": "Real"|"Fake"|"Unverified",
      "checked_by": int (UserID)
    }
    """
    data = request.json or {}
    required = ("article_id", "ai_score", "factcheck_score", "final_verdict", "checked_by")
    if not all(k in data for k in required):
        return jsonify({"error": "Missing required fields"}), 400

    # basic validation
    try:
        article_id = int(data["article_id"])
        ai_score = float(data["ai_score"])
        fact_score = float(data["factcheck_score"])
        final_verdict = str(data["final_verdict"])
        checked_by = int(data["checked_by"])

        if not (0.0 <= ai_score <= 1.0 and 0.0 <= fact_score <= 1.0):
            return jsonify({"error": "Scores must be between 0 and 1"}), 400
        if final_verdict not in ("Real", "Fake", "Unverified"):
            return jsonify({"error": "Invalid final_verdict"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid numeric values"}), 400

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.callproc("perform_credibility_check", (article_id, ai_score, fact_score, final_verdict, checked_by))
        conn.commit()
        return jsonify({"message": "Credibility check recorded"}), 201
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route("/api/reports/<int:report_id>/review", methods=["POST"])
def api_mark_report_reviewed(report_id):
    """
    Calls stored procedure mark_report_reviewed(report_id)
    """
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.callproc("mark_report_reviewed", (report_id,))
        conn.commit()
        return jsonify({"message": f"Report {report_id} marked Reviewed"}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route("/api/sources/<int:source_id>/avg_credibility", methods=["GET"])
def api_avg_credibility(source_id):
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT avg_credibility_for_source(%s)", (source_id,))
        row = cursor.fetchone()
        score = float(row[0]) if row and row[0] is not None else 0.0
        return jsonify({"source_id": source_id, "avg_credibility": score}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route("/api/articles/<int:article_id>/report_count", methods=["GET"])
def api_report_count(article_id):
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT report_count_for_article(%s)", (article_id,))
        row = cursor.fetchone()
        count = int(row[0]) if row and row[0] is not None else 0
        return jsonify({"article_id": article_id, "report_count": count}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# -----------------------
# USER ROUTES
# -----------------------
@app.route("/api/users", methods=["POST"])
def add_user():
    data = request.json or {}
    try:
        name = data.get("name")
        email = data.get("email")
        role = data.get("role", "user")
        password = data.get("password")
        if not name or not email or not password:
            return jsonify({"error": "Missing required fields (name, email, password)"}), 400

        conn = get_connection()
        cursor = conn.cursor()
        # store password as-is for now — replace with bcrypt in production
        cursor.execute(
            "INSERT INTO useraccount (Name, Email, Role, PasswordHash) VALUES (%s, %s, %s, %s)",
            (name, email, role, password),
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "User added successfully"}), 201
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/users", methods=["GET"])
def get_users():
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT UserID, Name, Role FROM useraccount ORDER BY Name")
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(rows), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# -----------------------
# SOURCE ROUTES
# -----------------------
@app.route("/api/sources", methods=["POST"])
def add_source():
    data = request.json or {}
    conn = None
    cursor = None
    try:
        name = data.get("name")
        domain = data.get("domain")
        # ensure trust is numeric (defaults to 50.00)
        try:
            trust = float(data.get("trust")) if data.get("trust") not in (None, "") else 50.0
        except ValueError:
            return jsonify({"error": "Invalid trust value; must be a number"}), 400

        if not name or not domain:
            return jsonify({"error": "Missing required fields: name and domain"}), 400

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO source (Name, Domain, TrustRating) VALUES (%s, %s, %s)",
            (name, domain, trust),
        )
        conn.commit()
        return jsonify({"message": "Source added successfully"}), 201
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route("/api/sources", methods=["GET"])
def get_sources():
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT SourceID, Name, Domain, TrustRating FROM source ORDER BY Name")
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(rows), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# -----------------------
# ARTICLE ROUTES
# -----------------------
@app.route("/api/articles", methods=["POST"])
def add_article():
    data = request.json or {}
    required = ("title", "content", "url", "source_id", "publish_date")
    if not all(k in data for k in required):
        return jsonify({"error": "Missing required article fields"}), 400

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO article (Title, Content, URL, SourceID, PublishDate) VALUES (%s, %s, %s, %s, %s)",
            (data["title"], data["content"], data["url"], int(data["source_id"]), data["publish_date"]),
        )
        conn.commit()
        return jsonify({"message": "Article added successfully"}), 201
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route("/api/articles", methods=["GET"])
def get_articles():
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT ArticleID, Title FROM article ORDER BY CreatedAt DESC")
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(rows), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# -----------------------
# REPORT ROUTES
# -----------------------
@app.route("/api/reports", methods=["POST"])
def add_report():
    data = request.json or {}
    if not all(k in data for k in ("user_id", "article_id")):
        return jsonify({"error": "Missing required fields user_id and article_id"}), 400

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO report (UserID, ArticleID, Reason) VALUES (%s, %s, %s)",
            (int(data["user_id"]), int(data["article_id"]), data.get("reason")),
        )
        conn.commit()
        return jsonify({"message": "Report submitted successfully"}), 201
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route("/api/reports", methods=["GET"])
def get_reports():
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT r.ReportID, u.Name AS Reporter, a.Title AS ArticleTitle,
                   r.Reason, r.Status, r.ReportDate
            FROM report r
            JOIN useraccount u ON r.UserID = u.UserID
            JOIN article a ON r.ArticleID = a.ArticleID
            ORDER BY r.ReportID ASC
        """)
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# -----------------------
# CREDIBILITY CHECK ROUTES
# -----------------------
@app.route("/api/credibility", methods=["POST"])
def add_credibility_check():
    data = request.json or {}
    required = ("article_id", "ai_score", "factcheck_score", "final_verdict")
    if not all(k in data for k in required):
        return jsonify({"error": "Missing required fields"}), 400

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO credibilitycheck (ArticleID, AI_Score, FactCheckScore, FinalVerdict, CheckedBy) VALUES (%s, %s, %s, %s, %s)",
            (int(data["article_id"]), float(data["ai_score"]), (None if data.get("factcheck_score") in (None, "") else float(data["factcheck_score"])), data["final_verdict"], (None if data.get("checked_by") in (None, "") else int(data["checked_by"]))),
        )
        conn.commit()
        return jsonify({"message": "Credibility check added successfully"}), 201
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route("/api/credibility", methods=["GET"])
def get_credibility_checks():
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT c.CheckID, a.Title AS ArticleTitle, c.AI_Score, c.FactCheckScore,
                   c.FinalVerdict, u.Name AS CheckedBy, c.CheckDate
            FROM credibilitycheck c
            JOIN article a ON c.ArticleID = a.ArticleID
            LEFT JOIN useraccount u ON c.CheckedBy = u.UserID
            ORDER BY c.CheckID ASC
        """)
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# -----------------------
# MAIN
# -----------------------
if __name__ == "__main__":
    app.run(port=5000, debug=True)
