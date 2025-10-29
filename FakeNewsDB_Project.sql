/*
==========================================================
  Project: Fake News Detection Database System
  Description: DBMS mini-project for managing news credibility
  Team Members:
    - Member 1: [Your Name] (Database & Backend)
    - Member 2: [Partner’s Name] (Frontend & Testing)
  Date: October 2025
  DBMS: MySQL 8.x
==========================================================
*/

-- Create Database
CREATE DATABASE IF NOT EXISTS FakeNewsDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE FakeNewsDB;


-- USER TABLE
CREATE TABLE IF NOT EXISTS UserAccount (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    UserName VARCHAR(100) NOT NULL,
    Email VARCHAR(150) NOT NULL UNIQUE,
    UserRole ENUM('admin', 'fact-checker', 'user') NOT NULL DEFAULT 'user',
    PasswordHash VARCHAR(255) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SOURCE TABLE
CREATE TABLE IF NOT EXISTS Source (
    SourceID INT AUTO_INCREMENT PRIMARY KEY,
    SourceName VARCHAR(150) NOT NULL,
    Domain VARCHAR(200) NOT NULL UNIQUE,
    TrustRating DECIMAL(5,2) DEFAULT 50.00 CHECK (TrustRating BETWEEN 0 AND 100),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ARTICLE TABLE
CREATE TABLE IF NOT EXISTS Article (
    ArticleID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(300) NOT NULL,
    Content TEXT NOT NULL,
    URL VARCHAR(500) NOT NULL UNIQUE,
    SourceID INT NOT NULL,
    PublishDate DATE NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (SourceID) REFERENCES Source(SourceID)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- REPORT TABLE
CREATE TABLE IF NOT EXISTS Report (
    ReportID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    ArticleID INT NOT NULL,
    Reason VARCHAR(255),
    ReportDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('Open', 'Reviewed', 'Dismissed') DEFAULT 'Open',
    FOREIGN KEY (UserID) REFERENCES UserAccount(UserID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ArticleID) REFERENCES Article(ArticleID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_user_article (UserID, ArticleID)
);

-- CREDIBILITYCHECK TABLE
CREATE TABLE IF NOT EXISTS CredibilityCheck (
    CheckID INT AUTO_INCREMENT PRIMARY KEY,
    ArticleID INT NOT NULL,
    AI_Score DECIMAL(3,2) DEFAULT 0.00 CHECK (AI_Score BETWEEN 0 AND 1),
    FactCheckScore DECIMAL(3,2) DEFAULT NULL CHECK (FactCheckScore BETWEEN 0 AND 1),
    FinalVerdict ENUM('Fake', 'Real', 'Unverified') DEFAULT 'Unverified',
    CheckedBy INT DEFAULT NULL,
    CheckDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ArticleID) REFERENCES Article(ArticleID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (CheckedBy) REFERENCES UserAccount(UserID)
        ON DELETE SET NULL
);


-- USERS
INSERT INTO UserAccount (UserName, Email, UserRole, PasswordHash) VALUES
('Alice Admin', 'alice@example.com', 'admin', 'hash_admin_123'),
('Bob Checker', 'bob@example.com', 'fact-checker', 'hash_checker_123'),
('Charlie User', 'charlie@example.com', 'user', 'hash_user_123');

-- SOURCES
INSERT INTO Source (SourceName, Domain, TrustRating) VALUES
('Trusted Times', 'trustedtimes.com', 90.00),
('Local Buzz', 'localbuzz.in', 45.00),
('Mystery Blog', 'mysteryblog.net', 20.00);

-- ARTICLES
INSERT INTO Article (Title, Content, URL, SourceID, PublishDate) VALUES
('Budget 2025 Announced', 'Finance ministry announces...', 'https://trustedtimes.com/budget2025', 1, '2025-10-01'),
('Aliens Visit Earth', 'Strange lights spotted...', 'https://mysteryblog.net/aliens', 3, '2025-10-05'),
('School Wins Award', 'A local school achieved...', 'https://localbuzz.in/award', 2, '2025-09-20');

-- REPORTS
INSERT INTO Report (UserID, ArticleID, Reason, Status) VALUES
(3, 2, 'Seems unrealistic - aliens not confirmed', 'Open'),
(3, 3, 'Unverified source mentioned', 'Reviewed');

-- CREDIBILITY CHECKS
INSERT INTO CredibilityCheck (ArticleID, AI_Score, FactCheckScore, FinalVerdict, CheckedBy) VALUES
(1, 0.95, 0.90, 'Real', 2),
(2, 0.15, 0.10, 'Fake', 2),
(3, 0.50, 0.55, 'Unverified', 2);



-- Show all tables
SHOW TABLES;

-- View all users
SELECT * FROM UserAccount;

-- List all fake or unverified articles
SELECT a.Title, s.SourceName, c.FinalVerdict
FROM Article a
JOIN CredibilityCheck c ON a.ArticleID = c.ArticleID
JOIN Source s ON a.SourceID = s.SourceID
WHERE c.FinalVerdict IN ('Fake', 'Unverified');

-- Count number of reports per article
SELECT a.Title, COUNT(r.ReportID) AS TotalReports
FROM Article a
LEFT JOIN Report r ON a.ArticleID = r.ArticleID
GROUP BY a.ArticleID;

-- Average trust rating grouped by verdict
SELECT c.FinalVerdict, AVG(s.TrustRating) AS AvgTrust
FROM CredibilityCheck c
JOIN Article a ON c.ArticleID = a.ArticleID
JOIN Source s ON a.SourceID = s.SourceID
GROUP BY c.FinalVerdict;

-- Show full report with reporter and article details
SELECT r.ReportID, u.Name AS Reporter, a.Title AS Article, r.Reason, r.Status, r.ReportDate
FROM Report r
JOIN UserAccount u ON r.UserID = u.UserID
JOIN Article a ON r.ArticleID = a.ArticleID;
