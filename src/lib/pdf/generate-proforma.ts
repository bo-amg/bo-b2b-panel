import { renderToBuffer } from "@react-pdf/renderer";
import { ProformaDocument } from "./proforma-template";
import React from "react";

export async function generateProformaPDF(
  order: any,
  dealer: any,
  settings: any,
  items: any[]
): Promise<Buffer> {
  const element = React.createElement(ProformaDocument, {
    order,
    dealer,
    settings,
    items,
  });
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}
