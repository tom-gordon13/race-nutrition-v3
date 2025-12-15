import { useState, useRef, type DragEvent, type TouchEvent } from 'react';

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
  loadingInstances: boolean;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onDragStart: (e: DragEvent, instanceId: string, currentTop: number) => void;
  onDragEnd: () => void;
  onDeleteInstance: (instanceId: string) => void;
  onUpdateInstance: (instanceId: string, time: number, servings: number) => Promise<void>;
  onClickHoldCreate?: (timeInSeconds: number) => void;
  timelineStyle?: React.CSSProperties;
}

const formatTimeHHMM = (seconds: number) => {
  const isNegative = seconds < 0;
  const absSeconds = Math.abs(seconds);
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const sign = isNegative ? '-' : '';
  return `${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
};

// Calculate horizontal offsets for overlapping instances
const calculateHorizontalOffsets = (instances: FoodInstance[], event: Event) => {
  const ITEM_HEIGHT_PERCENT = 8; // Approximate height of each box as percentage of timeline
  const ITEM_WIDTH_PX = 180; // Fixed width in pixels
  const PRE_START_TIME = 0.25 * 3600; // 0.25 hours in seconds
  const POST_END_TIME = 0.25 * 3600; // 0.25 hours in seconds
  const totalTimelineDuration = event.expected_duration + PRE_START_TIME + POST_END_TIME;

  // Sort instances by time
  const sorted = [...instances].sort((a, b) =>
    a.time_elapsed_at_consumption - b.time_elapsed_at_consumption
  );

  const offsets: { [key: string]: number } = {};
  const lanes: Array<{ id: string; topPercent: number; bottomPercent: number }[]> = [[]];

  sorted.forEach((instance) => {
    const topPercent = ((instance.time_elapsed_at_consumption + PRE_START_TIME) / totalTimelineDuration) * 100;
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

    // Calculate the horizontal offset in pixels
    offsets[instance.id] = assignedLane * ITEM_WIDTH_PX;
  });

  return offsets;
};

export const EventTimeline = ({
  event,
  foodInstances,
  loadingInstances,
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
  onDeleteInstance,
  onUpdateInstance,
  onClickHoldCreate,
  timelineStyle
}: EventTimelineProps) => {
  const [hoveredInstanceId, setHoveredInstanceId] = useState<string | null>(null);
  const [editingInstanceId, setEditingInstanceId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState<string>('');
  const [editServings, setEditServings] = useState<string>('');
  const [timelineHoverPosition, setTimelineHoverPosition] = useState<{ y: number; x: number; time: number } | null>(null);
  const [isHoveringInstance, setIsHoveringInstance] = useState(false);
  const [mouseDownPosition, setMouseDownPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Touch/mobile drag state
  const [touchDraggingInstanceId, setTouchDraggingInstanceId] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const THREE_HOURS = 3 * 3600;
  const ONE_HOUR = 3600;
  const HALF_HOUR = 1800;
  const PRE_START_TIME = 0.25 * 3600; // 0.25 hours in seconds (900 seconds) - extra space at top
  const POST_END_TIME = 0.25 * 3600; // 0.25 hours in seconds (900 seconds) - extra space at end

  // Total timeline duration includes pre-start time and post-end time
  const totalTimelineDuration = event.expected_duration + PRE_START_TIME + POST_END_TIME;

  // Determine tick interval based on event duration
  const tickInterval = event.expected_duration > THREE_HOURS ? ONE_HOUR : HALF_HOUR;

  // Generate tick marks (starting from 0, positioned in box with 0.25 hour buffer)
  const generateTicks = () => {
    const ticks = [];
    for (let time = 0; time <= event.expected_duration; time += tickInterval) {
      const percentage = ((time + PRE_START_TIME) / totalTimelineDuration) * 100;
      ticks.push({ time, percentage });
    }
    return ticks;
  };

  // Generate dividers (starting from 0, positioned in box with 0.25 hour buffer)
  const generateDividers = () => {
    const dividers = [];
    for (let time = tickInterval; time < event.expected_duration; time += tickInterval) {
      const percentage = ((time + PRE_START_TIME) / totalTimelineDuration) * 100;
      dividers.push({ time, percentage });
    }
    return dividers;
  };

  const horizontalOffsets = calculateHorizontalOffsets(foodInstances, event);

  // Handler for mouse down on timeline (start tracking potential drag)
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setMouseDownPosition({ x: e.clientX, y: e.clientY });
    setIsDragging(false);
  };

  // Handler for mouse move on timeline (to show elapsed time tooltip and detect dragging)
  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const timeline = e.currentTarget;
    const rect = timeline.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const mouseX = e.clientX - rect.left;
    const percentage = mouseY / rect.height;
    const timeInSeconds = Math.round((percentage * totalTimelineDuration) - PRE_START_TIME);

    setTimelineHoverPosition({ y: mouseY, x: mouseX, time: timeInSeconds });

    // Detect if user has dragged (moved mouse more than 10 pixels from initial position)
    if (mouseDownPosition) {
      const distanceX = Math.abs(e.clientX - mouseDownPosition.x);
      const distanceY = Math.abs(e.clientY - mouseDownPosition.y);
      if (distanceX > 10 || distanceY > 10) {
        setIsDragging(true);
      }
    }
  };

  // Handler for mouse up on timeline
  const handleTimelineMouseUp = () => {
    setMouseDownPosition(null);
    // Reset isDragging after a short delay to prevent click from firing
    setTimeout(() => setIsDragging(false), 10);
  };

  // Handler for mouse leave on timeline
  const handleTimelineMouseLeave = () => {
    setTimelineHoverPosition(null);
    setIsHoveringInstance(false);
    setMouseDownPosition(null);
    setIsDragging(false);
  };

  // Handler for click on timeline (to create new food instance)
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't trigger if user was dragging
    if (isDragging) {
      return;
    }

    // Only trigger if clicking on the timeline background (not on food instances)
    if ((e.target as HTMLElement).classList.contains('event-timeline') ||
        (e.target as HTMLElement).classList.contains('timeline-divider')) {

      if (onClickHoldCreate) {
        // Calculate time based on click position
        const timeline = e.currentTarget;
        const rect = timeline.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const percentage = clickY / rect.height;
        const timeInSeconds = Math.round((percentage * totalTimelineDuration) - PRE_START_TIME);

        // Trigger callback with calculated time
        onClickHoldCreate(timeInSeconds);
      }
    }
  };

  // Handler to enter edit mode for an instance
  const handleDoubleClick = (instance: FoodInstance) => {
    setEditingInstanceId(instance.id);
    // Convert seconds to HH:MM format
    const hours = Math.floor(instance.time_elapsed_at_consumption / 3600);
    const minutes = Math.floor((instance.time_elapsed_at_consumption % 3600) / 60);
    setEditTime(`${hours}:${minutes.toString().padStart(2, '0')}`);
    setEditServings(instance.servings.toString());
  };

  // Handler to save changes
  const handleSaveEdit = async () => {
    if (!editingInstanceId) return;

    // Parse time from HH:MM format to seconds
    const [hours, minutes] = editTime.split(':').map(Number);
    const timeInSeconds = (hours * 3600) + (minutes * 60);
    const servings = parseFloat(editServings);

    if (isNaN(timeInSeconds) || isNaN(servings) || servings <= 0) {
      alert('Please enter valid time and servings');
      return;
    }

    try {
      await onUpdateInstance(editingInstanceId, timeInSeconds, servings);
      setEditingInstanceId(null);
      setEditTime('');
      setEditServings('');
    } catch (err) {
      console.error('Error updating instance:', err);
      alert('Failed to update food instance');
    }
  };

  // Touch event handlers for mobile drag and drop
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>, instanceId: string, currentTop: number) => {
    if (editingInstanceId) return; // Don't start drag if editing

    const touch = e.touches[0];
    const element = e.currentTarget as HTMLElement;

    setTouchDraggingInstanceId(instanceId);

    // Call the parent's onDragStart to set the dragging state
    const syntheticDragEvent = {
      currentTarget: element,
      clientY: touch.clientY,
      preventDefault: () => {},
      stopPropagation: () => {},
    } as unknown as DragEvent;

    onDragStart(syntheticDragEvent, instanceId, currentTop);

    // Prevent scrolling while dragging
    e.preventDefault();
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!touchDraggingInstanceId || !timelineRef.current) return;

    // Prevent default to stop scrolling
    e.preventDefault();
  };

  const handleTouchEnd = async (e: TouchEvent<HTMLDivElement>) => {
    if (!touchDraggingInstanceId || !timelineRef.current) return;

    const touch = e.changedTouches[0];
    const timeline = timelineRef.current;

    // Create a synthetic DragEvent to reuse existing drop logic
    const syntheticEvent = {
      preventDefault: () => {},
      currentTarget: timeline,
      clientY: touch.clientY,
    } as unknown as DragEvent;

    // Clean up touch state
    setTouchDraggingInstanceId(null);

    // Call the existing drop handler
    await onDrop(syntheticEvent);

    // Call drag end to clean up parent state
    onDragEnd();
  };

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
            <span className="tick-label">{formatTimeHHMM(tick.time)}</span>
            <span className="tick-mark"></span>
          </div>
        ))}
      </div>

      {/* Timeline content area */}
      <div
        ref={timelineRef}
        className="event-timeline"
        style={timelineStyle}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={handleTimelineClick}
        onMouseDown={handleTimelineMouseDown}
        onMouseMove={handleTimelineMouseMove}
        onMouseUp={handleTimelineMouseUp}
        onMouseLeave={handleTimelineMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {loadingInstances ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
            Loading food instances...
          </div>
        ) : (
          <>
            {/* Race start line at timestamp 0 */}
            <div
              className="timeline-race-start"
              style={{
                top: `${(PRE_START_TIME / totalTimelineDuration) * 100}%`,
                position: 'absolute',
                width: '100%'
              }}
            ></div>

            {/* Generate dividers to match tick marks */}
            {generateDividers().map((divider) => (
              <div
                key={divider.time}
                className="timeline-divider"
                style={{ top: `${divider.percentage}%`, position: 'absolute', width: '100%' }}
              ></div>
            ))}

            {foodInstances.map((instance) => {
              const position = ((instance.time_elapsed_at_consumption + PRE_START_TIME) / totalTimelineDuration) * 100;
              const isHovered = hoveredInstanceId === instance.id;
              const isEditing = editingInstanceId === instance.id;
              // Use custom horizontal offset if set, otherwise use calculated offset
              const leftOffset = instance.horizontalOffset !== undefined
                ? instance.horizontalOffset
                : (horizontalOffsets[instance.id] || 0);

              return (
                <div
                  key={instance.id}
                  className="food-instance-box"
                  draggable={!isEditing}
                  onDragStart={(e) => !isEditing ? onDragStart(e, instance.id, position) : undefined}
                  onDragEnd={onDragEnd}
                  onTouchStart={(e) => !isEditing ? handleTouchStart(e, instance.id, position) : undefined}
                  onMouseEnter={() => {
                    if (!isEditing) {
                      setHoveredInstanceId(instance.id);
                      setIsHoveringInstance(true);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredInstanceId(null);
                    setIsHoveringInstance(false);
                  }}
                  onDoubleClick={() => !isEditing && handleDoubleClick(instance)}
                  style={{
                    position: 'absolute',
                    top: `${position}%`,
                    left: `${leftOffset}px`,
                    width: '180px',
                    cursor: isEditing ? 'default' : 'grab',
                    touchAction: isEditing ? 'auto' : 'none', // Prevent default touch behavior when not editing
                  }}
                >
                  <div className={`food-instance-content ${isEditing ? 'instance-editing' : ''}`}>
                    {!isEditing && (
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
                    )}

                    {isEditing ? (
                      // Edit mode UI
                      <div className="instance-edit-form">
                        <strong>{instance.foodItem.item_name}</strong>
                        <div className="edit-inputs">
                          <div>
                            <span>Time:</span>
                            <input
                              type="text"
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                              placeholder="HH:MM"
                              className="time-input"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div>
                            <span>Serv.:</span>
                            <input
                              type="number"
                              value={editServings}
                              onChange={(e) => setEditServings(e.target.value)}
                              placeholder="0"
                              className="servings-input"
                              step="0.5"
                              min="0.5"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <button
                          className="save-edit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveEdit();
                          }}
                          title="Save changes"
                        >
                          ✓
                        </button>
                      </div>
                    ) : (
                      // Normal display - show item name and timestamp
                      <div className="food-instance-name">
                        <div className="instance-item-name">{instance.foodItem.item_name}</div>
                        <div className="instance-timestamp">{formatTimeHHMM(instance.time_elapsed_at_consumption)}</div>
                      </div>
                    )}
                  </div>

                  {isHovered && !isEditing && (
                    <div className="food-instance-tooltip">
                      <div className="tooltip-header">
                        <strong>{instance.foodItem.item_name}</strong>
                        {instance.foodItem.brand && <div className="tooltip-brand">{instance.foodItem.brand}</div>}
                        {instance.foodItem.category && (
                          <div className="tooltip-category">{instance.foodItem.category.replace(/_/g, ' ')}</div>
                        )}
                      </div>
                      <div className="tooltip-time-servings">
                        <div className="tooltip-time">Time: {formatTimeHHMM(instance.time_elapsed_at_consumption)}</div>
                        <div className="tooltip-servings">Servings: {instance.servings}</div>
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

            {/* Timeline elapsed time tooltip - show when not hovering over an instance */}
            {timelineHoverPosition && !isHoveringInstance && (
              <div
                className="timeline-elapsed-tooltip"
                style={{
                  position: 'absolute',
                  top: `${timelineHoverPosition.y}px`,
                  left: `${timelineHoverPosition.x + 15}px`,
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              >
                {formatTimeHHMM(timelineHoverPosition.time)}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};
