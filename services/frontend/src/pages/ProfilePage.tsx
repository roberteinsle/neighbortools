import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { User, Lock, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/context/auth-store';
import { usersApi } from '@/lib/api';
import { validatePassword, getPasswordErrorKey } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
];

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Sync profileData when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [user]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const updateProfileMutation = useMutation({
    mutationFn: (data: { firstName: string; lastName: string; language?: string }) =>
      usersApi.updateProfile(data),
    onSuccess: (response) => {
      if (response.data.data) {
        updateUser(response.data.data);
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
      }
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      usersApi.changePassword(data),
    onSuccess: () => {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      ...profileData,
      language: selectedLanguage.toUpperCase(),
    });
  };

  const passwordErrors = useMemo(() => {
    if (!passwordData.newPassword) return [];
    return validatePassword(passwordData.newPassword, user?.email);
  }, [passwordData.newPassword, user?.email]);

  const isPasswordValid = passwordData.newPassword.length > 0 && passwordErrors.length === 0;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordErrors.length > 0) return;
    if (passwordData.newPassword !== passwordData.confirmPassword) return;
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    i18n.changeLanguage(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('profile.title')}</h1>
        <p className="text-muted-foreground">
          {t('profile.memberSince')}: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('profile.editProfile')}
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {t('profile.changePassword')}
          </TabsTrigger>
          <TabsTrigger value="language" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('profile.language')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.editProfile')}</CardTitle>
              <CardDescription>
                {user?.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? t('common.loading') : t('common.save')}
                  </Button>
                  {updateSuccess && (
                    <span className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {t('profile.updateSuccess')}
                    </span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.changePassword')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t('profile.currentPassword')}</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('profile.newPassword')}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                  {passwordData.newPassword && passwordErrors.length > 0 && (
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                  {passwordData.newPassword && passwordData.confirmPassword &&
                   passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="text-sm text-destructive">{t('errors.passwordsDoNotMatch')}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    type="submit"
                    disabled={
                      changePasswordMutation.isPending ||
                      !passwordData.currentPassword ||
                      !isPasswordValid ||
                      passwordData.newPassword !== passwordData.confirmPassword
                    }
                  >
                    {changePasswordMutation.isPending ? t('common.loading') : t('common.save')}
                  </Button>
                  {passwordSuccess && (
                    <span className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {t('profile.passwordChanged')}
                    </span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.language')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('profile.language')}</Label>
                <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => updateProfileMutation.mutate({ ...profileData, language: selectedLanguage.toUpperCase() })}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? t('common.loading') : t('common.save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
