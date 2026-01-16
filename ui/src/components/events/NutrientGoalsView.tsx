import { useState } from 'react';
import './NutrientGoalsView.css';

interface Nutrient {
  name: string;
  goal: number | null;
  actual: number;
  unit: string;
}

interface HourData {
  hour: number;
  startTime: number;
  endTime: number;
  nutrients: Nutrient[];
}

interface NutrientGoalsViewProps {
  hours: HourData[];
}

interface NutrientStatus {
  color: string;
  textColor: string;
  backgroundColor: string;
  percentage: number;
}

const getStatusColor = (actual: number, goal: number | null): NutrientStatus => {
  if (!goal || goal === 0) {
    return {
      color: '#9ca3af',
      textColor: '#6b7280',
      backgroundColor: '#f9fafb',
      percentage: 0
    };
  }

  const percentage = (actual / goal) * 100;

  // Critical Low: 0-49%
  if (percentage < 50) {
    return {
      color: '#f43f5e',
      textColor: '#e11d48',
      backgroundColor: 'rgba(244, 63, 94, 0.08)',
      percentage: Math.round(percentage)
    };
  }

  // Below Goal: 50-89%
  if (percentage < 90) {
    return {
      color: '#f59e0b',
      textColor: '#d97706',
      backgroundColor: 'rgba(245, 158, 11, 0.08)',
      percentage: Math.round(percentage)
    };
  }

  // On Target: 90-120%
  if (percentage <= 120) {
    return {
      color: '#22c55e',
      textColor: '#16a34a',
      backgroundColor: 'rgba(34, 197, 94, 0.08)',
      percentage: Math.round(percentage)
    };
  }

  // Above Goal: 121-150%
  if (percentage <= 150) {
    return {
      color: '#6366f1',
      textColor: '#4f46e5',
      backgroundColor: 'rgba(99, 102, 241, 0.08)',
      percentage: Math.round(percentage)
    };
  }

  // Way Over: 150%+
  return {
    color: '#a855f7',
    textColor: '#9333ea',
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    percentage: Math.round(percentage)
  };
};

const formatTimeRange = (startTime: number, endTime: number): string => {
  const startHours = Math.floor(startTime / 3600);
  const startMins = Math.floor((startTime % 3600) / 60);
  const endHours = Math.floor(endTime / 3600);
  const endMins = Math.floor((endTime % 3600) / 60);
  return `${startHours}:${startMins.toString().padStart(2, '0')} – ${endHours}:${endMins.toString().padStart(2, '0')}`;
};

