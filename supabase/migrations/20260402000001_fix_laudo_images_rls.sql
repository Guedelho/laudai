-- Drop the existing catch-all policy
drop policy if exists "Users can manage their own laudo images" on laudo_images;

-- SELECT: user_id match is sufficient
create policy "Users can read their own laudo images"
  on laudo_images for select
  using (auth.uid() = user_id);

-- DELETE: user_id match is sufficient
create policy "Users can delete their own laudo images"
  on laudo_images for delete
  using (auth.uid() = user_id);

-- INSERT: also verify the parent laudo belongs to the same user
create policy "Users can insert laudo images for their own laudos"
  on laudo_images for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from laudos
      where laudos.id = laudo_id
        and laudos.user_id = auth.uid()
    )
  );

-- UPDATE: same as insert
create policy "Users can update their own laudo images"
  on laudo_images for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from laudos
      where laudos.id = laudo_id
        and laudos.user_id = auth.uid()
    )
  );
