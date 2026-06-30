-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: it_equipment_management
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `it_equipment_management`
--

/*!40000 DROP DATABASE IF EXISTS `it_equipment_management`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `it_equipment_management` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `it_equipment_management`;

--
-- Table structure for table `asset_categories`
--

DROP TABLE IF EXISTS `asset_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `asset_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_categories`
--

LOCK TABLES `asset_categories` WRITE;
/*!40000 ALTER TABLE `asset_categories` DISABLE KEYS */;
INSERT INTO `asset_categories` VALUES (1,'Laptop',NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(2,'Desktop',NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(3,'Monitor',NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(4,'Printer',NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(5,'Server',NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(6,'Network Equipment',NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(7,'Tablet',NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(8,'Mobile Phone',NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(9,'Keyboard',NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(10,'Mouse',NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(11,'Headset',NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(12,'Projector',NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(13,'UPS',NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(14,'Scanner',NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(15,'Camera',NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(16,'Other',NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49');
/*!40000 ALTER TABLE `asset_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_history`
--

DROP TABLE IF EXISTS `asset_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `asset_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_id` int(11) NOT NULL,
  `action_type` varchar(50) NOT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `action_by` int(11) NOT NULL,
  `action_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `remark` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `action_by` (`action_by`),
  KEY `idx_asset_history_asset` (`asset_id`),
  CONSTRAINT `asset_history_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `asset_history_ibfk_2` FOREIGN KEY (`action_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_history`
--

LOCK TABLES `asset_history` WRITE;
/*!40000 ALTER TABLE `asset_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `asset_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assets`
--

DROP TABLE IF EXISTS `assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_code` varchar(50) NOT NULL,
  `asset_name` varchar(200) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `asset_tag` varchar(100) DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL,
  `condition_status` enum('new','good','fair','poor','damaged') DEFAULT 'good',
  `asset_status` enum('available','reserved','borrowed','under_repair','pending_repair','lost','damaged','retired') DEFAULT 'available',
  `purchase_date` date DEFAULT NULL,
  `warranty_end_date` date DEFAULT NULL,
  `price` decimal(12,2) DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_code` (`asset_code`),
  KEY `location_id` (`location_id`),
  KEY `idx_assets_status` (`asset_status`),
  KEY `idx_assets_category` (`category_id`),
  CONSTRAINT `assets_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `asset_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `assets_ibfk_2` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assets`
--

LOCK TABLES `assets` WRITE;
/*!40000 ALTER TABLE `assets` DISABLE KEYS */;
INSERT INTO `assets` VALUES (1,'LAP-001','Dell Latitude 5440',1,'Dell','Latitude 5440','SN-DELL-001',NULL,1,'good','available','2025-11-16','2027-06-30',NULL,NULL,NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(2,'LAP-002','HP EliteBook 840',1,'HP','EliteBook 840 G10','SN-HP-001',NULL,1,'good','available','2025-11-03','2027-03-15',NULL,NULL,NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(3,'LAP-003','Lenovo ThinkPad X1',1,'Lenovo','ThinkPad X1 Carbon','SN-LEN-001',NULL,2,'new','available','2026-01-25','2026-12-31',NULL,NULL,NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(4,'MON-001','Dell 27\" Monitor',3,'Dell','U2723QE','SN-MON-001',NULL,1,'good','available','2026-04-28','2026-08-15',NULL,NULL,NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(5,'MON-002','LG 24\" Monitor',3,'LG','24MK600M','SN-MON-002',NULL,2,'fair','available','2025-11-27','2025-11-30',NULL,NULL,NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(6,'PRN-001','HP LaserJet Pro',4,'HP','LaserJet Pro M404dn','SN-PRN-001',NULL,3,'good','available','2026-01-25','2026-05-20',NULL,NULL,NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(7,'SRV-001','Dell PowerEdge R740',5,'Dell','PowerEdge R740','SN-SRV-001',NULL,3,'good','available','2026-02-11','2027-01-10',NULL,NULL,NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(8,'NET-001','Cisco Switch 2960',6,'Cisco','Catalyst 2960-X','SN-NET-001',NULL,3,'good','available','2025-11-16','2026-10-01',NULL,NULL,NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(9,'TAB-001','iPad Pro 12.9\"',7,'Apple','iPad Pro 6th Gen','SN-TAB-001',NULL,1,'new','available','2025-07-14','2027-09-15',NULL,NULL,NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49'),(10,'PHN-001','iPhone 15 Pro',8,'Apple','iPhone 15 Pro','SN-PHN-001',NULL,2,'new','available','2025-07-17','2026-08-31',NULL,NULL,NULL,'2026-06-30 18:40:49','2026-06-30 18:40:49');
/*!40000 ALTER TABLE `assets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attachments`
--

DROP TABLE IF EXISTS `attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reference_type` varchar(50) NOT NULL,
  `reference_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `uploaded_by` int(11) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `attachments_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attachments`
--

LOCK TABLES `attachments` WRITE;
/*!40000 ALTER TABLE `attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `actor_user_id` int(11) DEFAULT NULL,
  `action_type` varchar(50) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `old_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_value`)),
  `new_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_value`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `actor_user_id` (`actor_user_id`),
  KEY `idx_audit_logs_entity` (`entity_type`,`entity_id`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `borrow_request_items`
--

DROP TABLE IF EXISTS `borrow_request_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `borrow_request_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `borrow_request_id` int(11) NOT NULL,
  `asset_id` int(11) NOT NULL,
  `qty` int(11) DEFAULT 1,
  `item_status` enum('pending','borrowed','returned','damaged','lost') DEFAULT 'pending',
  `borrow_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `returned_date` date DEFAULT NULL,
  `return_condition` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `borrow_request_id` (`borrow_request_id`),
  KEY `idx_borrow_items_asset` (`asset_id`),
  CONSTRAINT `borrow_request_items_ibfk_1` FOREIGN KEY (`borrow_request_id`) REFERENCES `borrow_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `borrow_request_items_ibfk_2` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `borrow_request_items`
--

LOCK TABLES `borrow_request_items` WRITE;
/*!40000 ALTER TABLE `borrow_request_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `borrow_request_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `borrow_requests`
--

DROP TABLE IF EXISTS `borrow_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `borrow_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_no` varchar(30) NOT NULL,
  `requester_id` int(11) NOT NULL,
  `approver_id` int(11) DEFAULT NULL,
  `request_date` date NOT NULL,
  `purpose` text DEFAULT NULL,
  `needed_from` date DEFAULT NULL,
  `needed_until` date DEFAULT NULL,
  `request_status` enum('draft','submitted','approved','rejected','borrowed','returned','cancelled') DEFAULT 'draft',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `notes` text DEFAULT NULL,
  `rejected_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `request_no` (`request_no`),
  KEY `approver_id` (`approver_id`),
  KEY `idx_borrow_requests_status` (`request_status`),
  KEY `idx_borrow_requests_requester` (`requester_id`),
  CONSTRAINT `borrow_requests_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`),
  CONSTRAINT `borrow_requests_ibfk_2` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `borrow_requests`
--

LOCK TABLES `borrow_requests` WRITE;
/*!40000 ALTER TABLE `borrow_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `borrow_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dashboard_metrics_daily`
--

DROP TABLE IF EXISTS `dashboard_metrics_daily`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dashboard_metrics_daily` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `metric_date` date NOT NULL,
  `scope_type` enum('global','department','user') DEFAULT 'global',
  `scope_id` int(11) DEFAULT NULL,
  `metric_key` varchar(50) NOT NULL,
  `metric_value` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_metric` (`metric_date`,`scope_type`,`scope_id`,`metric_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dashboard_metrics_daily`
--

LOCK TABLES `dashboard_metrics_daily` WRITE;
/*!40000 ALTER TABLE `dashboard_metrics_daily` DISABLE KEYS */;
/*!40000 ALTER TABLE `dashboard_metrics_daily` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dashboard_snapshots`
--

DROP TABLE IF EXISTS `dashboard_snapshots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dashboard_snapshots` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `snapshot_date` date NOT NULL,
  `scope_type` enum('global','department','user') DEFAULT 'global',
  `scope_id` int(11) DEFAULT NULL,
  `total_assets` int(11) DEFAULT 0,
  `available_assets` int(11) DEFAULT 0,
  `borrowed_assets` int(11) DEFAULT 0,
  `under_repair_assets` int(11) DEFAULT 0,
  `overdue_borrows` int(11) DEFAULT 0,
  `open_repairs` int(11) DEFAULT 0,
  `completed_repairs_month` int(11) DEFAULT 0,
  `pending_approvals` int(11) DEFAULT 0,
  `active_users` int(11) DEFAULT 0,
  `warranty_expiring_soon` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_snapshot` (`snapshot_date`,`scope_type`,`scope_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dashboard_snapshots`
--

LOCK TABLES `dashboard_snapshots` WRITE;
/*!40000 ALTER TABLE `dashboard_snapshots` DISABLE KEYS */;
/*!40000 ALTER TABLE `dashboard_snapshots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `department_name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Information Technology','2026-06-30 18:40:49','2026-06-30 18:40:49'),(2,'Human Resources','2026-06-30 18:40:49','2026-06-30 18:40:49'),(3,'Finance','2026-06-30 18:40:49','2026-06-30 18:40:49'),(4,'Marketing','2026-06-30 18:40:49','2026-06-30 18:40:49'),(5,'Operations','2026-06-30 18:40:49','2026-06-30 18:40:49'),(6,'Engineering','2026-06-30 18:40:49','2026-06-30 18:40:49'),(7,'Sales','2026-06-30 18:40:49','2026-06-30 18:40:49'),(8,'Legal','2026-06-30 18:40:49','2026-06-30 18:40:49'),(9,'Administration','2026-06-30 18:40:49','2026-06-30 18:40:49');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `location_name` varchar(100) NOT NULL,
  `building` varchar(100) DEFAULT NULL,
  `floor` varchar(50) DEFAULT NULL,
  `room` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
INSERT INTO `locations` VALUES (1,'Main Office - Floor 1','HQ','1','101','2026-06-30 18:40:49','2026-06-30 18:40:49'),(2,'Main Office - Floor 2','HQ','2','201','2026-06-30 18:40:49','2026-06-30 18:40:49'),(3,'IT Server Room','HQ','B1','B01','2026-06-30 18:40:49','2026-06-30 18:40:49'),(4,'Warehouse','Warehouse A','1','W01','2026-06-30 18:40:49','2026-06-30 18:40:49');
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text DEFAULT NULL,
  `channel` enum('in_app','email','both') DEFAULT 'in_app',
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`,`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `part_categories`
--

DROP TABLE IF EXISTS `part_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `part_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `part_categories`
--

LOCK TABLES `part_categories` WRITE;
/*!40000 ALTER TABLE `part_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `part_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `part_consumptions`
--

DROP TABLE IF EXISTS `part_consumptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `part_consumptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `repair_request_id` int(11) NOT NULL,
  `part_id` int(11) NOT NULL,
  `reservation_id` int(11) DEFAULT NULL,
  `qty_used` int(11) NOT NULL DEFAULT 1,
  `consumed_by` int(11) NOT NULL,
  `consumed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `part_id` (`part_id`),
  KEY `reservation_id` (`reservation_id`),
  KEY `consumed_by` (`consumed_by`),
  KEY `idx_part_consumptions_repair` (`repair_request_id`),
  CONSTRAINT `part_consumptions_ibfk_1` FOREIGN KEY (`repair_request_id`) REFERENCES `repair_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `part_consumptions_ibfk_2` FOREIGN KEY (`part_id`) REFERENCES `parts` (`id`),
  CONSTRAINT `part_consumptions_ibfk_3` FOREIGN KEY (`reservation_id`) REFERENCES `part_reservations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `part_consumptions_ibfk_4` FOREIGN KEY (`consumed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `part_consumptions`
--

LOCK TABLES `part_consumptions` WRITE;
/*!40000 ALTER TABLE `part_consumptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `part_consumptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `part_locations`
--

DROP TABLE IF EXISTS `part_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `part_locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `location_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `part_locations`
--

LOCK TABLES `part_locations` WRITE;
/*!40000 ALTER TABLE `part_locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `part_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `part_reservations`
--

DROP TABLE IF EXISTS `part_reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `part_reservations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `repair_request_id` int(11) NOT NULL,
  `part_id` int(11) NOT NULL,
  `qty_reserved` int(11) NOT NULL DEFAULT 1,
  `qty_used` int(11) DEFAULT 0,
  `reserved_by` int(11) NOT NULL,
  `reserved_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('reserved','partially_issued','issued','cancelled') DEFAULT 'reserved',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `reserved_by` (`reserved_by`),
  KEY `idx_part_reservations_repair` (`repair_request_id`),
  KEY `idx_part_reservations_part` (`part_id`),
  CONSTRAINT `part_reservations_ibfk_1` FOREIGN KEY (`repair_request_id`) REFERENCES `repair_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `part_reservations_ibfk_2` FOREIGN KEY (`part_id`) REFERENCES `parts` (`id`),
  CONSTRAINT `part_reservations_ibfk_3` FOREIGN KEY (`reserved_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `part_reservations`
--

LOCK TABLES `part_reservations` WRITE;
/*!40000 ALTER TABLE `part_reservations` DISABLE KEYS */;
/*!40000 ALTER TABLE `part_reservations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `part_stocks`
--

DROP TABLE IF EXISTS `part_stocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `part_stocks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `part_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL,
  `current_stock` int(11) DEFAULT 0,
  `reserved_stock` int(11) DEFAULT 0,
  `available_stock` int(11) GENERATED ALWAYS AS (`current_stock` - `reserved_stock`) STORED,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_part_location` (`part_id`,`location_id`),
  KEY `location_id` (`location_id`),
  KEY `idx_part_stocks_part` (`part_id`),
  CONSTRAINT `part_stocks_ibfk_1` FOREIGN KEY (`part_id`) REFERENCES `parts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `part_stocks_ibfk_2` FOREIGN KEY (`location_id`) REFERENCES `part_locations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `part_stocks`
--

LOCK TABLES `part_stocks` WRITE;
/*!40000 ALTER TABLE `part_stocks` DISABLE KEYS */;
/*!40000 ALTER TABLE `part_stocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `part_transactions`
--

DROP TABLE IF EXISTS `part_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `part_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `part_id` int(11) NOT NULL,
  `transaction_type` enum('purchase_in','return_in','adjustment_in','adjustment_out','reservation','reservation_cancelled','consumption_out','transfer_out','transfer_in','initial_balance') NOT NULL,
  `qty` int(11) NOT NULL,
  `stock_before` int(11) DEFAULT 0,
  `stock_after` int(11) DEFAULT 0,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `performed_by` int(11) NOT NULL,
  `performed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `remark` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `performed_by` (`performed_by`),
  KEY `idx_part_transactions_part` (`part_id`),
  KEY `idx_part_transactions_type` (`transaction_type`),
  CONSTRAINT `part_transactions_ibfk_1` FOREIGN KEY (`part_id`) REFERENCES `parts` (`id`),
  CONSTRAINT `part_transactions_ibfk_2` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `part_transactions`
--

LOCK TABLES `part_transactions` WRITE;
/*!40000 ALTER TABLE `part_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `part_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parts`
--

DROP TABLE IF EXISTS `parts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `parts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `part_code` varchar(50) NOT NULL,
  `part_name` varchar(200) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `unit` varchar(30) DEFAULT 'piece',
  `brand` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `min_stock` int(11) DEFAULT 0,
  `max_stock` int(11) DEFAULT 0,
  `current_stock` int(11) DEFAULT 0,
  `reserved_stock` int(11) DEFAULT 0,
  `available_stock` int(11) GENERATED ALWAYS AS (`current_stock` - `reserved_stock`) STORED,
  `cost_price` decimal(12,2) DEFAULT NULL,
  `selling_price` decimal(12,2) DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL,
  `shelf_location` varchar(100) DEFAULT NULL,
  `status` enum('in_stock','low_stock','out_of_stock','discontinued') DEFAULT 'in_stock',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `part_code` (`part_code`),
  KEY `category_id` (`category_id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `location_id` (`location_id`),
  KEY `idx_parts_code` (`part_code`),
  KEY `idx_parts_status` (`status`),
  CONSTRAINT `parts_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `part_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `parts_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `parts_ibfk_3` FOREIGN KEY (`location_id`) REFERENCES `part_locations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parts`
--

LOCK TABLES `parts` WRITE;
/*!40000 ALTER TABLE `parts` DISABLE KEYS */;
/*!40000 ALTER TABLE `parts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `permission_code` varchar(100) NOT NULL,
  `permission_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `permission_code` (`permission_code`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'users.view','View Users',NULL,'2026-06-30 18:40:49'),(2,'users.create','Create Users',NULL,'2026-06-30 18:40:49'),(3,'users.edit','Edit Users',NULL,'2026-06-30 18:40:49'),(4,'users.delete','Delete Users',NULL,'2026-06-30 18:40:49'),(5,'roles.view','View Roles',NULL,'2026-06-30 18:40:49'),(6,'roles.create','Create Roles',NULL,'2026-06-30 18:40:49'),(7,'roles.edit','Edit Roles',NULL,'2026-06-30 18:40:49'),(8,'roles.delete','Delete Roles',NULL,'2026-06-30 18:40:49'),(9,'assets.view','View Assets',NULL,'2026-06-30 18:40:49'),(10,'assets.create','Create Assets',NULL,'2026-06-30 18:40:49'),(11,'assets.edit','Edit Assets',NULL,'2026-06-30 18:40:49'),(12,'assets.delete','Delete Assets',NULL,'2026-06-30 18:40:49'),(13,'borrow.view','View Borrow Requests',NULL,'2026-06-30 18:40:49'),(14,'borrow.create','Create Borrow Requests',NULL,'2026-06-30 18:40:49'),(15,'borrow.approve','Approve Borrow Requests',NULL,'2026-06-30 18:40:49'),(16,'borrow.confirm','Confirm Borrow',NULL,'2026-06-30 18:40:49'),(17,'borrow.return','Process Returns',NULL,'2026-06-30 18:40:49'),(18,'repair.view','View Repair Requests',NULL,'2026-06-30 18:40:49'),(19,'repair.create','Create Repair Requests',NULL,'2026-06-30 18:40:49'),(20,'repair.update_status','Update Repair Status',NULL,'2026-06-30 18:40:49'),(21,'repair.close','Close Repairs',NULL,'2026-06-30 18:40:49'),(22,'parts.view','View Spare Parts',NULL,'2026-06-30 18:40:49'),(23,'parts.create','Create Spare Parts',NULL,'2026-06-30 18:40:49'),(24,'parts.edit','Edit Spare Parts',NULL,'2026-06-30 18:40:49'),(25,'parts.manage','Manage Parts Stock',NULL,'2026-06-30 18:40:49'),(26,'dashboard.view','View Dashboard',NULL,'2026-06-30 18:40:49'),(27,'reports.view','View Reports',NULL,'2026-06-30 18:40:49'),(28,'departments.view','View Departments',NULL,'2026-06-30 18:40:49'),(29,'departments.manage','Manage Departments',NULL,'2026-06-30 18:40:49');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `repair_logs`
--

DROP TABLE IF EXISTS `repair_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `repair_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `repair_request_id` int(11) NOT NULL,
  `status_from` varchar(30) DEFAULT NULL,
  `status_to` varchar(30) NOT NULL,
  `action_by` int(11) NOT NULL,
  `action_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `comment` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `repair_request_id` (`repair_request_id`),
  KEY `action_by` (`action_by`),
  CONSTRAINT `repair_logs_ibfk_1` FOREIGN KEY (`repair_request_id`) REFERENCES `repair_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `repair_logs_ibfk_2` FOREIGN KEY (`action_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `repair_logs`
--

LOCK TABLES `repair_logs` WRITE;
/*!40000 ALTER TABLE `repair_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `repair_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `repair_requests`
--

DROP TABLE IF EXISTS `repair_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `repair_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `repair_no` varchar(30) NOT NULL,
  `requested_by` int(11) NOT NULL,
  `asset_id` int(11) NOT NULL,
  `issue_type` varchar(100) DEFAULT NULL,
  `issue_detail` text DEFAULT NULL,
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `repair_status` enum('reported','accepted','in_progress','waiting_parts','parts_reserved','parts_issued','fixed','closed','rejected','cancelled') DEFAULT 'reported',
  `assigned_to` int(11) DEFAULT NULL,
  `reported_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `accepted_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `resolution_detail` text DEFAULT NULL,
  `cost_estimate` decimal(12,2) DEFAULT NULL,
  `cost_actual` decimal(12,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `repair_no` (`repair_no`),
  KEY `requested_by` (`requested_by`),
  KEY `assigned_to` (`assigned_to`),
  KEY `idx_repair_requests_status` (`repair_status`),
  KEY `idx_repair_requests_asset` (`asset_id`),
  CONSTRAINT `repair_requests_ibfk_1` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`),
  CONSTRAINT `repair_requests_ibfk_2` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`),
  CONSTRAINT `repair_requests_ibfk_3` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `repair_requests`
--

LOCK TABLES `repair_requests` WRITE;
/*!40000 ALTER TABLE `repair_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `repair_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (29,1,1),(26,1,2),(28,1,3),(27,1,4),(25,1,5),(22,1,6),(24,1,7),(23,1,8),(4,1,9),(1,1,10),(3,1,11),(2,1,12),(9,1,13),(7,1,14),(5,1,15),(6,1,16),(8,1,17),(20,1,18),(18,1,19),(19,1,20),(17,1,21),(16,1,22),(13,1,23),(14,1,24),(15,1,25),(10,1,26),(21,1,27),(12,1,28),(11,1,29),(47,2,1),(30,2,9),(31,2,10),(32,2,11),(33,2,12),(34,2,13),(35,2,15),(36,2,16),(37,2,17),(38,2,18),(39,2,20),(40,2,21),(41,2,22),(42,2,23),(43,2,24),(44,2,25),(45,2,26),(46,2,27),(48,2,28),(56,3,9),(53,3,18),(54,3,20),(55,3,21),(57,3,22),(58,3,23),(59,3,24),(60,3,26),(52,4,9),(49,4,13),(50,4,15),(51,4,26),(72,5,9),(68,5,13),(69,5,14),(70,5,18),(71,5,19),(73,5,26),(65,6,9),(61,6,22),(62,6,23),(63,6,24),(64,6,25),(66,6,26),(67,6,27);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'super_admin','Role: super admin','2026-06-30 18:40:49','2026-06-30 18:40:49'),(2,'it_admin','Role: it admin','2026-06-30 18:40:49','2026-06-30 18:40:49'),(3,'it_technician','Role: it technician','2026-06-30 18:40:49','2026-06-30 18:40:49'),(4,'approver','Role: approver','2026-06-30 18:40:49','2026-06-30 18:40:49'),(5,'employee','Role: employee','2026-06-30 18:40:49','2026-06-30 18:40:49'),(6,'inventory_officer','Role: inventory officer','2026-06-30 18:40:49','2026-06-30 18:40:49');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `status_history`
--

DROP TABLE IF EXISTS `status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `status_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` int(11) NOT NULL,
  `old_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) NOT NULL,
  `changed_by` int(11) NOT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `remark` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `changed_by` (`changed_by`),
  KEY `idx_status_history_entity` (`entity_type`,`entity_id`),
  CONSTRAINT `status_history_ibfk_1` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `status_history`
--

LOCK TABLES `status_history` WRITE;
/*!40000 ALTER TABLE `status_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `status_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplier_name` varchar(200) NOT NULL,
  `contact_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,1,1),(2,2,2),(3,3,3),(4,4,4),(5,5,5),(6,6,6);
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_code` varchar(20) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_code` (`employee_code`),
  UNIQUE KEY `email` (`email`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'SA001','Super Admin','superadmin@company.com','$2a$10$hqprAkdt0PqBREIWxEmt5OcQ.XjNFDHEMwylTgXrNc6pgfz1Do0Ma',NULL,NULL,NULL,'active','2026-06-30 18:40:49','2026-06-30 18:40:49'),(2,'IT001','John Doe','itadmin@company.com','$2a$10$BEwn1z5pOhj2aH9U5j/bG.puyq33DvtMja4A9QILmCXm8f4tYygmu',NULL,1,NULL,'active','2026-06-30 18:40:49','2026-06-30 18:40:49'),(3,'IT002','Jane Smith','tech@company.com','$2a$10$/U7eagOnerseT1BGQ3gmyuoqkxx43tYT3D6S4Fka4zM7jGm2QkKzC',NULL,1,NULL,'active','2026-06-30 18:40:49','2026-06-30 18:40:49'),(4,'EMP001','Alice Johnson','approver@company.com','$2a$10$RMrDosozK4wG57j8c8LUSOyV.e6avwUKQta05xnAKWJJxTHsbSuyK',NULL,1,NULL,'active','2026-06-30 18:40:49','2026-06-30 18:40:49'),(5,'EMP002','Bob Williams','employee@company.com','$2a$10$5fU4iQw9hx1cQbqtK8ALtufj8VuZX23LMKX.i/eUtRQJRL7cOSb6.',NULL,1,NULL,'active','2026-06-30 18:40:49','2026-06-30 18:40:49'),(6,'INV001','Carol Davis','inventory@company.com','$2a$10$Zndn1bRAIcpUOcuK.ffER.Z1MbEb/enym6RsfvWanV1VkjJd5q8Z.',NULL,1,NULL,'active','2026-06-30 18:40:49','2026-06-30 18:40:49');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'it_equipment_management'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-01  1:41:38
