import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Mail,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Send,
  Eye,
  EyeOff,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AdminUser, SmtpConfig, NotificationStats, EmailLog } from '@/types';

export function AdminPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Users Tab State
  const [userPage, setUserPage] = useState(1);

  // SMTP Tab State
  const [showPassword, setShowPassword] = useState(false);
  const [smtpForm, setSmtpForm] = useState({
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    fromEmail: '',
    fromName: 'NeighborTools',
  });
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Queries
  const usersQuery = useQuery({
    queryKey: ['admin', 'users', userPage],
    queryFn: async () => {
      const response = await adminApi.getUsers({ page: userPage, pageSize: 10 });
      return response.data.data as { data: AdminUser[]; pagination: { total: number; totalPages: number } };
    },
  });

  const smtpQuery = useQuery({
    queryKey: ['admin', 'smtp'],
    queryFn: async () => {
      const response = await adminApi.getSmtpConfig();
      return response.data.data as SmtpConfig | null;
    },
  });

  // Sync SMTP form when data is loaded
  useEffect(() => {
    if (smtpQuery.data) {
      setSmtpForm({
        host: smtpQuery.data.host || '',
        port: smtpQuery.data.port || 587,
        secure: smtpQuery.data.secure || false,
        user: smtpQuery.data.user || '',
        password: '',
        fromEmail: smtpQuery.data.fromEmail || '',
        fromName: smtpQuery.data.fromName || 'NeighborTools',
      });
    }
  }, [smtpQuery.data]);

  const statsQuery = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const response = await adminApi.getStats();
      return response.data.data as NotificationStats;
    },
  });

  const emailLogsQuery = useQuery({
    queryKey: ['admin', 'email-logs'],
    queryFn: async () => {
      const response = await adminApi.getEmailLogs({ pageSize: 20 });
      return response.data.data as { data: EmailLog[]; pagination: { total: number } };
    },
  });

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminUser> }) =>
      adminApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const updateSmtpMutation = useMutation({
    mutationFn: (data: typeof smtpForm) => adminApi.updateSmtpConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'smtp'] });
      setSmtpTestResult({ success: true, message: t('admin.smtpSaved') });
    },
    onError: () => {
      setSmtpTestResult({ success: false, message: t('admin.smtpSaveError') });
    },
  });

  const testSmtpMutation = useMutation({
    mutationFn: () => adminApi.testSmtpConfig(),
    onSuccess: () => {
      setSmtpTestResult({ success: true, message: t('admin.smtpTestSuccess') });
    },
    onError: () => {
      setSmtpTestResult({ success: false, message: t('admin.smtpTestError') });
    },
  });

  const handleToggleUserActive = (user: AdminUser) => {
    updateUserMutation.mutate({
      id: user.id,
      data: { isActive: !user.isActive },
    });
  };

  const handleSmtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpTestResult(null);
    updateSmtpMutation.mutate(smtpForm);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.title')}</h1>
        <p className="text-muted-foreground">{t('admin.description')}</p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('admin.users')}
          </TabsTrigger>
          <TabsTrigger value="smtp" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {t('admin.smtp')}
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('admin.statistics')}
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.userManagement')}</CardTitle>
              <CardDescription>{t('admin.userManagementDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {usersQuery.isLoading ? (
                <p className="text-muted-foreground">{t('common.loading')}</p>
              ) : usersQuery.error ? (
                <p className="text-destructive">{t('common.error')}</p>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 text-left font-medium">{t('admin.name')}</th>
                          <th className="p-3 text-left font-medium">{t('auth.email')}</th>
                          <th className="p-3 text-left font-medium">{t('admin.role')}</th>
                          <th className="p-3 text-left font-medium">{t('admin.status')}</th>
                          <th className="p-3 text-left font-medium">{t('admin.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersQuery.data?.data.map((user) => (
                          <tr key={user.id} className="border-b">
                            <td className="p-3">
                              {user.firstName} {user.lastName}
                            </td>
                            <td className="p-3">{user.email}</td>
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  user.role === 'ADMIN'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td className="p-3">
                              {user.isActive !== false ? (
                                <span className="inline-flex items-center gap-1 text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                                  {t('admin.active')}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-600">
                                  <XCircle className="h-4 w-4" />
                                  {t('admin.inactive')}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleUserActive(user)}
                                disabled={updateUserMutation.isPending}
                              >
                                {user.isActive !== false ? t('admin.deactivate') : t('admin.activate')}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {usersQuery.data?.pagination && usersQuery.data.pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                        disabled={userPage === 1}
                      >
                        {t('common.previous')}
                      </Button>
                      <span className="flex items-center px-4">
                        {userPage} / {usersQuery.data.pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUserPage((p) => p + 1)}
                        disabled={userPage >= usersQuery.data.pagination.totalPages}
                      >
                        {t('common.next')}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMTP Tab */}
        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.smtpConfig')}</CardTitle>
              <CardDescription>
                {smtpQuery.data?.source === 'environment'
                  ? t('admin.smtpFromEnv')
                  : t('admin.smtpFromDb')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSmtpSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">{t('admin.smtpHost')}</Label>
                    <Input
                      id="smtp-host"
                      value={smtpForm.host}
                      onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">{t('admin.smtpPort')}</Label>
                    <Input
                      id="smtp-port"
                      type="number"
                      value={smtpForm.port}
                      onChange={(e) => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-user">{t('admin.smtpUser')}</Label>
                    <Input
                      id="smtp-user"
                      value={smtpForm.user}
                      onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">{t('admin.smtpPassword')}</Label>
                    <div className="relative">
                      <Input
                        id="smtp-password"
                        type={showPassword ? 'text' : 'password'}
                        value={smtpForm.password}
                        onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                        placeholder={smtpQuery.data ? '••••••••' : ''}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-from-email">{t('admin.smtpFromEmail')}</Label>
                    <Input
                      id="smtp-from-email"
                      type="email"
                      value={smtpForm.fromEmail}
                      onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                      placeholder="noreply@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-from-name">{t('admin.smtpFromName')}</Label>
                    <Input
                      id="smtp-from-name"
                      value={smtpForm.fromName}
                      onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="smtp-secure"
                    checked={smtpForm.secure}
                    onChange={(e) => setSmtpForm({ ...smtpForm, secure: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="smtp-secure">{t('admin.smtpSecure')}</Label>
                </div>

                {smtpTestResult && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-md ${
                      smtpTestResult.success
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {smtpTestResult.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    {smtpTestResult.message}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={updateSmtpMutation.isPending}>
                    {updateSmtpMutation.isPending ? t('common.loading') : t('common.save')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => testSmtpMutation.mutate()}
                    disabled={testSmtpMutation.isPending}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {testSmtpMutation.isPending ? t('common.loading') : t('admin.testConnection')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('admin.totalNotifications')}</CardTitle>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsQuery.data?.notifications.total ?? '-'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {statsQuery.data?.notifications.unread ?? 0} {t('admin.unread')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('admin.emailsSent')}</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsQuery.data?.emails.sent ?? '-'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {statsQuery.data?.emails.failed ?? 0} {t('admin.failed')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('admin.scheduledPending')}</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsQuery.data?.scheduled.pending ?? '-'}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.recentEmails')}</CardTitle>
              </CardHeader>
              <CardContent>
                {emailLogsQuery.isLoading ? (
                  <p className="text-muted-foreground">{t('common.loading')}</p>
                ) : emailLogsQuery.data?.data.length === 0 ? (
                  <p className="text-muted-foreground">{t('admin.noEmails')}</p>
                ) : (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 text-left font-medium">{t('admin.recipient')}</th>
                          <th className="p-3 text-left font-medium">{t('admin.subject')}</th>
                          <th className="p-3 text-left font-medium">{t('admin.status')}</th>
                          <th className="p-3 text-left font-medium">{t('admin.date')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {emailLogsQuery.data?.data.map((log) => (
                          <tr key={log.id} className="border-b">
                            <td className="p-3">{log.to}</td>
                            <td className="p-3">{log.subject}</td>
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  log.status === 'SENT'
                                    ? 'bg-green-100 text-green-800'
                                    : log.status === 'FAILED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {log.status === 'SENT' && <CheckCircle className="h-3 w-3" />}
                                {log.status === 'FAILED' && <XCircle className="h-3 w-3" />}
                                {log.status}
                              </span>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
