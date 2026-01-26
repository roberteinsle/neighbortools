import { useState } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AdminUser, SmtpConfig, NotificationStats, EmailLog } from '@/types';

export function AdminPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Users Tab State
  const [userPage, setUserPage] = useState(1);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<{ firstName: string; lastName: string; role: 'USER' | 'ADMIN' }>({ firstName: '', lastName: '', role: 'USER' });

  // SMTP Tab State
  const [emailLogPage, setEmailLogPage] = useState(1);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const emailLogsPerPage = 10;

  // Queries
  const usersQuery = useQuery({
    queryKey: ['admin', 'users', userPage],
    queryFn: async () => {
      const response = await adminApi.getUsers({ page: userPage, pageSize: 10 });
      return response.data.data as { items: AdminUser[]; total: number; page: number; pageSize: number; totalPages: number };
    },
  });

  const smtpQuery = useQuery({
    queryKey: ['admin', 'smtp'],
    queryFn: async () => {
      const response = await adminApi.getSmtpConfig();
      return response.data.data as SmtpConfig | null;
    },
  });

  const statsQuery = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const response = await adminApi.getStats();
      return response.data.data as NotificationStats;
    },
  });

  const emailLogsQuery = useQuery({
    queryKey: ['admin', 'email-logs', emailLogPage],
    queryFn: async () => {
      const response = await adminApi.getEmailLogs({ page: emailLogPage, pageSize: emailLogsPerPage });
      return response.data.data as { items: EmailLog[]; total: number; page: number; pageSize: number; totalPages: number };
    },
  });

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminUser> }) =>
      adminApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setEditingUser(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
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

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  };

  const handleSaveUser = () => {
    if (!editingUser) return;
    updateUserMutation.mutate({
      id: editingUser.id,
      data: editForm,
    });
  };

  const handleDeactivateUser = (user: AdminUser) => {
    updateUserMutation.mutate({
      id: user.id,
      data: { isActive: false },
    });
  };

  const handleDeleteUser = (user: AdminUser) => {
    if (window.confirm(t('admin.confirmDelete', { name: `${user.firstName} ${user.lastName}` }))) {
      deleteUserMutation.mutate(user.id);
    }
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
                        {usersQuery.data?.items.map((user) => (
                          <tr key={user.id} className="border-b">
                            <td className="p-3">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="text-primary hover:underline font-medium text-left"
                              >
                                {user.firstName} {user.lastName}
                              </button>
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
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                  title={t('admin.edit')}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {user.isActive !== false ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeactivateUser(user)}
                                    disabled={updateUserMutation.isPending}
                                  >
                                    {t('admin.deactivate')}
                                  </Button>
                                ) : (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user)}
                                    disabled={deleteUserMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    {t('admin.delete')}
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {usersQuery.data && usersQuery.data.totalPages > 1 && (
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
                        {userPage} / {usersQuery.data.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUserPage((p) => p + 1)}
                        disabled={userPage >= usersQuery.data.totalPages}
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
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.smtpConfig')}</CardTitle>
                <CardDescription>{t('admin.smtpFromEnv')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {smtpQuery.isLoading ? (
                  <p className="text-muted-foreground">{t('common.loading')}</p>
                ) : smtpQuery.data ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('admin.smtpHost')}</p>
                      <p className="font-mono">{smtpQuery.data.host || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('admin.smtpPort')}</p>
                      <p className="font-mono">{smtpQuery.data.port || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('admin.smtpUser')}</p>
                      <p className="font-mono">{smtpQuery.data.user || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('admin.smtpFromEmail')}</p>
                      <p className="font-mono">{smtpQuery.data.fromEmail || '-'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t('admin.smtpNotConfigured')}</p>
                )}

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

                <Button
                  variant="outline"
                  onClick={() => {
                    setSmtpTestResult(null);
                    testSmtpMutation.mutate();
                  }}
                  disabled={testSmtpMutation.isPending || !smtpQuery.data?.host}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {testSmtpMutation.isPending ? t('common.loading') : t('admin.sendTestEmail')}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.recentEmails')}</CardTitle>
                <CardDescription>{t('admin.recentEmailsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {emailLogsQuery.isLoading ? (
                  <p className="text-muted-foreground">{t('common.loading')}</p>
                ) : emailLogsQuery.data?.items.length === 0 ? (
                  <p className="text-muted-foreground">{t('admin.noEmails')}</p>
                ) : (
                  <div className="space-y-4">
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
                          {emailLogsQuery.data?.items.map((log) => (
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
                    {emailLogsQuery.data && emailLogsQuery.data.totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEmailLogPage((p) => Math.max(1, p - 1))}
                          disabled={emailLogPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                          {emailLogPage} / {emailLogsQuery.data.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEmailLogPage((p) => p + 1)}
                          disabled={emailLogPage >= emailLogsQuery.data.totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats">
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
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.editUser')}</DialogTitle>
            <DialogDescription>
              {editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">{t('admin.role')}</Label>
              <Select
                value={editForm.role}
                onValueChange={(value: 'USER' | 'ADMIN') => setEditForm((f) => ({ ...f, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveUser} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
