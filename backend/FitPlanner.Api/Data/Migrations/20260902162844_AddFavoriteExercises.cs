using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FitPlanner.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddFavoriteExercises : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "favorite_exercises",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ExerciseId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_favorite_exercises", x => new { x.UserId, x.ExerciseId });
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000001"),
                column: "CreatedAtUtc",
                value: new DateTime(2026, 9, 2, 16, 28, 44, 87, DateTimeKind.Utc).AddTicks(803));

            migrationBuilder.UpdateData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000002"),
                column: "CreatedAtUtc",
                value: new DateTime(2026, 9, 2, 16, 28, 44, 87, DateTimeKind.Utc).AddTicks(1704));

            migrationBuilder.UpdateData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000003"),
                column: "CreatedAtUtc",
                value: new DateTime(2026, 9, 2, 16, 28, 44, 87, DateTimeKind.Utc).AddTicks(1711));

            migrationBuilder.UpdateData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000004"),
                column: "CreatedAtUtc",
                value: new DateTime(2026, 9, 2, 16, 28, 44, 87, DateTimeKind.Utc).AddTicks(1713));

            migrationBuilder.UpdateData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000005"),
                column: "CreatedAtUtc",
                value: new DateTime(2026, 9, 2, 16, 28, 44, 87, DateTimeKind.Utc).AddTicks(1716));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "favorite_exercises");

            migrationBuilder.UpdateData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000001"),
                column: "CreatedAtUtc",
                value: new DateTime(2026, 9, 2, 16, 26, 2, 307, DateTimeKind.Utc).AddTicks(3775));

            migrationBuilder.UpdateData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000002"),
                column: "CreatedAtUtc",
                value: new DateTime(2026, 9, 2, 16, 26, 2, 307, DateTimeKind.Utc).AddTicks(4611));

            migrationBuilder.UpdateData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000003"),
                column: "CreatedAtUtc",
                value: new DateTime(2026, 9, 2, 16, 26, 2, 307, DateTimeKind.Utc).AddTicks(4616));

            migrationBuilder.UpdateData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000004"),
                column: "CreatedAtUtc",
                value: new DateTime(2026, 9, 2, 16, 26, 2, 307, DateTimeKind.Utc).AddTicks(4618));

            migrationBuilder.UpdateData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000005"),
                column: "CreatedAtUtc",
                value: new DateTime(2026, 9, 2, 16, 26, 2, 307, DateTimeKind.Utc).AddTicks(4620));
        }
    }
}
