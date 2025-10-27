from flask import Flask, request, jsonify
from flask_cors import CORS
from db_config import get_connection

app = Flask(__name__)
CORS(app)

# -------------------------------------
# USER ROUTES
# -------------------------------------
@app.route("/api/users", methods=["POST"])
def add_user():
    data = request.json
    db = get_connection()
    cursor = db.cursor()
    query = "INSERT INTO UserAccount (Name, Email, UserRole, PasswordHash) VALUES (%s, %s, %s, %s)"
    values = (data["name"], data["email"], data["role"], data["password"])
    cursor.execute(query, values)
    db.commit()
    cursor.close()
    db.close()
    return jsonify({"message": "User added successfully"}), 201

# -------------------------------------
# SOURCE ROUTES
# -------------------------------------
@app.route("/api/sources", methods=["POST"])
def add_source():
    data = request.json
    db = get_connection()
    cursor = db.cursor()
    query = "INSERT INTO Source (SourceName, Domain, TrustRating) VALUES (%s, %s, %s)"
    values = (data["name"], data["domain"], data["trust"])
    cursor.execute(query, values)
    db.commit()
    cursor.close()
    db.close()
    return jsonify({"message": "Source added successfully"}), 201

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


# -------------------------------------
# MAIN
# -------------------------------------
if __name__ == "__main__":
    app.run(port=5000, debug=True)
