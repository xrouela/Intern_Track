-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 31, 2026 at 12:09 AM
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

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `action`, `performed_by`, `performed_by_name`, `target_user`, `target_user_name`, `details`, `created_at`, `updated_at`) VALUES
(122, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-14 21:18:20', '2026-07-14 21:18:20'),
(123, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-14 21:18:20', '2026-07-14 21:18:20'),
(124, 'USER_LOGIN', '002', 'Intern User', '002', 'Intern User', 'Intern User signed in', '2026-07-14 21:18:46', '2026-07-14 21:18:46'),
(125, 'USER_LOGIN', '002', 'Intern User', '002', 'Intern User', 'Intern User signed in', '2026-07-14 22:28:53', '2026-07-14 22:28:53'),
(126, 'USER_LOGIN', '002', 'Intern User', '002', 'Intern User', 'Intern User signed in', '2026-07-14 22:35:30', '2026-07-14 22:35:30'),
(127, 'USER_LOGIN', '001', 'Admin User', '001', 'Admin User', 'Admin User signed in', '2026-07-16 15:57:08', '2026-07-16 15:57:08'),
(128, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 15:57:38', '2026-07-16 15:57:38'),
(129, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 15:57:38', '2026-07-16 15:57:38'),
(130, 'USER_LOGIN', '002', 'Intern User', '002', 'Intern User', 'Intern User signed in', '2026-07-16 15:57:51', '2026-07-16 15:57:51'),
(131, 'USER_LOGIN', '001', 'Admin User', '001', 'Admin User', 'Admin User signed in', '2026-07-16 15:59:53', '2026-07-16 15:59:53'),
(132, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 15:59:55', '2026-07-16 15:59:55'),
(133, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 15:59:55', '2026-07-16 15:59:55'),
(134, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 15:59:58', '2026-07-16 15:59:58'),
(135, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 15:59:58', '2026-07-16 15:59:58'),
(136, 'USER_LOGIN', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno signed in', '2026-07-16 18:23:27', '2026-07-16 18:23:27'),
(137, 'USER_LOGIN', '001', 'Admin User', '001', 'Admin User', 'Admin User signed in', '2026-07-16 18:24:41', '2026-07-16 18:24:41'),
(138, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:24:43', '2026-07-16 18:24:43'),
(139, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:24:43', '2026-07-16 18:24:43'),
(140, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:33:27', '2026-07-16 18:33:27'),
(141, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:33:27', '2026-07-16 18:33:27'),
(142, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:35:45', '2026-07-16 18:35:45'),
(143, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:35:45', '2026-07-16 18:35:45'),
(144, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:35:49', '2026-07-16 18:35:49'),
(145, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:35:49', '2026-07-16 18:35:49'),
(146, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:36:27', '2026-07-16 18:36:27'),
(147, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:36:27', '2026-07-16 18:36:27'),
(148, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:38:14', '2026-07-16 18:38:14'),
(149, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:38:14', '2026-07-16 18:38:14'),
(150, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:38:18', '2026-07-16 18:38:18'),
(151, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:38:18', '2026-07-16 18:38:18'),
(152, 'USER_LOGIN', '001', 'Admin User', '001', 'Admin User', 'Admin User signed in', '2026-07-16 18:40:01', '2026-07-16 18:40:01'),
(153, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:40:05', '2026-07-16 18:40:05'),
(154, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:40:05', '2026-07-16 18:40:05'),
(155, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:46:22', '2026-07-16 18:46:22'),
(156, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:46:22', '2026-07-16 18:46:22'),
(157, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 18:46:29', '2026-07-16 18:46:29'),
(158, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 18:46:29', '2026-07-16 18:46:29'),
(159, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 18:46:29', '2026-07-16 18:46:29'),
(160, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 18:46:29', '2026-07-16 18:46:29'),
(161, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 18:46:29', '2026-07-16 18:46:29'),
(162, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 18:46:29', '2026-07-16 18:46:29'),
(163, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 18:46:29', '2026-07-16 18:46:29'),
(164, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 18:46:29', '2026-07-16 18:46:29'),
(165, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 18:46:29', '2026-07-16 18:46:29'),
(166, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 18:46:29', '2026-07-16 18:46:29'),
(167, 'USER_LOGIN', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno signed in', '2026-07-16 18:47:43', '2026-07-16 18:47:43'),
(168, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 18:48:11', '2026-07-16 18:48:11'),
(169, 'USER_LOGIN', '001', 'Admin User', '001', 'Admin User', 'Admin User signed in', '2026-07-16 18:49:59', '2026-07-16 18:49:59'),
(170, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:50:01', '2026-07-16 18:50:01'),
(171, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:50:01', '2026-07-16 18:50:01'),
(172, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:51:03', '2026-07-16 18:51:03'),
(173, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:51:04', '2026-07-16 18:51:04'),
(174, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:51:04', '2026-07-16 18:51:04'),
(175, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:51:05', '2026-07-16 18:51:05'),
(176, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:51:05', '2026-07-16 18:51:05'),
(177, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:53:15', '2026-07-16 18:53:15'),
(178, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 18:53:15', '2026-07-16 18:53:15'),
(179, 'USER_LOGIN', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno signed in', '2026-07-16 18:54:57', '2026-07-16 18:54:57'),
(180, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 18:54:58', '2026-07-16 18:54:58'),
(181, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 18:59:20', '2026-07-16 18:59:20'),
(182, 'USER_LOGIN', '001', 'Admin User', '001', 'Admin User', 'Admin User signed in', '2026-07-16 19:00:28', '2026-07-16 19:00:28'),
(183, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 19:00:30', '2026-07-16 19:00:30'),
(184, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-16 19:00:30', '2026-07-16 19:00:30'),
(185, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 19:00:35', '2026-07-16 19:00:35'),
(186, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 19:00:35', '2026-07-16 19:00:35'),
(187, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 19:00:35', '2026-07-16 19:00:35'),
(188, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 19:00:35', '2026-07-16 19:00:35'),
(189, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 19:00:35', '2026-07-16 19:00:35'),
(190, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 19:00:35', '2026-07-16 19:00:35'),
(191, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 19:00:35', '2026-07-16 19:00:35'),
(192, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 19:00:35', '2026-07-16 19:00:35'),
(193, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 19:00:35', '2026-07-16 19:00:35'),
(194, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 19:00:35', '2026-07-16 19:00:35'),
(195, 'USER_LOGIN', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno signed in', '2026-07-16 19:01:11', '2026-07-16 19:01:11'),
(196, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-16 19:01:14', '2026-07-16 19:01:14'),
(197, 'USER_LOGIN', '001', 'Admin User', '001', 'Admin User', 'Admin User signed in', '2026-07-28 21:21:44', '2026-07-28 21:21:44'),
(198, 'USER_LOGIN', '001', 'Admin User', '001', 'Admin User', 'Admin User signed in', '2026-07-29 15:49:40', '2026-07-29 15:49:40'),
(199, 'USER_LOGIN', '002', 'Intern User', '002', 'Intern User', 'Intern User signed in', '2026-07-29 15:50:05', '2026-07-29 15:50:05'),
(200, 'USER_LOGIN', '002', 'Intern User', '002', 'Intern User', 'Intern User signed in', '2026-07-29 16:03:33', '2026-07-29 16:03:33'),
(201, 'SHIFT_RECORDED', '002', 'Intern User', '002', 'Intern User', 'Intern User recorded an attendance entry', '2026-07-29 18:05:53', '2026-07-29 18:05:53'),
(202, 'SHIFT_RECORDED', '002', 'Intern User', '002', 'Intern User', 'Intern User recorded an attendance entry', '2026-07-29 18:06:20', '2026-07-29 18:06:20'),
(203, 'USER_LOGIN', '001', 'Admin User', '001', 'Admin User', 'Admin User signed in', '2026-07-29 18:26:31', '2026-07-29 18:26:31'),
(204, 'USER_LOGIN', '002', 'Intern User', '002', 'Intern User', 'Intern User signed in', '2026-07-29 18:26:59', '2026-07-29 18:26:59'),
(205, 'USER_LOGIN', '001', 'Admin User', '001', 'Admin User', 'Admin User signed in', '2026-07-29 18:33:05', '2026-07-29 18:33:05'),
(206, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-29 20:30:01', '2026-07-29 20:30:01'),
(207, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-29 20:30:01', '2026-07-29 20:30:01'),
(208, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-29 20:30:04', '2026-07-29 20:30:04'),
(209, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-29 20:30:04', '2026-07-29 20:30:04'),
(210, 'USER_LOGIN', '002', 'Intern User', '002', 'Intern User', 'Intern User signed in', '2026-07-29 20:47:00', '2026-07-29 20:47:00'),
(211, 'USER_LOGIN', '001', 'Admin User', '001', 'Admin User', 'Admin User signed in', '2026-07-29 21:33:13', '2026-07-29 21:33:13'),
(212, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-29 22:18:13', '2026-07-29 22:18:13'),
(213, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-29 22:18:13', '2026-07-29 22:18:13'),
(214, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-29 22:18:35', '2026-07-29 22:18:35'),
(215, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-29 22:18:35', '2026-07-29 22:18:35'),
(216, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-29 22:18:35', '2026-07-29 22:18:35'),
(217, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-29 22:18:35', '2026-07-29 22:18:35'),
(218, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-29 22:18:35', '2026-07-29 22:18:35'),
(219, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-29 22:18:35', '2026-07-29 22:18:35'),
(220, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-29 22:18:35', '2026-07-29 22:18:35'),
(221, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-29 22:18:35', '2026-07-29 22:18:35'),
(222, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-29 22:18:35', '2026-07-29 22:18:35'),
(223, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-29 22:18:35', '2026-07-29 22:18:35'),
(224, 'USER_LOGIN', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno signed in', '2026-07-29 22:19:51', '2026-07-29 22:19:51'),
(225, 'USER_LOGIN', '001', 'Admin User', '001', 'Admin User', 'Admin User signed in', '2026-07-29 22:26:53', '2026-07-29 22:26:53'),
(226, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-29 22:27:11', '2026-07-29 22:27:11'),
(227, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-29 22:27:11', '2026-07-29 22:27:11'),
(228, 'USER_LOGIN', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio signed in', '2026-07-29 22:29:08', '2026-07-29 22:29:08'),
(229, 'USER_LOGIN', '001', 'Admin User', '001', 'Admin User', 'Admin User signed in', '2026-07-29 22:31:01', '2026-07-29 22:31:01'),
(230, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-29 22:50:22', '2026-07-29 22:50:22'),
(231, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-29 22:50:22', '2026-07-29 22:50:22'),
(232, 'USER_LOGIN', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio signed in', '2026-07-29 23:01:59', '2026-07-29 23:01:59'),
(233, 'USER_LOGIN', '001', 'Admin User', '001', 'Admin User', 'Admin User signed in', '2026-07-29 23:02:57', '2026-07-29 23:02:57'),
(234, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-29 23:02:59', '2026-07-29 23:02:59'),
(235, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-29 23:02:59', '2026-07-29 23:02:59'),
(236, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-29 23:03:33', '2026-07-29 23:03:33'),
(237, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-29 23:03:33', '2026-07-29 23:03:33'),
(238, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-29 23:03:33', '2026-07-29 23:03:33'),
(239, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-29 23:03:33', '2026-07-29 23:03:33'),
(240, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-29 23:03:33', '2026-07-29 23:03:33'),
(241, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-29 23:03:33', '2026-07-29 23:03:33'),
(242, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-29 23:03:33', '2026-07-29 23:03:33'),
(243, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-29 23:03:33', '2026-07-29 23:03:33'),
(244, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-29 23:03:33', '2026-07-29 23:03:33'),
(245, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-29 23:03:33', '2026-07-29 23:03:33'),
(246, 'USER_LOGIN', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno signed in', '2026-07-29 23:04:46', '2026-07-29 23:04:46'),
(247, 'USER_LOGIN', '001', 'Admin User', '001', 'Admin User', 'Admin User signed in', '2026-07-30 18:03:58', '2026-07-30 18:03:58'),
(248, 'USER_LOGIN', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno signed in', '2026-07-30 18:06:00', '2026-07-30 18:06:00'),
(249, 'USER_LOGIN', '001', 'Admin User', '001', 'Admin User', 'Admin User signed in', '2026-07-30 18:18:00', '2026-07-30 18:18:00'),
(250, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-30 18:19:41', '2026-07-30 18:19:41'),
(251, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-30 18:19:41', '2026-07-30 18:19:41'),
(252, 'USER_LOGIN', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno signed in', '2026-07-30 18:47:10', '2026-07-30 18:47:10'),
(253, 'USER_LOGIN', '002', 'Intern User', '002', 'Intern User', 'Intern User signed in', '2026-07-30 19:20:55', '2026-07-30 19:20:55'),
(254, 'USER_LOGIN', '001', 'Admin User', '001', 'Admin User', 'Admin User signed in', '2026-07-30 19:21:16', '2026-07-30 19:21:16'),
(255, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-30 19:22:20', '2026-07-30 19:22:20'),
(256, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-30 19:22:20', '2026-07-30 19:22:20'),
(257, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-30 19:22:59', '2026-07-30 19:22:59'),
(258, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-30 19:22:59', '2026-07-30 19:22:59'),
(259, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-30 19:23:02', '2026-07-30 19:23:02'),
(260, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-30 19:23:02', '2026-07-30 19:23:02'),
(261, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-30 19:29:16', '2026-07-30 19:29:16'),
(262, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-30 19:29:16', '2026-07-30 19:29:16'),
(263, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-30 19:29:16', '2026-07-30 19:29:16'),
(264, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-30 19:29:16', '2026-07-30 19:29:16'),
(265, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-30 19:29:16', '2026-07-30 19:29:16'),
(266, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-30 19:29:16', '2026-07-30 19:29:16'),
(267, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-30 19:29:16', '2026-07-30 19:29:16'),
(268, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-30 19:29:16', '2026-07-30 19:29:16'),
(269, 'SHIFT_RECORDED', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno recorded an attendance entry', '2026-07-30 19:29:16', '2026-07-30 19:29:16'),
(270, 'USER_LOGIN', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno signed in', '2026-07-30 19:30:26', '2026-07-30 19:30:26'),
(271, 'USER_LOGIN', '001', 'Admin User', '001', 'Admin User', 'Admin User signed in', '2026-07-30 19:33:23', '2026-07-30 19:33:23'),
(272, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-30 19:38:08', '2026-07-30 19:38:08'),
(273, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-30 19:38:08', '2026-07-30 19:38:08'),
(274, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:40:20', '2026-07-30 19:40:20'),
(275, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:40:20', '2026-07-30 19:40:20'),
(276, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:40:20', '2026-07-30 19:40:20'),
(277, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(278, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(279, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(280, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(281, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(282, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(283, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(284, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(285, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(286, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(287, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(288, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(289, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(290, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:49:27', '2026-07-30 19:49:27'),
(291, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:49:27', '2026-07-30 19:49:27'),
(292, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:49:27', '2026-07-30 19:49:27'),
(293, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:49:27', '2026-07-30 19:49:27'),
(294, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:49:27', '2026-07-30 19:49:27'),
(295, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:49:27', '2026-07-30 19:49:27'),
(296, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:49:27', '2026-07-30 19:49:27'),
(297, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:49:27', '2026-07-30 19:49:27'),
(298, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:49:27', '2026-07-30 19:49:27'),
(299, 'SHIFT_RECORDED', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio recorded an attendance entry', '2026-07-30 19:49:27', '2026-07-30 19:49:27'),
(300, 'USER_LOGIN', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio signed in', '2026-07-30 19:49:57', '2026-07-30 19:49:57'),
(301, 'USER_LOGIN', '002', 'Intern User', '002', 'Intern User', 'Intern User signed in', '2026-07-30 19:54:00', '2026-07-30 19:54:00'),
(302, 'SHIFT_RECORDED', '002', 'Intern User', '002', 'Intern User', 'Intern User recorded an attendance entry', '2026-07-30 19:54:05', '2026-07-30 19:54:05'),
(303, 'USER_LOGIN', 'manual_1784226048647', 'Marianie Turno', 'manual_1784226048647', 'Marianie Turno', 'Marianie Turno signed in', '2026-07-30 19:54:21', '2026-07-30 19:54:21'),
(304, 'USER_LOGIN', '001', 'Admin User', '001', 'Admin User', 'Admin User signed in', '2026-07-30 20:01:57', '2026-07-30 20:01:57'),
(305, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-30 20:13:55', '2026-07-30 20:13:55'),
(306, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-30 20:13:55', '2026-07-30 20:13:55'),
(307, 'USER_LOGIN', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio signed in', '2026-07-30 20:15:45', '2026-07-30 20:15:45'),
(308, 'USER_LOGIN', '001', 'Admin User', '001', 'Admin User', 'Admin User signed in', '2026-07-30 20:16:33', '2026-07-30 20:16:33'),
(309, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-30 20:16:35', '2026-07-30 20:16:35'),
(310, 'TIME_LOGS_VIEWED', '001', 'Admin User', NULL, NULL, 'Admin User opened the time logs', '2026-07-30 20:16:35', '2026-07-30 20:16:35'),
(311, 'USER_LOGIN', 'manual_1784218683356', 'Moses Andrew Salivio', 'manual_1784218683356', 'Moses Andrew Salivio', 'Moses Andrew Salivio signed in', '2026-07-30 21:26:07', '2026-07-30 21:26:07');

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
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(10) UNSIGNED NOT NULL,
  `recipient_id` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
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
(68, 'manual_1784226048647', 'Marianie Turno', '2026-07-01 21:00:00', '2026-07-02 06:00:00', 'completed', 9.00, NULL, NULL, 0.00, 0, NULL, 0, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-29 23:03:33', '2026-07-29 23:03:33'),
(69, 'manual_1784226048647', 'Marianie Turno', '2026-07-02 18:00:00', '2026-07-03 03:00:00', 'completed', 9.00, NULL, NULL, 0.00, 0, NULL, 0, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-29 23:03:33', '2026-07-29 23:03:33'),
(70, 'manual_1784226048647', 'Marianie Turno', '2026-07-03 21:00:00', '2026-07-04 06:00:00', 'completed', 9.00, NULL, NULL, 0.00, 0, NULL, 0, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-29 23:03:33', '2026-07-29 23:03:33'),
(71, 'manual_1784226048647', 'Marianie Turno', '2026-07-07 20:22:00', '2026-07-08 06:00:00', 'completed', 9.63, NULL, NULL, 0.63, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'resolved', '2026-07-30 18:04:35', '001', NULL, NULL, NULL, '2026-07-29 23:03:33', '2026-07-29 23:03:33'),
(72, 'manual_1784226048647', 'Marianie Turno', '2026-07-08 20:24:00', '2026-07-09 06:00:00', 'completed', 9.60, NULL, NULL, 0.60, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'resolved', '2026-07-30 18:04:35', '001', NULL, NULL, NULL, '2026-07-29 23:03:33', '2026-07-29 23:03:33'),
(73, 'manual_1784226048647', 'Marianie Turno', '2026-07-09 20:30:00', '2026-07-10 06:00:00', 'completed', 9.50, NULL, NULL, 0.50, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'resolved', '2026-07-30 18:04:42', '001', NULL, NULL, NULL, '2026-07-29 23:03:33', '2026-07-29 23:03:33'),
(74, 'manual_1784226048647', 'Marianie Turno', '2026-07-10 20:37:00', '2026-07-11 06:00:00', 'completed', 9.38, NULL, NULL, 0.38, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'resolved', '2026-07-30 18:04:40', '001', NULL, NULL, NULL, '2026-07-29 23:03:33', '2026-07-29 23:03:33'),
(75, 'manual_1784226048647', 'Marianie Turno', '2026-07-13 20:15:00', '2026-07-14 06:00:00', 'completed', 9.75, NULL, NULL, 0.75, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'resolved', '2026-07-30 18:04:42', '001', NULL, NULL, NULL, '2026-07-29 23:03:33', '2026-07-29 23:03:33'),
(76, 'manual_1784226048647', 'Marianie Turno', '2026-07-14 20:41:00', '2026-07-15 06:00:00', 'completed', 9.32, NULL, NULL, 0.32, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'resolved', '2026-07-30 18:04:41', '001', NULL, NULL, NULL, '2026-07-29 23:03:33', '2026-07-29 23:03:33'),
(77, 'manual_1784226048647', 'Marianie Turno', '2026-07-15 20:52:00', '2026-07-16 06:00:00', 'completed', 9.13, NULL, NULL, 0.13, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'resolved', '2026-07-30 18:04:42', '001', NULL, NULL, NULL, '2026-07-29 23:03:33', '2026-07-29 23:03:33'),
(78, 'manual_1784226048647', 'Marianie Turno', '2026-07-16 20:52:00', '2026-07-17 06:02:00', 'completed', 9.17, NULL, NULL, 0.17, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:29:16', '2026-07-30 19:29:16'),
(79, 'manual_1784226048647', 'Marianie Turno', '2026-07-17 20:56:00', '2026-07-18 06:00:00', 'completed', 9.07, NULL, NULL, 0.07, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:29:16', '2026-07-30 19:29:16'),
(80, 'manual_1784226048647', 'Marianie Turno', '2026-07-20 20:56:00', '2026-07-21 06:09:00', 'completed', 9.22, NULL, NULL, 0.22, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:29:16', '2026-07-30 19:29:16'),
(81, 'manual_1784226048647', 'Marianie Turno', '2026-07-21 20:53:00', '2026-07-22 06:00:00', 'completed', 9.12, NULL, NULL, 0.12, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:29:16', '2026-07-30 19:29:16'),
(82, 'manual_1784226048647', 'Marianie Turno', '2026-07-22 20:57:00', '2026-07-23 06:00:00', 'completed', 9.05, NULL, NULL, 0.05, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:29:16', '2026-07-30 19:29:16'),
(83, 'manual_1784226048647', 'Marianie Turno', '2026-07-23 21:08:00', '2026-07-24 06:01:00', 'completed', 8.88, NULL, NULL, 0.00, 0, NULL, 0, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:29:16', '2026-07-30 19:29:16'),
(84, 'manual_1784226048647', 'Marianie Turno', '2026-07-27 21:15:00', '2026-07-28 06:23:00', 'completed', 9.13, NULL, NULL, 0.13, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:29:16', '2026-07-30 19:29:16'),
(85, 'manual_1784226048647', 'Marianie Turno', '2026-07-28 21:00:00', '2026-07-29 06:00:00', 'completed', 9.00, NULL, NULL, 0.00, 0, NULL, 0, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:29:16', '2026-07-30 19:29:16'),
(86, 'manual_1784226048647', 'Marianie Turno', '2026-07-29 21:25:00', '2026-07-30 06:30:00', 'completed', 9.08, NULL, NULL, 0.08, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:29:16', '2026-07-30 19:29:16'),
(87, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-07-13 19:56:00', '2026-07-14 05:04:00', 'completed', 9.13, NULL, NULL, 0.13, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:40:20', '2026-07-30 19:40:20'),
(88, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-07-14 19:56:00', '2026-07-15 05:11:00', 'completed', 9.25, NULL, NULL, 0.25, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:40:20', '2026-07-30 19:40:20'),
(89, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-07-15 19:59:00', '2026-07-16 05:02:00', 'completed', 9.05, NULL, NULL, 0.05, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:40:20', '2026-07-30 19:40:20'),
(90, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-06-24 19:45:00', '2026-06-25 05:00:00', 'completed', 9.25, NULL, NULL, 0.25, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(91, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-06-25 19:55:00', '2026-06-26 05:18:00', 'completed', 9.38, NULL, NULL, 0.38, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(92, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-06-26 22:00:00', '2026-06-27 07:00:00', 'completed', 9.00, NULL, NULL, 0.00, 0, NULL, 0, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(93, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-06-29 20:00:00', '2026-06-30 05:12:00', 'completed', 9.20, NULL, NULL, 0.20, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(94, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-06-30 23:00:00', '2026-07-01 07:01:00', 'completed', 8.02, NULL, NULL, 0.00, 0, NULL, 0, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(95, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-07-01 20:00:00', '2026-07-02 05:06:00', 'completed', 9.10, NULL, NULL, 0.10, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(96, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-07-02 16:00:00', '2026-07-03 01:14:00', 'completed', 9.23, NULL, NULL, 0.23, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(97, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-07-03 19:51:00', '2026-07-04 05:04:00', 'completed', 9.22, NULL, NULL, 0.22, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(98, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-07-06 19:49:00', '2026-07-07 05:00:00', 'completed', 9.18, NULL, NULL, 0.18, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(99, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-07-07 19:48:00', '2026-07-08 05:15:00', 'completed', 9.45, NULL, NULL, 0.45, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(100, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-07-08 19:52:00', '2026-07-09 05:00:00', 'completed', 9.13, NULL, NULL, 0.13, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(101, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-07-09 19:58:00', '2026-07-10 05:00:00', 'completed', 9.03, NULL, NULL, 0.03, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(102, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-07-10 19:57:00', '2026-07-11 05:00:00', 'completed', 9.05, NULL, NULL, 0.05, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:47:42', '2026-07-30 19:47:42'),
(103, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-07-16 20:55:00', '2026-07-17 06:01:00', 'completed', 9.10, NULL, NULL, 0.10, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:49:27', '2026-07-30 19:49:27'),
(104, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-07-17 19:53:00', '2026-07-18 05:00:00', 'completed', 9.12, NULL, NULL, 0.12, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:49:27', '2026-07-30 19:49:27'),
(105, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-07-20 19:56:00', '2026-07-21 05:00:00', 'completed', 9.07, NULL, NULL, 0.07, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:49:27', '2026-07-30 19:49:27'),
(106, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-07-21 19:56:00', '2026-07-22 05:00:00', 'completed', 9.07, NULL, NULL, 0.07, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:49:27', '2026-07-30 19:49:27'),
(107, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-07-22 19:59:00', '2026-07-23 05:49:00', 'completed', 9.83, NULL, NULL, 0.83, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:49:27', '2026-07-30 19:49:27'),
(108, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-07-24 19:58:00', '2026-07-25 05:16:00', 'completed', 9.30, NULL, NULL, 0.30, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:49:27', '2026-07-30 19:49:27'),
(109, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-07-27 19:51:00', '2026-07-28 05:21:00', 'completed', 9.50, NULL, NULL, 0.50, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:49:27', '2026-07-30 19:49:27'),
(110, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-07-28 19:51:00', '2026-07-29 05:12:00', 'completed', 9.35, NULL, NULL, 0.35, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:49:27', '2026-07-30 19:49:27'),
(111, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-07-29 19:59:00', '2026-07-30 05:03:00', 'completed', 9.07, NULL, NULL, 0.07, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:49:27', '2026-07-30 19:49:27'),
(112, 'manual_1784218683356', 'Moses Andrew Salivio', '2026-07-30 19:57:00', '2026-07-31 05:00:00', 'completed', 9.05, NULL, NULL, 0.05, 0, NULL, 1, NULL, 0, 1, 'Bulk Entry', 'Bulk Imported', 'Bulk Added by Admin', '001', 'Admin User', 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:49:27', '2026-07-30 19:49:27'),
(113, '002', 'Intern User', '2026-07-31 03:54:05', NULL, 'active', 0.00, NULL, NULL, 0.00, 0, 1, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'new', NULL, NULL, NULL, NULL, NULL, '2026-07-30 19:54:05', '2026-07-30 19:54:05');

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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ticket_link` varchar(255) DEFAULT NULL
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `program` varchar(255) DEFAULT NULL,
  `year_level` varchar(255) DEFAULT NULL,
  `emergency_contact_name` varchar(255) DEFAULT NULL,
  `emergency_contact_relation` varchar(255) DEFAULT NULL,
  `emergency_contact_phone` varchar(255) DEFAULT NULL,
  `emergency_contact_email` varchar(255) DEFAULT NULL,
  `emergency_contact_location` varchar(255) DEFAULT NULL,
  `skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`skills`)),
  `documents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`documents`)),
  `school` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`uid`, `name`, `email`, `username`, `employee_id`, `password`, `is_default_password`, `role`, `department`, `photoURL`, `start_date`, `end_date`, `required_hours`, `schedule_start`, `schedule_end`, `active_task`, `created_at`, `updated_at`, `program`, `year_level`, `emergency_contact_name`, `emergency_contact_relation`, `emergency_contact_phone`, `emergency_contact_email`, `emergency_contact_location`, `skills`, `documents`, `school`) VALUES
('001', 'Admin User', 'admin-internship@test.com', NULL, NULL, '$2y$10$h0hKFwqOx1PJlQGMbeWfIeQDLZVIIH9Us7i4kNiFMYV8ZF/0ehTuq', 1, 'admin', 'IT Management', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-29 23:03:47', '2026-06-29 23:03:47', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('002', 'Intern User', 'intern@test.com', 'intern', '123', '$2y$10$S9LgLUI27I5V/rNUM.gh2ek9MOwdHMV0MAntAeyfMiymgsitV3Tb2', 1, 'intern', 'IT Software Development', NULL, '2026-06-24', '2026-07-31', 240, '03:30', '12:30', NULL, '2026-06-27 07:03:47', '2026-06-27 07:03:47', 'BS Engineering', '4TH Year', 'Jane Cruz', 'Mother', '0946332548', 'janecruz@test.com', 'Cebu City', '[\"HTML\",\"CSS\",\"JavaScript\",\"Python\"]', NULL, 'Cebu Technology University'),
('manual_1784218683356', 'Moses Andrew Salivio', 'mosesandrewsalivio17@gmail.com', 'mosesandrewsalivio', '00049', '$2b$10$kGupEJsj4sMePAnyaRvW/uUeGMOhEiRFKVd0nteYQCXO9RF5BmrTq', 1, 'intern', 'IT Department', NULL, '2026-06-24', '2026-07-30', 240, '20:00', '05:00', NULL, '2026-07-16 16:18:03', '2026-07-16 16:18:03', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('manual_1784226048647', 'Marianie Turno', 'mariannieturno@gmail.com', 'marianieturno', '00051', '$2b$10$MYwL5XLbfnjubb.mB9aiXOvQhmHrgdYqxmYl2mlZFSsz5seNBGecG', 1, 'intern', 'IT Department', NULL, '2026-07-01', '2027-01-30', 1200, '21:00', '06:00', NULL, '2026-07-16 18:20:48', '2026-07-16 18:20:48', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

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
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_recipient_id_is_read_index` (`recipient_id`,`is_read`);

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
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=312;

--
-- AUTO_INCREMENT for table `leave_requests`
--
ALTER TABLE `leave_requests`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `schedule_change_requests`
--
ALTER TABLE `schedule_change_requests`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `shifts`
--
ALTER TABLE `shifts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=114;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `time_logs`
--
ALTER TABLE `time_logs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD CONSTRAINT `leave_requests_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`uid`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_recipient_id_foreign` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`uid`);

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
