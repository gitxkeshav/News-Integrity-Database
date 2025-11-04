#!/usr/bin/env python3
"""
Migration script to fix update_source_trust_after_check trigger
Removes AI_Score references and uses only FactCheckScore
"""

from db_config import get_connection

def fix_trigger():
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        print("Dropping existing update_source_trust_after_check trigger...")
        cursor.execute("DROP TRIGGER IF EXISTS update_source_trust_after_check")
        conn.commit()
        
        print("Creating new trigger without AI_Score...")
        # Execute trigger creation - MySQL connector handles this
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
        
        print("✅ Trigger created successfully!")
        print("   Trigger now uses only FactCheckScore (no AI_Score)")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        if conn:
            conn.rollback()
        raise

if __name__ == "__main__":
    fix_trigger()

