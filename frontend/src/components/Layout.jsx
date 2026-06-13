import { useState } from 'react';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import '../css/Layout.css';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="dashboard-layout">
      <Topbar onToggleSidebar={toggleSidebar} />
      <div className="dashboard-container">
        <div className={`sidebar-wrapper ${sidebarOpen ? 'd-block' : 'd-none d-md-block'}`}>
          <Sidebar />
        </div>
        <main className="dashboard-main-content w-100 flex-grow-1">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-md-none"
          style={{ zIndex: 35 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default Layout;