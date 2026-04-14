-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create exercises master table
create table public.exercises (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text not null, -- chest, back, legs, etc.
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create workouts table
create table public.workouts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create workout_exercises table (linking table)
create table public.workout_exercises (
  id uuid default uuid_generate_v4() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  order_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create sets table
create table public.sets (
  id uuid default uuid_generate_v4() primary key,
  workout_exercise_id uuid references public.workout_exercises(id) on delete cascade not null,
  weight float,
  reps integer,
  completed boolean default false not null,
  order_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.sets enable row level security;
alter table public.exercises enable row level security;

-- Profiles: Users can only see and update their own profile
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);
create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Workouts: Users can only see and manage their own workouts
create policy "Users can manage their own workouts." on public.workouts
  for all using (auth.uid() = user_id);

-- Workout Exercises: Users can manage exercises in their own workouts
create policy "Users can manage exercises in their own workouts." on public.workout_exercises
  for all using (
    exists (
      select 1 from public.workouts
      where workouts.id = workout_exercises.workout_id
      and workouts.user_id = auth.uid()
    )
  );

-- Sets: Users can manage sets in their own workout exercises
create policy "Users can manage sets in their own workout exercises." on public.sets
  for all using (
    exists (
      select 1 from public.workout_exercises
      join public.workouts on workouts.id = workout_exercises.workout_id
      where workout_exercises.id = sets.workout_exercise_id
      and workouts.user_id = auth.uid()
    )
  );

-- Exercises: Viewable by everyone, only insertable by "admin" (simulation)
create policy "Exercises are viewable by everyone." on public.exercises
  for select using (true);

-- Insert some default exercises
insert into public.exercises (name, category, description) values
  ('Bench Press', 'Chest', 'The classic chest building exercise.'),
  ('Incline Dumbbell Press', 'Chest', 'Focus on upper chest.'),
  ('Squat', 'Legs', 'The king of leg exercises.'),
  ('Deadlift', 'Back', 'Full body power movement.'),
  ('Pull-up', 'Back', 'Great for back width.'),
  ('Overhead Press', 'Shoulders', 'Building strong shoulders.'),
  ('Bicep Curl', 'Arms', 'Isolating the biceps.'),
  ('Tricep Extension', 'Arms', 'Isolating the triceps.'),
  ('Plank', 'Core', 'Core stability.');

-- Trigger for new user profiles
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
