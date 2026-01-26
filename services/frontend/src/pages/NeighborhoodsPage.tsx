import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Wrench, Copy, Check, Pencil, Trash2, UserPlus, Mail, X, Shield, Crown } from 'lucide-react';
import { neighborhoodsApi, membersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Neighborhood, NeighborhoodMember } from '@/types';

export function NeighborhoodsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [joinCode, setJoinCode] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);
  const [newNeighborhood, setNewNeighborhood] = useState({ name: '', description: '' });
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['neighborhoods', 'my'],
    queryFn: async () => {
      const response = await neighborhoodsApi.getMyNeighborhoods();
      return response.data;
    },
  });

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['neighborhoods', selectedNeighborhood?.id, 'members'],
    queryFn: async () => {
      if (!selectedNeighborhood?.id) return null;
      const response = await neighborhoodsApi.getMembers(selectedNeighborhood.id);
      return response.data;
    },
    enabled: !!selectedNeighborhood?.id && detailsOpen,
  });

  const { data: invitesData } = useQuery({
    queryKey: ['neighborhoods', selectedNeighborhood?.id, 'invites'],
    queryFn: async () => {
      if (!selectedNeighborhood?.id) return null;
      const response = await membersApi.listInvites(selectedNeighborhood.id);
      return response.data;
    },
    enabled: !!selectedNeighborhood?.id && detailsOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      neighborhoodsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods'] });
      setCreateOpen(false);
      setNewNeighborhood({ name: '', description: '' });
    },
  });

  const joinMutation = useMutation({
    mutationFn: (inviteCode: string) => neighborhoodsApi.join(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods'] });
      setJoinOpen(false);
      setJoinCode('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) =>
      neighborhoodsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods'] });
      if (selectedNeighborhood) {
        setSelectedNeighborhood({ ...selectedNeighborhood, ...editForm });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => neighborhoodsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods'] });
      setDetailsOpen(false);
      setDeleteConfirmOpen(false);
      setSelectedNeighborhood(null);
    },
  });

  const inviteMutation = useMutation({
    mutationFn: ({ neighborhoodId, email }: { neighborhoodId: string; email: string }) =>
      membersApi.sendInvite(neighborhoodId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods', selectedNeighborhood?.id, 'invites'] });
      setInviteEmail('');
    },
  });

  const revokeInviteMutation = useMutation({
    mutationFn: (inviteId: string) => membersApi.revokeInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods', selectedNeighborhood?.id, 'invites'] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => membersApi.remove(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods', selectedNeighborhood?.id, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['neighborhoods'] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: 'MEMBER' | 'ADMIN' }) =>
      membersApi.updateRole(memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods', selectedNeighborhood?.id, 'members'] });
    },
  });

  const regenerateCodeMutation = useMutation({
    mutationFn: (id: string) => neighborhoodsApi.regenerateInviteCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhoods'] });
    },
  });

  const neighborhoods: Neighborhood[] = data?.data?.items || [];
  const members: NeighborhoodMember[] = membersData?.data?.items || [];
  const invites: any[] = invitesData?.data || [];

  const openDetails = (neighborhood: Neighborhood) => {
    setSelectedNeighborhood(neighborhood);
    setEditForm({ name: neighborhood.name, description: neighborhood.description || '' });
    setDetailsOpen(true);
  };

  const copyInviteCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('neighborhoods.title')}</h1>
          <p className="text-muted-foreground">
            {t('neighborhoods.myNeighborhoods')}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                {t('neighborhoods.joinNeighborhood')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('neighborhoods.joinNeighborhood')}</DialogTitle>
                <DialogDescription>
                  {t('neighborhoods.enterInviteCode')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">{t('neighborhoods.inviteCode')}</Label>
                  <Input
                    id="inviteCode"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="ABC123"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => joinMutation.mutate(joinCode)}
                  disabled={!joinCode || joinMutation.isPending}
                >
                  {joinMutation.isPending ? t('common.loading') : t('neighborhoods.joinNeighborhood')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('neighborhoods.createNeighborhood')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('neighborhoods.createNeighborhood')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('neighborhoods.name')}</Label>
                  <Input
                    id="name"
                    value={newNeighborhood.name}
                    onChange={(e) => setNewNeighborhood({ ...newNeighborhood, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t('neighborhoods.description')}</Label>
                  <Input
                    id="description"
                    value={newNeighborhood.description}
                    onChange={(e) => setNewNeighborhood({ ...newNeighborhood, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createMutation.mutate(newNeighborhood)}
                  disabled={!newNeighborhood.name || createMutation.isPending}
                >
                  {createMutation.isPending ? t('common.loading') : t('common.create')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : neighborhoods.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('neighborhoods.noNeighborhoods')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create a new neighborhood or join an existing one
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {neighborhoods.map((neighborhood) => (
            <Card key={neighborhood.id}>
              <CardHeader>
                <CardTitle
                  className="cursor-pointer hover:text-primary transition-colors"
                  onClick={() => openDetails(neighborhood)}
                >
                  {neighborhood.name}
                </CardTitle>
                <CardDescription>{neighborhood.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {neighborhood._count?.members || 0} {t('neighborhoods.members')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {neighborhood._count?.tools || 0} {t('neighborhoods.tools')}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDetails(neighborhood)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {t('common.edit')}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedNeighborhood?.name}</DialogTitle>
            <DialogDescription>{selectedNeighborhood?.description}</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">{t('neighborhoods.details')}</TabsTrigger>
              <TabsTrigger value="members">{t('neighborhoods.members')}</TabsTrigger>
              <TabsTrigger value="invites">{t('neighborhoods.inviteMember')}</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="space-y-4 py-4">
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
                    onClick={() => selectedNeighborhood && updateMutation.mutate({ id: selectedNeighborhood.id, data: editForm })}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? t('common.loading') : t('common.save')}
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('neighborhoods.inviteCode')}</Label>
                    <p className="text-sm text-muted-foreground">{t('neighborhoods.copyInvite')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => (selectedNeighborhood as any)?.inviteCode && copyInviteCode((selectedNeighborhood as any).inviteCode, selectedNeighborhood!.id)}
                    >
                      {copiedId === selectedNeighborhood?.id ? (
                        <><Check className="mr-2 h-4 w-4" />{t('neighborhoods.inviteCopied')}</>
                      ) : (
                        <><Copy className="mr-2 h-4 w-4" />{(selectedNeighborhood as any)?.inviteCode || 'Code'}</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectedNeighborhood && regenerateCodeMutation.mutate(selectedNeighborhood.id)}
                      disabled={regenerateCodeMutation.isPending}
                    >
                      {t('neighborhoods.regenerateCode')}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Button
                  variant="destructive"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('neighborhoods.deleteNeighborhood')}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
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

            <TabsContent value="invites" className="space-y-4">
              <div className="space-y-4 py-4">
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
                      onClick={() => selectedNeighborhood && inviteMutation.mutate({ neighborhoodId: selectedNeighborhood.id, email: inviteEmail })}
                      disabled={!inviteEmail || inviteMutation.isPending}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {inviteMutation.isPending ? t('common.loading') : t('common.submit')}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
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
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('neighborhoods.deleteNeighborhood')}</DialogTitle>
            <DialogDescription>
              {t('neighborhoods.confirmDelete', { name: selectedNeighborhood?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedNeighborhood && deleteMutation.mutate(selectedNeighborhood.id)}
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
