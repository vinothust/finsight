import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Settings = () => (
  <Layout>
    <h1 className="text-2xl font-display font-bold mb-6">Settings</h1>
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Preference-saving wiring lands in Phase 6.</p>
      </CardContent>
    </Card>
  </Layout>
);

export default Settings;
