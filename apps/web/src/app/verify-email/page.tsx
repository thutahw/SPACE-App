'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { emailApi, ApiError } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import { toast } from '@/hooks/use-toast';

type VerificationState = 'loading' | 'success' | 'error' | 'no-token';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { user } = useAuth();
  const [state, setState] = useState<VerificationState>('loading');
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setState('no-token');
      return;
    }

    const verifyEmail = async () => {
      try {
        const result = await emailApi.verifyEmail(token);
        setMessage(result.message);
        setState('success');
      } catch (error) {
        const errorMessage =
          error instanceof ApiError
            ? error.message
            : 'Failed to verify email';
        setMessage(errorMessage);
        setState('error');
      }
    };

    verifyEmail();
  }, [token]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await emailApi.resendVerification();
      toast({
        title: 'Email sent',
        description: 'A new verification email has been sent to your inbox.',
      });
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : 'Failed to send verification email';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Link href="/" className="text-2xl font-bold text-primary">
              SPACE
            </Link>
          </div>
          <CardTitle className="text-2xl text-center">
            {state === 'loading' && 'Verifying...'}
            {state === 'success' && 'Email Verified!'}
            {state === 'error' && 'Verification Failed'}
            {state === 'no-token' && 'Verify Your Email'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {state === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              <p className="text-muted-foreground">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {state === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-muted-foreground">{message}</p>
              <CardDescription>
                Your email has been verified. You can now access all features of SPACE.
              </CardDescription>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-red-100 p-3">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-red-600">{message}</p>
              <CardDescription>
                The verification link may have expired or is invalid.
                {user && ' You can request a new verification email below.'}
              </CardDescription>
            </div>
          )}

          {state === 'no-token' && (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-yellow-100 p-3">
                <svg
                  className="h-8 w-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <CardDescription>
                {user
                  ? "Check your email for a verification link, or request a new one below."
                  : "Please check your email for a verification link. If you haven't received one, try logging in first."}
              </CardDescription>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {state === 'success' && (
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          )}

          {(state === 'error' || state === 'no-token') && user && (
            <Button
              onClick={handleResend}
              disabled={isResending}
              variant="outline"
              className="w-full"
            >
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </Button>
          )}

          {(state === 'error' || state === 'no-token') && !user && (
            <Button asChild className="w-full">
              <Link href="/login">Sign In</Link>
            </Button>
          )}

          <Button asChild variant="ghost" className="w-full">
            <Link href="/">Back to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
