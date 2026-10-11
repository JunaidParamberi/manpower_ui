import JSZip from "jszip";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";

import { AccountExportPdf } from "@/lib/account/export-pdf";
import { bundleToCsvFiles, gatherUserData } from "@/lib/account/export-data";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { isExportFormat } from "@/lib/validations/account";

export const runtime = "nodejs";

function jsonResponse(body: unknown, filename: string): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const formatParam = searchParams.get("format") ?? "json";

  if (!isExportFormat(formatParam)) {
    return new Response("Invalid format. Use json, csv, or pdf.", {
      status: 400,
    });
  }

  const { supabase, user } = await getServerContext();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const bundle = await gatherUserData(supabase, user.id);
    const stamp = new Date().toISOString().slice(0, 10);

    if (formatParam === "json") {
      return jsonResponse(bundle, `manpower-export-${stamp}.json`);
    }

    if (formatParam === "csv") {
      const zip = new JSZip();
      const files = bundleToCsvFiles(bundle);
      for (const [name, content] of Object.entries(files)) {
        zip.file(name, content);
      }
      const zipBuffer = await zip.generateAsync({ type: "uint8array" });
      return new Response(new Uint8Array(zipBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="manpower-export-${stamp}.zip"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const pdfBuffer = await renderToBuffer(
      <AccountExportPdf bundle={bundle} email={user.email} />,
    );

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="manpower-export-${stamp}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Export failed.";
    return new Response(message, { status: 500 });
  }
}
