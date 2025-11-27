import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Expenses</CardTitle>
          <CardDescription className="text-base">
            Track and manage your expenses with ease
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/login">Log in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
