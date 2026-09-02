using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FitPlanner.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class SeedCoreExercises : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "exercises",
                columns: new[] { "Id", "Category", "CreatedAtUtc", "Description", "Equipment", "ImageUrl", "MovementType", "Name", "UserId", "VideoUrl" },
                values: new object[,]
                {
                    { new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000001"), "Pecho", new DateTime(2026, 9, 2, 16, 26, 2, 307, DateTimeKind.Utc).AddTicks(3775), "Empuje horizontal para desarrollar el pectoral.", null, null, null, "Press de banca", null, null },
                    { new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000002"), "Piernas", new DateTime(2026, 9, 2, 16, 26, 2, 307, DateTimeKind.Utc).AddTicks(4611), "Movimiento base para fuerza de piernas.", null, null, null, "Sentadilla", null, null },
                    { new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000003"), "Espalda", new DateTime(2026, 9, 2, 16, 26, 2, 307, DateTimeKind.Utc).AddTicks(4616), "Patrón de bisagra para fuerza posterior.", null, null, null, "Peso muerto", null, null },
                    { new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000004"), "Espalda", new DateTime(2026, 9, 2, 16, 26, 2, 307, DateTimeKind.Utc).AddTicks(4618), "Tracción vertical para espalda y brazos.", null, null, null, "Dominadas", null, null },
                    { new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000005"), "Hombros", new DateTime(2026, 9, 2, 16, 26, 2, 307, DateTimeKind.Utc).AddTicks(4620), "Empuje vertical controlado.", null, null, null, "Press militar", null, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000001"));

            migrationBuilder.DeleteData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000002"));

            migrationBuilder.DeleteData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000003"));

            migrationBuilder.DeleteData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000004"));

            migrationBuilder.DeleteData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000005"));
        }
    }
}
