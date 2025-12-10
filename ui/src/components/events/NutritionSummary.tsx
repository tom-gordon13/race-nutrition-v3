import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface Nutrient {
  id: string;
  nutrient_name: string;
  nutrient_abbreviation: string;
}

interface FoodItemNutrient {
  id: string;
  food_item_id: string;
  nutrient_id: string;
  quantity: number;
  unit: string;
  nutrient: {
    id: string;
    nutrient_name: string;
    nutrient_abbreviation: string;
  };
}

interface FoodItem {
  id: string;
  item_name: string;
  brand?: string;
  category?: string;
  foodItemNutrients: FoodItemNutrient[];
}

interface FoodInstance {
  id: string;
  time_elapsed_at_consumption: number;
  servings: number;
  food_item_id: string;
  event_id: string;
  foodItem: FoodItem;
}

interface Event {
  id: string;
  event_user_id: string;
  expected_duration: number;
  type: string;
  created_at: string;
  updated_at: string;
}

interface EventGoalBase {
  id: string;
  nutrient_id: string;
  quantity: number;
  unit: string;
  nutrient: Nutrient;
}

interface EventGoalHourly {
  id: string;
  nutrient_id: string;
  hour: number;
  quantity: number;
  unit: string;
  nutrient: Nutrient;
}

