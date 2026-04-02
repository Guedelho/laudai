create table laudo_images (
  id uuid default gen_random_uuid() primary key,
  laudo_id uuid references laudos(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  storage_path text not null,
  file_name text not null,
  created_at timestamptz default now() not null
);

alter table laudo_images enable row level security;
create policy "Users can manage their own laudo images"
  on laudo_images for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
