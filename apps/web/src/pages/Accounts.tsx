import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Accounts = () => (
  <Layout>
    <h1 className="text-2xl font-display font-bold mb-6">Accounts</h1>
    <Card>
      <CardHeader>
        <CardTitle>Account Management</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Admin CRUD wiring lands in a later sub-phase.</p>
      </CardContent>
    </Card>
  </Layout>
);

export default Accounts;
