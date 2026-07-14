-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 30, 2026 at 07:06 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `intern_track`
--

-- --------------------------------------------------------

--
-- Table structure for table `approvals`
--

CREATE TABLE `approvals` (
  `id` int(10) UNSIGNED NOT NULL,
  `log_id` varchar(255) DEFAULT NULL,
  `approved_by` varchar(255) DEFAULT NULL,
  `approved_by_name` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(10) UNSIGNED NOT NULL,
  `action` varchar(255) NOT NULL,
  `performed_by` varchar(255) DEFAULT NULL,
  `performed_by_name` varchar(255) DEFAULT NULL,
  `target_user` varchar(255) DEFAULT NULL,
  `target_user_name` varchar(255) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leave_requests`
--

CREATE TABLE `leave_requests` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `request_date` varchar(255) DEFAULT NULL,
  `leave_type` varchar(255) DEFAULT NULL,
  `start_date` varchar(255) DEFAULT NULL,
  `end_date` varchar(255) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `attachment_base64` text DEFAULT NULL,
  `attachment_name` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'pending',
  `reviewed_by` varchar(255) DEFAULT NULL,
  `reviewed_by_name` varchar(255) DEFAULT NULL,
  `review_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `schedule_change_requests`
--

CREATE TABLE `schedule_change_requests` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `request_date` varchar(255) DEFAULT NULL,
  `affected_date` varchar(255) DEFAULT NULL,
  `current_time_in` varchar(255) DEFAULT NULL,
  `current_time_out` varchar(255) DEFAULT NULL,
  `requested_time_in` varchar(255) DEFAULT NULL,
  `requested_time_out` varchar(255) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `attachment_base64` text DEFAULT NULL,
  `attachment_name` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'pending',
  `reviewed_by` varchar(255) DEFAULT NULL,
  `reviewed_by_name` varchar(255) DEFAULT NULL,
  `review_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shifts`
--

CREATE TABLE `shifts` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `clock_in` datetime DEFAULT NULL,
  `clock_out` datetime DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `total_hours` float(8,2) DEFAULT NULL,
  `net_work_hours` float(8,2) DEFAULT NULL,
  `regular_hours` float(8,2) DEFAULT NULL,
  `overtime_hours` float(8,2) DEFAULT NULL,
  `late_minutes` int(11) DEFAULT 0,
  `is_late` tinyint(1) DEFAULT NULL,
  `is_overtime` tinyint(1) DEFAULT NULL,
  `is_undertime` tinyint(1) DEFAULT NULL,
  `is_incomplete` tinyint(1) DEFAULT 0,
  `manual_entry` tinyint(1) DEFAULT 0,
  `source` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `audit_label` varchar(255) DEFAULT NULL,
  `imported_by_id` varchar(255) DEFAULT NULL,
  `imported_by_name` varchar(255) DEFAULT NULL,
  `alert_status` varchar(255) DEFAULT 'new',
  `resolved_at` datetime DEFAULT NULL,
  `resolved_by` varchar(255) DEFAULT NULL,
  `flagged_at` datetime DEFAULT NULL,
  `flagged_by` varchar(255) DEFAULT NULL,
  `edit_history` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`edit_history`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shifts`
--

INSERT INTO `shifts` (`id`, `user_id`, `user_name`, `clock_in`, `clock_out`, `status`, `total_hours`, `net_work_hours`, `regular_hours`, `overtime_hours`, `late_minutes`, `is_late`, `is_overtime`, `is_undertime`, `is_incomplete`, `manual_entry`, `source`, `description`, `audit_label`, `imported_by_id`, `imported_by_name`, `alert_status`, `resolved_at`, `resolved_by`, `flagged_at`, `flagged_by`, `edit_history`, `created_at`, `updated_at`) VALUES
(1, '002', 'Intern User', '2026-06-29 23:11:29', '2026-06-30 00:34:06', 'completed', 1.38, NULL, NULL, 0.00, 0, 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-29 23:11:29', '2026-06-30 02:59:35'),
(2, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 08:41:31', '2026-06-30 08:48:38', 'completed', 0.12, NULL, NULL, 0.00, 0, 0, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 00:41:31', '2026-06-30 02:59:35'),
(3, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 08:49:07', '2026-06-30 08:49:15', 'completed', 0.00, NULL, NULL, 0.00, 0, 0, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 00:49:07', '2026-06-30 02:59:35'),
(4, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 08:52:42', '2026-06-30 08:52:55', 'completed', 0.00, NULL, NULL, 0.00, 0, 0, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 00:52:42', '2026-06-30 02:59:35'),
(5, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 08:53:06', '2026-06-30 08:53:16', 'completed', 0.00, NULL, NULL, 0.00, 0, 0, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 00:53:06', '2026-06-30 02:59:35'),
(6, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 08:53:25', '2026-06-30 08:53:33', 'completed', 0.00, NULL, NULL, 0.00, 0, 0, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 00:53:25', '2026-06-30 02:59:35'),
(7, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 08:53:37', '2026-06-30 08:57:05', 'completed', 0.06, NULL, NULL, 0.00, 0, 0, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 00:53:37', '2026-06-30 02:59:35'),
(8, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 09:01:14', '2026-06-30 09:02:40', 'completed', 0.02, NULL, NULL, 0.00, 0, 0, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 01:01:14', '2026-06-30 02:59:35'),
(9, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 09:02:41', '2026-06-30 09:07:51', 'completed', 0.09, NULL, NULL, 0.00, 0, 0, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 01:02:41', '2026-06-30 02:59:35'),
(10, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 09:07:54', '2026-06-30 09:08:08', 'completed', 0.00, NULL, NULL, 0.00, 0, 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 01:07:54', '2026-06-30 02:59:35'),
(11, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 09:08:09', '2026-06-30 09:08:52', 'completed', 0.01, NULL, NULL, 0.00, 0, 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 01:08:09', '2026-06-30 02:59:35'),
(12, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 09:08:52', '2026-06-30 09:14:12', 'completed', 0.09, NULL, NULL, 0.00, 0, 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 01:08:53', '2026-06-30 02:59:35'),
(13, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 09:14:15', '2026-06-30 09:14:40', 'completed', 0.01, NULL, NULL, 0.00, 0, 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 01:14:15', '2026-06-30 02:59:35'),
(14, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 09:14:44', '2026-06-30 09:22:09', 'completed', 0.12, NULL, NULL, 0.00, 0, 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 01:14:44', '2026-06-30 02:59:35'),
(15, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 09:22:20', '2026-06-30 09:24:29', 'completed', 0.04, NULL, NULL, 0.00, 0, 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 01:22:20', '2026-06-30 02:59:35'),
(16, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 09:24:36', '2026-06-30 09:30:04', 'completed', 0.09, NULL, NULL, 0.00, 0, 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 01:24:36', '2026-06-30 02:59:35'),
(17, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 09:30:08', '2026-06-30 09:31:44', 'completed', 0.03, NULL, NULL, 0.00, 0, 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 01:30:08', '2026-06-30 02:59:35'),
(18, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 09:31:47', '2026-06-30 09:38:30', 'completed', 0.11, NULL, NULL, 0.00, 0, 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 01:31:47', '2026-06-30 02:59:35'),
(19, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 09:38:38', '2026-06-30 09:44:52', 'completed', 0.10, NULL, NULL, 0.00, 0, 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 01:38:39', '2026-06-30 02:59:35'),
(20, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 09:44:55', '2026-06-30 09:47:28', 'completed', 0.04, NULL, NULL, 0.00, 0, 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 01:44:55', '2026-06-30 02:59:35'),
(21, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 09:47:30', '2026-06-30 09:49:34', 'completed', 0.03, NULL, NULL, 0.00, 0, 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 01:47:30', '2026-06-30 02:59:35'),
(22, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 09:50:10', '2026-06-30 09:50:14', 'completed', 0.00, NULL, NULL, 0.00, 0, 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 01:50:10', '2026-06-30 02:59:35'),
(23, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 09:51:21', '2026-06-30 09:51:30', 'completed', 0.00, NULL, NULL, 0.00, 0, 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 01:51:21', '2026-06-30 02:59:35'),
(24, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 09:53:54', '2026-06-30 11:00:34', 'completed', 9.11, NULL, NULL, 0.11, 0, 1, 1, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 01:53:54', '2026-06-30 02:59:35'),
(25, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 11:01:45', '2026-06-30 11:01:47', 'completed', 8.00, NULL, NULL, 0.00, 0, 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 03:01:45', '2026-06-30 03:01:45'),
(26, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 11:58:44', '2026-06-30 12:15:55', 'completed', 0.29, NULL, NULL, 0.00, 0, 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 03:58:44', '2026-06-30 03:58:44'),
(27, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 12:19:59', '2026-06-30 12:42:34', 'completed', 0.38, NULL, NULL, 0.00, 0, 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 04:19:59', '2026-06-30 04:19:59'),
(28, 'manual_1782779922748', 'Rylee Singson', '2026-06-30 12:42:55', '2026-06-30 13:03:25', 'completed', 0.34, NULL, NULL, 0.00, 0, 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 04:42:55', '2026-06-30 04:42:55'),
(29, '002', 'Intern User', '2026-06-30 12:45:55', '2026-06-30 13:00:48', 'completed', 0.25, NULL, NULL, 0.00, 0, 1, 0, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-06-30 04:45:55', '2026-06-30 04:45:55');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `assigned_to` varchar(255) DEFAULT NULL,
  `assigned_to_name` varchar(255) DEFAULT NULL,
  `start_date` varchar(255) DEFAULT NULL,
  `end_date` varchar(255) DEFAULT NULL,
  `estimated_hours` float(8,2) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'pending',
  `priority` varchar(255) DEFAULT 'medium',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `time_logs`
--

CREATE TABLE `time_logs` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `task_id` int(11) DEFAULT NULL,
  `task_name` varchar(255) DEFAULT NULL,
  `date` varchar(255) DEFAULT NULL,
  `date_out` varchar(255) DEFAULT NULL,
  `start_time` varchar(255) DEFAULT NULL,
  `end_time` varchar(255) DEFAULT NULL,
  `rendered_hours` float(8,2) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(255) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `uid` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `employee_id` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `is_default_password` tinyint(1) DEFAULT 1,
  `role` varchar(255) NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  `photoURL` varchar(255) DEFAULT NULL,
  `start_date` varchar(255) DEFAULT NULL,
  `end_date` varchar(255) DEFAULT NULL,
  `required_hours` int(11) DEFAULT NULL,
  `schedule_start` varchar(255) DEFAULT NULL,
  `schedule_end` varchar(255) DEFAULT NULL,
  `active_task` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`active_task`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`uid`, `name`, `email`, `username`, `employee_id`, `password`, `is_default_password`, `role`, `department`, `photoURL`, `start_date`, `end_date`, `required_hours`, `schedule_start`, `schedule_end`, `active_task`, `created_at`, `updated_at`) VALUES
('001', 'Admin User', 'admin-internship@test.com', NULL, NULL, '$2y$10$h0hKFwqOx1PJlQGMbeWfIeQDLZVIIH9Us7i4kNiFMYV8ZF/0ehTuq', 1, 'admin', 'IT Management', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-29 23:03:47', '2026-06-29 23:03:47'),
('002', 'Intern User', 'intern@test.com', 'intern', '123', '$2y$10$S9LgLUI27I5V/rNUM.gh2ek9MOwdHMV0MAntAeyfMiymgsitV3Tb2', 1, 'intern', 'IT Software Development', NULL, '2026-06-24', '2026-07-31', 240, '07:00', '15:00', NULL, '2026-06-29 23:03:47', '2026-06-29 23:03:47'),
('manual_1782779922748', 'Rylee Singson', 'ryleesestoso@gmail.com', 'ryleesingson', '88199', '$2b$10$4.rI7NQ5AyVHJv5iHH76F.NRMSzDEUilxPDpLBOG7RKsJxKbG8hYS', 1, 'intern', 'IT Department', NULL, '2026-06-29', '2026-08-05', 240, '09:00', '18:00', NULL, '2026-06-30 00:38:42', '2026-06-30 00:38:42');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `approvals`
--
ALTER TABLE `approvals`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leave_requests_user_id_foreign` (`user_id`);

--
-- Indexes for table `schedule_change_requests`
--
ALTER TABLE `schedule_change_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `schedule_change_requests_user_id_foreign` (`user_id`);

--
-- Indexes for table `shifts`
--
ALTER TABLE `shifts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shifts_user_id_foreign` (`user_id`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tasks_assigned_to_foreign` (`assigned_to`);

--
-- Indexes for table `time_logs`
--
ALTER TABLE `time_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`uid`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `users_username_unique` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `approvals`
--
ALTER TABLE `approvals`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `leave_requests`
--
ALTER TABLE `leave_requests`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `schedule_change_requests`
--
ALTER TABLE `schedule_change_requests`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shifts`
--
ALTER TABLE `shifts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `time_logs`
--
ALTER TABLE `time_logs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD CONSTRAINT `leave_requests_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`uid`);

--
-- Constraints for table `schedule_change_requests`
--
ALTER TABLE `schedule_change_requests`
  ADD CONSTRAINT `schedule_change_requests_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`uid`);

--
-- Constraints for table `shifts`
--
ALTER TABLE `shifts`
  ADD CONSTRAINT `shifts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`uid`);

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_assigned_to_foreign` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`uid`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
