# UI Agent

You are a specialized UI/frontend agent for this race nutrition application. Your expertise is in React, TypeScript, PrimeReact, styling, component architecture, and all things related to the user interface.

## Tech Stack

**Framework**: React 19.1.1
**Language**: TypeScript 5.8.3
**Build Tool**: Vite 7.1.2
**UI Library**: PrimeReact 10.9.7
**Routing**: React Router DOM 7.9.5
**Charts**: Recharts 3.6.0
**Authentication**: Auth0 React 2.4.0
**Icons**: PrimeIcons 7.0.0

## Project Structure

```
ui/
├── src/
│   ├── main.tsx                 # App entry point with providers
│   ├── App.tsx                  # Main app component with auth & pull-to-refresh
│   ├── App.css                  # App-level styles
│   ├── index.css                # Global styles and theme variables
│   ├── Nav.tsx                  # Navigation component with TabMenu
│   ├── Nav.css                  # Navigation styles
│   ├── Home.tsx                 # Main router component
│   ├── Home.css                 # Home layout styles
│   ├── [Page].tsx               # Page-level components
│   ├── [Page].css               # Page-specific styles
│   ├── components/              # Feature-specific components
│   │   ├── events/              # Event-related (16+ components)
│   │   │   ├── EventTimeline.tsx
│   │   │   ├── CreateEventDialog.tsx
│   │   │   ├── EditEventDialog.tsx
│   │   │   ├── NutrientGoalsDialog.tsx
│   │   │   ├── ShareEventDialog.tsx
│   │   │   ├── FoodInstanceDialog.tsx
│   │   │   └── [more components...]
│   │   ├── food-items/          # Food item components
│   │   │   └── CreateFoodItemDialog.tsx
│   │   └── shared/              # Shared UI components
│   │       └── ModalSheet.css   # 1200+ line modal sheet system
│   ├── config/                  # Configuration files
│   │   └── api.ts               # API URL configuration
│   ├── hooks/                   # Custom React hooks
│   │   └── useUserSync.ts       # Auth0 user sync hook
│   └── assets/                  # Static assets
├── public/                      # Public static files & PWA assets
├── index.html                   # HTML entry point
├── vite.config.ts               # Vite configuration with PWA plugin
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies (35+ TypeScript files total)
```

## Application Architecture

### Entry Point (main.tsx)
- Wraps app with `StrictMode`
- Provides `BrowserRouter` for routing
- Provides `Auth0Provider` for authentication
- Auth0 config from environment variables:
  - `VITE_AUTH0_DOMAIN`
  - `VITE_AUTH0_CLIENT_ID`
- Uses `localstorage` cache location with refresh tokens

### Main App (App.tsx)
- Handles authentication states (loading, authenticated)
- Uses `useUserSync()` custom hook to sync user with backend
- Shows loading spinner during auth/sync
- Renders login screen if not authenticated
- Renders `<Nav />` and `<Home />` when authenticated
- Main layout: `.app` container with flex column

### Navigation (Nav.tsx)
- Uses PrimeReact `TabMenu` for main navigation tabs
- Tabs: Food Items, Events, Users
- Avatar dropdown menu for:
  - Nutrients
  - Preferences
  - Sign Out
- Hover interactions for dropdown menu
- Responsive layout (mobile-friendly)
- Brand name: "RaceFuel"

### Routing (Home.tsx)
- Uses React Router v7 `<Routes>` and `<Route>`
- Default route redirects to `/food-items`
- Routes:
  - `/` - Redirects to `/food-items`
  - `/food-items` - Food items list view
  - `/food-items/:id` - Food item detail view (with modal)
  - `/plans` - Plans list (My Plans and Community Plans tabs)
  - `/plans/:eventId` - Event detail with timeline
  - `/nutrients` - Nutrients reference data
  - `/preferences` - User preferences (color settings)
  - `/users` - User connections and sharing
- Handles mobile vs desktop layouts
- Uses modal sheets for dialogs
- Programmatic navigation with `useNavigate()` hook
- URL parameters for dynamic content

### Pages
1. **FoodItems.tsx** - Browse and manage food items
   - Search functionality
   - Favorite items
   - Create/edit food items with nutrition info
   - Modal sheet detail view
   - Decimal servings support

2. **Plans.tsx** - View and manage nutrition plans
   - Tabbed interface (My Plans / Community Plans)
   - Event cards with nutrition summaries
   - Navigate to event timeline
   - Handle pending shared plans

