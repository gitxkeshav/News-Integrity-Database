#!/usr/bin/env python3
"""
Comprehensive migration script to remove all AI_Score references
- Drops and recreates perform_credibility_check procedure (4 params)
- Drops and recreates update_source_trust_after_check trigger (no AI_Score)
- Drops and recreates avg_credibility_for_source function (no AI_Score)
"""

from db_config import get_connection

def fix_all():
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        print("=" * 60)
        print("Removing all AI_Score references from database")
        print("=" * 60)
        
        # 1. Fix Procedure
        print("\n1. Fixing perform_credibility_check procedure...")
        cursor.execute("DROP PROCEDURE IF EXISTS perform_credibility_check")
        conn.commit()
        
        cursor.execute("""
            CREATE PROCEDURE perform_credibility_check (
                IN art_id INT,
                IN fact_score DECIMAL(3,2),
                IN verdict VARCHAR(20),
                IN checker_id INT
            )
            BEGIN
                INSERT INTO credibilitycheck (ArticleID, FactCheckScore, FinalVerdict, CheckedBy)
                VALUES (art_id, fact_score, verdict, checker_id);
            END
        """)
        conn.commit()
        print("   ✅ Procedure created with 4 parameters (no ai_score)")
        
        # 2. Fix Trigger
        print("\n2. Fixing update_source_trust_after_check trigger...")
        cursor.execute("DROP TRIGGER IF EXISTS update_source_trust_after_check")
        conn.commit()
        
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
        print("   ✅ Trigger created without AI_Score reference")
        
        # 3. Fix Function
        print("\n3. Fixing avg_credibility_for_source function...")
        cursor.execute("DROP FUNCTION IF EXISTS avg_credibility_for_source")
        conn.commit()
        
        cursor.execute("""
            CREATE FUNCTION avg_credibility_for_source(src_id INT)
            RETURNS DECIMAL(5,2)
            DETERMINISTIC
            BEGIN
                DECLARE avg_score DECIMAL(5,4);

                SELECT AVG(COALESCE(FactCheckScore, 0))
                INTO avg_score
                FROM credibilitycheck c
                JOIN article a ON c.ArticleID = a.ArticleID
                WHERE a.SourceID = src_id;

                RETURN IFNULL(ROUND(avg_score * 100, 2), 0.00);
            END
        """)
        conn.commit()
        print("   ✅ Function created without AI_Score reference")
        
        # 4. Check if AI_Score column exists in table and remove it
        print("\n4. Checking credibilitycheck table for AI_Score column...")
        cursor.execute("SHOW COLUMNS FROM credibilitycheck LIKE 'AI_Score'")
        ai_score_col = cursor.fetchone()
        
        if ai_score_col:
            print("   ⚠️  AI_Score column found in credibilitycheck table")
            print("   Dropping AI_Score column...")
            cursor.execute("ALTER TABLE credibilitycheck DROP COLUMN AI_Score")
            conn.commit()
            print("   ✅ AI_Score column removed")
        else:
            print("   ✅ AI_Score column does not exist (already removed)")
        
        print("\n" + "=" * 60)
        print("✅ All AI_Score references have been removed!")
        print("=" * 60)
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        if conn:
            conn.rollback()
        raise

if __name__ == "__main__":
    fix_all()

