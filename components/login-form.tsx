'use client';

import { useActionState } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { authenticate } from '@/app/lib/actions';
import { useSearchParams } from 'next/navigation';

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" name="email" placeholder="email@example.com" required />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  {/*<a*/}
                  {/*  href="#"*/}
                  {/*  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"*/}
                  {/*>*/}
                  {/*  Forgot your password?*/}
                  {/*</a>*/}
                </div>
                <Input id="password" type="password" name="password" required />
              </Field>
              <Field>
                <input type="hidden" name="redirectTo" value={callbackUrl} />
                <Button type="submit" aria-disabled={isPending}>
                  Login
                </Button>
                {/*<Button variant="outline" type="button">*/}
                {/*  Login with Google*/}
                {/*</Button>*/}
                {/*<FieldDescription className="text-center">*/}
                {/*  Don&apos;t have an account? <a href="#">Sign up</a>*/}
                {/*</FieldDescription>*/}
              </Field>
            </FieldGroup>
          </form>
          <div className="flex h-8 items-end space-x-1" aria-live="polite" aria-atomic="true">
            {errorMessage && (
              <>
                <p className="text-sm text-red-500">{errorMessage}</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
