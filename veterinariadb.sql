USE [master]
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'veterinariadb')
BEGIN
    CREATE DATABASE [veterinariadb]
END
GO

USE [veterinariadb]
GO

IF OBJECT_ID('dbo.Tratamientos', 'U') IS NOT NULL DROP TABLE dbo.Tratamientos;
IF OBJECT_ID('dbo.Citas', 'U') IS NOT NULL DROP TABLE dbo.Citas;
IF OBJECT_ID('dbo.Mascotas', 'U') IS NOT NULL DROP TABLE dbo.Mascotas;
IF OBJECT_ID('dbo.Usuarios', 'U') IS NOT NULL DROP TABLE dbo.Usuarios;
IF OBJECT_ID('dbo.Roles', 'U') IS NOT NULL DROP TABLE dbo.Roles;
GO

-- Tabla Roles (id, nombre)
CREATE TABLE [dbo].[Roles](
    [id] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [nombre] [varchar](50) NOT NULL
);
GO

-- Tabla Usuarios (id, nombre, email, rol)
CREATE TABLE [dbo].[Usuarios](
    [id] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [nombre] [varchar](100) NOT NULL,
    [email] [varchar](150) NOT NULL UNIQUE,
    [rol] [varchar](50) NOT NULL DEFAULT 'Cliente',
    [password_hash] [varchar](255) NULL
);
GO

-- Tabla Mascotas (id, nombre, especie, dueño_id)
CREATE TABLE [dbo].[Mascotas](
    [id] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [nombre] [varchar](100) NOT NULL,
    [especie] [varchar](50) NOT NULL,
    [dueño_id] [int] NOT NULL,
    CONSTRAINT [FK_Mascotas_Usuarios] FOREIGN KEY([dueño_id]) REFERENCES [dbo].[Usuarios] ([id])
);
GO

-- Tabla Citas (id, mascota_id, fecha, motivo)
CREATE TABLE [dbo].[Citas](
    [id] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [mascota_id] [int] NOT NULL,
    [fecha] [datetime] NOT NULL,
    [motivo] [varchar](255) NOT NULL,
    CONSTRAINT [FK_Citas_Mascotas] FOREIGN KEY([mascota_id]) REFERENCES [dbo].[Mascotas] ([id])
);
GO

-- Tabla Tratamientos (id, cita_id, descripción, costo)
CREATE TABLE [dbo].[Tratamientos](
    [id] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [cita_id] [int] NOT NULL,
    [descripción] [varchar](255) NOT NULL,
    [costo] [decimal](18, 2) NOT NULL,
    CONSTRAINT [FK_Tratamientos_Citas] FOREIGN KEY([cita_id]) REFERENCES [dbo].[Citas] ([id])
);
GO

-- Inserción de datos de ejemplo
INSERT INTO [dbo].[Roles] ([nombre]) VALUES ('Admin'), ('Veterinario'), ('Recepcionista'), ('Cliente');

INSERT INTO [dbo].[Usuarios] ([nombre], [email], [rol], [password_hash]) VALUES 
('Dr. Juan Perez', 'juan.perez@veterinaria.com', 'Veterinario', NULL),
('Maria Gonzalez', 'maria.gonzalez@gmail.com', 'Cliente', NULL),
('Carlos Tapia', 'carlos.tapia@gmail.com', 'Cliente', NULL);

INSERT INTO [dbo].[Mascotas] ([nombre], [especie], [dueño_id]) VALUES 
('Firulais', 'Perro', 2),
('Michi', 'Gato', 2),
('Rocky', 'Perro', 3);

INSERT INTO [dbo].[Citas] ([mascota_id], [fecha], [motivo]) VALUES 
(1, '2026-09-10 10:00:00', 'Vacunacion anual y revision general'),
(2, '2026-09-11 11:30:00', 'Control de peso y desparasitacion'),
(3, '2026-09-12 15:00:00', 'Revision por cojera en pata trasera');

INSERT INTO [dbo].[Tratamientos] ([cita_id], [descripción], [costo]) VALUES 
(1, 'Vacuna antirrabica y polivalente', 25000.00),
(2, 'Antiparasitario en pipeta', 12000.00),
(3, 'Radiografia y antiinflamatorio', 45000.00);
GO
