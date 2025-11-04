#!/usr/bin/env python3
"""
Migration script to fix perform_credibility_check procedure
Drops and recreates the procedure with correct signature (4 parameters, no ai_score)
"""

from db_config import get_connection

def fix_procedure():
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        print("Dropping existing perform_credibility_check procedure...")
        cursor.execute("DROP PROCEDURE IF EXISTS perform_credibility_check")
        conn.commit()
        
        print("Creating new perform_credibility_check procedure with 4 parameters...")
        # Execute CREATE PROCEDURE as a single statement
        # MySQL connector can handle this without DELIMITER when executed via Python
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
        
        print("✅ Procedure created successfully!")
        print("   Parameters: art_id, fact_score, verdict, checker_id (4 total)")
        
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
    fix_procedure()

