import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { ChatWidget } from '@/components/chat/ChatWidget';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
      <main className={collapsed ? 'ml-16' : 'ml-64'}>
        <div className="p-6">{children}</div>
      </main>
      <ChatWidget />
    </div>
  );
};

export default Layout;
