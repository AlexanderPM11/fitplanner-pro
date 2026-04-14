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
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  started_at: string;
  completed_at: string | null;
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
