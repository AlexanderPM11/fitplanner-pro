using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FitPlanner.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRapidApiExerciseSource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExternalId",
                table: "exercises",
                type: "varchar(120)",
                maxLength: 120,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "exercises",
                type: "varchar(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "local")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000001"),
                columns: new[] { "ExternalId", "Source" },
                values: new object[] { null, "local" });

            migrationBuilder.UpdateData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000002"),
                columns: new[] { "ExternalId", "Source" },
                values: new object[] { null, "local" });

            migrationBuilder.UpdateData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000003"),
                columns: new[] { "ExternalId", "Source" },
                values: new object[] { null, "local" });

            migrationBuilder.UpdateData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000004"),
                columns: new[] { "ExternalId", "Source" },
                values: new object[] { null, "local" });

            migrationBuilder.UpdateData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000005"),
                columns: new[] { "ExternalId", "Source" },
                values: new object[] { null, "local" });

            migrationBuilder.CreateIndex(
                name: "IX_exercises_Source_ExternalId",
                table: "exercises",
                columns: new[] { "Source", "ExternalId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_exercises_Source_ExternalId",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "ExternalId",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "exercises");
        }
    }
}