interface NutritionSummaryProps {
  event: Event;
  foodInstances: FoodInstance[];
  timelineStyle?: React.CSSProperties;
  userId: string;
  goalsRefreshTrigger?: number;
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const NutritionSummary = ({ event, foodInstances, timelineStyle, userId, goalsRefreshTrigger }: NutritionSummaryProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [allNutrients, setAllNutrients] = useState<Nutrient[]>([]);
  const [baseGoals, setBaseGoals] = useState<EventGoalBase[]>([]);
  const [hourlyGoals, setHourlyGoals] = useState<EventGoalHourly[]>([]);
  const THREE_HOURS = 3 * 3600;
  const ONE_HOUR = 3600;
  const HALF_HOUR = 1800;
  const tickInterval = event.expected_duration > THREE_HOURS ? ONE_HOUR : HALF_HOUR;

  // Fetch all available nutrients
  useEffect(() => {
    const fetchNutrients = async () => {
      try {
        const response = await fetch(`${API_URL}/api/nutrients`);
        if (!response.ok) throw new Error('Failed to fetch nutrients');
        const data = await response.json();
        setAllNutrients(data.nutrients);
      } catch (err) {
        console.error('Error fetching nutrients:', err);
      }
    };

    fetchNutrients();
  }, []);

  // Fetch nutrient goals
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const [baseResponse, hourlyResponse] = await Promise.all([
          fetch(`${API_URL}/api/event-goals/base?event_id=${event.id}&user_id=${userId}`),
          fetch(`${API_URL}/api/event-goals/hourly?event_id=${event.id}&user_id=${userId}`)
        ]);

        if (baseResponse.ok) {
          const baseData = await baseResponse.json();
          setBaseGoals(baseData.goals || []);
        }

        if (hourlyResponse.ok) {
          const hourlyData = await hourlyResponse.json();
          setHourlyGoals(hourlyData.goals || []);
        }
      } catch (err) {
        console.error('Error fetching goals:', err);
      }
    };

    if (userId && event.id) {
      fetchGoals();
    }
  }, [event.id, userId, goalsRefreshTrigger]);

  // Get goal for a specific nutrient and hour
  const getGoalForNutrient = (nutrientId: string, hour: number): { quantity: number; unit: string } | null => {
    // Check for hourly override first
    const hourlyGoal = hourlyGoals.find(g => g.nutrient_id === nutrientId && g.hour === hour);
    if (hourlyGoal) {
      return { quantity: hourlyGoal.quantity, unit: hourlyGoal.unit };
    }

    // Fall back to base goal
    const baseGoal = baseGoals.find(g => g.nutrient_id === nutrientId);
    if (baseGoal) {
      return { quantity: baseGoal.quantity, unit: baseGoal.unit };
    }

    return null;
  };

  // Generate dividers to match timeline
  const generateDividers = () => {
    const dividers = [];
    for (let time = tickInterval; time < event.expected_duration; time += tickInterval) {
      const percentage = (time / event.expected_duration) * 100;
      dividers.push({ time, percentage });
    }
    return dividers;
  };

  // Create time windows
  const generateWindows = () => {
    const windows = [];

    for (let startTime = 0; startTime < event.expected_duration; startTime += tickInterval) {
      const endTime = Math.min(startTime + tickInterval, event.expected_duration);
      const topPercentage = (startTime / event.expected_duration) * 100;
      const bottomPercentage = (endTime / event.expected_duration) * 100;
      const height = bottomPercentage - topPercentage;

      // Calculate which hour this window represents (for goals)
      const hour = Math.floor(startTime / 3600);

      // Filter instances in this window
      const instancesInWindow = foodInstances.filter(instance =>
        instance.time_elapsed_at_consumption >= startTime &&
        instance.time_elapsed_at_consumption < endTime
      );

      // Initialize all nutrients with zero totals
      const nutrientTotals: { [key: string]: {
        id: string;
        name: string;
        total: number;
        unit: string;
        goal: { quantity: number; unit: string } | null;
      } } = {};

      allNutrients.forEach(nutrient => {
        const goal = getGoalForNutrient(nutrient.id, hour);
        nutrientTotals[nutrient.id] = {
          id: nutrient.id,
          name: nutrient.nutrient_name,
          total: 0,
          unit: goal?.unit || 'g', // Use goal unit or default to 'g'
          goal: goal
        };
      });

      // Calculate total nutrients for this window
      instancesInWindow.forEach(instance => {
        instance.foodItem.foodItemNutrients.forEach(fin => {
          const nutrientKey = fin.nutrient.id;
          const amount = fin.quantity * instance.servings;

          if (nutrientTotals[nutrientKey]) {
            nutrientTotals[nutrientKey].total += amount;
            nutrientTotals[nutrientKey].unit = fin.unit; // Use the actual unit from the data
          }
        });
      });

      windows.push({
        startTime,
        endTime,
        topPercentage,
        height,
        hour,
        nutrientTotals: Object.values(nutrientTotals)
      });
    }

    return windows;
  };

  // Calculate color based on actual vs goal
  const getRowColor = (actual: number, goal: { quantity: number; unit: string } | null) => {
    if (!goal) return '';

    const percentage = (actual / goal.quantity) * 100;
    const deviation = Math.abs(100 - percentage);

    if (deviation <= 10) {
      return '#22c55e'; // green
    } else if (deviation <= 40) {
      return '#eab308'; // yellow
    } else {
      return '#ef4444'; // red
    }
  };

  return (
    <div className={`nutrition-summary-panel ${isExpanded ? 'expanded' : 'collapsed'}`} style={timelineStyle}>
      <button
        className="nutrition-panel-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Collapse nutrition panel' : 'Expand nutrition panel'}
      >
        {isExpanded ? '›' : '‹'}
      </button>

      {isExpanded && (
        <div className="nutrition-panel-content" style={timelineStyle}>
          {/* Generate dividers to match timeline */}
          {generateDividers().map((divider) => (
            <div
              key={divider.time}
              className="nutrition-divider"
              style={{ top: `${divider.percentage}%`, position: 'absolute', width: '100%' }}
            ></div>
          ))}

          {generateWindows().map((window, index) => (
            <div
              key={index}
              className="nutrition-window"
              style={{
                top: `${window.topPercentage}%`,
                height: `${window.height}%`
              }}
            >
              <div className="nutrition-window-content">
                <table className="nutrient-summary-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Goal</th>
                      <th>Actual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {window.nutrientTotals.map((nutrient, nIndex) => {
                      const rowColor = getRowColor(nutrient.total, nutrient.goal);
                      return (
                        <tr key={nIndex} style={{ backgroundColor: rowColor ? `${rowColor}33` : 'transparent' }}>
                          <td className="nutrient-summary-name">{nutrient.name}</td>
                          <td className="nutrient-summary-goal">
                            {nutrient.goal
                              ? `${Math.round(nutrient.goal.quantity * 10) / 10}${nutrient.goal.unit}`
                              : '-'
                            }
                          </td>
                          <td className="nutrient-summary-actual">
                            {Math.round(nutrient.total * 10) / 10}{nutrient.unit}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
