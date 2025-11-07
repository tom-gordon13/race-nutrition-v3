import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const FOOD_CATEGORIES = [
  'ALL',
  'ENERGY_GEL',
  'ENERGY_BAR',
  'SPORTS_DRINK',
  'FRUIT',
  'SNACK',
  'OTHER'
] as const;

interface Event {
  id: string;
  event_user_id: string;
  expected_duration: number;
  type: string;
  created_at: string;
  updated_at: string;
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

// Compute seconds from three inputs (hours, minutes, seconds)
const computeSecondsFromInputs = (hStr: string, mStr: string, sStr: string): number | null => {
  const toInt = (v: string) => (v.trim() === '' ? 0 : Number(v));
  const h = toInt(hStr);
  const m = toInt(mStr);
  const s = toInt(sStr);

  if (![h, m, s].every((n) => Number.isInteger(n) && n >= 0)) return null;
  if (m > 59 || s > 59) return null;

  return h * 3600 + m * 60 + s;
};

const Events = () => {
  const { user } = useAuth0();
  const { eventId } = useParams<{ eventId: string }>();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Selected event state
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [foodInstances, setFoodInstances] = useState<FoodInstance[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);

  // Sub-tab state (for left panel when event is selected)
  const [leftPanelTab, setLeftPanelTab] = useState<'food-items' | 'events'>('food-items');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loadingFoodItems, setLoadingFoodItems] = useState(false);
  const [hoveredFoodItemId, setHoveredFoodItemId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [myItemsOnly, setMyItemsOnly] = useState<boolean>(true);

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [eventType, setEventType] = useState('');
  const [hoursInput, setHoursInput] = useState('');
  const [minutesInput, setMinutesInput] = useState('');
  const [secondsInput, setSecondsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editableEvent, setEditableEvent] = useState<Event | null>(null);
  const [editableFoodInstances, setEditableFoodInstances] = useState<FoodInstance[]>([]);
  const [draggingInstanceId, setDraggingInstanceId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Hover state for tooltip
  const [hoveredInstanceId, setHoveredInstanceId] = useState<string | null>(null);

  // State for dragging food items from left panel
  const [draggingFoodItemId, setDraggingFoodItemId] = useState<string | null>(null);

  const fetchEvents = async () => {
    if (!user || !user.sub) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/events?auth0_sub=${encodeURIComponent(user.sub)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const fetchFoodItems = async () => {
    if (!user || !user.sub) return;

    setLoadingFoodItems(true);
    try {
      const response = await fetch(`${API_URL}/api/food-items?auth0_sub=${encodeURIComponent(user.sub)}&my_items_only=${myItemsOnly}`);

      if (!response.ok) {
        throw new Error('Failed to fetch food items');
      }

      const data = await response.json();
      setFoodItems(data.foodItems);
    } catch (err) {
      console.error('Error fetching food items:', err);
    } finally {
      setLoadingFoodItems(false);
    }
  };

  useEffect(() => {
    if (selectedEvent) {
      fetchFoodItems();
    }
  }, [selectedEvent, myItemsOnly]);

  // Auto-select event if eventId is in URL
  useEffect(() => {
    if (eventId && events.length > 0 && !selectedEvent) {
      const eventToSelect = events.find(e => e.id === eventId);
      if (eventToSelect) {
        setSelectedEvent(eventToSelect);
      }
    }
  }, [eventId, events, selectedEvent]);

  const fetchFoodInstances = async (eventId: string) => {
    setLoadingInstances(true);
    try {
      const response = await fetch(`${API_URL}/api/food-instances/event/${eventId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch food instances');
      }

      const data = await response.json();
      setFoodInstances(data.foodInstances);
    } catch (err) {
      console.error('Error fetching food instances:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoadingInstances(false);
    }
  };

  useEffect(() => {
    if (selectedEvent) {
      fetchFoodInstances(selectedEvent.id);
    } else {
      setFoodInstances([]);
    }
    // Reset edit mode when event changes
    setEditMode(false);
    setEditableEvent(null);
    setEditableFoodInstances([]);
  }, [selectedEvent]);

  const toggleEditMode = async () => {
    if (!editMode && selectedEvent) {
      // Entering edit mode - copy data to editable state
      setEditableEvent({ ...selectedEvent });
      setEditableFoodInstances(foodInstances.map(instance => ({ ...instance })));
      setEditMode(true);
    } else if (editMode) {
      // Exiting edit mode - save changes
      await saveChanges();
      setEditableEvent(null);
      setEditableFoodInstances([]);
      setEditMode(false);
    }
  };

  const saveChanges = async () => {
    if (!selectedEvent) return;

    try {
      // Update food instances that have changed
      for (const instance of editableFoodInstances) {
        const original = foodInstances.find(fi => fi.id === instance.id);
        if (original && original.time_elapsed_at_consumption !== instance.time_elapsed_at_consumption) {
          const response = await fetch(`${API_URL}/api/food-instances/${instance.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              time_elapsed_at_consumption: instance.time_elapsed_at_consumption
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to update food instance');
          }
        }
      }

      // Refresh food instances after save
      await fetchFoodInstances(selectedEvent.id);
      setSuccess('Changes saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
      console.error('Error saving changes:', err);
    }
  };

  const handleDragStart = (e: React.DragEvent, instanceId: string, currentTop: number) => {
    if (!editMode) return;

    setDraggingInstanceId(instanceId);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    const timeline = e.currentTarget as HTMLElement;
    const rect = timeline.getBoundingClientRect();

    // Calculate drop position relative to timeline
    const dropY = e.clientY - rect.top;

    // Check if drop is within timeline bounds
    if (dropY < 0 || dropY > rect.height) {
      setDraggingInstanceId(null);
      setDraggingFoodItemId(null);
      return;
    }

    // Calculate new time based on position
    const percentage = dropY / rect.height;
    const newTime = Math.round(percentage * selectedEvent.expected_duration);

    // Handle dragging existing instance (edit mode)
    if (draggingInstanceId && editMode) {
      // Update the editable food instance
      setEditableFoodInstances(prev =>
        prev.map(instance =>
          instance.id === draggingInstanceId
            ? { ...instance, time_elapsed_at_consumption: newTime }
            : instance
        )
      );
      setDraggingInstanceId(null);
    }
    // Handle dragging food item from left panel (create new instance)
    else if (draggingFoodItemId) {
      try {
        const response = await fetch(`${API_URL}/api/food-instances`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            food_item_id: draggingFoodItemId,
            event_id: selectedEvent.id,
            time_elapsed_at_consumption: newTime,
            servings: 1
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create food instance');
        }

        // Refresh food instances to show the new one
        await fetchFoodInstances(selectedEvent.id);
        setSuccess('Food instance added successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        console.error('Error creating food instance:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
      setDraggingFoodItemId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggingInstanceId(null);
    setDraggingFoodItemId(null);
  };

  const handleFoodItemDragStart = (e: React.DragEvent, foodItemId: string) => {
    setDraggingFoodItemId(foodItemId);
  };

  // Calculate horizontal offsets for overlapping instances
  const calculateHorizontalOffsets = (instances: FoodInstance[]) => {
    if (!selectedEvent) return {};

    const ITEM_HEIGHT_PERCENT = 8; // Approximate height of each box as percentage of timeline
    const ITEM_WIDTH_PERCENT = 16.67; // Width of each box as percentage

    // Sort instances by time
    const sorted = [...instances].sort((a, b) =>
      a.time_elapsed_at_consumption - b.time_elapsed_at_consumption
    );

    const offsets: { [key: string]: number } = {};
    const lanes: Array<{ id: string; topPercent: number; bottomPercent: number }[]> = [[]];

    sorted.forEach((instance) => {
      const topPercent = (instance.time_elapsed_at_consumption / selectedEvent.expected_duration) * 100;
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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!user || !user.sub) {
        throw new Error('User not authenticated');
      }

      const seconds = computeSecondsFromInputs(hoursInput, minutesInput, secondsInput);
      if (seconds === null) {
        throw new Error('Please enter valid time values. Minutes and seconds must be 0–59.');
      }

      const response = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth0_sub: user.sub,
          expected_duration: seconds,
          type: eventType
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create event');
      }

      const data = await response.json();
      setSuccess(`Event "${data.event.type}" created successfully!`);

      // Reset form
      setEventType('');
      setHoursInput('');
      setMinutesInput('');
      setSecondsInput('');
      setShowCreateForm(false);

      // Refresh events list
      fetchEvents();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error creating event:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const previewSeconds = computeSecondsFromInputs(hoursInput, minutesInput, secondsInput);

  if (loading) {
    return <div>Loading events...</div>;
  }

  if (!user || !user.sub) {
    return <div>Please log in to view events.</div>;
  }

  return (
    <div className={`events-container ${selectedEvent ? 'split-view' : ''}`}>
      <div className={`events-panel ${selectedEvent ? 'vertical' : ''}`}>
        <h2>My Events</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {selectedEvent && (
          <div className="sub-tabs">
            <button
              className={`sub-tab ${leftPanelTab === 'food-items' ? 'active' : ''}`}
              onClick={() => setLeftPanelTab('food-items')}
            >
              Food Items
            </button>
            <button
              className={`sub-tab ${leftPanelTab === 'events' ? 'active' : ''}`}
              onClick={() => setLeftPanelTab('events')}
            >
              Events
            </button>
          </div>
        )}

        {!selectedEvent && (
          <div style={{ marginBottom: '1rem' }}>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="add-nutrient-btn"
            >
              {showCreateForm ? 'Cancel' : '+ Create New Event'}
            </button>
          </div>
        )}

        {showCreateForm && (
          <div className="create-food-item" style={{ marginBottom: '2rem' }}>
            <h3>Create New Event</h3>
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label htmlFor="eventType">Event Type *</label>
                <input
                  type="text"
                  id="eventType"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  required
                  placeholder="e.g., Marathon, Half Marathon, 10K"
                />
              </div>

              <div className="form-group">
                <label>Expected Duration</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div>
                    <input
                      type="number"
                      id="hoursInput"
                      value={hoursInput}
                      onChange={(e) => setHoursInput(e.target.value)}
                      min={0}
                      step={1}
                      placeholder="Hours"
                      inputMode="numeric"
                      style={{ width: '6rem' }}
                    />
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>hours</div>
                  </div>
                  <div>
                    <input
                      type="number"
                      id="minutesInput"
                      value={minutesInput}
                      onChange={(e) => setMinutesInput(e.target.value)}
                      min={0}
                      max={59}
                      step={1}
                      placeholder="Minutes"
                      inputMode="numeric"
                      style={{ width: '6rem' }}
                    />
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>minutes</div>
                  </div>
                  <div>
                    <input
                      type="number"
                      id="secondsInput"
                      value={secondsInput}
                      onChange={(e) => setSecondsInput(e.target.value)}
                      min={0}
                      max={59}
                      step={1}
                      placeholder="Seconds"
                      inputMode="numeric"
                      style={{ width: '6rem' }}
                    />
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>seconds</div>
                  </div>
                </div>
                {(hoursInput !== '' || minutesInput !== '' || secondsInput !== '') && (
                  <small style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    {previewSeconds !== null
                      ? `→ ${previewSeconds}s (${formatDuration(previewSeconds)})`
                      : 'Enter valid time (mm and ss 0–59)'}
                  </small>
                )}
              </div>

              <button type="submit" disabled={submitting || !eventType || previewSeconds === null} className="submit-btn">
                {submitting ? 'Creating...' : 'Create Event'}
              </button>
            </form>
          </div>
        )}

        {(!selectedEvent || leftPanelTab === 'events') && (
          <>
            <p>Total Events: {events.length}</p>

            {events.length === 0 ? (
              <p>No events found. Create your first event above!</p>
            ) : (
              <div className="events-table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Event Type</th>
                      <th>Expected Duration</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={selectedEvent?.id === event.id ? 'selected' : ''}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{event.type}</td>
                        <td>{formatDuration(event.expected_duration)}</td>
                        <td>{new Date(event.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {selectedEvent && leftPanelTab === 'food-items' && (
          <>
            <div className="food-filters-container">
              <div className="my-items-filter">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={myItemsOnly}
                    onChange={(e) => setMyItemsOnly(e.target.checked)}
                  />
                  <span className="checkbox-text">My items</span>
                </label>
              </div>

              <div className="category-filter-container">
                <label htmlFor="category-filter" className="category-filter-label">Category:</label>
                <select
                  id="category-filter"
                  className="category-filter-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  {FOOD_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category === 'ALL' ? 'All Categories' : category.toLowerCase().replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(() => {
              const filteredItems = categoryFilter === 'ALL'
                ? foodItems
                : foodItems.filter(item => item.category === categoryFilter);

              return (
                <>
                  <p>Total Food Items: {filteredItems.length}</p>

                  {loadingFoodItems ? (
                    <p>Loading food items...</p>
                  ) : filteredItems.length === 0 ? (
                    <p>No food items found.</p>
                  ) : (
                    <div className="food-items-grid">
                      {filteredItems.map((item) => {
                  // Find carbohydrates and sodium
                  const carbs = item.foodItemNutrients.find(
                    fin => fin.nutrient.nutrient_name.toLowerCase().includes('carbohydrate')
                  );
                  const sodium = item.foodItemNutrients.find(
                    fin => fin.nutrient.nutrient_name.toLowerCase().includes('sodium')
                  );

                  return (
                    <div
                      key={item.id}
                      className="draggable-food-item"
                      draggable
                      onDragStart={(e) => handleFoodItemDragStart(e, item.id)}
                      onDragEnd={handleDragEnd}
                      onMouseEnter={() => setHoveredFoodItemId(item.id)}
                      onMouseLeave={() => setHoveredFoodItemId(null)}
                    >
                      <div className="food-item-content">
                        <div className="drag-handle">⋮⋮</div>
                        <div className="food-item-name">{item.item_name}</div>
                        {item.brand && <div className="food-item-brand">{item.brand}</div>}

                        <div className="food-item-nutrients">
                          {carbs && (
                            <div className="food-item-nutrient">
                              Carbs: {carbs.quantity}{carbs.unit}
                            </div>
                          )}
                          {sodium && (
                            <div className="food-item-nutrient">
                              Sodium: {sodium.quantity}{sodium.unit}
                            </div>
                          )}
                        </div>
                      </div>

                      {hoveredFoodItemId === item.id && (
                        <div className="food-instance-tooltip" style={{ position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '0.5rem' }}>
                          <div className="tooltip-header">
                            <strong>{item.item_name}</strong>
                            {item.brand && <div className="tooltip-brand">{item.brand}</div>}
                            {item.category && <div className="tooltip-category">{item.category.toLowerCase().replace(/_/g, ' ')}</div>}
                          </div>

                          <div className="tooltip-nutrients">
                            <div className="tooltip-section-title">Nutrients (per serving)</div>
                            {item.foodItemNutrients.map((fin) => (
                              <div key={fin.id} className="tooltip-nutrient-row">
                                <span className="nutrient-name">{fin.nutrient.nutrient_name}</span>
                                <span className="nutrient-amount">
                                  {fin.quantity} {fin.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}
      </div>

      {selectedEvent && (
        <div className="event-detail-panel">
          <div className="event-detail-header">
            <h3>{selectedEvent.type}</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={toggleEditMode}
                className={`edit-mode-btn ${editMode ? 'active' : ''}`}
              >
                {editMode ? 'Save & Exit Edit Mode' : 'Edit Mode'}
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="close-btn"
              >
                ✕
              </button>
            </div>
          </div>
          <div
            className="event-timeline"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {loadingInstances ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
                Loading food instances...
              </div>
            ) : (
              <>
                <div className="timeline-section"></div>
                <div className="timeline-divider"></div>
                <div className="timeline-section"></div>
                <div className="timeline-divider"></div>
                <div className="timeline-section"></div>
                <div className="timeline-divider"></div>
                <div className="timeline-section"></div>
                <div className="timeline-divider"></div>
                <div className="timeline-section"></div>

                {(() => {
                  const currentInstances = editMode ? editableFoodInstances : foodInstances;
                  const horizontalOffsets = calculateHorizontalOffsets(currentInstances);

                  return currentInstances.map((instance) => {
                    const position = (instance.time_elapsed_at_consumption / selectedEvent.expected_duration) * 100;
                    const isHovered = hoveredInstanceId === instance.id;
                    const leftOffset = horizontalOffsets[instance.id] || 0;

                    return (
                      <div
                        key={instance.id}
                        className="food-instance-box"
                        draggable={editMode}
                        onDragStart={(e) => editMode ? handleDragStart(e, instance.id, position) : undefined}
                        onDragEnd={editMode ? handleDragEnd : undefined}
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
                  });
                })()}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
