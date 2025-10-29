from flask import Flask, request, jsonify
from flask_cors import CORS
from db_config import get_connection

app = Flask(__name__)


CORS(app)

@app.route("/ping", methods=["GET"])
def ping():
    return "pong", 200


# -------------------------------------
# USER ROUTES
# -------------------------------------
@app.route("/api/users", methods=["POST"])
def add_user():
    data = request.json
    try:
        db = get_connection()
        cursor = db.cursor()
        query = "INSERT INTO UserAccount (Name, Email, Role, PasswordHash) VALUES (%s, %s, %s, %s)"
        values = (data["name"], data["email"], data["role"], data["password"])
        cursor.execute(query, values)
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"message": "User added successfully"}), 201
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# -------------------------------------
# SOURCE ROUTES
# -------------------------------------
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
        # Insert using the actual column name `Name`
        cursor.execute(
            "INSERT INTO Source (Name, Domain, TrustRating) VALUES (%s, %s, %s)",
            (name, domain, trust),
        )
        conn.commit()
        return jsonify({"message": "Source added successfully"}), 201
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# -------------------------------------
# ARTICLE ROUTES
# -------------------------------------
@app.route("/api/articles", methods=["POST"])
def add_article():
    data = request.json
    db = get_connection()
    cursor = db.cursor()
    query = """
        INSERT INTO Article (Title, Content, URL, SourceID, PublishDate)
        VALUES (%s, %s, %s, %s, %s)
    """
    values = (data["title"], data["content"], data["url"], data["source_id"], data["publish_date"])
    cursor.execute(query, values)
    db.commit()
    cursor.close()
    db.close()
    return jsonify({"message": "Article added successfully"}), 201

# -------------------------------------
# REPORT ROUTES
# -------------------------------------
@app.route("/api/reports", methods=["POST"])
def add_report():
    data = request.json
    db = get_connection()
    cursor = db.cursor()
    query = "INSERT INTO Report (UserID, ArticleID, Reason) VALUES (%s, %s, %s)"
    values = (data["user_id"], data["article_id"], data["reason"])
    cursor.execute(query, values)
    db.commit()
    cursor.close()
    db.close()
    return jsonify({"message": "Report submitted successfully"}), 201


@app.route("/api/reports", methods=["GET"])
def get_reports():
    db = get_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
       SELECT r.ReportID, u.Name AS Reporter, a.Title AS ArticleTitle,
       r.Reason, r.Status, r.ReportDate
FROM Report r
JOIN UserAccount u ON r.UserID = u.UserID
JOIN Article a ON r.ArticleID = a.ArticleID
ORDER BY r.ReportDate DESC

    """)
    results = cursor.fetchall()
    cursor.close()
    db.close()
    return jsonify(results), 200

# -------------------------------------
# CREDIBILITY CHECK ROUTES
# -------------------------------------
@app.route("/api/credibility", methods=["POST"])
def add_credibility_check():
    data = request.json
    db = get_connection()
    cursor = db.cursor()
    query = """
        INSERT INTO CredibilityCheck (ArticleID, AI_Score, FactCheckScore, FinalVerdict, CheckedBy)
        VALUES (%s, %s, %s, %s, %s)
    """
    values = (data["article_id"], data["ai_score"], data["factcheck_score"], data["final_verdict"], data["checked_by"])
    cursor.execute(query, values)
    db.commit()
    cursor.close()
    db.close()
    return jsonify({"message": "Credibility check added successfully"}), 201


@app.route("/api/credibility", methods=["GET"])
def get_credibility_checks():
    db = get_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT c.CheckID, a.Title AS ArticleTitle, c.AI_Score, c.FactCheckScore,
       c.FinalVerdict, u.Name AS CheckedBy, c.CheckDate
FROM CredibilityCheck c
JOIN Article a ON c.ArticleID = a.ArticleID
LEFT JOIN UserAccount u ON c.CheckedBy = u.UserID
ORDER BY c.CheckDate DESC

    """)
    results = cursor.fetchall()
    cursor.close()
    db.close()
    return jsonify(results), 200


@app.route("/", methods=["GET"])
def index():
    html = """
    <h2>Fake News Detection API</h2>
    <ul>
      <li><a href="/ping">/ping</a></li>
      <li><a href="/api/reports">/api/reports</a></li>
      <li><a href="/api/credibility">/api/credibility</a></li>
      <!-- POST endpoints are shown as text (use Postman/curl to POST) -->
      <li>POST /api/users</li>
      <li>POST /api/sources</li>
      <li>POST /api/articles</li>
      <li>POST /api/reports</li>
      <li>POST /api/credibility</li>
    </ul>
    """
    return html, 200


# -------------------------------------
# MAIN
# -------------------------------------
if __name__ == "__main__":
    app.run(port=5000, debug=True)
