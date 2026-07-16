import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Upload = () => (
  <Layout>
    <h1 className="text-2xl font-display font-bold mb-6">Upload Data</h1>
    <Card>
      <CardHeader>
        <CardTitle>File Upload</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Upload preview/commit wiring lands in a later sub-phase.</p>
      </CardContent>
    </Card>
  </Layout>
);

export default Upload;
