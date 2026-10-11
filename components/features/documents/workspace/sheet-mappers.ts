import type { VariableContext } from "@/lib/documents/variables";
import type { SheetBrand, SheetSender } from "@/components/features/documents/sheets/types";

export function toSheetBrand(brand: VariableContext["brand"]): SheetBrand | null {
  if (!brand) return null;
  return {
    logoUrl: brand.logo_url,
    businessName: brand.business_name,
    primaryColor: brand.primary_color,
    email: null,
    phone: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    vatNumber: null,
  };
}

export function toSheetSender(sender: VariableContext["sender"]): SheetSender | null {
  if (!sender) return null;
  return {
    name: sender.name,
    companyName: sender.company_name,
    email: sender.email,
    addressLine1: sender.address_line1,
    addressLine2: sender.address_line2,
    city: sender.city,
    region: sender.region,
    postalCode: sender.postal_code,
    country: sender.country,
    vatNumber: sender.vat_number,
  };
}
