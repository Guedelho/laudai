-- Pin search_path on SECURITY DEFINER function
create or replace function public.create_solo_org(p_user_id uuid, p_name text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_org_id uuid;
begin
  insert into organizations (name, slug, plan, owner_user_id)
  values (p_name, p_slug, 'individual', p_user_id)
  returning id into v_org_id;

  insert into organization_members (org_id, user_id, role)
  values (v_org_id, p_user_id, 'owner');

  insert into organization_report_types (org_id, report_type_id, expires_at)
  values (v_org_id, 'ultrasound_abdominal', now() + interval '7 days');

  return v_org_id;
end;
$function$;

-- Revoke anon access; realtime authz only needs authenticated
revoke execute on function public.is_org_member(uuid, uuid) from anon;

-- Cover the two missing FKs flagged by the performance advisor
create index if not exists member_specialties_report_type_id_idx
  on public.member_specialties (report_type_id);

create index if not exists organization_report_types_report_type_id_idx
  on public.organization_report_types (report_type_id);
