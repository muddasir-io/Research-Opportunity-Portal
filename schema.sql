-- Database Creation Script for University Research Opportunity Portal
-- Database: MySQL

CREATE DATABASE IF NOT EXISTS `research_portal_db`;
USE `research_portal_db`;

DROP TABLE IF EXISTS `research_opportunities`;

CREATE TABLE `research_opportunities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `research_area` VARCHAR(100) NOT NULL,
  `faculty_name` VARCHAR(100) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `required_skills` TEXT NOT NULL,
  `available_positions` INT NOT NULL,
  `application_deadline` DATE NOT NULL,
  `status` ENUM('Open', 'Closed') NOT NULL DEFAULT 'Open',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Sample Data for initial testing
INSERT INTO `research_opportunities` 
  (`title`, `description`, `research_area`, `faculty_name`, `department`, `required_skills`, `available_positions`, `application_deadline`, `status`)
VALUES
  (
    'Deep Learning for Medical Image Segmentation', 
    'Investigating multi-modal vision transformers for early detection of brain tumors in MRI scans.', 
    'Artificial Intelligence', 
    'Dr. Tariq Ahmad', 
    'Computer Science', 
    'Python, PyTorch, OpenCV, Computer Vision', 
    3, 
    '2026-11-30', 
    'Open'
  ),
  (
    'Software-Defined Networking in Edge Computing', 
    'Analyzing latency optimization algorithms in SDN-enabled IoT networks.', 
    'Computer Networks', 
    'Dr. Sara Khan', 
    'Computer Science', 
    'Mininet, C++, Python, Wireshark, OpenFlow', 
    2, 
    '2026-12-15', 
    'Open'
  ),
  (
    'Post-Quantum Cryptography Protocols', 
    'Evaluating lattice-based cryptographic algorithms for securing lightweight IoT sensor nodes.', 
    'Cyber Security', 
    'Dr. Muhammad Bilal', 
    'Cyber Security', 
    'C, Cryptography, SageMath, Linux', 
    1, 
    '2026-10-25', 
    'Closed'
  );
