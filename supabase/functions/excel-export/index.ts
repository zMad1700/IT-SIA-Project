// @ts-nocheck
// Supabase Edge Function: excel-export
// Serverless endpoint to query scholars and stream a formatted Excel (.xlsx) masterlist

declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};

serve(async (req: any) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const school = url.searchParams.get("school");
    const scholarType = url.searchParams.get("scholar_type");
    const status = url.searchParams.get("status");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('profiles')
      .select('id, name, first_name, middle_name, last_name, school, course, year_level, scholar_type, requirements_status, scholar_status, email, phone, municipality, barangay, registered_at')
      .eq('role', 'user');

    if (school && school !== 'all') query = query.eq('school', school);
    if (scholarType && scholarType !== 'all') query = query.eq('scholar_type', scholarType);
    if (status && status !== 'all') query = query.eq('scholar_status', status);

    const { data: scholars, error } = await query.order('last_name', { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Build worksheet data rows
    const exportRows = (scholars || []).map((s, idx) => ({
      "No.": idx + 1,
      "Last Name": s.last_name || '',
      "First Name": s.first_name || '',
      "M.I.": s.middle_name ? s.middle_name[0] + '.' : '',
      "School": s.school || '',
      "Course": s.course || '',
      "Year Level": s.year_level || '',
      "Scholar Type": s.scholar_type || 'Old scholar',
      "Requirements": s.requirements_status || 'Complete',
      "Grant Status": s.scholar_status || 'Active',
      "Email Address": s.email || '',
      "Contact Number": s.phone || '',
      "Barangay": s.barangay || '',
      "Municipality": s.municipality || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 6 },  // No.
      { wch: 18 }, // Last Name
      { wch: 20 }, // First Name
      { wch: 8 },  // M.I.
      { wch: 26 }, // School
      { wch: 28 }, // Course
      { wch: 14 }, // Year
      { wch: 15 }, // Scholar Type
      { wch: 14 }, // Requirements
      { wch: 14 }, // Grant Status
      { wch: 30 }, // Email
      { wch: 16 }, // Contact
      { wch: 20 }, // Barangay
      { wch: 18 }  // Municipality
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Scholars Masterlist");

    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const nowStr = new Date().toISOString().slice(0, 10);
    const filename = `scholarhub_masterlist_${nowStr}.xlsx`;

    return new Response(excelBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Failed to generate Excel export" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
