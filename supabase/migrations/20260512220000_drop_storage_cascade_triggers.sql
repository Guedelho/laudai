-- Reverts 20260512210000_storage_cascade_triggers.sql.
-- Supabase's storage.protect_delete() guard blocks DELETE from storage.objects
-- via SQL, so the trigger functions can't actually purge files — they just make
-- every report hard-delete fail. Storage cleanup must go through the Storage API
-- (handled at the app / admin-script layer).

drop trigger if exists trg_report_images_storage_cleanup on public.report_images;
drop trigger if exists trg_reports_pdf_storage_cleanup on public.reports;
drop function if exists public.delete_report_image_object();
drop function if exists public.delete_report_pdf_object();
