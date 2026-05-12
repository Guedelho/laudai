-- Storage cleanup triggers: when report rows / report_images rows are hard-deleted,
-- delete the matching objects from the storage buckets. Supabase Storage has no native
-- FK to public tables, so we wire it manually here. Without these, orphans accumulate
-- in `report-images` and `report-pdfs` whenever a report is purged.
--
-- Note: soft-deletes (`update set deleted_at = …`) are intentionally NOT cleaned —
-- the row is still recoverable. Cleanup happens on the eventual hard delete.

create or replace function delete_report_image_object()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from storage.objects
   where bucket_id = 'report-images'
     and name = old.storage_path;
  return old;
end;
$$;

drop trigger if exists trg_report_images_storage_cleanup on public.report_images;
create trigger trg_report_images_storage_cleanup
  after delete on public.report_images
  for each row execute function delete_report_image_object();

create or replace function delete_report_pdf_object()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.pdf_storage_path is not null then
    delete from storage.objects
     where bucket_id = 'report-pdfs'
       and name = old.pdf_storage_path;
  end if;
  return old;
end;
$$;

drop trigger if exists trg_reports_pdf_storage_cleanup on public.reports;
create trigger trg_reports_pdf_storage_cleanup
  after delete on public.reports
  for each row execute function delete_report_pdf_object();
