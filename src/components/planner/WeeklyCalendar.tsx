import React from 'react';
import DayCard from './DayCard';
import type { Schedule, ScheduleCompletion } from '../../types';

interface WeeklyCalendarProps {
  schedules: Schedule[];
  completions: ScheduleCompletion[];
  onAddWorkout: (dayIndex: number) => void;
  onRemoveSchedule: (scheduleId: string) => void;
  onStartWorkout: (workoutId: string) => void;
  onToggleCompletion: (scheduleId: string) => void;
}

const DAYS = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
];

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ 
  schedules, 
  completions,
  onAddWorkout, 
  onRemoveSchedule,
  onStartWorkout,
  onToggleCompletion
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
      {DAYS.map((day, index) => (
        <DayCard 
          key={day}
          dayName={day}
          dayIndex={index}
          schedules={schedules.filter(s => s.day_of_week === index)}
          completions={completions}
          onAddWorkout={onAddWorkout}
          onRemoveSchedule={onRemoveSchedule}
          onStartWorkout={onStartWorkout}
          onToggleCompletion={onToggleCompletion}
        />
      ))}
    </div>
  );
};

export default WeeklyCalendar;
