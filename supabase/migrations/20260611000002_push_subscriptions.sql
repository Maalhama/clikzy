-- ============================================================
-- Notifications push (Web Push/VAPID) : abonnements navigateur.
-- Un endpoint = un navigateur ; un utilisateur peut en avoir plusieurs.
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own push subs readable" ON push_subscriptions;
CREATE POLICY "Own push subs readable" ON push_subscriptions
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Own push subs insertable" ON push_subscriptions;
CREATE POLICY "Own push subs insertable" ON push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Own push subs deletable" ON push_subscriptions;
CREATE POLICY "Own push subs deletable" ON push_subscriptions
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));
