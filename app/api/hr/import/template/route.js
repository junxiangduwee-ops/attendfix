export async function GET() {
  const csv = 'staff_id,date,clock_in,clock_out\nE-04291,2026-10-13,09:00,18:00\nE-04287,2026-10-13,08:55,17:45\n'
  return new Response(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="attendance_template.csv"' } })
}
