import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Clusters = () => (
  <Layout>
    <h1 className="text-2xl font-display font-bold mb-6">Clusters</h1>
    <Card>
      <CardHeader>
        <CardTitle>Cluster Management</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Admin CRUD wiring lands in a later sub-phase.</p>
      </CardContent>
    </Card>
  </Layout>
);

export default Clusters;
