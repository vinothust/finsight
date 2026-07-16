import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Dashboard = () => (
  <Layout>
    <h1 className="text-2xl font-display font-bold mb-6">Dashboard</h1>
    <Card>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Dashboard data wiring lands in a later sub-phase.</p>
      </CardContent>
    </Card>
  </Layout>
);

export default Dashboard;
