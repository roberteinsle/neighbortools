import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/context/auth-store';
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, CheckCircle, AlertCircle } from 'lucide-react';
import { validatePassword, getPasswordErrorKey } from '@/lib/utils';

// Map backend error messages to translation keys
function getErrorTranslationKey(error: string): string {
  if (error.includes('email already exists') || error.includes('User with this email')) {
    return 'errors.emailAlreadyExists';
  }
  if (error.includes('Invalid email')) {
    return 'errors.invalidEmail';
  }
  return 'errors.registrationFailed';
}

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(12),
  confirmPassword: z.string().min(1),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getLocalizedPath } = useLocalizedNavigate();
  const { register: registerUser, error, clearError } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const watchedPassword = watch('password', '');
  const watchedEmail = watch('email', '');

  const passwordErrors = useMemo(() => {
    if (!watchedPassword) return [];
    return validatePassword(watchedPassword, watchedEmail);
  }, [watchedPassword, watchedEmail]);

  const isPasswordValid = watchedPassword.length > 0 && passwordErrors.length === 0;

  const onSubmit = async (data: RegisterForm) => {
    setIsSubmitting(true);
    clearError();
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      navigate(getLocalizedPath('/'), { replace: true });
    } catch {
      // Error is handled by the store
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Wrench className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t('auth.register')}</CardTitle>
          <CardDescription>
            {t('common.appName')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {t(getErrorTranslationKey(error))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{t('errors.required')}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                <Input
                  id="lastName"
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{t('errors.required')}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{t('errors.invalidEmail')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
              />
              {watchedPassword && passwordErrors.length > 0 && (
                <div className="space-y-1">
                  {passwordErrors.map((error) => (
                    <p key={error} className="flex items-center gap-1.5 text-sm text-destructive">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {t(getPasswordErrorKey(error))}
                    </p>
                  ))}
                </div>
              )}
              {isPasswordValid && (
                <p className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {t('profile.passwordValid')}
                </p>
              )}
              {!watchedPassword && errors.password && (
                <p className="text-sm text-destructive">{t('errors.passwordTooShort')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{t('errors.passwordsDoNotMatch')}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('common.loading') : t('auth.register')}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {t('auth.hasAccount')}{' '}
              <Link to={getLocalizedPath('/login')} className="text-primary hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
