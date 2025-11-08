/*
==========================================================
  Project: Fake News Detection Database System
  Description: DBMS mini-project for managing news credibility
  Team Members:
    - Member 1: KESHAV SINGHAL (Database & Backend)
    - Member 2: KARTHIKEYA K (Frontend & Testing)
  
==========================================================
*/

-- Use the database that exists on your system
CREATE DATABASE IF NOT EXISTS fakenewsdb
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE fakenewsdb;

-- USER TABLE (matches your current schema)
CREATE TABLE IF NOT EXISTS useraccount (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(150) NOT NULL UNIQUE,
    Role ENUM('admin','fact-checker','user') NOT NULL DEFAULT 'user',
    PasswordHash VARCHAR(255) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SOURCE TABLE (uses column Name, Domain, TrustRating)
CREATE TABLE IF NOT EXISTS source (
    SourceID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(150) NOT NULL,
    Domain VARCHAR(200) NOT NULL UNIQUE,
    TrustRating DECIMAL(5,2) DEFAULT 50.00 CHECK (TrustRating BETWEEN 0 AND 100),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ARTICLE TABLE
CREATE TABLE IF NOT EXISTS article (
    ArticleID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(300) NOT NULL,
    Content TEXT NOT NULL,
    URL VARCHAR(500) NOT NULL UNIQUE,
    SourceID INT NOT NULL,
    PublishDate DATE NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (SourceID) REFERENCES source(SourceID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- REPORT TABLE
CREATE TABLE IF NOT EXISTS report (
    ReportID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    ArticleID INT NOT NULL,
    Reason VARCHAR(255),
    ReportDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('Open','Reviewed','Dismissed') DEFAULT 'Open',
    FOREIGN KEY (UserID) REFERENCES useraccount(UserID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ArticleID) REFERENCES article(ArticleID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_user_article (UserID, ArticleID)
);

-- CREDIBILITYCHECK TABLE
CREATE TABLE IF NOT EXISTS credibilitycheck (
    CheckID INT AUTO_INCREMENT PRIMARY KEY,
    ArticleID INT NOT NULL,
    FactCheckScore DECIMAL(3,2) DEFAULT NULL CHECK (FactCheckScore BETWEEN 0 AND 1),
    FinalVerdict ENUM('Fake','Real','Unverified') DEFAULT 'Unverified',
    CheckedBy INT DEFAULT NULL,
    CheckDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ArticleID) REFERENCES article(ArticleID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (CheckedBy) REFERENCES useraccount(UserID)
        ON DELETE SET NULL
);

-- SAMPLE DATA (only run if you want sample rows)
-- USERS
INSERT INTO useraccount (Name, Email, Role, PasswordHash) VALUES
('Alice Admin', 'alice@example.com', 'admin', 'hash_admin_123'),
('Bob Checker', 'bob@example.com', 'fact-checker', 'hash_checker_123'),
('Charlie User', 'charlie@example.com', 'user', 'hash_user_123')
ON DUPLICATE KEY UPDATE Email = Email;

-- SOURCES
INSERT INTO source (Name, Domain, TrustRating) VALUES
('Trusted Times', 'trustedtimes.com', 90.00),
('Local Buzz', 'localbuzz.in', 45.00),
('Mystery Blog', 'mysteryblog.net', 20.00)
ON DUPLICATE KEY UPDATE Domain = Domain;

-- ARTICLES
INSERT INTO article (Title, Content, URL, SourceID, PublishDate) VALUES
('Budget 2025 Announced', 'Finance ministry announces...', 'https://trustedtimes.com/budget2025', 1, '2025-10-01'),
('Aliens Visit Earth', 'Strange lights spotted...', 'https://mysteryblog.net/aliens', 3, '2025-10-05'),
('School Wins Award', 'A local school achieved...', 'https://localbuzz.in/award', 2, '2025-09-20')
ON DUPLICATE KEY UPDATE URL = URL;

-- REPORTS
INSERT INTO report (UserID, ArticleID, Reason, Status) VALUES
(3, 2, 'Seems unrealistic - aliens not confirmed', 'Open'),
(3, 3, 'Unverified source mentioned', 'Reviewed')
ON DUPLICATE KEY UPDATE Reason = Reason;

-- CREDIBILITY CHECKS
INSERT INTO credibilitycheck (ArticleID, FactCheckScore, FinalVerdict, CheckedBy) VALUES
(1, 0.90, 'Real', 2),
(2, 0.10, 'Fake', 2),
(3, 0.55, 'Unverified', 2)
ON DUPLICATE KEY UPDATE CheckID = CheckID;

-- Useful verification queries

-- Show all tables
SHOW TABLES;

-- View all users
SELECT UserID, Name, Email, Role, CreatedAt FROM useraccount;

-- List all fake or unverified articles
SELECT a.Title, s.Name AS SourceName, c.FinalVerdict
FROM article a
JOIN credibilitycheck c ON a.ArticleID = c.ArticleID
JOIN source s ON a.SourceID = s.SourceID
WHERE c.FinalVerdict IN ('Fake', 'Unverified');

-- Count number of reports per article
SELECT a.Title, COUNT(r.ReportID) AS TotalReports
FROM article a
LEFT JOIN report r ON a.ArticleID = r.ArticleID
GROUP BY a.ArticleID;

-- Average trust rating grouped by verdict
SELECT c.FinalVerdict, AVG(s.TrustRating) AS AvgTrust
FROM credibilitycheck c
JOIN article a ON c.ArticleID = a.ArticleID
JOIN source s ON a.SourceID = s.SourceID
GROUP BY c.FinalVerdict;

-- Show full report with reporter and article details
SELECT r.ReportID, u.Name AS Reporter, a.Title AS Article, r.Reason, r.Status, r.ReportDate
FROM report r
JOIN useraccount u ON r.UserID = u.UserID
JOIN article a ON r.ArticleID = a.ArticleID;



USE fakenewsdb;

-- SAFE DROPS (if already exist)
DROP TRIGGER IF EXISTS update_source_trust_after_check;
DROP TRIGGER IF EXISTS flag_article_after_report;
DROP PROCEDURE IF EXISTS perform_credibility_check;
DROP PROCEDURE IF EXISTS mark_report_reviewed;
DROP FUNCTION IF EXISTS avg_credibility_for_source;
DROP FUNCTION IF EXISTS report_count_for_article;
------------------------------------------------------------------------
-- 1) TRIGGERS

DELIMITER $$
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
        -- Scale to 0-100 and round to 2 decimals
        UPDATE source
        SET TrustRating = ROUND(avg_score * 100, 2)
        WHERE SourceID = (
            SELECT SourceID FROM article WHERE ArticleID = NEW.ArticleID
        );
    END IF;
END$$
DELIMITER ;

-- Add ReviewStatus column to article if not present
-- Note: MySQL doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- Run this manually if the column doesn't exist:
-- ALTER TABLE article ADD COLUMN ReviewStatus ENUM('Normal','Under Review') DEFAULT 'Normal';

DELIMITER $$
CREATE TRIGGER flag_article_after_report
AFTER INSERT ON report
FOR EACH ROW
BEGIN
    DECLARE report_count INT;

    SELECT COUNT(*) INTO report_count
    FROM report
    WHERE ArticleID = NEW.ArticleID;

    IF report_count >= 3 THEN
        UPDATE article
        SET ReviewStatus = 'Under Review'
        WHERE ArticleID = NEW.ArticleID;
    END IF;
END$$
DELIMITER ;

-- 2) PROCEDURES

DELIMITER $$
CREATE PROCEDURE perform_credibility_check (
    IN art_id INT,
    IN fact_score DECIMAL(3,2),
    IN verdict VARCHAR(20),
    IN checker_id INT
)
BEGIN
    INSERT INTO credibilitycheck (ArticleID, FactCheckScore, FinalVerdict, CheckedBy)
    VALUES (art_id, fact_score, verdict, checker_id);
    -- trigger update_source_trust_after_check will run automatically after insert
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE mark_report_reviewed (
    IN rep_id INT
)
BEGIN
    UPDATE report
    SET Status = 'Reviewed'
    WHERE ReportID = rep_id;
END$$
DELIMITER ;

-- 3) FUNCTIONS

DELIMITER $$
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
END$$
DELIMITER ;

DELIMITER $$
CREATE FUNCTION report_count_for_article(art_id INT)
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE rep_count INT;
    SELECT COUNT(*) INTO rep_count FROM report WHERE ArticleID = art_id;
    RETURN IFNULL(rep_count, 0);
END$$
DELIMITER ;

-- 4) COMPLEX SQL QUERIES 
1️⃣ Find top 5 most trusted sources
SELECT Name AS SourceName, Domain, TrustRating
FROM source
ORDER BY TrustRating DESC
LIMIT 5;

2️⃣ List all articles marked “Under Review” with their report count
SELECT a.Title, COUNT(r.ReportID) AS TotalReports
FROM article a
JOIN report r ON a.ArticleID = r.ArticleID
WHERE a.ReviewStatus = 'Under Review'
GROUP BY a.ArticleID;

3️⃣ Show 5 most recent credibility checks with verdicts and source info
SELECT c.CheckID, a.Title, s.Name AS SourceName, c.FactCheckScore, 
       c.FinalVerdict, c.CheckDate
FROM credibilitycheck c
JOIN article a ON c.ArticleID = a.ArticleID
JOIN source s ON a.SourceID = s.SourceID
ORDER BY c.CheckDate DESC
LIMIT 5;

4️⃣ List users who submitted more than 2 reports
SELECT u.Name, COUNT(r.ReportID) AS TotalReports
FROM useraccount u
JOIN report r ON u.UserID = r.UserID
GROUP BY u.UserID
HAVING COUNT(r.ReportID) > 2;