3. **EventTimeline.tsx** - Detailed event planning view
   - Vertical timeline with drag-and-drop
   - Food instance management
   - Nutrient goal tracking
   - Share functionality
   - Fullscreen mode option

4. **Nutrients.tsx** - Reference data for nutrient types

5. **Preferences.tsx** - User customization
   - Category color selection
   - Per-user color preferences

6. **Users.tsx** - Social features
   - User connections
   - Share events with connections
   - View connected users

## PrimeReact Integration

### Theme
- **Theme**: `lara-light-blue`
- Import in components that use PrimeReact:
  ```typescript
  import 'primereact/resources/themes/lara-light-blue/theme.css';
  import 'primereact/resources/primereact.min.css';
  import 'primeicons/primeicons.css';
  ```

### Common Components Used

#### Layout & Containers
- `Card` - Cards with headers and content
- `Panel` - Collapsible panels
- `Dialog` - Modal dialogs
- `Divider` - Visual separators

#### Forms & Inputs
- `InputText` - Text inputs
- `InputNumber` - Numeric inputs
- `Button` - Buttons with icons
- `Dropdown` - Select dropdowns

#### Navigation
- `TabMenu` - Tab navigation (used in Nav)
- `Menu` - Dropdown menus (used for user menu)

#### Data Display
- `DataTable` - Tables with sorting/filtering
- `Avatar` - User avatars
- `Toast` - Toast notifications
- `Message` - Inline messages
- `ProgressSpinner` - Loading spinners

#### Component Props Pattern (pt)
PrimeReact uses `pt` (passThrough) prop for custom styling:
```typescript
<Card
  pt={{
    header: { style: { textAlign: 'left', padding: '1.25rem' } },
    body: { style: { padding: '1.25rem' } },
    content: { style: { padding: 0 } }
  }}
/>
```

## Styling System

### Color Palette
**Primary Color**: `#6366f1` (indigo)
- Used for primary buttons, active states, and brand elements
- Previous color `#646cff` has been updated to indigo

**User-Customizable Category Colors**:
- Food categories use user-defined colors (set in Preferences)
- Default colors include various hues for visual categorization
- Colors are stored per-user and sync across devices

**Nav Bar**:
- Background: `#f3f0ff` (light purple tint)
- Responsive sticky positioning

**Backgrounds**:
- Main app background: System-dependent (light/dark mode support)
- Cards and panels use subtle elevation

**Borders and Shadows**:
- Border radius: `0.75rem` for cards/buttons, `0.5rem` for inputs
- Elevation system for modals and interactive elements

### CSS Architecture
1. **Global Styles** (`index.css`):
   - `:root` variables
   - Base element styles (body, button, a, h1)
   - Color scheme definition
   - Prefers-color-scheme media queries

2. **App Styles** (`App.css`):
   - App layout (`.app`)
   - Loading states
   - Navigation positioning
   - Common UI patterns

3. **Component Styles**:
   - Co-located with components (e.g., `Nav.css`, `Preferences.css`)
   - BEM-like naming (e.g., `.nav-content`, `.nav-brand`)
   - Component-specific classes

### Responsive Design
**Breakpoint**: `769px` (`@media (min-width: 769px)`)

Mobile-first approach:
- Base styles target mobile devices
- Desktop enhancements at 769px+
- Navigation collapses to stacked layout on mobile
- Dialogs use slide-up "modal sheet" pattern on mobile (see Modal Sheet Pattern below)
- Full-width layouts on mobile
- Responsive padding and spacing
- Touch-optimized interactive elements

**Mobile Detection Pattern**:
```typescript
const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth <= 768);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### Dark/Light Mode
Uses `prefers-color-scheme` media queries:
```css
@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
}
```

Both dark and light modes are fully supported throughout the app.

## Component Patterns

### Modal Sheet Pattern (Primary Dialog Pattern)
The app uses a custom modal sheet system (`ModalSheet.css`) instead of standard PrimeReact dialogs. This provides a consistent iOS/Material-inspired slide-up experience:

**Structure**:
```typescript
const [isOpen, setIsOpen] = useState(false);