export const NutrientGoalsView = ({ hours }: NutrientGoalsViewProps) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      {/* Help Button - positioned absolutely in the parent */}
      <button
        className="nutrient-goals-help-btn"
        onClick={() => setShowHelp(true)}
        title="Explain colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      {/* Hour Sections */}
      <div className="nutrient-goals-hours-container">
        {hours.map((hourData, index) => {
          const isEven = index % 2 === 1;
          return (
            <div
              key={hourData.hour}
              className={`nutrient-goals-hour-section ${isEven ? 'even' : 'odd'}`}
            >
              {/* Hour Header */}
              <div className="nutrient-goals-hour-header">
                <div className="nutrient-goals-hour-info">
                  <span className="nutrient-goals-hour-title">Hour {hourData.hour}</span>
                  <span className="nutrient-goals-hour-time">
                    {formatTimeRange(hourData.startTime, hourData.endTime)}
                  </span>
                </div>
              </div>

              {/* Column Headers */}
              <div className="nutrient-goals-column-headers">
                <span className="header-nutrient"></span>
                <span className="header-goal">Goal</span>
                <span className="header-actual">Actual</span>
              </div>

              {/* Nutrients */}
              <div className="nutrient-goals-nutrients-list">
                {hourData.nutrients.map((nutrient, nIndex) => {
                  const status = getStatusColor(nutrient.actual, nutrient.goal);
                  const hasGoal = nutrient.goal !== null && nutrient.goal > 0;

                  return (
                    <div
                      key={nIndex}
                      className="nutrient-goals-row"
                      style={{ backgroundColor: status.backgroundColor }}
                    >
                      <div className="nutrient-goals-row-top">
                        <div className="nutrient-goals-row-info">
                          <div
                            className="nutrient-goals-dot"
                            style={{ background: status.color }}
                          />
                          <span className="nutrient-goals-name">{nutrient.name}</span>
                        </div>
                        <span className="nutrient-goals-goal">
                          {hasGoal ? `${nutrient.goal}${nutrient.unit}` : '—'}
                        </span>
                        <span
                          className="nutrient-goals-actual"
                          style={{ color: hasGoal ? status.textColor : '#6b7280' }}
                        >
                          {Math.round(nutrient.actual)}{nutrient.unit}
                        </span>
                      </div>

                      {/* Progress Bar (only show if there's a goal) */}
                      {hasGoal && (
                        <div className="nutrient-goals-progress-container">
                          <div className="nutrient-goals-progress-bar">
                            <div
                              className="nutrient-goals-progress-fill"
                              style={{
                                width: `${Math.min(status.percentage, 100)}%`,
                                background: status.color
                              }}
                            />
                          </div>
                          <span
                            className="nutrient-goals-percentage"
                            style={{ color: status.textColor }}
                          >
                            {status.percentage}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Dialog */}
      {showHelp && (
        <div
          className="nutrient-goals-help-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowHelp(false);
            }
          }}
        >
          <div className="nutrient-goals-help-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="nutrient-goals-help-handle" />

            {/* Help Header */}
            <div className="nutrient-goals-help-header">
              <div>
                <p className="nutrient-goals-help-label">Understanding</p>
                <h2 className="nutrient-goals-help-title">Status Colors</h2>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="nutrient-goals-help-close"
              >
                ✕
              </button>
            </div>

            {/* Help Content */}
            <div className="nutrient-goals-help-content">
              <p className="nutrient-goals-help-intro">
                Each nutrient is color-coded based on how close you are to your hourly goal:
              </p>

              {/* Critical - Rose */}
              <div className="nutrient-goals-help-item">
                <div className="nutrient-goals-help-dot" style={{ background: '#f43f5e' }} />
                <div className="nutrient-goals-help-item-content">
                  <div className="nutrient-goals-help-item-top">
                    <span className="nutrient-goals-help-status">Critical Low</span>
                    <span className="nutrient-goals-help-range" style={{ color: '#e11d48', background: 'rgba(244, 63, 94, 0.1)' }}>
                      0 – 49%
                    </span>
                  </div>
                  <p className="nutrient-goals-help-description">
                    Significantly under goal. Add more to avoid bonking.
                  </p>
                </div>
              </div>

              {/* Below Goal - Amber */}
              <div className="nutrient-goals-help-item">
                <div className="nutrient-goals-help-dot" style={{ background: '#f59e0b' }} />
                <div className="nutrient-goals-help-item-content">
                  <div className="nutrient-goals-help-item-top">
                    <span className="nutrient-goals-help-status">Below Goal</span>
                    <span className="nutrient-goals-help-range" style={{ color: '#d97706', background: 'rgba(245, 158, 11, 0.1)' }}>
                      50 – 89%
                    </span>
                  </div>
                  <p className="nutrient-goals-help-description">
                    Close but not there. A small addition would help.
                  </p>
                </div>
              </div>

              {/* On Target - Green */}
              <div className="nutrient-goals-help-item">
                <div className="nutrient-goals-help-dot" style={{ background: '#22c55e' }} />
                <div className="nutrient-goals-help-item-content">
                  <div className="nutrient-goals-help-item-top">
                    <span className="nutrient-goals-help-status">On Target</span>
                    <span className="nutrient-goals-help-range" style={{ color: '#16a34a', background: 'rgba(34, 197, 94, 0.1)' }}>
                      90 – 120%
                    </span>
                  </div>
                  <p className="nutrient-goals-help-description">
                    Perfect! Ideal range for peak performance.
                  </p>
                </div>
              </div>

              {/* Above Goal - Indigo */}
              <div className="nutrient-goals-help-item">
                <div className="nutrient-goals-help-dot" style={{ background: '#6366f1' }} />
                <div className="nutrient-goals-help-item-content">
                  <div className="nutrient-goals-help-item-top">
                    <span className="nutrient-goals-help-status">Above Goal</span>
                    <span className="nutrient-goals-help-range" style={{ color: '#4f46e5', background: 'rgba(99, 102, 241, 0.1)' }}>
                      121 – 150%
                    </span>
                  </div>
                  <p className="nutrient-goals-help-description">
                    Extra nutrients. Usually fine, watch for GI issues.
                  </p>
                </div>
              </div>

              {/* Way Over - Purple */}
              <div className="nutrient-goals-help-item">
                <div className="nutrient-goals-help-dot" style={{ background: '#a855f7' }} />
                <div className="nutrient-goals-help-item-content">
                  <div className="nutrient-goals-help-item-top">
                    <span className="nutrient-goals-help-status">Way Over</span>
                    <span className="nutrient-goals-help-range" style={{ color: '#9333ea', background: 'rgba(168, 85, 247, 0.1)' }}>
                      150%+
                    </span>
                  </div>
                  <p className="nutrient-goals-help-description">
                    Consider spreading intake across hours.
                  </p>
                </div>
              </div>

              {/* No Goal - Gray */}
              <div className="nutrient-goals-help-item">
                <div className="nutrient-goals-help-dot" style={{ background: '#9ca3af' }} />
                <div className="nutrient-goals-help-item-content">
                  <div className="nutrient-goals-help-item-top">
                    <span className="nutrient-goals-help-status">No Goal Set</span>
                    <span className="nutrient-goals-help-range" style={{ color: '#6b7280', background: '#f3f4f6' }}>
                      —
                    </span>
                  </div>
                  <p className="nutrient-goals-help-description">
                    Tap to add a goal if you want to track it.
                  </p>
                </div>
              </div>
            </div>

            {/* Help Footer */}
            <div className="nutrient-goals-help-footer">
              <button
                onClick={() => setShowHelp(false)}
                className="nutrient-goals-help-ok-btn"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
