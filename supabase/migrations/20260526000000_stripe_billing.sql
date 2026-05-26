-- ═══════════════════════════════════════════════════════════════════════════
-- Stripe billing
-- ═══════════════════════════════════════════════════════════════════════════
-- Subscription lifecycle is owned by Stripe. The webhook handler at
-- /api/webhooks/stripe upserts organization_report_types(expires_at) from
-- subscription.current_period_end on every state change, so the existing
-- hasReportTypeAccess() gate keeps working unchanged.
--
-- stripe_subscription_status mirrors Stripe verbatim: trialing, active,
-- past_due, canceled, unpaid, incomplete, incomplete_expired, paused.

alter table organizations
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text unique,
  add column if not exists stripe_subscription_status text;

create index if not exists organizations_stripe_customer_idx
  on organizations(stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists organizations_stripe_subscription_idx
  on organizations(stripe_subscription_id)
  where stripe_subscription_id is not null;

-- Drop the 7-day DB trial. The new create_solo_org leaves the org with
-- zero entitlements until the webhook writes one in response to Stripe.
create or replace function create_solo_org(p_user_id uuid, p_name text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org_id uuid;
begin
  insert into organizations (name, slug, plan, owner_user_id)
  values (p_name, p_slug, 'individual', p_user_id)
  returning id into v_org_id;

  insert into organization_members (org_id, user_id, role)
  values (v_org_id, p_user_id, 'owner');

  return v_org_id;
end;
$$;

revoke all on function create_solo_org(uuid, text, text) from anon, authenticated;
