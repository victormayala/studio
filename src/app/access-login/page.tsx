
"use client";

import React, { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons/Logo';
import { verifyPasswordAndSetCookie } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound } from 'lucide-react';

function AccessLoginFormContent() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook is used here
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const redirectParam = searchParams.get('redirect');

    try {
      const result = await verifyPasswordAndSetCookie(password, redirectParam);
      if (result.success) {
        toast({ title: 'Access Granted!', description: 'Redirecting...' });
        router.push(result.redirectPath || '/dashboard');
      } else {
        setError(result.error || 'An unknown error occurred.');
        setPassword(''); // Clear password field on error
      }
    } catch (err) {
      console.error("Access login error:", err);
      setError('Failed to verify password. Please try again.');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/20 items-center justify-center p-4">
      <div className="mb-8">
        <Logo />
      </div>
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline text-foreground">Application Access</CardTitle>
          <CardDescription>Please enter the password to access the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter access password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-input/50"
                  disabled={isLoading}
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Unlock"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="mt-8 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Customizer Studio. All rights reserved.
      </p>
    </div>
  );
}

export default function AccessLoginPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-muted/20 items-center justify-center p-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading access page...</p>
      </div>
    }>
      <AccessLoginFormContent />
    </Suspense>
  );
}
