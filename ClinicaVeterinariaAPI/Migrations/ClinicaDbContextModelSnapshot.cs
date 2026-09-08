
using System;
using ClinicaVeterinariaAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

#nullable disable

namespace ClinicaVeterinariaAPI.Migrations
{
    [DbContext(typeof(ClinicaDbContext))]
    partial class ClinicaDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "9.0.19")
                .HasAnnotation("Relational:MaxIdentifierLength", 128);

            SqlServerModelBuilderExtensions.UseIdentityColumns(modelBuilder);

            modelBuilder.Entity("ClinicaVeterinariaAPI.Models.Cita", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int")
                        .HasColumnName("id");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("Id"));

                    b.Property<DateTime>("Fecha")
                        .HasColumnType("datetime2")
                        .HasColumnName("fecha");

                    b.Property<int>("MascotaId")
                        .HasColumnType("int")
                        .HasColumnName("mascota_id");

                    b.Property<string>("Motivo")
                        .IsRequired()
                        .HasMaxLength(255)
                        .IsUnicode(false)
                        .HasColumnType("varchar(255)")
                        .HasColumnName("motivo");

                    b.HasKey("Id");

                    b.HasIndex("MascotaId");

                    b.ToTable("Citas", (string)null);
                });

            modelBuilder.Entity("ClinicaVeterinariaAPI.Models.Mascota", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int")
                        .HasColumnName("id");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("Id"));

                    b.Property<int>("DueñoId")
                        .HasColumnType("int")
                        .HasColumnName("dueño_id");

                    b.Property<string>("Especie")
                        .IsRequired()
                        .HasMaxLength(50)
                        .IsUnicode(false)
                        .HasColumnType("varchar(50)")
                        .HasColumnName("especie");

                    b.Property<string>("Nombre")
                        .IsRequired()
                        .HasMaxLength(100)
                        .IsUnicode(false)
                        .HasColumnType("varchar(100)")
                        .HasColumnName("nombre");

                    b.HasKey("Id");

                    b.HasIndex("DueñoId");

                    b.ToTable("Mascotas", (string)null);
                });

            modelBuilder.Entity("ClinicaVeterinariaAPI.Models.Rol", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int")
                        .HasColumnName("id");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("Id"));

                    b.Property<string>("Nombre")
                        .IsRequired()
                        .HasMaxLength(50)
                        .IsUnicode(false)
                        .HasColumnType("varchar(50)")
                        .HasColumnName("nombre");

                    b.HasKey("Id");

                    b.ToTable("Roles", (string)null);
                });

            modelBuilder.Entity("ClinicaVeterinariaAPI.Models.Tratamiento", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int")
                        .HasColumnName("id");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("Id"));

                    b.Property<int>("CitaId")
                        .HasColumnType("int")
                        .HasColumnName("cita_id");

                    b.Property<decimal>("Costo")
                        .HasColumnType("decimal(18, 2)")
                        .HasColumnName("costo");

                    b.Property<string>("Descripcion")
                        .IsRequired()
                        .HasMaxLength(255)
                        .IsUnicode(false)
                        .HasColumnType("varchar(255)")
                        .HasColumnName("descripción");

                    b.HasKey("Id");

                    b.HasIndex("CitaId");

                    b.ToTable("Tratamientos", (string)null);
                });

            modelBuilder.Entity("ClinicaVeterinariaAPI.Models.Usuario", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int")
                        .HasColumnName("id");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("Id"));

                    b.Property<string>("Email")
                        .IsRequired()
                        .HasMaxLength(150)
                        .IsUnicode(false)
                        .HasColumnType("varchar(150)")
                        .HasColumnName("email");

                    b.Property<string>("Nombre")
                        .IsRequired()
                        .HasMaxLength(100)
                        .IsUnicode(false)
                        .HasColumnType("varchar(100)")
                        .HasColumnName("nombre");

                    b.Property<string>("PasswordHash")
                        .HasMaxLength(255)
                        .IsUnicode(false)
                        .HasColumnType("varchar(255)")
                        .HasColumnName("password_hash");

                    b.Property<string>("Rol")
                        .IsRequired()
                        .ValueGeneratedOnAdd()
                        .HasMaxLength(50)
                        .IsUnicode(false)
                        .HasColumnType("varchar(50)")
                        .HasDefaultValue("Cliente")
                        .HasColumnName("rol");

                    b.HasKey("Id");

                    b.HasIndex(new[] { "Email" }, "UQ_Usuario_Email")
                        .IsUnique();

                    b.ToTable("Usuarios", (string)null);
                });

            modelBuilder.Entity("ClinicaVeterinariaAPI.Models.Cita", b =>
                {
                    b.HasOne("ClinicaVeterinariaAPI.Models.Mascota", "MascotaNavigation")
                        .WithMany("Citas")
                        .HasForeignKey("MascotaId")
                        .IsRequired()
                        .HasConstraintName("FK_Citas_Mascotas");

                    b.Navigation("MascotaNavigation");
                });

            modelBuilder.Entity("ClinicaVeterinariaAPI.Models.Mascota", b =>
                {
                    b.HasOne("ClinicaVeterinariaAPI.Models.Usuario", "DueñoNavigation")
                        .WithMany("Mascotas")
                        .HasForeignKey("DueñoId")
                        .IsRequired()
                        .HasConstraintName("FK_Mascotas_Usuarios");

                    b.Navigation("DueñoNavigation");
                });

            modelBuilder.Entity("ClinicaVeterinariaAPI.Models.Tratamiento", b =>
                {
                    b.HasOne("ClinicaVeterinariaAPI.Models.Cita", "CitaNavigation")
                        .WithMany("Tratamientos")
                        .HasForeignKey("CitaId")
                        .IsRequired()
                        .HasConstraintName("FK_Tratamientos_Citas");

                    b.Navigation("CitaNavigation");
                });

            modelBuilder.Entity("ClinicaVeterinariaAPI.Models.Cita", b =>
                {
                    b.Navigation("Tratamientos");
                });

            modelBuilder.Entity("ClinicaVeterinariaAPI.Models.Mascota", b =>
                {
                    b.Navigation("Citas");
                });

            modelBuilder.Entity("ClinicaVeterinariaAPI.Models.Usuario", b =>
                {
                    b.Navigation("Mascotas");
                });
#pragma warning restore 612, 618
        }
    }
}
