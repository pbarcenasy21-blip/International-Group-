-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: adminseguro_ctg
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `documento` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_registro` date NOT NULL DEFAULT (curdate()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_clientes_documento` (`documento`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,'Andrés Castillo','73150987','3205551122','acastillo@correo.com','2026-10-25'),(2,'John Smith','P98234571','3157778899','john.smith@mail.com','2026-10-26'),(3,'María Fernanda Ruiz','1045123456','3001234567','mfruiz@correo.com','2026-10-27'),(4,'Marie Dubois','FR7721903','3169990011','marie.d@mail.com','2026-10-28'),(5,'Sofía Herrera','1129876543','3112223344','sherrera@correo.com','2026-10-29'),(6,'Daniel','115181251','3004585514','daniel@legustaelvaper.com','2026-11-17'),(10,'Daniel','11534352341','3004585514','daniel@legustaelvaper.com','2026-11-17'),(12,'Juanito Alimañia','780490312','3045556271','juanito@xn--alimaia-8za.com','2026-11-17');
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial`
--

DROP TABLE IF EXISTS `historial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int unsigned DEFAULT NULL,
  `usuario` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accion` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `detalle` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_hora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_historial_fecha` (`fecha_hora`),
  KEY `ix_historial_usuario` (`id_usuario`),
  CONSTRAINT `fk_historial_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial`
--

