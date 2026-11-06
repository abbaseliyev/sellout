import apiClient from "./client.js";

async function fetchStringList(path) {
  const { data } = await apiClient.get(path, {
    headers: { accept: "text/plain" },
    responseType: "text",
  });

  const barcodes = typeof data === "string" ? JSON.parse(data) : data;

  if (!Array.isArray(barcodes)) {
    throw new Error("Barcode API cavabı siyahı formatında deyil.");
  }

  return barcodes.map(String);
}

export function fetchBarcodes() {
  return fetchStringList("/api/products/barcodes");
}

export function fetchBrandFamilies() {
  return fetchStringList("/api/products/brand-families");
}

export function fetchSkuNames() {
  return fetchStringList("/api/products/sku-names");
}

export function fetchFormats() {
  return fetchStringList("/api/products/formats");
}

export function fetchSegments() {
  return fetchStringList("/api/products/segments");
}
