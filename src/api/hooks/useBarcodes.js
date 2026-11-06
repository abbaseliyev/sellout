import { useQuery } from "@tanstack/react-query";
import { fetchBarcodes } from "../products.js";

export const barcodesQueryKey = ["products", "barcodes"];

export function useBarcodes() {
  return useQuery({
    queryKey: barcodesQueryKey,
    queryFn: fetchBarcodes,
  });
}
