import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Wrench, Copy, Check } from 'lucide-react';
import { neighborhoodsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Neighborhood } from '@/types';

export function NeighborhoodsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [joinCode, setJoinCode] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [newNeighborhood, setNewNeighborhood] = useState({ name: '', description: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['neighborhoods', 'my'],
    queryFn: async () => {
      const response = await neighborhoodsApi.getMyNeighborhoods();
      return response.data;
    },
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

  const neighborhoods: Neighborhood[] = data?.data || [];

  const copyInviteCode = async (id: string) => {
    try {
      const response = await neighborhoodsApi.generateInvite(id);
      const code = response.data.data.code;
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy invite code:', error);
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
                <CardTitle>{neighborhood.name}</CardTitle>
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
                  onClick={() => copyInviteCode(neighborhood.id)}
                >
                  {copiedId === neighborhood.id ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      {t('neighborhoods.inviteCopied')}
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      {t('neighborhoods.copyInvite')}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
