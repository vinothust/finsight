import Layout from '@/components/Layout';
import PnLOverview from '@/components/PnLOverview';

const Dashboard = () => (
  <Layout>
    <h1 className="text-2xl font-display font-bold mb-6">Dashboard</h1>
    <PnLOverview />
  </Layout>
);

export default Dashboard;
