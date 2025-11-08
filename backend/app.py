# backend/app.py
from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from db_config import get_connection
import traceback
from werkzeug.security import generate_password_hash, check_password_hash
import secrets

app = Flask(__name__)
CORS(app)


# -----------------------
# Helper Functions
# -----------------------
def recreate_trigger_without_ai_score(cursor, conn):
    """Recreate the update_source_trust_after_check trigger without AI_Score"""
    cursor.execute("DROP TRIGGER IF EXISTS update_source_trust_after_check")
    conn.commit()


def ensure_password_column(cursor, conn):
    """Ensure useraccount has PasswordHash column."""
    try:
        cursor.execute("SHOW COLUMNS FROM useraccount LIKE 'PasswordHash'")
        if cursor.fetchone() is None:
            cursor.execute("ALTER TABLE useraccount ADD COLUMN PasswordHash VARCHAR(255) NULL")
            conn.commit()
    except Exception:
        # ignore if cannot alter
        pass


# -----------------------
# AUTH ROUTES
# -----------------------
@app.route("/api/auth/signup", methods=["POST"])
def auth_signup():
    data = request.json or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = (data.get("role") or "user").strip()

    if not name or not email or not password:
        return jsonify({"error": "Missing name, email, or password"}), 400

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Ensure PasswordHash column exists
        ensure_password_column(cursor, conn)

        # Prevent duplicate emails
        cursor.execute("SELECT UserID FROM useraccount WHERE Email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"error": "Email already registered"}), 409

        pwd_hash = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO useraccount (Name, Email, Role, PasswordHash) VALUES (%s, %s, %s, %s)",
            (name, email, role, pwd_hash)
        )
        conn.commit()

        # Fetch inserted user (id)
        cursor.execute("SELECT LAST_INSERT_ID()")
        user_id_row = cursor.fetchone()
        user_id = int(user_id_row[0]) if user_id_row else None

        token = secrets.token_urlsafe(32)
        return jsonify({
            "token": token,
            "user": {"UserID": user_id, "Name": name, "Email": email, "Role": role}
        }), 201
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    data = request.json or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Ensure PasswordHash column exists
        ensure_password_column(cursor, conn)

        cursor.execute("SELECT UserID, Name, Email, Role, PasswordHash FROM useraccount WHERE Email = %s", (email,))
        user = cursor.fetchone()
        if not user or not user.get("PasswordHash"):
            return jsonify({"error": "Invalid credentials"}), 401
        if not check_password_hash(user["PasswordHash"], password):
            return jsonify({"error": "Invalid credentials"}), 401

        token = secrets.token_urlsafe(32)
        return jsonify({
            "token": token,
            "user": {"UserID": user["UserID"], "Name": user["Name"], "Email": user["Email"], "Role": user["Role"]}
        }), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
    cursor.execute("""
        CREATE TRIGGER update_source_trust_after_check
        AFTER INSERT ON credibilitycheck
        FOR EACH ROW
        BEGIN
            DECLARE avg_score DECIMAL(5,4);
            SELECT AVG(COALESCE(c.FactCheckScore, 0))
            INTO avg_score
            FROM credibilitycheck c
            JOIN article a ON c.ArticleID = a.ArticleID
            WHERE a.SourceID = (
                SELECT SourceID FROM article WHERE ArticleID = NEW.ArticleID
            );
            IF avg_score IS NOT NULL THEN
                UPDATE source
                SET TrustRating = ROUND(avg_score * 100, 2)
                WHERE SourceID = (
                    SELECT SourceID FROM article WHERE ArticleID = NEW.ArticleID
                );
            END IF;
        END
    """)
    conn.commit()


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
    Only fact-checkers and admins can perform credibility checks
    expects JSON:
    {
      "article_id": int,
      "factcheck_score": float (0..1),
      "final_verdict": "Real"|"Fake"|"Unverified",
      "checked_by": int (UserID)
    }
    """
    data = request.json or {}
    required = ("article_id", "factcheck_score", "final_verdict", "checked_by")
    if not all(k in data for k in required):
        return jsonify({"error": "Missing required fields"}), 400

    # basic validation
    try:
        article_id = int(data["article_id"])
        fact_score = float(data["factcheck_score"])
        final_verdict = str(data["final_verdict"])
        checked_by = int(data["checked_by"])

        if not (0.0 <= fact_score <= 1.0):
            return jsonify({"error": "Fact-check score must be between 0 and 1"}), 400
        if final_verdict not in ("Real", "Fake", "Unverified"):
            return jsonify({"error": "Invalid final_verdict"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid numeric values"}), 400

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if user is a fact-checker or admin
        cursor.execute("SELECT Role FROM useraccount WHERE UserID = %s", (checked_by,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        if user["Role"] not in ("fact-checker", "admin"):
            return jsonify({
                "error": "Unauthorized: Only fact-checkers and admins can perform credibility checks",
                "user_role": user["Role"]
            }), 403
        
        # User is authorized, proceed with credibility check
        
        # First, check if AI_Score column exists and remove it
        try:
            cursor.execute("SHOW COLUMNS FROM credibilitycheck LIKE 'AI_Score'")
            if cursor.fetchone():
                print("Removing AI_Score column from credibilitycheck table...")
                cursor.execute("ALTER TABLE credibilitycheck DROP COLUMN AI_Score")
                conn.commit()
                print("AI_Score column removed successfully")
        except Exception as col_error:
            # Column might not exist or already removed
            pass
        
        # Reset cursor for procedure call (non-dictionary cursor for callproc)
        cursor = conn.cursor()
        
        # Check and fix trigger if it references AI_Score
        try:
            # Check if trigger exists and has AI_Score reference
            cursor.execute("SHOW TRIGGERS LIKE 'update_source_trust_after_check'")
            trigger_exists = cursor.fetchone()
            
            if trigger_exists:
                # Check trigger definition for AI_Score
                cursor.execute("SHOW CREATE TRIGGER update_source_trust_after_check")
                trigger_def = cursor.fetchone()
                if trigger_def and len(trigger_def) > 2 and 'AI_Score' in trigger_def[2]:  # Column 2 contains the SQL
                    print("Trigger still references AI_Score, recreating...")
                    recreate_trigger_without_ai_score(cursor, conn)
        except Exception as trigger_error:
            # If we can't check/fix trigger, continue - will fail on INSERT if trigger is broken
            print(f"Warning: Could not check/fix trigger: {trigger_error}")
        
        # Try calling the procedure - if it fails due to wrong signature, use direct INSERT
        try:
            cursor.callproc("perform_credibility_check", (article_id, fact_score, final_verdict, checked_by))
        except Exception as proc_call_error:
            error_msg = str(proc_call_error)
            # If error is about incorrect number of arguments, use direct INSERT instead
            # This handles the case where the database still has the old procedure with 5 params
            if "Incorrect number of arguments" in error_msg or "42000" in error_msg:
                # Use direct INSERT - this achieves the same result and triggers will still fire
                # But first check if trigger needs fixing
                try:
                    cursor.execute("SHOW CREATE TRIGGER update_source_trust_after_check")
                    trigger_def = cursor.fetchone()
                    if trigger_def and len(trigger_def) > 2 and 'AI_Score' in trigger_def[2]:
                        recreate_trigger_without_ai_score(cursor, conn)
                except:
                    pass  # Continue with INSERT even if trigger check fails
                
                cursor.execute(
                    "INSERT INTO credibilitycheck (ArticleID, FactCheckScore, FinalVerdict, CheckedBy) VALUES (%s, %s, %s, %s)",
                    (article_id, fact_score, final_verdict, checked_by)
                )
            else:
                # If error is about AI_Score in trigger, recreate trigger and retry
                if "AI_Score" in error_msg:
                    try:
                        recreate_trigger_without_ai_score(cursor, conn)
                        # Retry the INSERT after fixing trigger
                        cursor.execute(
                            "INSERT INTO credibilitycheck (ArticleID, FactCheckScore, FinalVerdict, CheckedBy) VALUES (%s, %s, %s, %s)",
                            (article_id, fact_score, final_verdict, checked_by)
                        )
                    except Exception as trigger_fix_error:
                        traceback.print_exc()
                        return jsonify({"error": f"Failed to fix trigger: {str(trigger_fix_error)}"}), 500
                else:
                    # Re-raise if it's a different error
                    raise proc_call_error
        
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
# ANALYTICS & COMPLEX QUERIES
# -----------------------
@app.route("/api/analytics/top_trusted_sources", methods=["GET"])
def get_top_trusted_sources():
    """Get top 5 most trusted sources"""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT SourceID, Name AS SourceName, Domain, TrustRating
            FROM source
            ORDER BY TrustRating DESC
            LIMIT 5
        """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(rows), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/analytics/under_review_articles", methods=["GET"])
