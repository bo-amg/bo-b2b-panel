import { renderToBuffer } from "@react-pdf/renderer";
import { ProformaDocument } from "./proforma-template";
import React from "react";

export async function generateProformaPDF(
  order: any,
  dealer: any,
  settings: any,
  items: any[],
  currency?: string,
  language?: string
): Promise<Buffer> {
  const element = React.createElement(ProformaDocument, {
    order,
    dealer,
    settings,
    items,
    currency,
    language,
  });
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}
