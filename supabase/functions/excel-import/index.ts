// @ts-nocheck
// Supabase Edge Function: excel-import
// Serverless endpoint to parse and bulk-import scholar records from Excel (.xlsx, .xls, .csv)

declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const normalizeYear = (val: any): string => {
  if (!val) return '1st Year';
  const str = String(val).trim().toUpperCase();
  if (str.startsWith('1') || str.includes('FIRST')) return '1st Year';
  if (str.startsWith('2') || str.includes('SECOND')) return '2nd Year';
  if (str.startsWith('3') || str.includes('THIRD')) return '3rd Year';
  if (str.startsWith('4') || str.includes('FOURTH')) return '4th Year';
  return '1st Year';
};

const normalizeSchool = (val: any): string => {
  if (!val) return 'Cor Jesu College';
  const str = String(val).trim().toLowerCase();
  if (str.includes('cor jesu') || str.includes('cjc')) return 'Cor Jesu College';
  if (str.includes('padada') || str.includes('sc padada')) return 'SC Padada';
  if (str.includes('polytechnic')) return 'Polytechnic';
  if (str.includes('digos') || str.includes('um digos')) return 'UM Digos';
  if (str.includes('bansalan') || str.includes('um bansalan')) return 'UM Bansalan';
  if (str.includes('serapion')) return 'Serapion';
  if (str.includes('spac')) return 'SPAC';
  if (str.includes('mary') || str.includes("st mary's")) return "ST Mary's";
  return String(val).trim();
};

const formatPhone = (val: any): string => {
  if (!val) return '';
  const clean = String(val).replace(/[^0-9]/g, '');
  if (clean.length === 10 && clean.startsWith('9')) return '0' + clean;
  if (clean.length === 11) return clean;
  return clean;
};

serve(async (req: any) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const contentType = req.headers.get("content-type") || "";
    let fileBuffer: ArrayBuffer;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof File)) {
        return new Response(JSON.stringify({ error: "No file provided in form-data" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      fileBuffer = await file.arrayBuffer();
    } else {
      fileBuffer = await req.arrayBuffer();
    }

    if (!fileBuffer || fileBuffer.byteLength === 0) {
      return new Response(JSON.stringify({ error: "Empty file payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Parse workbook
    const workbook = XLSX.read(new Uint8Array(fileBuffer), { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    if (!rawData || rawData.length < 2) {
      return new Response(JSON.stringify({ error: "Sheet contains no data rows" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const headerRow = (rawData[0] || []).map((h: any) => String(h || '').trim().toLowerCase());
    
    // Header Index Mapping with aliases
    const findIndex = (aliases: string[]) => {
      return headerRow.findIndex((h: string) => aliases.some(alias => h.includes(alias)));
    };

    const idxLast = findIndex(['last name', 'lastname', 'surname', 'apelyido']);
    const idxFirst = findIndex(['first name', 'firstname', 'given name', 'pangalan']);
    const idxMiddle = findIndex(['m.i.', 'middle', 'mi']);
    const idxSex = findIndex(['sex', 'gender']);
    const idxStreet = findIndex(['street', 'purok', 'address', 'sitio']);
    const idxBrgy = findIndex(['brgy', 'barangay']);
    const idxMun = findIndex(['mun', 'municipality', 'city', 'lungsod']);
    const idxCourse = findIndex(['course', 'degree', 'program']);
    const idxYear = findIndex(['year', 'level', 'yr']);
    const idxSchool = findIndex(['school', 'college', 'university', 'eskwelahan']);
    const idxPhone = findIndex(['cp no.', 'cp', 'contact', 'mobile', 'phone']);

    const scholarsToInsert: any[] = [];
    const errors: any[] = [];

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || !row.length) continue;

      const lastName = String(row[idxLast !== -1 ? idxLast : 1] || '').trim();
      const firstName = String(row[idxFirst !== -1 ? idxFirst : 2] || '').trim();
      const middleName = String(row[idxMiddle !== -1 ? idxMiddle : 3] || '').trim();

      if (!lastName && !firstName) continue;

      const sex = String(row[idxSex !== -1 ? idxSex : 4] || 'Female').trim();
      const purok = String(row[idxStreet !== -1 ? idxStreet : 5] || '').trim();
      const barangay = String(row[idxBrgy !== -1 ? idxBrgy : 6] || '').trim();
      const municipality = String(row[idxMun !== -1 ? idxMun : 7] || '').trim();
      const course = String(row[idxCourse !== -1 ? idxCourse : 8] || 'Not specified').trim();
      const yearLevel = normalizeYear(row[idxYear !== -1 ? idxYear : 9]);
      const school = normalizeSchool(row[idxSchool !== -1 ? idxSchool : 10]);
      const phone = formatPhone(row[idxPhone !== -1 ? idxPhone : 15]);

      // Safe clean email generation
      const cleanFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanLast = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = `${cleanFirst}.${cleanLast}.${i}@cjc.scholarhub.local`;

      scholarsToInsert.push({
        name: `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.replace(/\s+/g, ' ').trim(),
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        email,
        sex: sex.startsWith('M') ? 'Male' : 'Female',
        purok,
        barangay,
        municipality,
        course,
        year_level: yearLevel,
        school,
        phone,
        scholar_type: 'Old scholar',
        role: 'user',
        requirements_status: 'Complete',
        scholar_status: 'Active',
        added_by_admin: true
      });
    }

    if (!scholarsToInsert.length) {
      return new Response(JSON.stringify({ error: "No valid student rows could be parsed from the file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Upsert into Supabase database if configured
    if (supabaseUrl && supabaseServiceKey) {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(scholarsToInsert, { onConflict: 'email' })
        .select();

      if (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          parsedCount: scholarsToInsert.length
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      count: scholarsToInsert.length,
      sample: scholarsToInsert.slice(0, 5),
      scholars: scholarsToInsert
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Failed to process Excel file" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
