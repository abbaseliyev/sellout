import { useQuery } from "@tanstack/react-query";
import { fetchBrandFamilies } from "../products.js";

export const brandFamiliesQueryKey = ["products", "brand-families"];

export function useBrandFamilies() {
  return useQuery({
    queryKey: brandFamiliesQueryKey,
    queryFn: fetchBrandFamilies,
  });
}
