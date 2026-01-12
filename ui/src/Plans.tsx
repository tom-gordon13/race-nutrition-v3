import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { CreateEventDialog, EditEventDialog } from './components/events';
import { API_URL } from './config/api';
import './Plans.css';
import LoadingSpinner from './LoadingSpinner';

interface Event {
  id: string;
  event_user_id: string;
  expected_duration: number;
  name: string;
  event_type: string;
  created_at: string;
  updated_at: string;
  private: boolean;
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

type TabType = 'my_plans' | 'community_plans';

const Plans = () => {
  const { user } = useAuth0();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('my_plans');
  const [myPlans, setMyPlans] = useState<EventWithStats[]>([]);
  const [communityPlans, setCommunityPlans] = useState<EventWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);

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

  useEffect(() => {
    fetchMyPlans();
    fetchCommunityPlans();
  }, [user]);

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
                      <>
                        <button
                          className="icon-button edit-button"
                          onClick={(e) => handleEditClick(e, plan)}
                          title="Edit plan"
                        >
                          <i className="pi pi-pencil"></i>
                        </button>
                        <button
                          className="icon-button copy-button"
                          onClick={(e) => handleCopyClick(e, plan)}
                          title="Copy plan"
                        >
                          <i className="pi pi-copy"></i>
                        </button>
                      </>
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
    </div>
  );
};

export default Plans;
