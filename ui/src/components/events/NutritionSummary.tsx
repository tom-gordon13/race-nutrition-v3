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

interface NutritionSummaryProps {
  event: Event;
  foodInstances: FoodInstance[];
  timelineStyle?: React.CSSProperties;
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const NutritionSummary = ({ event, foodInstances, timelineStyle }: NutritionSummaryProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [allNutrients, setAllNutrients] = useState<Nutrient[]>([]);
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

      // Filter instances in this window
      const instancesInWindow = foodInstances.filter(instance =>
        instance.time_elapsed_at_consumption >= startTime &&
        instance.time_elapsed_at_consumption < endTime
      );

      // Initialize all nutrients with zero totals
      const nutrientTotals: { [key: string]: { name: string; total: number; unit: string } } = {};

      allNutrients.forEach(nutrient => {
        nutrientTotals[nutrient.id] = {
          name: nutrient.nutrient_name,
          total: 0,
          unit: 'g' // Default unit, will be overwritten if there's actual data
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
        nutrientTotals: Object.values(nutrientTotals)
      });
    }

    return windows;
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
              <div className="nutrition-window-header">
                {formatDuration(window.startTime)} - {formatDuration(window.endTime)}
              </div>
              <div className="nutrition-window-content">
                {window.nutrientTotals.map((nutrient, nIndex) => (
                  <div key={nIndex} className="nutrient-summary-row">
                    <span className="nutrient-summary-name">{nutrient.name}:</span>
                    <span className="nutrient-summary-amount">
                      {Math.round(nutrient.total * 10) / 10} {nutrient.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
