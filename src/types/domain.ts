export type UserRole = "admin" | "coach" | "client";

export type SessionMode = "online" | "presencial";

export type CoachCertificationStatus = "none" | "pending" | "approved" | "rejected";

export type CoachProfileStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "paused"
  | "archived";

export type ReviewCoachDecision =
  | "pending_coach_review"
  | "approved"
  | "rejected"
  | "flagged";

export interface CoachCategory {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  icon: string;
}

export interface City {
  id: string;
  slug: string;
  name: string;
  province?: string;
  country: string;
}

export interface CoachReview {
  id: string;
  authorName: string;
  authorRole?: string;
  rating: number;
  title?: string;
  body: string;
  createdAt: string;
  coachDecision: ReviewCoachDecision;
}

export interface CoachProfile {
  id: string;
  slug: string;
  name: string;
  headline: string;
  bio: string;
  aboutHtml?: string;
  categories: string[];
  citySlug: string;
  cityLabel: string;
  country: string;
  sessionModes: SessionMode[];
  languages: string[];
  basePriceEur: number;
  pricingDetails: string[];
  certifiedStatus: CoachCertificationStatus;
  profileStatus: CoachProfileStatus;
  visibilityActive: boolean;
  featured: boolean;
  heroImageUrl: string;
  galleryImageUrls: string[];
  videoPresentationUrl?: string;
  specialties: string[];
  links: {
    whatsapp?: string;
    phone?: string;
    email?: string;
    web?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
  };
  reviews: CoachReview[];
  metrics: {
    totalViews: number;
    avgViewSeconds: number;
    clicks: Record<string, number>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  coverImageUrl: string;
  publishedAt: string;
  readingMinutes: number;
  contentHtml: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answerHtml: string;
}

export interface DirectoryFilters {
  q?: string;
  cat?: string;
  location?: string;
  session?: SessionMode[];
  certified?: boolean;
  idioma?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: "recent" | "price_asc" | "price_desc" | "rating_desc";
  page?: number;
}
