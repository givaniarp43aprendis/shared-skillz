
REVOKE SELECT ON public.services FROM anon;
GRANT SELECT (id, user_id, title, description, category, image_url, created_at) ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