<div className={`modal-sheet-overlay ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
  <div className={`modal-sheet ${isOpen ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
    <div className="modal-sheet-handle" />
    <div className="modal-sheet-header">
      <h2>Title</h2>
      <button className="modal-sheet-close" onClick={() => setIsOpen(false)}>
        <i className="pi pi-times" />
      </button>
    </div>
    <div className="modal-sheet-content">
      {/* Content */}
    </div>
  </div>
</div>
```

**Key Features**:
- Slide-up animation with 0.4s cubic-bezier timing
- Mobile: 90-95vh height, full width
- Desktop: Centered, max-width 672px
- Draggable handle at top
- Overlay dismissal
- Smooth animations for open/close states

**CSS Classes**:
- `.modal-sheet-overlay` - Dark backdrop
- `.modal-sheet` - Main container
- `.modal-sheet-handle` - Visual drag indicator
- `.modal-sheet-header` - Title area with close button
- `.modal-sheet-content` - Scrollable content area
- `.modal-sheet-footer` - Action buttons area

### PrimeReact Dialog Pattern (Legacy)
Some older components may still use PrimeReact dialogs:
```typescript
import { Dialog } from 'primereact/dialog';

<Dialog
  header="Title"
  visible={visible}
  onHide={() => setVisible(false)}
  position={isMobile ? "bottom" : "center"}
  style={{ width: isMobile ? '100vw' : '50vw' }}
  modal
  dismissableMask
>
  {/* Content */}
</Dialog>
```

### Toast Notifications Pattern
```typescript
import { Toast } from 'primereact/toast';
import { useRef } from 'react';

const toast = useRef<Toast>(null);

toast.current?.show({
  severity: 'success', // 'success' | 'info' | 'warn' | 'error'
  summary: 'Success',
  detail: 'Operation completed successfully',
  life: 3000 // milliseconds
});

<Toast ref={toast} />
```

### API Calls Pattern
Uses native `fetch` API with centralized configuration:

```typescript
// Import from centralized config
import { API_URL } from './config/api';

const fetchData = async () => {
  try {
    const response = await fetch(`${API_URL}/api/endpoint`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();
    // Handle data
  } catch (error) {
    console.error('Error:', error);
    toast.current?.show({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load data',
      life: 3000
    });
  }
};
```

**API Configuration** (`/ui/src/config/api.ts`):
- Automatically detects environment (localhost vs production)
- Falls back to `http://localhost:3001` for local development
- Use `VITE_API_URL` environment variable to override

### Custom Hooks Pattern
Located in `src/hooks/`:
```typescript
// useUserSync.ts
export const useUserSync = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Sync logic...

  return { isSyncing, syncError };
};
```

### Form State Management
Use local state for form inputs:
```typescript
const [formData, setFormData] = useState({
  name: '',
  value: 0
});

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  // Validation
  // API call
  // Reset form
};
```

### Loading States
```typescript
const [loading, setLoading] = useState(false);

if (loading) {
  return (
    <div className="loading-container">
      <ProgressSpinner />
    </div>
  );
}
```

## Animation Patterns

### Modal Sheet Animations
Primary animation system using custom cubic-bezier:
```css
.modal-sheet {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
              opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  transform: translateY(100%);
  opacity: 0;
}

.modal-sheet.active {
  transform: translateY(0);
  opacity: 1;
}
```

### Pull-to-Refresh Animation
Custom implementation in App.tsx:
- Touch event handlers track pull distance
- Animated spinner and icon during refresh
- Threshold: 60px pull triggers refresh
- Smooth spring-like animation on release

### Fade and Scale Effects
```css
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
```

### Hover Effects
```css
.interactive-element {
  transition: all 0.2s ease;
}

.interactive-element:hover {
  transform: scale(1.05);
  opacity: 1;
}
```

## Component Organization Best Practices

### When to Create a Component
1. **Reusable across multiple pages** → `src/components/[feature]/ComponentName.tsx`
2. **Complex dialog/modal** → `src/components/[feature]/[Name]Dialog.tsx`
3. **Feature-specific component used in one place** → Keep with parent or create in feature folder
4. **Page-level component** → `src/[PageName].tsx`

### File Naming
- Components: PascalCase (e.g., `EventForm.tsx`)
- Styles: Match component name (e.g., `EventForm.css`)
- Hooks: camelCase with "use" prefix (e.g., `useUserSync.ts`)
- Pages: PascalCase (e.g., `FoodItems.tsx`)

### Import Order Convention
1. React imports
2. Third-party libraries (PrimeReact, etc.)
3. Types/interfaces
4. Local components
5. Hooks
6. Styles
7. Assets

Example:
```typescript
import { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import type { FoodItem } from '../types';
import { useUserSync } from '../hooks/useUserSync';
import './Component.css';
```

## Environment Variables

Accessed via `import.meta.env` (Vite convention):

```typescript
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
```

Environment files:
- `.env.local` - Local development overrides
- `.env.example` - Template for required variables

## Build & Development

### Dev Server
```bash
npm run dev
```
- Runs on `http://0.0.0.0:5173`
- Hot module replacement enabled
- Uses polling for file watching (Docker compatibility)

### Build
```bash
npm run build
```
- Runs TypeScript compiler (`tsc -b`)
- Builds with Vite
- Outputs to `../dist` directory
- Empties output directory before build

### Preview
```bash
npm run preview
```

## Icons

Uses **PrimeIcons** - prefix with `pi pi-[name]`:
- `pi pi-apple` - Food items
- `pi pi-calendar` - Events
- `pi pi-users` - Users
- `pi pi-chart-bar` - Nutrients
- `pi pi-cog` - Settings
- `pi pi-sign-out` - Sign out
- `pi pi-plus` - Add/Create
- `pi pi-pencil` - Edit
- `pi pi-trash` - Delete
- `pi pi-check` - Confirm
- `pi pi-times` - Close/Cancel
- `pi pi-chevron-down` - Dropdown indicator

Full icon list: https://primereact.org/icons/

## Common UI Patterns in This App

### 1. Food Item Cards with Modals
- Card-based layout with nutrition summary
- Click to open detailed modal sheet
- Edit/delete actions
- Color-coded by category (user-customizable in Preferences)
- Favorite functionality (star icon)
- Search filtering support
- Decimal servings support

### 2. Event Timeline with Drag-and-Drop
- Vertical timeline with time markers (HH:MM format)
- Drag-and-drop food items onto timeline
- Collision detection with horizontal offsets for overlapping items
- Fullscreen mode for detailed editing
- Category color coding from user preferences
- Real-time nutrient calculations
- Share functionality with view-only mode

### 3. Plans View (My Plans & Community)
- Tabbed interface (My Plans / Community Plans)
- Event cards showing nutrition summary
- "Pending plans" state handling for shared events
- Click to navigate to detailed timeline view

### 4. User Avatar Menu
- Hover-triggered dropdown in Nav
- Mouse enter/leave event handling
- Delayed hide with timeout management
- Uses PrimeReact `Menu` with popup mode
- Options: Nutrients, Preferences, Sign Out

### 5. Color Selection (Preferences)
- Circular color buttons for category customization
- Selected state with visual indicator
- Per-category color selection
- Saves to user preferences in backend

### 6. Modal Sheet Dialogs
- Custom slide-up sheet system (`ModalSheet.css`)
- Mobile: Full-width, 90-95vh height
- Desktop: Centered, max 672px width
- Draggable handle visual indicator
- Overlay dismissal
- Smooth 0.4s cubic-bezier animations

### 7. User Connections & Sharing
- Connect with other users
- Share events/plans with connections
- View shared plans from community
- Collaborative race nutrition planning

### 8. Pull-to-Refresh (Mobile)
- Custom implementation with touch handlers
- Visual feedback with animated spinner
- 60px threshold triggers refresh
- Works on main app container

## Accessibility Considerations

- Semantic HTML structure
- Keyboard navigation support (via PrimeReact)
- Focus management in dialogs
- ARIA labels on interactive elements
- Color contrast compliance
- Reduced motion support

## Performance Patterns

### PWA (Progressive Web App)
- **vite-plugin-pwa** configured for offline support
- **Workbox** runtime caching for API responses
- Service worker for background sync
- Installable as native app on mobile devices
- Manifest.json for PWA metadata

### Current Optimizations
- Refresh triggers using numeric state for efficient re-renders
- Controlled components with minimal re-renders
- Event handler optimization in timeline drag-and-drop

### Future Optimization Opportunities
- Route-level code splitting with `React.lazy()`
- Memoization of expensive timeline calculations
- `useMemo` for filtered/sorted food item lists
- `useCallback` for event handlers in timeline components
- Virtualization for long food item lists (PrimeReact `VirtualScroller`)
- Image lazy loading for food item photos

## TypeScript Patterns

### Interface Definitions
```typescript
interface ComponentProps {
  visible: boolean;
  onHide: () => void;
  onSave: () => void;
}

interface ApiResponse {
  id: string;
  name: string;
  created_at: string;
}
```

### Functional Component Typing
```typescript
const Component: React.FC<ComponentProps> = ({ visible, onHide }) => {
  // Component logic
};

// or
const Component = ({ visible, onHide }: ComponentProps) => {
  // Component logic
};
```

### Event Typing
```typescript
const handleSubmit = (e: FormEvent) => {
  e.preventDefault();
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setData(e.target.value);
};
```

## Common Tasks

### Adding a New Page
1. Create `src/NewPage.tsx`
2. Create `src/NewPage.css` (if needed)
3. Add route in `Home.tsx`:
   ```typescript
   <Route path="/new-page" element={<NewPage />} />
   ```
4. Add navigation link in `Nav.tsx` (if needed)

### Adding a New Component
1. Create in appropriate directory:
   - Shared: `src/components/ComponentName.tsx`
   - Feature-specific: `src/components/[feature]/ComponentName.tsx`
2. Create matching CSS file if needed
3. Export from index file if creating a feature module:
   ```typescript
   // src/components/events/index.ts
   export { EventForm } from './EventForm';
   export { EditEventDialog } from './EditEventDialog';
   ```

### Adding a New Dialog
1. Create `[Name]Dialog.tsx` in appropriate component folder
2. Create `[Name]Dialog.css` for custom styles
3. Use standard dialog pattern (see Dialog Pattern above)
4. Handle mobile responsiveness

### Styling a PrimeReact Component
1. Use `pt` prop for inline customization
2. Use CSS classes (check PrimeReact docs for class names)
3. Override in component CSS file:
   ```css
   .my-custom-dialog .p-dialog-header {
     background-color: #646cff;
   }
   ```

### Making API Calls
1. Get API_URL from environment
2. Use async/await with try-catch
3. Show loading state
4. Handle errors with toast notifications
5. Update UI on success

## Key Design Decisions

1. **No state management library** - Using React local state and props (no Redux, Zustand, etc.)
2. **Custom modal sheet system** - `ModalSheet.css` provides consistent, native-feeling dialogs
3. **Co-located styles** - Traditional CSS files next to components (not CSS-in-JS or CSS modules)
4. **PrimeReact for UI components** - Consistent component library for forms, tables, etc.
5. **Mobile-first responsive** - 769px breakpoint with mobile-optimized patterns
6. **Auth0 for authentication** - Social login and user management
7. **Vite for builds** - Fast development with HMR, optimized production builds
8. **TypeScript strict mode** - Type safety throughout
9. **PWA-ready** - Offline support and installable as native app
10. **Native fetch API** - No axios or other HTTP libraries
11. **Feature-based organization** - Components organized by feature (events, food-items, etc.)

## Recent Major Updates (Last 2 Weeks)

### Styling Overhaul
- Major styling updates across the application
- Timeline styling refinements (multiple iterations)
- Desktop layout improvements with better responsive behavior
- Login screen redesign
- Dialog system rework to use modal sheets
- Nav bar styling improvements

### New Features
- **Share Event Dialog** - Share plans with connected users
- **User Connections** - Connect with other users for collaboration
- **Favorite Food Items** - Star/favorite functionality
- **Search on Food Items** - Filter food items by search term
- **Decimal Servings** - Support for fractional serving sizes
- **Event Sharing View-Only Mode** - Shared events can be viewed but not edited
- **Pending Plans Handling** - Better UX for shared events pending acceptance

### Bug Fixes & Improvements
- Multiple build error fixes
- Header alignment corrections
- Food instance dialog fixes
- Table styling fixes
- Better handling for pending shared plans

## Task Instructions

When asked to perform UI tasks:
1. **Understand the context** - Read relevant component files
2. **Follow existing patterns** - Match the app's conventions
3. **Use modal sheets for dialogs** - Prefer `ModalSheet.css` system over PrimeReact Dialog
4. **Use PrimeReact for form components** - InputText, InputNumber, Dropdown, Button, etc.
5. **Style consistently** - Use the indigo color palette and 0.4s cubic-bezier animations
6. **Mobile-first responsive design** - Base styles for mobile, enhance at 769px+ breakpoint
7. **Handle errors gracefully** - Use toast notifications for user feedback
8. **Type everything** - Use TypeScript interfaces for props and data
9. **Test mobile behavior** - Verify modal sheets, pull-to-refresh, touch interactions
10. **Import API_URL from config** - Use centralized `config/api.ts` for API calls
11. **Consider PWA capabilities** - Offline support, service workers, installability

### Common Component Locations
- Event components: `/ui/src/components/events/`
- Food item components: `/ui/src/components/food-items/`
- Shared components: `/ui/src/components/shared/`
- Page-level components: `/ui/src/[PageName].tsx`
- Hooks: `/ui/src/hooks/`
- Config: `/ui/src/config/`

Remember: This is **RaceFuel**, a nutrition tracking app for endurance athletes. Components should support:
- Tracking food items with detailed nutrition data
- Planning race nutrition on timelines
- Visualizing consumption over time
- Collaborating with other users via sharing
- Mobile-first UX with PWA capabilities