LOCK TABLES `historial` WRITE;
/*!40000 ALTER TABLE `historial` DISABLE KEYS */;
INSERT INTO `historial` VALUES (1,1,'Administrador General','Datos de ejemplo','Se cargaron los datos iniciales del sistema','2026-11-17 11:42:35'),(2,1,'Administrador General','Inicio de sesión','El usuario admin ingresó al sistema','2026-11-17 11:42:35'),(3,NULL,'Sistema','Eliminación de cliente','ID 6','2026-11-17 14:49:27'),(4,NULL,'Sistema','Registro de cliente','Daniel','2026-11-17 14:50:22'),(5,NULL,'Sistema','Registro de cliente','Daniel','2026-11-17 15:03:59'),(6,NULL,'Sistema','Registro de reserva','Reserva #5','2026-11-17 15:08:57'),(7,NULL,'Sistema','Registro de reserva','Reserva #6','2026-11-17 15:09:09'),(8,NULL,'Sistema','Registro de reserva','Reserva #7','2026-11-17 15:09:10'),(9,NULL,'Sistema','Registro de reserva','Reserva #8','2026-11-17 15:09:10'),(10,NULL,'Sistema','Registro de reserva','Reserva #9','2026-11-17 15:11:50'),(11,NULL,'Sistema','Registro de reserva','Reserva #10','2026-11-17 15:11:57'),(12,NULL,'Sistema','Edición de inventario','ID 1','2026-11-17 15:12:49'),(13,NULL,'Sistema','Edición de inventario','ID 1','2026-11-17 15:12:55'),(14,NULL,'Sistema','Edición de inventario','ID 1','2026-11-17 15:13:12'),(15,NULL,'Sistema','Edición de inventario','ID 1','2026-11-17 15:13:18'),(16,NULL,'Sistema','Edición de inventario','ID 1','2026-11-17 15:13:49'),(17,1,'Administrador General','Edición de inventario','Tour Islas del Rosario: 50 cupos','2026-11-17 15:18:29'),(18,1,'Administrador General','Edición de inventario','Tour Islas del Rosario: 60 cupos','2026-11-17 15:18:51'),(19,1,'Administrador General','Registro de reserva','#undefined · Daniel · Tour Islas del Rosario','2026-11-17 15:24:09'),(20,1,'Administrador General','Registro de usuario','Jvega_588 (Administrador)','2026-11-17 15:26:44'),(21,1,'Administrador General','Registro de usuario','facabu (Trabajador autorizado)','2026-11-17 15:30:43'),(22,1,'Administrador General','Registro de cliente','Juanito Alimañia (780490312)','2026-11-17 15:45:54');
/*!40000 ALTER TABLE `historial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventario`
--

DROP TABLE IF EXISTS `inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventario` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `id_servicio` int unsigned NOT NULL,
  `cantidad_disponible` int NOT NULL DEFAULT '0',
  `fecha_actualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inventario_id_servicio` (`id_servicio`),
  CONSTRAINT `fk_inventario_servicio` FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ck_inventario_cantidad` CHECK ((`cantidad_disponible` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventario`
--

LOCK TABLES `inventario` WRITE;
/*!40000 ALTER TABLE `inventario` DISABLE KEYS */;
INSERT INTO `inventario` VALUES (1,1,55,'2026-11-17 15:24:08'),(2,2,15,'2026-11-17 11:42:35'),(3,3,30,'2026-11-17 11:42:35'),(4,4,40,'2026-11-17 11:42:35'),(5,5,0,'2026-11-17 11:42:35');
/*!40000 ALTER TABLE `inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservas`
--

DROP TABLE IF EXISTS `reservas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservas` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `id_cliente` int unsigned NOT NULL,
  `id_servicio` int unsigned NOT NULL,
  `id_usuario` int unsigned NOT NULL,
  `fecha` date NOT NULL,
  `personas` smallint unsigned NOT NULL,
  `estado` enum('Pendiente','Confirmada','Cancelada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendiente',
  `precio_unitario` int unsigned NOT NULL,
  `total` int unsigned NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_reservas_cliente` (`id_cliente`),
  KEY `ix_reservas_servicio_fecha` (`id_servicio`,`fecha`),
  KEY `ix_reservas_usuario` (`id_usuario`),
  CONSTRAINT `fk_reservas_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_reservas_servicio` FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_reservas_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ck_reservas_personas` CHECK ((`personas` between 1 and 50))
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservas`
--

LOCK TABLES `reservas` WRITE;
/*!40000 ALTER TABLE `reservas` DISABLE KEYS */;
INSERT INTO `reservas` VALUES (1,3,1,1,'2026-11-05',2,'Confirmada',180000,360000,'2026-11-17 16:42:35'),(2,2,2,2,'2026-11-07',3,'Pendiente',65000,195000,'2026-11-17 16:42:35'),(3,1,3,1,'2026-11-09',4,'Confirmada',120000,480000,'2026-11-17 16:42:35'),(4,5,4,2,'2026-11-12',2,'Pendiente',55000,110000,'2026-11-17 16:42:35'),(5,6,1,1,'2026-11-30',5,'Confirmada',180000,900000,'2026-11-17 20:08:57'),(6,6,1,1,'2026-11-30',5,'Confirmada',180000,900000,'2026-11-17 20:09:09'),(7,6,1,1,'2026-11-30',5,'Confirmada',180000,900000,'2026-11-17 20:09:10'),(8,6,1,1,'2026-11-30',5,'Confirmada',180000,900000,'2026-11-17 20:09:10'),(9,6,1,1,'2026-11-30',1,'Confirmada',180000,180000,'2026-11-17 20:11:50'),(10,6,1,1,'2026-11-30',1,'Confirmada',180000,180000,'2026-11-17 20:11:57'),(11,10,1,1,'2026-11-30',5,'Confirmada',180000,900000,'2026-11-17 20:24:08');
/*!40000 ALTER TABLE `reservas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_roles_nombre_rol` (`nombre_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Administrador'),(2,'Trabajador autorizado');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicios`
--

DROP TABLE IF EXISTS `servicios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicios` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo` enum('Tour','Excursión','Transporte','Otro') COLLATE utf8mb4_unicode_ci NOT NULL,
  `precio` int unsigned NOT NULL,
  `estado` enum('Activo','Inactivo') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_servicios_nombre` (`nombre`),
  CONSTRAINT `ck_servicios_precio` CHECK ((`precio` between 1000 and 5000000))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicios`
--

LOCK TABLES `servicios` WRITE;
/*!40000 ALTER TABLE `servicios` DISABLE KEYS */;
INSERT INTO `servicios` VALUES (1,'Tour Islas del Rosario','Pasadía full day en lancha rápida con almuerzo típico incluido.','Tour',180000,'Activo'),(2,'City Tour Ciudad Amurallada','Recorrido histórico guiado por el Centro Histórico y Castillo San Felipe.','Tour',65000,'Activo'),(3,'Playa Blanca (Barú)','Transporte ida y vuelta con acceso a club de playa.','Excursión',120000,'Activo'),(4,'Chiva Rumbera','Recorrido nocturno panorámico con música en vivo y paradas.','Tour',55000,'Activo'),(5,'Transporte aeropuerto - hotel','Traslado privado desde Aeropuerto Rafael Núñez hasta zona hotelera.','Transporte',45000,'Inactivo');
/*!40000 ALTER TABLE `servicios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_rol` tinyint unsigned NOT NULL,
  `estado` enum('Activo','Inactivo') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuarios_usuario` (`usuario`),
  UNIQUE KEY `uq_usuarios_correo` (`correo`),
  KEY `ix_usuarios_rol` (`id_rol`),
  CONSTRAINT `fk_usuarios_rol` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Administrador General','admin','admin@internationalgroup.co','$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',1,'Activo','2026-11-17 16:42:35'),(2,'Laura Mendoza','operador','laura@internationalgroup.co','$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',2,'Activo','2026-11-17 16:42:35'),(3,'Carlos Pérez','cperez','carlos@internationalgroup.co','$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',2,'Inactivo','2026-11-17 16:42:35'),(4,'Juan David Vega Quintero','Jvega_588','juand@gmail.com','$2b$10$J9cT8insWYeu8Qw2SESp8.OkFwYjCauxo5GC0mF2zQeo21dd4ibbe',1,'Activo','2026-11-17 20:26:44'),(5,'fabian andres carbal burgos','facabu','facabu2@123456677.com','$2b$10$TE0wlEAEOvbdshV4.EXa2u4Gw8iTNMCZCbTyyJervAK5joAnpbi3m',2,'Activo','2026-11-17 20:30:43');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-17 16:11:26
