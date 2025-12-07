import { useAuth0 } from '@auth0/auth0-react';
import { Card } from 'primereact/card';
import { Avatar } from 'primereact/avatar';
import { Divider } from 'primereact/divider';
import { Panel } from 'primereact/panel';
import './Preferences.css';

export default function Preferences() {
  const { user } = useAuth0();

  const userProfileTemplate = (
    <div className="preference-header-content">
      <Avatar
        label={user?.name?.charAt(0).toUpperCase()}
        icon="pi pi-user"
        style={{ backgroundColor: '#646cff', color: 'white' }}
        shape="circle"
        size="large"
      />
      <span className="preference-title">User Profile</span>
    </div>
  );

  return (
    <div className="preferences-container">
      <Panel header="Preferences" className="preferences-panel">
        <p className="preferences-subtitle">Manage your app settings and preferences</p>

        <Divider />

        <Card className="preferences-card">
          {userProfileTemplate}
          <Divider />
          <div className="preference-section">
            <div className="preference-row">
              <label>Name</label>
              <span>{user?.name || 'N/A'}</span>
            </div>
            <Divider />
            <div className="preference-row">
              <label>Email</label>
              <span>{user?.email || 'N/A'}</span>
            </div>
          </div>
        </Card>

        <Card title="App Settings" className="preferences-card">
          <div className="preference-section">
            <p className="coming-soon">Additional settings will be available soon.</p>
          </div>
        </Card>
      </Panel>
    </div>
  );
}
