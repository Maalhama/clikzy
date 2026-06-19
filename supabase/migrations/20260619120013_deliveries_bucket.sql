-- ============================================================================
-- Fix revue 2026-06-19 : les photos de livraison NON approuvées étaient accessibles
-- via URL publique devinable (bucket 'profiles' public + winners.delivery_photo_url
-- lisible anon). On bascule sur un bucket PRIVÉ 'deliveries' : on stocke le CHEMIN
-- (pas une URL publique) et l'affichage public passe par une URL SIGNÉE générée
-- côté serveur, uniquement pour les photos approuvées. Idempotent.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('deliveries', 'deliveries', false)
ON CONFLICT (id) DO NOTHING;

-- Upload réservé aux utilisateurs authentifiés (la lecture publique = URL signée service_role).
DROP POLICY IF EXISTS "deliveries_auth_insert" ON storage.objects;
CREATE POLICY "deliveries_auth_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'deliveries');

DROP POLICY IF EXISTS "deliveries_auth_update" ON storage.objects;
CREATE POLICY "deliveries_auth_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'deliveries') WITH CHECK (bucket_id = 'deliveries');
