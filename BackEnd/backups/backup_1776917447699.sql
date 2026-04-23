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
('0L2lBU7Che7K0oLKq0ethvdfKtZNPHiW','c5bmjuhvmtb6whVVuuQ1Bgcbk7GPx3Jv','40AoerbbUJXiQbGjR4WIpIJBPenDG9sN','2026-04-23 16:10:42','','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',NULL,'2026-04-23 04:10:42','2026-04-23 04:10:42'),
('4DrChwZIA5dQZ6hxhgzE1AOcQvMImWfx','C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','nvB3oNWoT6CXPLBeADIEjAZhk3zAkyil','2026-04-23 15:29:45','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',NULL,'2026-04-22 19:06:26','2026-04-23 03:29:45'),
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
  `dui` varchar(10) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `hiring_date` date DEFAULT NULL,
  `is_nurse` tinyint(1) DEFAULT 0,
  `jvpm` varchar(20) DEFAULT NULL,
  `jvpe` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `dui` (`dui`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
('1VkIk8Qh4yM26lJcuYBWSvNZzvp3YGRL','Dr. Gregory House','doctor@consultorio.com',0,NULL,'doctor',0,NULL,NULL,'2026-02-25 20:16:28','2026-02-25 20:16:28',NULL,NULL,NULL,NULL,0,NULL,NULL),
('5y0D9nfakUhq6af4PRgayfy4iZeW0acs','Ana Reception','assistant@consultorio.com',0,NULL,'assistant',1,'Desactivado por administrador',NULL,'2026-02-25 20:16:28','2026-02-26 16:53:29',NULL,NULL,NULL,NULL,0,NULL,NULL),
('C2S6R0zrFJDPopxa4R6z91guTx1uRwXB','asistente','asistente@consultorio.com',0,NULL,'assistant',0,NULL,NULL,'2026-03-13 06:24:59','2026-03-13 06:24:59',NULL,NULL,NULL,NULL,0,NULL,NULL),
('c5bmjuhvmtb6whVVuuQ1Bgcbk7GPx3Jv','Balcaceres ','silvestre@consultorio.com',0,NULL,'admin',0,NULL,NULL,'2026-03-13 05:33:21','2026-03-13 05:33:21',NULL,NULL,NULL,NULL,0,NULL,NULL),
('dp7z44j6U0NXm1UYZKCfNY8CZc7i5uPR','juan','juan@gmail.com',0,NULL,'doctor',0,NULL,NULL,'2026-03-13 05:39:41','2026-03-13 05:39:41',NULL,NULL,NULL,NULL,0,NULL,NULL),
('j9KjR7K34dbcqxkkVHicuw0mxZTla0qi','flor','flor@consultorio.com',0,NULL,'doctor',0,NULL,NULL,'2026-02-27 00:17:01','2026-02-27 00:17:01',NULL,NULL,NULL,NULL,0,NULL,NULL),
('jLXsoGglSt4QKNjJGaIooq8X3rsievwU','Central Administrator','admin@consultorio.com',0,NULL,'admin',0,NULL,NULL,'2026-02-25 20:16:27','2026-02-25 20:16:27',NULL,NULL,NULL,NULL,0,NULL,NULL),
('MRwjrE0MFrsOsXBhRUdvoqUNi8SDkaYi','Ricardo Quintanilla','quintanilla@consultorio.com',0,NULL,'doctor',0,NULL,NULL,'2026-02-27 01:39:32','2026-02-27 01:39:32',NULL,NULL,NULL,NULL,0,NULL,NULL),
('N2zSqDNV4vWXBaprNAQZeIiNgc8bTkpp','yesenia','yesenia@consultorio.com',0,NULL,'assistant',0,NULL,NULL,'2026-03-05 02:21:19','2026-03-05 02:21:19',NULL,NULL,NULL,NULL,0,NULL,NULL),
('qzN3J7mnA3pc7Lr2qgKTL0O5EzOQZn6c','felipe','luis.balcaceres@catolica.edu.sv',0,NULL,'assistant',0,NULL,NULL,'2026-02-26 17:05:15','2026-02-26 20:40:22',NULL,NULL,NULL,NULL,0,NULL,NULL),
('rfFo5fZAOAA5EiK6jsqR1Klo9qaku693','antonio','antonio123@gmail.com',0,NULL,'doctor',0,NULL,NULL,'2026-04-13 16:10:17','2026-04-13 16:10:17',NULL,NULL,NULL,NULL,0,NULL,NULL),
('uNT1qYxsKostUzCxo0QL7HNfR07fiiYG','Mario','marioedgardovilledaalabi@gmail.com',0,NULL,'admin',1,'Desactivado por administrador',NULL,'2026-02-27 00:13:24','2026-03-13 05:40:23',NULL,NULL,NULL,NULL,0,NULL,NULL),
('wBZjSwVoNJZD2NhRBALvUiVmwGlCnQMG','carlos','carlos@gmail.com',0,NULL,'assistant',0,NULL,NULL,'2026-02-25 20:20:42','2026-02-26 17:02:59',NULL,NULL,NULL,NULL,0,NULL,NULL),
('WL39Obu37xkbfRy5ZdwfiWMDcsuYA8Sq','Dennis Ademir Guevara Martinez','ademir2812dk@gmail.com',0,NULL,'doctor',0,NULL,NULL,'2026-03-02 03:15:59','2026-03-02 03:15:59',NULL,NULL,NULL,NULL,0,NULL,NULL),
('ZXcdNcdbSBSyO1keOChS54Kw0Y2oxnCA','ana','ana@gmail.com',0,NULL,'doctor',0,NULL,NULL,'2026-02-26 20:14:36','2026-02-26 20:14:36',NULL,NULL,NULL,NULL,0,NULL,NULL);
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

-- Dump completed on 2026-04-22 22:10:47
