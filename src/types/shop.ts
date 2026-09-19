export type ProductStatus = "active" | "sold_out" | "archived";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url: string;
  cta_label: string;
  cta_url: string | null;
  status: ProductStatus;
  created_at: string;
}

export type AdPlacement = "home" | "chat" | "profile";
export type AdCtaType = "internal" | "external";
export type AdStatus = "draft" | "active" | "paused";

export interface Ad {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_label: string;
  cta_type: AdCtaType;
  cta_url: string;
  placements: AdPlacement[];
  status: AdStatus;
  starts_at: string;
  expires_at: string | null;
  impressions: number;
  clicks: number;
  sort_order: number;
  created_at: string;
}