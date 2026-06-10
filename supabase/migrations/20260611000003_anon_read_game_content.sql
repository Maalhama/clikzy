-- ============================================================
-- FIX rétention : le lobby/landing des VISITEURS était vide.
-- Les policies SELECT d'origine ciblaient `authenticated` uniquement ;
-- le flux anon (lobby ouvert, parties spectables) lisait donc 0 ligne.
-- Lecture seule du contenu de jeu non sensible pour anon.
-- ============================================================
DROP POLICY IF EXISTS "Games viewable by anon" ON games;
CREATE POLICY "Games viewable by anon" ON games FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Items viewable by anon" ON items;
CREATE POLICY "Items viewable by anon" ON items FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Winners viewable by anon" ON winners;
CREATE POLICY "Winners viewable by anon" ON winners FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Clicks viewable by anon" ON clicks;
CREATE POLICY "Clicks viewable by anon" ON clicks FOR SELECT TO anon USING (true);
