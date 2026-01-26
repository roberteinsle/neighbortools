import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Copy, Check, Trash2, UserPlus, Mail, X, Shield, Crown } from 'lucide-react';
import { neighborhoodsApi, membersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';
import type { Neighborhood, NeighborhoodMember } from '@/types';

export function NeighborhoodEditPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { navigate: localizedNavigate } = useLocalizedNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Fetch neighborhood details
  const { data: neighborhoodData, isLoading } = useQuery({
    queryKey: ['neighborhoods', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await neighborhoodsApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });

  const neighborhood: Neighborhood | null = neighborhoodData?.data || null;

  // Initialize edit form when data loads
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['neighborhoods', id, 'members'],
    queryFn: async () => {
      if (!id) return null;
      const response = await neighborhoodsApi.getMembers(id);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: invitesData } = useQuery({
    queryKey: ['neighborhoods', id, 'invites'],
    queryFn: async () => {
      if (!id) return null;
      const response = await membersApi.listInvites(id);
      return response.data;
    },
    enabled: !!id,
  });

  // Set form values when neighborhood loads
  useState(() => {
    if (neighborhood) {
      setEditForm({ name: neighborhood.name, description: neighborhood.description || '' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) =>
      neighborhoodsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => neighborhoodsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods'] });
      localizedNavigate('/neighborhoods');
    },
  });

  const inviteMutation = useMutation({
    mutationFn: ({ neighborhoodId, email }: { neighborhoodId: string; email: string }) =>
      membersApi.sendInvite(neighborhoodId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods', id, 'invites'] });
      setInviteEmail('');
    },
  });

  const revokeInviteMutation = useMutation({
    mutationFn: (inviteId: string) => membersApi.revokeInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods', id, 'invites'] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => membersApi.remove(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods', id, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['neighborhoods'] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: 'MEMBER' | 'ADMIN' }) =>
      membersApi.updateRole(memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods', id, 'members'] });
    },
  });

  const regenerateCodeMutation = useMutation({
    mutationFn: (id: string) => neighborhoodsApi.regenerateInviteCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods', id] });
      queryClient.invalidateQueries({ queryKey: ['neighborhoods'] });
    },
  });

  const members: NeighborhoodMember[] = membersData?.data?.items || [];
  const invites: any[] = invitesData?.data || [];

  const copyInviteCode = async (code: string, neighborhoodId: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(neighborhoodId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'ADMIN':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  // Update form when neighborhood data loads
  if (neighborhood && editForm.name === '' && editForm.description === '') {
    setEditForm({ name: neighborhood.name, description: neighborhood.description || '' });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!neighborhood) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => localizedNavigate('/neighborhoods')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">{t('neighborhoods.notFound')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => localizedNavigate('/neighborhoods')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{neighborhood.name}</CardTitle>
          <CardDescription>{neighborhood.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">{t('neighborhoods.details')}</TabsTrigger>
              <TabsTrigger value="members">{t('neighborhoods.members')}</TabsTrigger>
              <TabsTrigger value="invites">{t('neighborhoods.inviteMember')}</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editName">{t('neighborhoods.name')}</Label>
                  <Input
                    id="editName"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editDescription">{t('neighborhoods.description')}</Label>
                  <Input
                    id="editDescription"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => id && updateMutation.mutate({ id, data: editForm })}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? t('common.loading') : t('common.save')}
                  </Button>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('neighborhoods.inviteCode')}</Label>
                    <p className="text-sm text-muted-foreground">{t('neighborhoods.copyInvite')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => (neighborhood as any)?.inviteCode && copyInviteCode((neighborhood as any).inviteCode, neighborhood.id)}
                    >
                      {copiedId === neighborhood.id ? (
                        <><Check className="mr-2 h-4 w-4" />{t('neighborhoods.inviteCopied')}</>
                      ) : (
                        <><Copy className="mr-2 h-4 w-4" />{(neighborhood as any)?.inviteCode || 'Code'}</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => id && regenerateCodeMutation.mutate(id)}
                      disabled={regenerateCodeMutation.isPending}
                    >
                      {t('neighborhoods.regenerateCode')}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <Button
                  variant="destructive"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('neighborhoods.deleteNeighborhood')}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="members" className="space-y-4 mt-6">
              {membersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : members.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t('neighborhoods.noMembers')}</p>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getRoleIcon(member.role)}
                        <div>
                          <p className="font-medium">
                            {member.user?.firstName} {member.user?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground px-2 py-1 bg-muted rounded">
                          {t(`neighborhoods.roles.${member.role.toLowerCase()}`)}
                        </span>
                        {member.role !== 'OWNER' && (
                          <>
                            <Select
                              value={member.role}
                              onValueChange={(value) => updateRoleMutation.mutate({ memberId: member.id, role: value as 'MEMBER' | 'ADMIN' })}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MEMBER">{t('neighborhoods.roles.member')}</SelectItem>
                                <SelectItem value="ADMIN">{t('neighborhoods.roles.admin')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMemberMutation.mutate(member.id)}
                              disabled={removeMemberMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="invites" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">{t('neighborhoods.inviteByEmail')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="inviteEmail"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder={t('neighborhoods.emailPlaceholder')}
                    />
                    <Button
                      onClick={() => id && inviteMutation.mutate({ neighborhoodId: id, email: inviteEmail })}
                      disabled={!inviteEmail || inviteMutation.isPending}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {inviteMutation.isPending ? t('common.loading') : t('common.submit')}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">{t('neighborhoods.pendingInvites')}</h4>
                {invites.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">{t('neighborhoods.noInvites')}</p>
                ) : (
                  <div className="space-y-2">
                    {invites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{invite.invitedEmail}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(invite.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeInviteMutation.mutate(invite.id)}
                          disabled={revokeInviteMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('neighborhoods.deleteNeighborhood')}</DialogTitle>
            <DialogDescription>
              {t('neighborhoods.confirmDelete', { name: neighborhood.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => id && deleteMutation.mutate(id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('common.loading') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
