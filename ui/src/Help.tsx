import { useState } from 'react';
import './Help.css';

const Help = () => {
  const [openAccordion, setOpenAccordion] = useState<string>('getting-started');

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? '' : id);
  };

  return (
    <div className="help-container">
      {/* Header */}
      <header className="help-header">
        <div className="help-header-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
        </div>
        <div>
          <h1 className="help-title">Help & Guide</h1>
          <p className="help-subtitle">Learn how to fuel your race</p>
        </div>
      </header>

      {/* Quick Start Section - Commented out as requested */}
      {/* <div className="help-section">
        <div className="quick-start-card">
          <div className="quick-start-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
          <div className="quick-start-content">
            <h3 className="quick-start-title">Quick Start Video</h3>
            <p className="quick-start-description">Watch a 2-minute overview of RaceFuel</p>
            <button className="quick-start-button">
              Watch Now →
            </button>
          </div>
        </div>
      </div> */}

      {/* Divider */}
      <div className="help-divider"></div>

      {/* Getting Started Accordion */}
      <div className="help-section">
        <button
          onClick={() => toggleAccordion('getting-started')}
          className="accordion-button"
        >
          <div className="accordion-header-content">
            <div className="accordion-icon-wrapper" style={{ background: '#22c55e20' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div>
              <h3 className="accordion-title">Getting Started</h3>
              <p className="accordion-subtitle">Create your first fuel plan</p>
            </div>
          </div>
          <svg className={`chevron-icon ${openAccordion === 'getting-started' ? 'open' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        <div className={`accordion-content ${openAccordion === 'getting-started' ? 'open' : ''}`}>
          {/* Step 1 */}
          <div className="step-item">
            <div className="step-dot">1</div>
            <div className="step-content">
              <h4 className="step-title">Create a new plan</h4>
              <p className="step-description">Tap the purple "Create New Plan" button on the My Plans screen.</p>
              <div className="step-example">
                <div className="example-button">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                  <span>Create New Plan</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="step-item">
            <div className="step-dot">2</div>
            <div className="step-content">
              <h4 className="step-title">Set your event details</h4>
              <p className="step-description">Enter the event name, discipline (Bike, Run, Triathlon, etc.), and expected duration.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="step-item">
            <div className="step-dot">3</div>
            <div className="step-content">
              <h4 className="step-title">Add food items to timeline</h4>
              <p className="step-description">Use the "Add Item" button to schedule nutrition throughout your event.</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="step-item">
            <div className="step-dot complete">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div className="step-content">
              <h4 className="step-title">Review your plan</h4>
              <p className="step-description">Check your carbs/hr and sodium/hr to ensure you're meeting your goals.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="help-separator"></div>

      {/* Understanding the Timeline */}
      <div className="help-section">
        <button
          onClick={() => toggleAccordion('timeline')}
          className="accordion-button"
        >
          <div className="accordion-header-content">
            <div className="accordion-icon-wrapper" style={{ background: '#f9731620' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <h3 className="accordion-title">Understanding the Timeline</h3>
              <p className="accordion-subtitle">Schedule nutrition by time</p>
            </div>
          </div>
          <svg className={`chevron-icon ${openAccordion === 'timeline' ? 'open' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        <div className={`accordion-content ${openAccordion === 'timeline' ? 'open' : ''}`}>
          <p className="content-description">The timeline shows when you'll consume each item during your event. Items are color-coded by category:</p>

          {/* Category Legend */}
          <div className="category-grid">
            <div className="category-item">
              <div className="category-dot" style={{ background: '#f97316' }}></div>
              <span>Sports drink</span>
            </div>
            <div className="category-item">
              <div className="category-dot" style={{ background: '#14b8a6' }}></div>
              <span>Energy gel</span>
            </div>
            <div className="category-item">
              <div className="category-dot" style={{ background: '#d946ef' }}></div>
              <span>Fruit</span>
            </div>
            <div className="category-item">
              <div className="category-dot" style={{ background: '#f59e0b' }}></div>
              <span>Energy bar</span>
            </div>
            <div className="category-item">
              <div className="category-dot" style={{ background: '#6366f1' }}></div>
              <span>Chews</span>
            </div>
            <div className="category-item">
              <div className="category-dot" style={{ background: '#6b7280' }}></div>
              <span>Other</span>
            </div>
          </div>

          {/* Example timeline item */}
          <div className="example-timeline-item">
            <p className="example-label">Example Item</p>
            <div className="timeline-badge">
              <span className="badge-name">Carbs50</span>
              <span className="badge-time">1:36</span>
            </div>
            <p className="example-description">↑ This gel is scheduled at 1 hour 36 minutes into your event</p>
          </div>

          {/* Tip */}
          <div className="tip-callout">
            <div className="tip-content">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
                <path d="M9 21h6"/><path d="M9 18h6"/>
              </svg>
              <p><strong>Tip:</strong> Drag items to adjust timing, or tap to edit details.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="help-separator"></div>

      {/* Nutrient Goals */}
      <div className="help-section">
        <button
          onClick={() => toggleAccordion('nutrients')}
          className="accordion-button"
        >
          <div className="accordion-header-content">
            <div className="accordion-icon-wrapper" style={{ background: '#14b8a620' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <div>
              <h3 className="accordion-title">Nutrient Goals</h3>
              <p className="accordion-subtitle">Track carbs, sodium & more</p>
            </div>
          </div>
          <svg className={`chevron-icon ${openAccordion === 'nutrients' ? 'open' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        <div className={`accordion-content ${openAccordion === 'nutrients' ? 'open' : ''}`}>
          <p className="content-description">Set hourly goals for key nutrients and track your progress with color-coded indicators:</p>

          {/* Status Colors */}
          <div className="status-colors">
            <div className="status-item" style={{ background: 'rgba(239, 68, 68, 0.06)' }}>
              <div className="status-dot" style={{ background: '#ef4444' }}></div>
              <span className="status-label">Critical Low</span>
              <span className="status-range" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}>0-49%</span>
            </div>
            <div className="status-item" style={{ background: 'rgba(249, 115, 22, 0.06)' }}>
              <div className="status-dot" style={{ background: '#f97316' }}></div>
              <span className="status-label">Below Goal</span>
              <span className="status-range" style={{ color: '#f97316', background: 'rgba(249, 115, 22, 0.1)' }}>50-89%</span>
            </div>
            <div className="status-item" style={{ background: 'rgba(34, 197, 94, 0.06)' }}>
              <div className="status-dot" style={{ background: '#22c55e' }}></div>
              <span className="status-label">On Target</span>
              <span className="status-range" style={{ color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)' }}>90-120%</span>
            </div>
            <div className="status-item" style={{ background: 'rgba(99, 102, 241, 0.06)' }}>
              <div className="status-dot" style={{ background: '#6366f1' }}></div>
              <span className="status-label">Above Goal</span>
              <span className="status-range" style={{ color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)' }}>121-150%</span>
            </div>
            <div className="status-item" style={{ background: 'rgba(168, 85, 247, 0.06)' }}>
              <div className="status-dot" style={{ background: '#a855f7' }}></div>
              <span className="status-label">Way Over</span>
              <span className="status-range" style={{ color: '#a855f7', background: 'rgba(168, 85, 247, 0.1)' }}>150%+</span>
            </div>
          </div>

          {/* Example progress bar */}
          <div className="progress-example">
            <div className="progress-header">
              <span className="progress-name">Carbs</span>
              <div className="progress-values">
                <span className="progress-goal">61g goal</span>
                <span className="progress-current">58g</span>
              </div>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: '95%' }}></div>
              </div>
              <span className="progress-percentage">95%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="help-separator"></div>

      {/* Managing Food Items */}
      <div className="help-section">
        <button
          onClick={() => toggleAccordion('food-items')}
          className="accordion-button"
        >
          <div className="accordion-header-content">
            <div className="accordion-icon-wrapper" style={{ background: '#d946ef20' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#d946ef">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>
            <div>
              <h3 className="accordion-title">Managing Food Items</h3>
              <p className="accordion-subtitle">Add, edit & favorite items</p>
            </div>
          </div>
          <svg className={`chevron-icon ${openAccordion === 'food-items' ? 'open' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        <div className={`accordion-content ${openAccordion === 'food-items' ? 'open' : ''}`}>
          <div className="food-items-content">
            <div className="content-block">
              <h4 className="content-block-title">Creating custom items</h4>
              <p className="content-block-text">Tap "Create New Item" to add your own nutrition products. Enter the name, category, cost, and nutrient values (carbs, sodium, caffeine, etc.).</p>
            </div>

            <div className="content-block">
              <h4 className="content-block-title">Using favorites</h4>
              <p className="content-block-text">Tap the star icon to favorite items you use frequently. Access them quickly from the Favorites tab.</p>
              <div className="favorite-example">
                <div className="favorite-indicator"></div>
                <div className="favorite-info">
                  <span className="favorite-name">Carbs50</span>
                  <div className="favorite-details">
                    <span className="favorite-category">Gel</span>
                    <span className="favorite-carbs">50g carbs</span>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
            </div>

            <div className="content-block">
              <h4 className="content-block-title">Item tabs</h4>
              <div className="tabs-example">
                <span className="tab-example active">My Items</span>
                <span className="tab-example">All Items</span>
                <span className="tab-example">Favorites</span>
              </div>
              <p className="content-block-text">Switch between your custom items, the full database, or your starred favorites.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="help-separator"></div>

      {/* Sharing & Community */}
      <div className="help-section">
        <button
          onClick={() => toggleAccordion('sharing')}
          className="accordion-button"
        >
          <div className="accordion-header-content">
            <div className="accordion-icon-wrapper" style={{ background: '#6366f120' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </div>
            <div>
              <h3 className="accordion-title">Sharing & Community</h3>
              <p className="accordion-subtitle">Share plans with others</p>
            </div>
          </div>
          <svg className={`chevron-icon ${openAccordion === 'sharing' ? 'open' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        <div className={`accordion-content ${openAccordion === 'sharing' ? 'open' : ''}`}>
          <div className="sharing-content">
            <div className="content-block">
              <h4 className="content-block-title">Share your plans</h4>
              <p className="content-block-text">Tap the share icon on any plan to publish it to the community or send directly to friends.</p>
              <div className="shared-badge-container">
                <span className="shared-badge">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  Shared
                </span>
                <span className="badge-helper-text">This badge appears on shared plans</span>
              </div>
            </div>

            <div className="content-block">
              <h4 className="content-block-title">Browse community plans</h4>
              <p className="content-block-text">Switch to the "Community Plans" tab to discover nutrition strategies from other athletes. Download plans to customize for your own events.</p>
              <div className="tabs-example">
                <span className="tab-example">My Plans</span>
                <span className="tab-example active">Community Plans</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="help-divider"></div>

      {/* FAQ Section */}
      <div className="help-section faq-section">
        <h3 className="faq-heading">Frequently Asked Questions</h3>

        <div className="faq-items">
          <div className="faq-item">
            <h4 className="faq-question">How many carbs per hour should I target?</h4>
            <p className="faq-answer">Most athletes aim for 60-90g of carbs per hour for endurance events. Higher intensities and trained athletes may tolerate up to 120g/hr. Start conservative and test in training.</p>
          </div>

          <div className="faq-item">
            <h4 className="faq-question">What about sodium intake?</h4>
            <p className="faq-answer">300-600mg of sodium per hour is typical, but sweat rates vary. Hot conditions and heavy sweaters may need 800-1000mg/hr. Pay attention to cramping as a sign you may need more.</p>
          </div>

          <div className="faq-item">
            <h4 className="faq-question">Can I use RaceFuel offline?</h4>
            <p className="faq-answer">Yes! Your plans are saved locally. You can view and follow your plan during events without an internet connection.</p>
          </div>
        </div>
      </div>

      <div className="help-divider"></div>

      {/* Contact Support */}
      <div className="help-section contact-section">
        <div className="contact-card">
          <div className="contact-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h4 className="contact-title">Still have questions?</h4>
          <p className="contact-description">We're here to help you fuel your best race.</p>
          <button className="contact-button">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default Help;