def get_under_review_articles():
    """Get articles marked 'Under Review' with their report count (trigger effect)"""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if ReviewStatus column exists
        review_status_exists = False
        try:
            cursor.execute("SHOW COLUMNS FROM article LIKE 'ReviewStatus'")
            review_status_exists = cursor.fetchone() is not None
        except:
            pass
        
        if review_status_exists:
            query = """
                SELECT a.ArticleID, a.Title, s.Name AS SourceName, 
                       COUNT(r.ReportID) AS TotalReports, a.ReviewStatus
                FROM article a
                JOIN source s ON a.SourceID = s.SourceID
                LEFT JOIN report r ON a.ArticleID = r.ArticleID
                WHERE a.ReviewStatus = 'Under Review'
                GROUP BY a.ArticleID, a.Title, s.Name, a.ReviewStatus
                ORDER BY TotalReports DESC
            """
        else:
            # If column doesn't exist, return empty or articles with 3+ reports
            query = """
                SELECT a.ArticleID, a.Title, s.Name AS SourceName, 
                       COUNT(r.ReportID) AS TotalReports, 'Under Review' AS ReviewStatus
                FROM article a
                JOIN source s ON a.SourceID = s.SourceID
                LEFT JOIN report r ON a.ArticleID = r.ArticleID
                GROUP BY a.ArticleID, a.Title, s.Name
                HAVING COUNT(r.ReportID) >= 3
                ORDER BY TotalReports DESC
            """
        
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(rows), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/analytics/active_reporters", methods=["GET"])
def get_active_reporters():
    """Get users who submitted more than 2 reports"""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT u.UserID, u.Name, u.Email, u.Role, COUNT(r.ReportID) AS TotalReports
            FROM useraccount u
            JOIN report r ON u.UserID = r.UserID
            GROUP BY u.UserID, u.Name, u.Email, u.Role
            HAVING COUNT(r.ReportID) > 2
            ORDER BY TotalReports DESC
        """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(rows), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/analytics/articles_with_report_count", methods=["GET"])
def get_articles_with_report_count():
    """Get all articles with their report counts using the function"""
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if ReviewStatus column exists
        review_status_exists = False
        try:
            cursor.execute("SHOW COLUMNS FROM article LIKE 'ReviewStatus'")
            review_status_exists = cursor.fetchone() is not None
        except:
            pass
        
        if review_status_exists:
            query = """
                SELECT a.ArticleID, a.Title, s.Name AS SourceName, 
                       report_count_for_article(a.ArticleID) AS ReportCount,
                       a.ReviewStatus
                FROM article a
                JOIN source s ON a.SourceID = s.SourceID
                ORDER BY ReportCount DESC, a.Title
            """
        else:
            query = """
                SELECT a.ArticleID, a.Title, s.Name AS SourceName, 
                       report_count_for_article(a.ArticleID) AS ReportCount,
                       'Normal' AS ReviewStatus
                FROM article a
                JOIN source s ON a.SourceID = s.SourceID
                ORDER BY ReportCount DESC, a.Title
            """
        
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(rows), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


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
        cursor.execute("SELECT SourceID, Name, Domain, TrustRating, CreatedAt FROM source ORDER BY Name")
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
        
        # Check if ReviewStatus column exists, if not add it
        review_status_exists = False
        try:
            cursor.execute("SHOW COLUMNS FROM article LIKE 'ReviewStatus'")
            review_status_exists = cursor.fetchone() is not None
        except:
            pass
        
        if not review_status_exists:
            try:
                cursor.execute("""
                    ALTER TABLE article 
                    ADD COLUMN ReviewStatus ENUM('Normal','Under Review') DEFAULT 'Normal'
                """)
                conn.commit()
                review_status_exists = True
                print("ReviewStatus column added to article table")
            except Exception as alter_error:
                # Column might already exist or there's a permission issue
                print(f"Could not add ReviewStatus column: {alter_error}")
                review_status_exists = False
        
        # Build query based on whether ReviewStatus exists
        if review_status_exists:
            query = """
                SELECT a.ArticleID, a.Title, a.URL, a.PublishDate, 
                       a.ReviewStatus,
                       s.Name AS SourceName,
                       COALESCE(MAX(c.FinalVerdict), 'Unverified') AS CredibilityVerdict
                FROM article a
                JOIN source s ON a.SourceID = s.SourceID
                LEFT JOIN credibilitycheck c ON a.ArticleID = c.ArticleID
                GROUP BY a.ArticleID, a.Title, a.URL, a.PublishDate, a.ReviewStatus, s.Name
                ORDER BY a.CreatedAt DESC
            """
        else:
            # Fallback query without ReviewStatus
            query = """
                SELECT a.ArticleID, a.Title, a.URL, a.PublishDate, 
                       'Normal' AS ReviewStatus,
                       s.Name AS SourceName,
                       COALESCE(MAX(c.FinalVerdict), 'Unverified') AS CredibilityVerdict
                FROM article a
                JOIN source s ON a.SourceID = s.SourceID
                LEFT JOIN credibilitycheck c ON a.ArticleID = c.ArticleID
                GROUP BY a.ArticleID, a.Title, a.URL, a.PublishDate, s.Name
                ORDER BY a.CreatedAt DESC
            """
        
        cursor.execute(query)
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
    """
    DEPRECATED: Use /api/perform_check instead (uses stored procedure with role validation)
    This endpoint is kept for backward compatibility but will be removed
    """
    data = request.json or {}
    required = ("article_id", "factcheck_score", "final_verdict")
    if not all(k in data for k in required):
        return jsonify({"error": "Missing required fields"}), 400

    # Check if checked_by is provided and validate role
    checked_by = data.get("checked_by")
    if checked_by:
        conn = None
        cursor = None
        try:
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT Role FROM useraccount WHERE UserID = %s", (int(checked_by),))
            user = cursor.fetchone()
            
            if user and user["Role"] not in ("fact-checker", "admin"):
                return jsonify({
                    "error": "Unauthorized: Only fact-checkers and admins can perform credibility checks",
                    "user_role": user["Role"]
                }), 403
        except:
            pass
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO credibilitycheck (ArticleID, FactCheckScore, FinalVerdict, CheckedBy) VALUES (%s, %s, %s, %s)",
            (int(data["article_id"]), (None if data.get("factcheck_score") in (None, "") else float(data["factcheck_score"])), data["final_verdict"], (None if checked_by in (None, "") else int(checked_by))),
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
            SELECT c.CheckID, a.Title AS ArticleTitle, c.FactCheckScore,
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
    app.run(host="0.0.0.0", port=5000, debug=True)
