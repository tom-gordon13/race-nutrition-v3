import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { CreateEventDialog, EditEventDialog, DeleteEventDialog } from './components/events';
import { API_URL } from './config/api';
import './Plans.css';
import LoadingSpinner from './LoadingSpinner';

interface TriathlonAttributes {
  id: string;
  event_id: string;
  swim_duration_seconds: number;
  bike_duration_seconds: number;
  run_duration_seconds: number;
  t1_duration_seconds: number | null;
  t2_duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

interface Event {
  id: string;
  event_user_id: string;
  expected_duration: number;
  name: string;
  event_type: string;
  created_at: string;
  updated_at: string;
  private: boolean;
  triathlonAttributes?: TriathlonAttributes | null;
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
  cost?: number;
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

interface EventWithStats extends Event {
  foodInstances?: FoodInstance[];
  owner?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  };
  downloadCount?: number;
}

interface SharedEvent {
  id: string;
  event_id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  event: {
    id: string;
    name: string;
    event_type: string;
    expected_duration: number;
    created_at: string;
  };
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  };
  foodInstances?: FoodInstance[];
}

type TabType = 'my_plans' | 'community_plans';

interface PlansProps {
  onPendingSharedEventsCountChange?: (count: number) => void;
}

const Plans = ({ onPendingSharedEventsCountChange }: PlansProps) => {
  const { user } = useAuth0();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('my_plans');
  const [myPlans, setMyPlans] = useState<EventWithStats[]>([]);
  const [communityPlans, setCommunityPlans] = useState<EventWithStats[]>([]);
  const [pendingSharedEvents, setPendingSharedEvents] = useState<SharedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [showPlanOptionsDropdown, setShowPlanOptionsDropdown] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventWithStats | null>(null);

  const fetchMyPlans = async () => {
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

      // Fetch food instances for each event
      const eventsWithStats = await Promise.all(
        data.events.map(async (event: Event) => {
          try {
            const instancesResponse = await fetch(`${API_URL}/api/food-instances/event/${event.id}`);
            if (instancesResponse.ok) {
              const instancesData = await instancesResponse.json();
              return { ...event, foodInstances: instancesData.foodInstances };
            }
          } catch (err) {
            console.error('Error fetching food instances:', err);
          }
          return { ...event, foodInstances: [] };
        })
      );

      setMyPlans(eventsWithStats);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunityPlans = async () => {
    if (!user || !user.sub) return;

    try {
      const response = await fetch(`${API_URL}/api/events/community?auth0_sub=${encodeURIComponent(user.sub)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch community events');
      }

      const data = await response.json();

      // Fetch food instances for each community event
      const eventsWithStats = await Promise.all(
        data.events.map(async (event: EventWithStats) => {
          try {
            const instancesResponse = await fetch(`${API_URL}/api/food-instances/event/${event.id}`);
            if (instancesResponse.ok) {
              const instancesData = await instancesResponse.json();
              return { ...event, foodInstances: instancesData.foodInstances };
            }
          } catch (err) {
            console.error('Error fetching food instances:', err);
          }
          return { ...event, foodInstances: [] };
        })
      );

      setCommunityPlans(eventsWithStats);
    } catch (err) {
      console.error('Error fetching community events:', err);
    }
  };

  const fetchPendingSharedEvents = async () => {
    if (!user || !user.sub) return;

    try {
      const response = await fetch(`${API_URL}/api/shared-events/pending/${encodeURIComponent(user.sub)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch pending shared events');
      }

      const data = await response.json();

      // Fetch food instances for each shared event
      const eventsWithStats = await Promise.all(
        data.sharedEvents.map(async (sharedEvent: SharedEvent) => {
          try {
            const instancesResponse = await fetch(`${API_URL}/api/food-instances/event/${sharedEvent.event.id}`);
            if (instancesResponse.ok) {
              const instancesData = await instancesResponse.json();
              return { ...sharedEvent, foodInstances: instancesData.foodInstances };
            }
          } catch (err) {
            console.error('Error fetching food instances:', err);
          }
          return { ...sharedEvent, foodInstances: [] };
        })
      );

      setPendingSharedEvents(eventsWithStats);
    } catch (err) {
      console.error('Error fetching pending shared events:', err);
    }
  };

  const handleAcceptSharedEvent = async (sharedEventId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/shared-events/${sharedEventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept shared event');
      }

      // Refresh all plans
      await Promise.all([
        fetchMyPlans(),
        fetchPendingSharedEvents()
      ]);
    } catch (err) {
      console.error('Error accepting shared event:', err);
    }
  };

  const handleDeclineSharedEvent = async (sharedEventId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/shared-events/${sharedEventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'DENIED' }),
      });

      if (!response.ok) {
        throw new Error('Failed to decline shared event');
      }

      // Refresh pending shared events
      await fetchPendingSharedEvents();
    } catch (err) {
      console.error('Error declining shared event:', err);
    }
  };

  const calculateSharedEventStats = (sharedEvent: SharedEvent) => {
    const instances = sharedEvent.foodInstances || [];

    const totalCarbs = instances.reduce((total, instance) => {
      const carbNutrient = instance.foodItem.foodItemNutrients.find(
        n => n.nutrient.nutrient_name.toLowerCase().includes('carb')
      );
      if (carbNutrient) {
        return total + (carbNutrient.quantity * instance.servings);
      }
      return total;
    }, 0);

    const totalSodium = instances.reduce((total, instance) => {
      const sodiumNutrient = instance.foodItem.foodItemNutrients.find(
        n => n.nutrient.nutrient_name.toLowerCase().includes('sodium')
      );
      if (sodiumNutrient) {
        return total + (sodiumNutrient.quantity * instance.servings);
      }
      return total;
    }, 0);

    const itemCount = instances.length;

    // Calculate per hour rates
    const durationHours = sharedEvent.event.expected_duration / 3600;
    const carbsPerHour = durationHours > 0 ? Math.round(totalCarbs / durationHours) : 0;
    const sodiumPerHour = durationHours > 0 ? Math.round(totalSodium / durationHours) : 0;

    return { itemCount, carbsPerHour, sodiumPerHour };
  };

  const formatSharedTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return `${Math.floor(diffInDays / 7)} ${Math.floor(diffInDays / 7) === 1 ? 'week' : 'weeks'} ago`;
    }
  };

  useEffect(() => {
    fetchMyPlans();
    fetchCommunityPlans();
    fetchPendingSharedEvents();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showPlanOptionsDropdown && !target.closest('.plan-options-dropdown-wrapper')) {
        setShowPlanOptionsDropdown(null);
      }
    };

    if (showPlanOptionsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPlanOptionsDropdown]);

  useEffect(() => {
    if (onPendingSharedEventsCountChange) {
      onPendingSharedEventsCountChange(pendingSharedEvents.length);
    }
  }, [pendingSharedEvents, onPendingSharedEventsCountChange]);

  const handleCreateEvent = async () => {
    await fetchMyPlans();
    setShowCreateDialog(false);
  };

  const handlePlanClick = (planId: string) => {
    const plan = activeTab === 'my_plans'
      ? myPlans.find(p => p.id === planId)
      : communityPlans.find(p => p.id === planId);

    navigate(`/plans/${planId}`, {
      state: {
        initialData: plan ? {
          id: plan.id,
          name: plan.name,
          event_type: plan.event_type,
          expected_duration: plan.expected_duration,
          private: plan.private,
          event_user_id: plan.event_user_id,
          created_at: plan.created_at,
          updated_at: plan.updated_at
        } : null
      }
    });
  };

  const handleEditClick = (e: React.MouseEvent, plan: EventWithStats) => {
    e.stopPropagation();
    setEventToEdit(plan);
    setShowEditDialog(true);
  };

  const handleSaveEditedEvent = async (_updatedEvent: Event) => {
    await fetchMyPlans();
    setShowEditDialog(false);
    setEventToEdit(null);
  };

  const handleCopyClick = async (e: React.MouseEvent, plan: EventWithStats) => {
    e.stopPropagation();

    try {
      const response = await fetch(`${API_URL}/api/events/${plan.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate event');
      }

      // Refresh plans
      await fetchMyPlans();
    } catch (err) {
      console.error('Error duplicating event:', err);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, plan: EventWithStats) => {
    e.stopPropagation();
    setEventToDelete(plan);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete || !user?.sub) return;

    try {
      const response = await fetch(`${API_URL}/api/events/${eventToDelete.id}?auth0_sub=${encodeURIComponent(user.sub)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete event');
      }

      // Close dialog
      setShowDeleteDialog(false);
      setEventToDelete(null);

      // Refresh plans
      await fetchMyPlans();
    } catch (err) {
      console.error('Error deleting event:', err);
      throw err; // Re-throw to be handled by dialog
    }
  };

  const calculateStats = (plan: EventWithStats) => {
    const instances = plan.foodInstances || [];

    const totalCalories = instances.reduce((total, instance) => {
      const calorieNutrient = instance.foodItem.foodItemNutrients.find(
        n => n.nutrient.nutrient_name.toLowerCase().includes('calorie')
      );
      if (calorieNutrient) {
        return total + (calorieNutrient.quantity * instance.servings);
      }
      return total;
    }, 0);

    const totalCarbs = instances.reduce((total, instance) => {
      const carbNutrient = instance.foodItem.foodItemNutrients.find(
        n => n.nutrient.nutrient_name.toLowerCase().includes('carb')
      );
      if (carbNutrient) {
        return total + (carbNutrient.quantity * instance.servings);
      }
      return total;
    }, 0);

    const totalSodium = instances.reduce((total, instance) => {
      const sodiumNutrient = instance.foodItem.foodItemNutrients.find(
        n => n.nutrient.nutrient_name.toLowerCase().includes('sodium')
      );
      if (sodiumNutrient) {
        return total + (sodiumNutrient.quantity * instance.servings);
      }
      return total;
    }, 0);

    const itemCount = instances.length;

    // Calculate per hour rates
    const durationHours = plan.expected_duration / 3600;
    const carbsPerHour = durationHours > 0 ? Math.round(totalCarbs / durationHours) : 0;
    const sodiumPerHour = durationHours > 0 ? Math.round(totalSodium / durationHours) : 0;

    return { totalCalories, totalCarbs, totalSodium, itemCount, carbsPerHour, sodiumPerHour };
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatEventType = (eventType: string) => {
    const typeMap: { [key: string]: string } = {
      'TRIATHLON': 'Triathlon',
      'RUN': 'Run',
      'BIKE': 'Bike',
      'OTHER': 'Other'
    };
    return typeMap[eventType] || 'Other';
  };

  const formatUpdatedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Edited Today';
    } else if (diffInDays === 1) {
      return 'Edited 1 day ago';
    } else if (diffInDays < 7) {
      return `Edited ${diffInDays} days ago`;
    } else if (diffInDays < 14) {
      return 'Edited 1 week ago';
    } else {
      return `Edited ${Math.floor(diffInDays / 7)} weeks ago`;
    }
  };

  const getEventTypeClass = (eventType: string) => {
    return eventType.toLowerCase();
  };

  const currentPlans = activeTab === 'my_plans' ? myPlans : communityPlans;

  if (loading) {
    return <LoadingSpinner message="Loading plans..." />;
  }

  if (!user || !user.sub) {
    return <div className="plans-loading">Please log in to view plans.</div>;
  }

  return (
    <div className="plans-container">
      {/* Create Button Section */}
      <div className="plans-header">
        <Button
          icon="pi pi-plus"
          label="Create New Plan"
          onClick={() => setShowCreateDialog(true)}
          className="create-button"
        />
      </div>

      {/* Tab Switcher */}
      <div className="plans-tabs">
        <div className="tabs-container">
          <button
            className={`tab-button ${activeTab === 'my_plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('my_plans')}
          >
            My Plans
          </button>
          <button
            className={`tab-button ${activeTab === 'community_plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('community_plans')}
          >
            Community Plans
          </button>
          <div className={`tab-indicator ${activeTab === 'community_plans' ? 'community' : 'my'}`} />
        </div>
      </div>

      {/* Pending Shared Plans Section */}
      {activeTab === 'my_plans' && pendingSharedEvents.length > 0 && (
        <div className="pending-shared-section">
          {/* Section Header */}
          <div className="pending-shared-header">
            <div className="pending-shared-header-left">
              <div className="pending-count-badge">
                <span>{pendingSharedEvents.length}</span>
              </div>
              <span className="pending-section-title">Shared with You</span>
            </div>
          </div>

          {/* Pending Plans List */}
          {pendingSharedEvents.map((sharedEvent, index) => {
            const stats = calculateSharedEventStats(sharedEvent);
            const duration = formatDuration(sharedEvent.event.expected_duration);
            const eventType = formatEventType(sharedEvent.event.event_type);
            const sharedTime = formatSharedTime(sharedEvent.created_at);
            const senderInitials = `${sharedEvent.sender.first_name.charAt(0)}${sharedEvent.sender.last_name.charAt(0)}`.toUpperCase();

            return (
              <div key={sharedEvent.id}>
                <div className="pending-plan-card">
                  <div className="pending-plan-top">
                    {/* Sender Avatar */}
                    <div className="pending-sender-avatar-wrapper">
                      <div className="pending-sender-avatar">
                        <span>{senderInitials}</span>
                      </div>
                      <div className="pending-share-badge">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="18" cy="5" r="3" />
                          <circle cx="6" cy="12" r="3" />
                          <circle cx="18" cy="19" r="3" />
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                      </div>
                    </div>

                    {/* Plan Info */}
                    <div className="pending-plan-info">
                      <h3 className="pending-plan-name">{sharedEvent.event.name}</h3>
                      <div className="pending-plan-meta">
                        <span className={`event-type-badge ${getEventTypeClass(sharedEvent.event.event_type)}`}>
                          {eventType}
                        </span>
                        <span className="pending-plan-duration">{duration}</span>
                      </div>
                      <p className="pending-plan-sender">
                        From <span className="pending-sender-name">{sharedEvent.sender.first_name} {sharedEvent.sender.last_name}</span> • {sharedTime}
                      </p>
                    </div>
                  </div>

                  {/* Plan Stats */}
                  <div className="pending-plan-stats">
                    <div className="pending-stat-item">
                      <span className="pending-stat-label">Carbs/hr:</span>
                      <span className="pending-stat-value">{stats.carbsPerHour}g</span>
                    </div>
                    <div className="pending-stat-item">
                      <span className="pending-stat-label">Items:</span>
                      <span className="pending-stat-value">{stats.itemCount}</span>
                    </div>
                    <div className="pending-stat-item">
                      <span className="pending-stat-label">Sodium/hr:</span>
                      <span className="pending-stat-value">{stats.sodiumPerHour}mg</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pending-plan-actions">
                    <button
                      onClick={() => handleDeclineSharedEvent(sharedEvent.id)}
                      className="pending-decline-button"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      Decline
                    </button>
                    <button
                      onClick={() => handleAcceptSharedEvent(sharedEvent.id)}
                      className="pending-accept-button"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Add to My Plans
                    </button>
                  </div>
                </div>
                {index < pendingSharedEvents.length - 1 && <div className="pending-plan-separator" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Count */}
      <div className="plans-count">
        {currentPlans.length} plan{currentPlans.length !== 1 ? 's' : ''}
      </div>

      {/* Plans List */}
      <div className="plans-list">
        {currentPlans.length === 0 ? (
          <div className="empty-state">
            {activeTab === 'my_plans'
              ? 'No plans found. Create your first plan above!'
              : 'No community plans available.'}
          </div>
        ) : (
          currentPlans.map((plan, index) => {
            const stats = calculateStats(plan);
            const duration = formatDuration(plan.expected_duration);
            const eventType = formatEventType(plan.event_type);
            const updatedDate = formatUpdatedDate(plan.updated_at);

            return (
              <div key={plan.id}>
                <div
                  className="plan-card"
                  onClick={() => handlePlanClick(plan.id)}
                >
                <div className="plan-card-header">
                  <div className="plan-title-section">
                    <h3 className="plan-title">{plan.name}</h3>
                  </div>
                  <div className="plan-actions">
                    {activeTab === 'my_plans' ? (
                      <div className="plan-options-dropdown-wrapper">
                        <button
                          className="icon-button plan-options-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPlanOptionsDropdown(showPlanOptionsDropdown === plan.id ? null : plan.id);
                          }}
                          title="More options"
                        >
                          <i className="pi pi-ellipsis-h"></i>
                        </button>
                        {showPlanOptionsDropdown === plan.id && (
                          <div className="plan-options-dropdown">
                            <button
                              className="plan-option-item"
                              onClick={(e) => {
                                handleEditClick(e, plan);
                                setShowPlanOptionsDropdown(null);
                              }}
                            >
                              <i className="pi pi-pencil"></i>
                              <span>Edit Plan</span>
                            </button>
                            <button
                              className="plan-option-item"
                              onClick={(e) => {
                                handleCopyClick(e, plan);
                                setShowPlanOptionsDropdown(null);
                              }}
                            >
                              <i className="pi pi-copy"></i>
                              <span>Copy Plan</span>
                            </button>
                            <button
                              className="plan-option-item delete-option"
                              onClick={(e) => {
                                handleDeleteClick(e, plan);
                                setShowPlanOptionsDropdown(null);
                              }}
                            >
                              <i className="pi pi-trash"></i>
                              <span>Delete Plan</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        className="icon-button download-button"
                        onClick={(e) => handleCopyClick(e, plan)}
                        title="Download plan"
                      >
                        <i className="pi pi-download"></i>
                      </button>
                    )}
                  </div>
                </div>

                <div className="plan-event-info">
                  <span className={`event-type-badge ${getEventTypeClass(plan.event_type)}`}>
                    {eventType}
                  </span>
                  {activeTab === 'community_plans' && plan.owner && (
                    <span className="owner-name">
                      <i className="pi pi-user"></i>
                      <span>{plan.owner.first_name} {plan.owner.last_name}</span>
                    </span>
                  )}
                  <span className="plan-updated">{updatedDate}</span>
                </div>

                <div className="plan-stats">
                  <div className="plan-stat">
                    <div className="stat-value">{duration}</div>
                    <div className="stat-label">Duration</div>
                  </div>
                  <div className="plan-stat-divider"></div>
                  <div className="plan-stat">
                    <div className="stat-value">{stats.carbsPerHour}g</div>
                    <div className="stat-label">Carbs/hr</div>
                  </div>
                  <div className="plan-stat-divider"></div>
                  <div className="plan-stat">
                    <div className="stat-value">{stats.itemCount}</div>
                    <div className="stat-label">Items</div>
                  </div>
                  <div className="plan-stat-divider"></div>
                  <div className="plan-stat">
                    <div className="stat-value">{stats.sodiumPerHour}mg</div>
                    <div className="stat-label">Sodium/hr</div>
                  </div>
                </div>
                </div>
                {index < currentPlans.length - 1 && <div className="plan-separator" />}
              </div>
            );
          })
        )}
      </div>

      {user?.sub && (
        <CreateEventDialog
          visible={showCreateDialog}
          onHide={() => setShowCreateDialog(false)}
          onCreate={handleCreateEvent}
          auth0Sub={user.sub}
        />
      )}

      <EditEventDialog
        visible={showEditDialog}
        event={eventToEdit}
        onHide={() => {
          setShowEditDialog(false);
          setEventToEdit(null);
        }}
        onSave={handleSaveEditedEvent}
      />

      {eventToDelete && (
        <DeleteEventDialog
          visible={showDeleteDialog}
          event={eventToDelete}
          onHide={() => {
            setShowDeleteDialog(false);
            setEventToDelete(null);
          }}
          onConfirmDelete={handleConfirmDelete}
        />
      )}
    </div>
  );
};

export default Plans;
