import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Analytics = () => (
  <Layout>
    <h1 className="text-2xl font-display font-bold mb-6">Analytics</h1>
    <Card>
      <CardHeader>
        <CardTitle>Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Chart wiring lands in a later sub-phase.</p>
      </CardContent>
    </Card>
  </Layout>
);

export default Analytics;
