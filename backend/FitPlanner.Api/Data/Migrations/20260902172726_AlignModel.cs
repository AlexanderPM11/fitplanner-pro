using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FitPlanner.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AlignModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000001"),
                column: "CreatedAtUtc",
                value: new DateTime(2026, 9, 2, 17, 27, 25, 556, DateTimeKind.Utc).AddTicks(5379));

            migrationBuilder.UpdateData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000002"),
                column: "CreatedAtUtc",
                value: new DateTime(2026, 9, 2, 17, 27, 25, 556, DateTimeKind.Utc).AddTicks(6257));

            migrationBuilder.UpdateData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000003"),
                column: "CreatedAtUtc",
                value: new DateTime(2026, 9, 2, 17, 27, 25, 556, DateTimeKind.Utc).AddTicks(6263));

            migrationBuilder.UpdateData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000004"),
                column: "CreatedAtUtc",
                value: new DateTime(2026, 9, 2, 17, 27, 25, 556, DateTimeKind.Utc).AddTicks(6266));

            migrationBuilder.UpdateData(
                table: "exercises",
                keyColumn: "Id",
                keyValue: new Guid("2f3c6b1a-7f3e-4e9f-9b24-000000000005"),
                column: "CreatedAtUtc",
                value: new DateTime(2026, 9, 2, 17, 27, 25, 556, DateTimeKind.Utc).AddTicks(6268));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
    }
}
