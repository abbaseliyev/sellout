import { useQuery } from "@tanstack/react-query";
import {
  fetchFormats,
  fetchSegments,
  fetchSkuNames,
} from "../products.js";

export function useSkuNames() {
  return useQuery({
    queryKey: ["products", "sku-names"],
    queryFn: fetchSkuNames,
  });
}

export function useFormats() {
  return useQuery({
    queryKey: ["products", "formats"],
    queryFn: fetchFormats,
  });
}

export function useSegments() {
  return useQuery({
    queryKey: ["products", "segments"],
    queryFn: fetchSegments,
  });
}
