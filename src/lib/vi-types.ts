// Tipos do domínio do Vizinho Indica (schema: profiles, services, reviews).

export interface Profile {
  id: string;
  name: string | null;
  neighborhood: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  phone: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  service_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface ReviewWithAuthor extends Review {
  profiles: Pick<Profile, "name" | "avatar_url"> | null;
}

export interface ServiceWithStats extends Service {
  provider_name: string | null;
  provider_avatar: string | null;
  provider_neighborhood: string | null;
  rating_avg: number;
  rating_count: number;
}

export type ServiceRow = Service & {
  profiles: Pick<Profile, "name" | "avatar_url" | "neighborhood"> | null;
  reviews: { rating: number }[] | null;
};

export function toServiceWithStats(row: ServiceRow): ServiceWithStats {
  const ratings = (row.reviews ?? []).map((r) => r.rating);
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  return {
    ...row,
    provider_name: row.profiles?.name ?? null,
    provider_avatar: row.profiles?.avatar_url ?? null,
    provider_neighborhood: row.profiles?.neighborhood ?? null,
    rating_avg: avg,
    rating_count: ratings.length,
  };
}
