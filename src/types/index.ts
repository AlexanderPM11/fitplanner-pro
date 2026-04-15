export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  video_url?: string | null;
  gender?: string | null;
  instructions?: string[] | null;
  tips?: string[] | null;
  difficulty?: string | null;
  male_activation_url?: string | null;
  female_activation_url?: string | null;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  started_at: string;
  completed_at: string | null;
  is_template: boolean; // Assigned by DB default false
  order_index?: number | null;
}

export interface Schedule {
  id: string;
  user_id: string;
  workout_id: string;
  day_of_week: number;
  workout?: Workout;
}

export interface ScheduleCompletion {
  id: string;
  user_id: string;
  schedule_id: string;
  completed_at: string;
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  order_index: number;
  exercise?: Exercise;
}

export interface Set {
  id: string;
  workout_exercise_id: string;
  weight: number | null;
  reps: number | null;
  completed: boolean;
  order_index: number;
}
