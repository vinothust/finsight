import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';

const Login = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col items-center gap-2">
        <Logo size="lg" />
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center">Login form wiring lands in a later sub-phase.</p>
      </CardContent>
    </Card>
  </div>
);

export default Login;
