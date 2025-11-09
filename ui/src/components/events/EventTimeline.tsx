import { useState, type DragEvent } from 'react';

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
  horizontalOffset?: number; // Custom horizontal offset to avoid overlaps
}

interface Event {
  id: string;
  event_user_id: string;
  expected_duration: number;
  type: string;
  created_at: string;
  updated_at: string;
}

interface EventTimelineProps {
  event: Event;
  foodInstances: FoodInstance[];
  editMode: boolean;
  loadingInstances: boolean;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onDragStart: (e: DragEvent, instanceId: string, currentTop: number) => void;
  onDragEnd: () => void;
  onDeleteInstance: (instanceId: string) => void;
  timelineStyle?: React.CSSProperties;
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

// Calculate horizontal offsets for overlapping instances
const calculateHorizontalOffsets = (instances: FoodInstance[], event: Event) => {
  const ITEM_HEIGHT_PERCENT = 8; // Approximate height of each box as percentage of timeline
  const ITEM_WIDTH_PERCENT = 16.67; // Width of each box as percentage

  // Sort instances by time
  const sorted = [...instances].sort((a, b) =>
    a.time_elapsed_at_consumption - b.time_elapsed_at_consumption
  );

  const offsets: { [key: string]: number } = {};
  const lanes: Array<{ id: string; topPercent: number; bottomPercent: number }[]> = [[]];

  sorted.forEach((instance) => {
    const topPercent = (instance.time_elapsed_at_consumption / event.expected_duration) * 100;
    const bottomPercent = topPercent + ITEM_HEIGHT_PERCENT;

    // Find the first available lane
    let assignedLane = -1;
    for (let i = 0; i < lanes.length; i++) {
      const lane = lanes[i];
      const hasOverlap = lane.some((item) => {
        // Check if this instance overlaps with any item in this lane
        return !(bottomPercent <= item.topPercent || topPercent >= item.bottomPercent);
      });

      if (!hasOverlap) {
        assignedLane = i;
        break;
      }
    }

    // If no available lane found, create a new one
    if (assignedLane === -1) {
      assignedLane = lanes.length;
      lanes.push([]);
    }

    // Add this instance to the assigned lane
    lanes[assignedLane].push({
      id: instance.id,
      topPercent,
      bottomPercent,
    });

    // Calculate the horizontal offset
    offsets[instance.id] = assignedLane * ITEM_WIDTH_PERCENT;
  });

  return offsets;
};

export const EventTimeline = ({
  event,
  foodInstances,
  editMode,
  loadingInstances,
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
  onDeleteInstance,
  timelineStyle
}: EventTimelineProps) => {
  const [hoveredInstanceId, setHoveredInstanceId] = useState<string | null>(null);

  const THREE_HOURS = 3 * 3600;
  const ONE_HOUR = 3600;
  const HALF_HOUR = 1800;

  // Determine tick interval based on event duration
  const tickInterval = event.expected_duration > THREE_HOURS ? ONE_HOUR : HALF_HOUR;

  // Generate tick marks
  const generateTicks = () => {
    const ticks = [];
    for (let time = 0; time <= event.expected_duration; time += tickInterval) {
      const percentage = (time / event.expected_duration) * 100;
      ticks.push({ time, percentage });
    }
    return ticks;
  };

  // Generate dividers
  const generateDividers = () => {
    const dividers = [];
    for (let time = tickInterval; time < event.expected_duration; time += tickInterval) {
      const percentage = (time / event.expected_duration) * 100;
      dividers.push({ time, percentage });
    }
    return dividers;
  };

  const horizontalOffsets = calculateHorizontalOffsets(foodInstances, event);

  return (
    <>
      {/* Y-axis with tick marks */}
      <div className="timeline-y-axis" style={timelineStyle}>
        {generateTicks().map((tick, index) => (
          <div
            key={index}
            className="timeline-tick"
            style={{ top: `${tick.percentage}%` }}
          >
            <span className="tick-label">{formatDuration(tick.time)}</span>
            <span className="tick-mark"></span>
          </div>
        ))}
      </div>

      {/* Timeline content area */}
      <div
        className="event-timeline"
        style={timelineStyle}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {loadingInstances ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
            Loading food instances...
          </div>
        ) : (
          <>
            {/* Generate dividers to match tick marks */}
            {generateDividers().map((divider) => (
              <div
                key={divider.time}
                className="timeline-divider"
                style={{ top: `${divider.percentage}%`, position: 'absolute', width: '100%' }}
              ></div>
            ))}

            {foodInstances.map((instance) => {
              const position = (instance.time_elapsed_at_consumption / event.expected_duration) * 100;
              const isHovered = hoveredInstanceId === instance.id;
              // Use custom horizontal offset if set, otherwise use calculated offset
              const leftOffset = instance.horizontalOffset !== undefined
                ? instance.horizontalOffset
                : (horizontalOffsets[instance.id] || 0);

              return (
                <div
                  key={instance.id}
                  className="food-instance-box"
                  draggable={editMode}
                  onDragStart={(e) => editMode ? onDragStart(e, instance.id, position) : undefined}
                  onDragEnd={editMode ? onDragEnd : undefined}
                  onMouseEnter={() => setHoveredInstanceId(instance.id)}
                  onMouseLeave={() => setHoveredInstanceId(null)}
                  style={{
                    position: 'absolute',
                    top: `${position}%`,
                    left: `${leftOffset}%`,
                    width: '16.67%',
                    cursor: editMode ? 'grab' : 'pointer',
                  }}
                >
                  <div className={`food-instance-content ${editMode ? 'edit-mode' : ''}`}>
                    <button
                      className="delete-instance-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteInstance(instance.id);
                      }}
                      title="Delete food instance"
                    >
                      ✕
                    </button>
                    <strong>{instance.foodItem.item_name}</strong>
                    {instance.foodItem.brand && <span> - {instance.foodItem.brand}</span>}
                    <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                      {formatDuration(instance.time_elapsed_at_consumption)} • {instance.servings} serving(s)
                    </div>
                  </div>

                  {isHovered && (
                    <div className="food-instance-tooltip">
                      <div className="tooltip-header">
                        <strong>{instance.foodItem.item_name}</strong>
                        {instance.foodItem.brand && <div className="tooltip-brand">{instance.foodItem.brand}</div>}
                        {instance.foodItem.category && (
                          <div className="tooltip-category">{instance.foodItem.category.replace(/_/g, ' ')}</div>
                        )}
                      </div>
                      <div className="tooltip-servings">
                        Servings: {instance.servings}
                      </div>
                      {instance.foodItem.foodItemNutrients && instance.foodItem.foodItemNutrients.length > 0 && (
                        <div className="tooltip-nutrients">
                          <div className="tooltip-section-title">Total Nutrients:</div>
                          {instance.foodItem.foodItemNutrients.map((fin) => {
                            const totalAmount = fin.quantity * instance.servings;
                            return (
                              <div key={fin.id} className="tooltip-nutrient-row">
                                <span className="nutrient-name">{fin.nutrient.nutrient_name}:</span>
                                <span className="nutrient-amount">{totalAmount} {fin.unit}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
};
