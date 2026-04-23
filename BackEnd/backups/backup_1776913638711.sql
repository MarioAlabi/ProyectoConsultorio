/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.16-MariaDB, for Linux (x86_64)
--
-- Host: 100.64.0.1    Database: proyecto_consultorio
-- ------------------------------------------------------
-- Server version	11.4.9-MariaDB-ubu2404

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
-- Table structure for table `__drizzle_migrations`
--

DROP TABLE IF EXISTS `__drizzle_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `__drizzle_migrations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `hash` text NOT NULL,
  `created_at` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `__drizzle_migrations`
--

LOCK TABLES `__drizzle_migrations` WRITE;
/*!40000 ALTER TABLE `__drizzle_migrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `__drizzle_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accounts`
--

DROP TABLE IF EXISTS `accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts` (
  `id` varchar(36) NOT NULL,
  `account_id` varchar(100) NOT NULL,
  `provider_id` varchar(20) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `password` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts`
--

LOCK TABLES `accounts` WRITE;
/*!40000 ALTER TABLE `accounts` DISABLE KEYS */;
INSERT INTO `accounts` VALUES
('1eBLGspXDQasiar9pcYmkg9zLKxnO68q','ZXcdNcdbSBSyO1keOChS54Kw0Y2oxnCA','credential','ZXcdNcdbSBSyO1keOChS54Kw0Y2oxnCA','3989dd813275ef7638c025288be947d6:8a276205752da4b47d2c62b9c3a25e27fddb7c676d2d3a851817d3ccf3c94a565237fb96ac108d4ca3b1c1c34cbcfac43638cdf413aed8362b627e0c372ec28e','2026-02-26 20:14:36','2026-02-26 20:14:36'),
('9V28YNPzhppaz8ujIWoMbh2y6nINoyur','N2zSqDNV4vWXBaprNAQZeIiNgc8bTkpp','credential','N2zSqDNV4vWXBaprNAQZeIiNgc8bTkpp','2c6adf742e46c4cd28abe9b9437ccd19:a6b1cac83907c44ae7d5d29a75fa5c6013354a727cfc6a0f5fd74cd77e24ae8cbacf457874596cf55a22a0ee76b10223e00e9bbd9f2e1ed443186599a75841c4','2026-03-05 02:21:20','2026-03-05 02:21:20'),
('AU7JqwN9qFc0jdAZZCPAV5glhDo4l50v','j9KjR7K34dbcqxkkVHicuw0mxZTla0qi','credential','j9KjR7K34dbcqxkkVHicuw0mxZTla0qi','c60fbeaa82c96bb863a04c765f0df1d1:0d8b7df1d3384e8fc58459a0d877ce1fbbe8e493516b445e77c3b6bfc0cf19d07fdc19c44f1c3ef27f001992aa4a528fe068eca3fda4064f7c03bbe7bcbc0a70','2026-02-27 00:17:01','2026-02-27 00:17:01'),
('EFCH9XI3S33SIkDihc7wGsgk76ANuxmd','jLXsoGglSt4QKNjJGaIooq8X3rsievwU','credential','jLXsoGglSt4QKNjJGaIooq8X3rsievwU','4f74f4eb146a9214a64ef351137c2b57:42a1b9b85b82dbd72404520647a4881d0fffac04e6e470ef7ab0ba19891cdfd8d9483d7625311e3215d9a30796c619c6557c73d481de9bac23a0f7c31084058f','2026-02-25 20:16:27','2026-02-26 18:37:52'),
('enBSUZ5hIWhRvBkZZr75JqPvBFcC0bWt','rfFo5fZAOAA5EiK6jsqR1Klo9qaku693','credential','rfFo5fZAOAA5EiK6jsqR1Klo9qaku693','953669466f35b54fdfc593abe1864101:887c73d158a6ee224437e4d014715216f6059a121580d4fb5c87d1ea35e29d321c1c63aef873a3fa495575053fce320a4b8ab26fb5482f25dc74f60b8082ff4b','2026-04-13 16:10:17','2026-04-13 16:10:17'),
('fuDnuKkTRF86FDbxNJgqAaKSzo8bkydE','5y0D9nfakUhq6af4PRgayfy4iZeW0acs','credential','5y0D9nfakUhq6af4PRgayfy4iZeW0acs','4d4e37e6b720bcc6e97eb8bef0e7e134:616871d17ea5a1252549079a98a4a7a99ff3876242d321b87f78a0a15ee88dc40b671d3c9c65ec48f52b4fe4ef9624d93975371b7c2f83e88f0f63184840579f','2026-02-25 20:16:28','2026-02-25 20:16:28'),
('k1lviFeN6SEc3RvPvsJDwBKkDHjFyEH0','dp7z44j6U0NXm1UYZKCfNY8CZc7i5uPR','credential','dp7z44j6U0NXm1UYZKCfNY8CZc7i5uPR','b7d65dc7385818a5805b0ad407b557e2:0828ed82fc7aa84b3d08786711557a5387eb6125a89eb11aabb5c66781631e51783f24a94ce43043f230cfe8a64dc628fdc8db0084cf0982e0b2bcdd3c95ed6a','2026-03-13 05:39:42','2026-03-13 05:39:42'),
('o7YeFuipSNC8a9HAqayjCgxWR9Q604Fb','MRwjrE0MFrsOsXBhRUdvoqUNi8SDkaYi','credential','MRwjrE0MFrsOsXBhRUdvoqUNi8SDkaYi','ce2c35b7bd48cabb7005783d58bb2ef0:3ea1e621ff97916e13ae9e07cafd83033c5ec73e61d7ce0397e008bd6bf5fca8286e14f8526387431e57904a90dc3e5bd3eff423b33ccf054874774f861f2a55','2026-02-27 01:39:32','2026-02-27 01:39:53'),
('PSALm6YEOju2FrgtD2SSzATCFhMEafev','c5bmjuhvmtb6whVVuuQ1Bgcbk7GPx3Jv','credential','c5bmjuhvmtb6whVVuuQ1Bgcbk7GPx3Jv','6fe15e23981381e46c587c3191bbf379:228f49f01ce1608a3c2a3b563a7fec018dc89589d2c41fc2cf47ae428ca2912f030ea97fa781f0c6987fe420603096369bf051c3efdbe54f6c1519276873c030','2026-03-13 05:33:21','2026-03-13 05:33:21'),
('tf7iMyFDOR0FIDHcGzEpwKxprxRxyh8v','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','credential','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','51975859f532b912254c2fd5bfce1d03:d73688d498aef913f1e749912037061e46067482a0785783c96ef40e1d1d7426dc970b6a9f8d516ac294464530433c021f337794b83df0997b9939ae4dfb114a','2026-03-13 06:24:59','2026-03-13 06:24:59'),
('Wj5nwjD82BVxV4oP8DFQ9dmQN2eZwRRZ','wBZjSwVoNJZD2NhRBALvUiVmwGlCnQMG','credential','wBZjSwVoNJZD2NhRBALvUiVmwGlCnQMG','5d352ee9477ee6ba48aaa6cc1d8765fd:805dcbca6ed93aa1a31bba7726b07ebfcd6513fa68701711148f40813057ea36b9f3b7c937e929b992ba93a4a7a04d3c847cead03c553927898ce590b6fc559e','2026-02-25 20:20:43','2026-02-26 17:02:54'),
('X1NrZniMG7lj4bIxKZoxaDYTwP0YbmVH','WL39Obu37xkbfRy5ZdwfiWMDcsuYA8Sq','credential','WL39Obu37xkbfRy5ZdwfiWMDcsuYA8Sq','4439aaad1f75fd3cbbb44e2dac701029:d108e503feb3a4a92ea3905a1b73e0c2fa5a175af888ff4465df8ebdbb9ccfc2a9571152d637b77686a2494d90c1c0ffee844d20f21e5cdc2b112a0d90580a99','2026-03-02 03:15:59','2026-03-02 03:15:59'),
('YfVxIsGm6zOgHYSU6fRozfcgT7yx6R2m','uNT1qYxsKostUzCxo0QL7HNfR07fiiYG','credential','uNT1qYxsKostUzCxo0QL7HNfR07fiiYG','9c23c5327b9b3a5a35de8518e4b8b179:0ba7c991a5c6ca768390a0b2a18415aca615d89c5bb899ad79160f9ac72babf97e3a0410c194f9753e180bf98352941310d1727b2767f03da5f1f80167efe7cc','2026-02-27 00:13:24','2026-02-27 00:13:24'),
('z0DIiR65r1pTNMJmhRLepEMYifIPEOMP','1VkIk8Qh4yM26lJcuYBWSvNZzvp3YGRL','credential','1VkIk8Qh4yM26lJcuYBWSvNZzvp3YGRL','aab425105373cbf38f3ad532fba54cf4:ef654b4b591f65482187d63c9c63872915b6f369255fd3b0a47ef3234df8b98b61785e41ddcc2691a53c317a2398ee00e6438761c6f74379704206e0fd0bacd0','2026-02-25 20:16:28','2026-02-25 20:16:28'),
('ZZkd5SH6jUMWQPgSsFzZtHTEuhzsjQ2t','qzN3J7mnA3pc7Lr2qgKTL0O5EzOQZn6c','credential','qzN3J7mnA3pc7Lr2qgKTL0O5EzOQZn6c','e1998b9ff8e0a974a7cbca60f9668128:6592f59d259ffddaafb1c0906f21a18cdb3e65a73070936662d4381049fc52383cfa5f7f8bc216f116e948e8da58611f9e07315ffb6a3633da20a4d1f4880961','2026-02-26 17:05:15','2026-03-13 05:30:15');
/*!40000 ALTER TABLE `accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `id` varchar(36) NOT NULL,
  `patient_id` varchar(36) NOT NULL,
  `date` date NOT NULL,
  `time` varchar(10) NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('scheduled','present','cancelled','done') NOT NULL DEFAULT 'scheduled',
  `created_by_user_id` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `appointments_patient_id_patients_id_fk` (`patient_id`),
  KEY `appointments_created_by_user_id_users_id_fk` (`created_by_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` varchar(36) NOT NULL,
  `table_name` varchar(50) NOT NULL,
  `record_id` varchar(36) NOT NULL,
  `action` enum('CREATE','UPDATE','DELETE','STATUS_CHANGE') NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `user_name` varchar(80) NOT NULL,
  `user_role` varchar(20) NOT NULL,
  `previous_values` text DEFAULT NULL,
  `new_values` text DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `audit_logs_user_id_users_id_fk` (`user_id`),
  CONSTRAINT `audit_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES
('0124edd2-5b69-44a5-98e7-aa08bc8f8aac','preclinical_records','e0a0a2d9-4af6-4de6-a140-e88a625399dc','CREATE','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','asistente','assistant',NULL,'{\"patientId\":\"0268a2da-d2d3-4e82-91a2-9861e268dec0\",\"motivo\":\"dolor de cabeza\"}','Registro pre-clínico creado para paciente ID 0268a2da-d2d3-4e82-91a2-9861e268dec0','::1','2026-04-22 19:31:52'),
('0c867965-f156-4f57-ab99-bc2f171af0ee','preclinical_records','e0a0a2d9-4af6-4de6-a140-e88a625399dc','UPDATE','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','asistente','assistant','{\"status\":\"waiting\"}','{\"patientId\":\"0268a2da-d2d3-4e82-91a2-9861e268dec0\",\"motivo\":\"dolor de cabeza\",\"bloodPressure\":\"120/80\",\"temperature\":40,\"weight\":200,\"height\":1.5,\"heartRate\":90,\"oxygenSaturation\":87,\"bmi\":40.32}','Registro pre-clínico de paciente \"Mauricio Funes\" actualizado','::1','2026-04-22 21:02:55'),
('15c71a7a-e120-4542-a6c9-9dec4fa1e439','patients','75311cc1-64d0-48d7-90c4-84fc2cfcc32b','STATUS_CHANGE','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','asistente','assistant','{\"status\":\"active\"}','{\"status\":\"inactive\"}','Estado de paciente \"carlos chavez\" (EXP-2026-5341) cambiado de \"active\" a \"inactive\"','::1','2026-04-22 21:19:17'),
('1683ccf3-41b1-44f3-b664-66d3bcc470bd','preclinical_records','064d3991-5b60-40ae-a8b7-bde7cc34b7e8','CREATE','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','asistente','assistant',NULL,'{\"patientId\":\"75311cc1-64d0-48d7-90c4-84fc2cfcc32b\",\"motivo\":\"\"}','Registro pre-clínico creado para paciente ID 75311cc1-64d0-48d7-90c4-84fc2cfcc32b','::1','2026-04-22 21:02:23'),
('309cc89b-c859-4fc5-b7bf-8591648ccc08','patients','75311cc1-64d0-48d7-90c4-84fc2cfcc32b','CREATE','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','asistente','assistant',NULL,'{\"fullName\":\"carlos chavez\",\"dateOfBirth\":\"2001-02-14\",\"identityDocument\":\"12345678-9\",\"gender\":\"male\",\"phone\":\"1234-5677\",\"address\":\"santa ana\",\"isMinor\":false,\"responsibleName\":null,\"personalHistory\":\"cancer\",\"familyHistory\":\"\",\"fileNumber\":\"EXP-2026-5341\"}','Expediente EXP-2026-5341 creado para paciente \"carlos chavez\"','::1','2026-04-22 20:57:03'),
('3a7e2389-6285-442f-8c50-2c67d96c6171','preclinical_records','e0a0a2d9-4af6-4de6-a140-e88a625399dc','UPDATE','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','asistente','assistant','{\"status\":\"waiting\"}','{\"patientId\":\"0268a2da-d2d3-4e82-91a2-9861e268dec0\",\"motivo\":\"vomitos\",\"bloodPressure\":\"120/80\",\"temperature\":40,\"weight\":200,\"height\":1.5,\"heartRate\":90,\"oxygenSaturation\":87,\"bmi\":40.32}','Registro pre-clínico de paciente \"Mauricio Funes\" actualizado','::1','2026-04-22 20:46:48'),
('4afc4bcb-3832-4809-8dd0-7f7f740f001b','preclinical_records','e0a0a2d9-4af6-4de6-a140-e88a625399dc','UPDATE','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','asistente','assistant','{\"status\":\"waiting\"}','{\"patientId\":\"0268a2da-d2d3-4e82-91a2-9861e268dec0\",\"motivo\":\"dolor de cabeza\",\"bloodPressure\":\"120/80\",\"temperature\":31,\"weight\":200,\"height\":1.5,\"heartRate\":90,\"oxygenSaturation\":87,\"bmi\":40.32}','Registro pre-clínico de paciente \"Mauricio Funes\" actualizado','::1','2026-04-22 20:47:20'),
('63a9d75c-17bf-4352-baa0-2f6d51fcf80a','patients','75311cc1-64d0-48d7-90c4-84fc2cfcc32b','STATUS_CHANGE','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','asistente','assistant','{\"status\":\"deceased\"}','{\"status\":\"active\"}','Estado de paciente \"carlos chavez\" (EXP-2026-5341) cambiado de \"deceased\" a \"active\"','::1','2026-04-22 21:21:24'),
('9889996e-6e1e-4849-8f70-d433be709121','preclinical_records','e0a0a2d9-4af6-4de6-a140-e88a625399dc','UPDATE','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','asistente','assistant','{\"status\":\"waiting\"}','{\"patientId\":\"0268a2da-d2d3-4e82-91a2-9861e268dec0\",\"motivo\":\"dolor de cabeza\",\"bloodPressure\":\"120/80\",\"temperature\":38,\"weight\":200,\"height\":1.5,\"heartRate\":90,\"oxygenSaturation\":87,\"bmi\":40.32}','Registro pre-clínico de paciente \"Mauricio Funes\" actualizado','::1','2026-04-22 20:40:10'),
('9b3969cd-ec5d-4ce9-ab95-9e4a3c3c9f15','patients','75311cc1-64d0-48d7-90c4-84fc2cfcc32b','STATUS_CHANGE','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','asistente','assistant','{\"status\":\"inactive\"}','{\"status\":\"deceased\"}','Estado de paciente \"carlos chavez\" (EXP-2026-5341) cambiado de \"inactive\" a \"deceased\"','::1','2026-04-22 21:19:32'),
('c1052c52-c3f0-46e6-a263-4539645aca49','preclinical_records','e0a0a2d9-4af6-4de6-a140-e88a625399dc','UPDATE','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','asistente','assistant','{\"status\":\"waiting\"}','{\"patientId\":\"0268a2da-d2d3-4e82-91a2-9861e268dec0\",\"motivo\":\"vomitos\",\"bloodPressure\":\"120/80\",\"temperature\":40,\"weight\":200,\"height\":1.5,\"heartRate\":90,\"oxygenSaturation\":87,\"bmi\":40.32}','Registro pre-clínico de paciente \"Mauricio Funes\" actualizado','::1','2026-04-22 20:46:32'),
('cbefa754-a15b-4e7a-8593-218c4e130e0f','patients','0268a2da-d2d3-4e82-91a2-9861e268dec0','CREATE','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','asistente','assistant',NULL,'{\"fullName\":\"Mauricio Funes\",\"dateOfBirth\":\"2017-07-05\",\"identityDocument\":\"12345678-9\",\"gender\":\"male\",\"phone\":\"1234-5677\",\"address\":\"Santa Ana\",\"isMinor\":true,\"responsibleName\":\"Francisco Flores\",\"personalHistory\":\"robo, desfalco, desvios de fondos publicos\",\"familyHistory\":\"divorciado, negro\",\"fileNumber\":\"EXP-2026-3035\"}','Expediente EXP-2026-3035 creado para paciente \"Mauricio Funes\"','::1','2026-04-22 19:29:47'),
('dc3ccc9d-0ca0-436c-9139-c86eb48cb0d7','preclinical_records','387f8f01-4fdb-4dee-8644-82cdf7a0024d','CREATE','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','asistente','assistant',NULL,'{\"patientId\":\"cb185cdf-5f16-433d-89f2-e7259b050059\",\"motivo\":\"malestar estomacal\"}','Registro pre-clínico creado para paciente ID cb185cdf-5f16-433d-89f2-e7259b050059','::1','2026-04-22 18:32:20'),
('df3486c9-9acd-496a-bca3-8c68d49f62a3','preclinical_records','e0a0a2d9-4af6-4de6-a140-e88a625399dc','UPDATE','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','asistente','assistant','{\"status\":\"waiting\"}','{\"patientId\":\"0268a2da-d2d3-4e82-91a2-9861e268dec0\",\"motivo\":\"dolor de cabeza\",\"bloodPressure\":\"120/80\",\"temperature\":40,\"weight\":200,\"height\":1.5,\"heartRate\":90,\"oxygenSaturation\":87,\"bmi\":40.32}','Registro pre-clínico de paciente \"Mauricio Funes\" actualizado','::1','2026-04-22 20:38:36'),
('e680cfcd-fe43-448d-83e2-5476cd5b5d9d','patients','cb185cdf-5f16-433d-89f2-e7259b050059','CREATE','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','asistente','assistant',NULL,'{\"fullName\":\"Vin Diesel\",\"dateOfBirth\":\"2004-02-03\",\"identityDocument\":\"12345678-9\",\"gender\":\"male\",\"phone\":\"1234-5677\",\"address\":\"Santa Ana\",\"isMinor\":true,\"responsibleName\":\"Alguien\",\"personalHistory\":\"Convulsiones\",\"familyHistory\":\"Cancer\",\"fileNumber\":\"EXP-2026-8733\"}','Expediente EXP-2026-8733 creado para paciente \"Vin Diesel\"','::1','2026-04-22 18:29:05');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clinic_settings`
--

DROP TABLE IF EXISTS `clinic_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `clinic_settings` (
  `id` int(11) NOT NULL,
  `clinic_name` varchar(255) NOT NULL,
  `address` varchar(100) DEFAULT NULL,
  `logo_url` longtext DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clinic_settings`
--

LOCK TABLES `clinic_settings` WRITE;
/*!40000 ALTER TABLE `clinic_settings` DISABLE KEYS */;
INSERT INTO `clinic_settings` VALUES
(1,'clinica buena','','data:image/png;base64,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','2026-04-22 18:25:47');
/*!40000 ALTER TABLE `clinic_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `insurers`
--

DROP TABLE IF EXISTS `insurers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `insurers` (
  `id` varchar(36) NOT NULL,
  `company_name` varchar(150) NOT NULL,
  `contact_name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `fixed_consultation_amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `insurers`
--

LOCK TABLES `insurers` WRITE;
/*!40000 ALTER TABLE `insurers` DISABLE KEYS */;
/*!40000 ALTER TABLE `insurers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_consultations`
--

DROP TABLE IF EXISTS `medical_consultations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_consultations` (
  `id` varchar(36) NOT NULL,
  `preclinical_id` varchar(36) NOT NULL,
  `patient_id` varchar(36) NOT NULL,
  `doctor_id` varchar(36) NOT NULL,
  `anamnesis` text DEFAULT NULL,
  `physical_exam` text DEFAULT NULL,
  `diagnosis` text DEFAULT NULL,
  `lab_results` text DEFAULT NULL,
  `observations` text DEFAULT NULL,
  `documents` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `insurer_id` varchar(36) DEFAULT NULL,
  `agreed_amount` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `medical_consultations_insurer_id_insurers_id_fk` (`insurer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_consultations`
--

LOCK TABLES `medical_consultations` WRITE;
/*!40000 ALTER TABLE `medical_consultations` DISABLE KEYS */;
/*!40000 ALTER TABLE `medical_consultations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patients`
--

DROP TABLE IF EXISTS `patients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `patients` (
  `id` varchar(36) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `year_of_birth` date NOT NULL,
  `identity_document` varchar(20) NOT NULL,
  `gender` enum('male','female') NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `file_number` varchar(20) NOT NULL,
  `is_minor` int(11) DEFAULT NULL,
  `responsible_name` varchar(100) DEFAULT NULL,
  `personal_history` varchar(200) DEFAULT NULL,
  `family_history` varchar(200) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `insurer_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `patients_insurer_id_insurers_id_fk` (`insurer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patients`
--

LOCK TABLES `patients` WRITE;
/*!40000 ALTER TABLE `patients` DISABLE KEYS */;
INSERT INTO `patients` VALUES
('0268a2da-d2d3-4e82-91a2-9861e268dec0','Mauricio Funes','2017-07-05','12345678-9','male','1234-5677','Santa Ana','EXP-2026-3035',1,'Francisco Flores','robo, desfalco, desvios de fondos publicos','divorciado, negro','active','2026-04-22 19:29:47','2026-04-22 19:29:47',NULL),
('75311cc1-64d0-48d7-90c4-84fc2cfcc32b','carlos chavez','2001-02-14','12345678-9','male','1234-5677','santa ana','EXP-2026-5341',0,NULL,'cancer',NULL,'active','2026-04-22 20:57:03','2026-04-23 03:21:23',NULL),
('cb185cdf-5f16-433d-89f2-e7259b050059','Vin Diesel','2004-02-03','12345678-9','male','1234-5677','Santa Ana','EXP-2026-8733',1,'Alguien','Convulsiones','Cancer','active','2026-04-22 18:29:05','2026-04-22 18:29:05',NULL);
/*!40000 ALTER TABLE `patients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `preclinical_records`
--

DROP TABLE IF EXISTS `preclinical_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `preclinical_records` (
  `id` varchar(36) NOT NULL,
  `patient_id` varchar(36) NOT NULL,
  `created_by_user_id` varchar(36) NOT NULL,
  `created_by_role` varchar(20) NOT NULL,
  `motivo` text NOT NULL,
  `blood_pressure` varchar(20) DEFAULT NULL,
  `temperature` decimal(5,2) DEFAULT NULL,
  `weight` decimal(6,2) DEFAULT NULL,
  `height` decimal(4,2) DEFAULT NULL,
  `heart_rate` int(11) DEFAULT NULL,
  `oxygen_saturation` int(11) DEFAULT NULL,
  `bmi` decimal(5,2) DEFAULT NULL,
  `status` enum('waiting','in_consultation','done','cancelled') NOT NULL DEFAULT 'waiting',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_preclinical_patient` (`patient_id`),
  KEY `fk_preclinical_user` (`created_by_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `preclinical_records`
--

LOCK TABLES `preclinical_records` WRITE;
/*!40000 ALTER TABLE `preclinical_records` DISABLE KEYS */;
INSERT INTO `preclinical_records` VALUES
('064d3991-5b60-40ae-a8b7-bde7cc34b7e8','75311cc1-64d0-48d7-90c4-84fc2cfcc32b','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','assistant','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'waiting','2026-04-22 21:02:23','2026-04-22 21:02:23'),
('387f8f01-4fdb-4dee-8644-82cdf7a0024d','cb185cdf-5f16-433d-89f2-e7259b050059','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','assistant','malestar estomacal','120/80',35.00,652.00,1.61,100,87,114.09,'waiting','2026-04-22 18:32:20','2026-04-22 18:32:20'),
('e0a0a2d9-4af6-4de6-a140-e88a625399dc','0268a2da-d2d3-4e82-91a2-9861e268dec0','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','assistant','dolor de cabeza','120/80',40.00,200.00,1.50,90,87,40.32,'waiting','2026-04-22 19:31:52','2026-04-23 03:02:54');
/*!40000 ALTER TABLE `preclinical_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescribed_medications`
--

DROP TABLE IF EXISTS `prescribed_medications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescribed_medications` (
  `id` varchar(36) NOT NULL,
  `consultation_id` varchar(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `concentration` varchar(50) DEFAULT NULL,
  `concentration_unit` varchar(20) DEFAULT NULL,
  `dose` varchar(50) DEFAULT NULL,
  `dose_unit` varchar(50) DEFAULT NULL,
  `route` varchar(50) DEFAULT NULL,
  `frequency` varchar(50) DEFAULT NULL,
  `duration` varchar(50) DEFAULT NULL,
  `additional_instructions` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescribed_medications`
--

LOCK TABLES `prescribed_medications` WRITE;
/*!40000 ALTER TABLE `prescribed_medications` DISABLE KEYS */;
/*!40000 ALTER TABLE `prescribed_medications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rate_limit`
--

DROP TABLE IF EXISTS `rate_limit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `rate_limit` (
  `id` varchar(36) NOT NULL,
  `key` text NOT NULL,
  `count` int(11) NOT NULL,
  `last_request` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rate_limit`
--

LOCK TABLES `rate_limit` WRITE;
/*!40000 ALTER TABLE `rate_limit` DISABLE KEYS */;
INSERT INTO `rate_limit` VALUES
('33vFEF8Ugqoh3BK5RVgAYJYEX1PPX0BV','168.243.238.82/sign-in/email',3,1776913410541),
('3aWd0a70rHADYK1ta09XbqsK3WDHnFvX','127.0.0.1/admin/list-users',4,1776883607657),
('aJQgAjAT1l8ZOe2Ee80mHm4XUF0RwO9g','127.0.0.1/sign-in/email',1,1776884785552),
('CcqbVv3soa9rHj1yr2Spsriw2RS4lqSJ','168.243.238.82/admin/list-users',1,1776913410926),
('een39tdwBi5Zwtx1hWqYW1moQRARAUPc','127.0.0.1/sign-out',2,1776883607200),
('qwDr79NvBn0hBrr9qWKqh9iic0AMUgPj','168.243.238.82/get-session',5,1776913564660),
('YSbyh1QoUieznFemfvCeEgyvyUExApGH','127.0.0.1/get-session',1,1776892934753);
/*!40000 ALTER TABLE `rate_limit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `token` varchar(128) NOT NULL,
  `expires_at` datetime NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `impersonated_by` varchar(36) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sessions_token_unique` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES
('4DrChwZIA5dQZ6hxhgzE1AOcQvMImWfx','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','nvB3oNWoT6CXPLBeADIEjAZhk3zAkyil','2026-04-23 09:21:15','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',NULL,'2026-04-22 19:06:26','2026-04-22 21:21:15'),
('uus4hbNlAh3A2PYLBTR9WqiXexGVtBwt','c5bmjuhvmtb6whVVuuQ1Bgcbk7GPx3Jv','Kw6o24gOujy4jTCHnvCzO7gIZrJJwN6B','2026-04-23 15:03:30','168.243.238.82','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',NULL,'2026-04-23 03:03:30','2026-04-23 03:03:30'),
('zqypGscXUGh4XSuuBFQ8wY26yj58GKbv','c5bmjuhvmtb6whVVuuQ1Bgcbk7GPx3Jv','M7U1vreK8Eae5OKL9IAtUOdLkgJNQk1c','2026-04-23 15:07:07','','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',NULL,'2026-04-23 03:07:07','2026-04-23 03:07:07');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(80) NOT NULL,
  `email` varchar(100) NOT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `image` varchar(255) DEFAULT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'assistant',
  `banned` tinyint(1) NOT NULL DEFAULT 0,
  `ban_reason` varchar(255) DEFAULT NULL,
  `ban_expires` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
('1VkIk8Qh4yM26lJcuYBWSvNZzvp3YGRL','Dr. Gregory House','doctor@consultorio.com',0,NULL,'doctor',0,NULL,NULL,'2026-02-25 20:16:28','2026-02-25 20:16:28'),
('5y0D9nfakUhq6af4PRgayfy4iZeW0acs','Ana Reception','assistant@consultorio.com',0,NULL,'assistant',1,'Desactivado por administrador',NULL,'2026-02-25 20:16:28','2026-02-26 16:53:29'),
('C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','asistente','asistente@consultorio.com',0,NULL,'assistant',0,NULL,NULL,'2026-03-13 06:24:59','2026-03-13 06:24:59'),
('c5bmjuhvmtb6whVVuuQ1Bgcbk7GPx3Jv','Balcaceres ','silvestre@consultorio.com',0,NULL,'admin',0,NULL,NULL,'2026-03-13 05:33:21','2026-03-13 05:33:21'),
('dp7z44j6U0NXm1UYZKCfNY8CZc7i5uPR','juan','juan@gmail.com',0,NULL,'doctor',0,NULL,NULL,'2026-03-13 05:39:41','2026-03-13 05:39:41'),
('j9KjR7K34dbcqxkkVHicuw0mxZTla0qi','flor','flor@consultorio.com',0,NULL,'doctor',0,NULL,NULL,'2026-02-27 00:17:01','2026-02-27 00:17:01'),
('jLXsoGglSt4QKNjJGaIooq8X3rsievwU','Central Administrator','admin@consultorio.com',0,NULL,'admin',0,NULL,NULL,'2026-02-25 20:16:27','2026-02-25 20:16:27'),
('MRwjrE0MFrsOsXBhRUdvoqUNi8SDkaYi','Ricardo Quintanilla','quintanilla@consultorio.com',0,NULL,'doctor',0,NULL,NULL,'2026-02-27 01:39:32','2026-02-27 01:39:32'),
('N2zSqDNV4vWXBaprNAQZeIiNgc8bTkpp','yesenia','yesenia@consultorio.com',0,NULL,'assistant',0,NULL,NULL,'2026-03-05 02:21:19','2026-03-05 02:21:19'),
('qzN3J7mnA3pc7Lr2qgKTL0O5EzOQZn6c','felipe','luis.balcaceres@catolica.edu.sv',0,NULL,'assistant',0,NULL,NULL,'2026-02-26 17:05:15','2026-02-26 20:40:22'),
('rfFo5fZAOAA5EiK6jsqR1Klo9qaku693','antonio','antonio123@gmail.com',0,NULL,'doctor',0,NULL,NULL,'2026-04-13 16:10:17','2026-04-13 16:10:17'),
('uNT1qYxsKostUzCxo0QL7HNfR07fiiYG','Mario','marioedgardovilledaalabi@gmail.com',0,NULL,'admin',1,'Desactivado por administrador',NULL,'2026-02-27 00:13:24','2026-03-13 05:40:23'),
('wBZjSwVoNJZD2NhRBALvUiVmwGlCnQMG','carlos','carlos@gmail.com',0,NULL,'assistant',0,NULL,NULL,'2026-02-25 20:20:42','2026-02-26 17:02:59'),
('WL39Obu37xkbfRy5ZdwfiWMDcsuYA8Sq','Dennis Ademir Guevara Martinez','ademir2812dk@gmail.com',0,NULL,'doctor',0,NULL,NULL,'2026-03-02 03:15:59','2026-03-02 03:15:59'),
('ZXcdNcdbSBSyO1keOChS54Kw0Y2oxnCA','ana','ana@gmail.com',0,NULL,'doctor',0,NULL,NULL,'2026-02-26 20:14:36','2026-02-26 20:14:36');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `verifications`
--

DROP TABLE IF EXISTS `verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `verifications` (
  `id` varchar(36) NOT NULL,
  `identifier` varchar(255) NOT NULL,
  `value` text NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `verifications`
--

LOCK TABLES `verifications` WRITE;
/*!40000 ALTER TABLE `verifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `verifications` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-22 21:07:18
