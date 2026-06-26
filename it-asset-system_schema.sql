-- Database Schema for IT Equipment Loan & Maintenance (ATC)
-- Create Date: 2026

CREATE DATABASE IF NOT EXISTS `atc_it_asset_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `atc_it_asset_db`;

CREATE TABLE `tb_users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `role` enum('admin','staff','user') NOT NULL DEFAULT 'user',
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `tb_assets` (
  `asset_id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_code` varchar(50) DEFAULT NULL,
  `asset_name` varchar(100) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `status` enum('available','borrowed','repairing') DEFAULT 'available',
  PRIMARY KEY (`asset_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `tb_transactions` (
  `trans_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `asset_id` int(11) NOT NULL,
  `borrow_date` datetime DEFAULT current_timestamp(),
  `return_date` datetime DEFAULT NULL,
  `trans_status` enum('pending','approved','returned') DEFAULT 'pending',
  `detail` text DEFAULT NULL,
  PRIMARY KEY (`trans_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `tb_repairs` (
  `repair_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `asset_id` int(11) NOT NULL,
  `detail` text NOT NULL,
  `repair_status` enum('pending','fixed') DEFAULT 'pending',
  `report_date` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`repair_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `tb_users` (`username`, `password`, `full_name`, `role`) VALUES
('admin', '123', 'ศิรายุ (Admin)', 'admin'),
('staff', '123', 'ช่างไอที (Staff)', 'staff'),
('user', '123', 'นักศึกษา (User)', 'user');
