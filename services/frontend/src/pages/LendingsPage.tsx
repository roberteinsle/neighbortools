import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, RotateCcw, Play, Clock, Ban } from 'lucide-react';
import { lendingsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDateShort } from '@/lib/utils';
import type { Lending, LendingStatus } from '@/types';

export function LendingsPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const [selectedLending, setSelectedLending] = useState<Lending | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [newEndDate, setNewEndDate] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'cancel' | 'start' | 'return' | null>(null);

  const { data: myRequestsData, isLoading: loadingRequests } = useQuery({
    queryKey: ['lendings', 'my-requests'],
    queryFn: async () => {
      const response = await lendingsApi.getMyRequests();
      return response.data;
    },
  });

  const { data: incomingData, isLoading: loadingIncoming } = useQuery({
    queryKey: ['lendings', 'incoming'],
    queryFn: async () => {
      const response = await lendingsApi.getIncomingRequests();
      return response.data;
    },
  });

  const myRequests: Lending[] = myRequestsData?.data?.items || [];
  const incomingRequests: Lending[] = incomingData?.data?.items || [];

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['lendings'] });
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) => lendingsApi.approve(id),
    onSuccess: () => {
      invalidateQueries();
      setConfirmDialogOpen(false);
      setSelectedLending(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => lendingsApi.reject(id, reason),
    onSuccess: () => {
      invalidateQueries();
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedLending(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => lendingsApi.cancel(id),
    onSuccess: () => {
      invalidateQueries();
      setConfirmDialogOpen(false);
      setSelectedLending(null);
    },
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => lendingsApi.start(id),
    onSuccess: () => {
      invalidateQueries();
      setConfirmDialogOpen(false);
      setSelectedLending(null);
    },
  });

  const returnMutation = useMutation({
    mutationFn: (id: string) => lendingsApi.return(id),
    onSuccess: () => {
      invalidateQueries();
      setConfirmDialogOpen(false);
      setSelectedLending(null);
    },
  });

  const extendMutation = useMutation({
    mutationFn: ({ id, newEndDate }: { id: string; newEndDate: string }) =>
      lendingsApi.extend(id, newEndDate),
    onSuccess: () => {
      invalidateQueries();
      setExtendDialogOpen(false);
      setNewEndDate('');
      setSelectedLending(null);
    },
  });

  const getStatusVariant = (status: LendingStatus) => {
    switch (status) {
      case 'PENDING':
        return 'secondary';
      case 'APPROVED':
        return 'default';
      case 'ACTIVE':
        return 'success';
      case 'REJECTED':
      case 'CANCELLED':
        return 'destructive';
      case 'RETURNED':
        return 'outline';
      case 'OVERDUE':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const handleConfirmAction = () => {
    if (!selectedLending || !confirmAction) return;

    switch (confirmAction) {
      case 'approve':
        approveMutation.mutate(selectedLending.id);
        break;
      case 'cancel':
        cancelMutation.mutate(selectedLending.id);
        break;
      case 'start':
        startMutation.mutate(selectedLending.id);
        break;
      case 'return':
        returnMutation.mutate(selectedLending.id);
        break;
    }
  };

  const openConfirmDialog = (lending: Lending, action: 'approve' | 'cancel' | 'start' | 'return') => {
    setSelectedLending(lending);
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };

  const openRejectDialog = (lending: Lending) => {
    setSelectedLending(lending);
    setRejectDialogOpen(true);
  };

  const openExtendDialog = (lending: Lending) => {
    setSelectedLending(lending);
    setNewEndDate(lending.endDate?.split('T')[0] || '');
    setExtendDialogOpen(true);
  };

  const getConfirmDialogContent = () => {
    switch (confirmAction) {
      case 'approve':
        return {
          title: t('lendings.approve'),
          description: `${t('lendings.approve')} "${selectedLending?.toolName || 'tool'}"?`,
        };
      case 'cancel':
        return {
          title: t('lendings.cancel'),
          description: `${t('lendings.cancel')} "${selectedLending?.toolName || 'tool'}"?`,
        };
      case 'start':
        return {
          title: t('lendings.confirmPickup'),
          description: `${t('lendings.confirmPickupDesc')} "${selectedLending?.toolName || 'tool'}"?`,
        };
      case 'return':
        return {
          title: t('lendings.return'),
          description: `${t('lendings.confirmReturn')} "${selectedLending?.toolName || 'tool'}"?`,
        };
      default:
        return { title: '', description: '' };
    }
  };

  const isPending = approveMutation.isPending || rejectMutation.isPending ||
    cancelMutation.isPending || startMutation.isPending ||
    returnMutation.isPending || extendMutation.isPending;

  const LendingCard = ({
    lending,
    isBorrower = false,
    isLender = false,
  }: {
    lending: Lending;
    isBorrower?: boolean;
    isLender?: boolean;
  }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{lending.toolName || 'Tool'}</CardTitle>
            <CardDescription>
              {formatDateShort(lending.startDate, i18n.language)} - {formatDateShort(lending.endDate, i18n.language)}
            </CardDescription>
          </div>
          <Badge variant={getStatusVariant(lending.status)}>
            {t(`lendings.statuses.${lending.status.toLowerCase()}`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {lending.message && (
          <p className="text-sm text-muted-foreground mb-4">{lending.message}</p>
        )}

        {/* Action buttons based on status and role */}
        <div className="flex flex-wrap gap-2">
          {/* Lender actions */}
          {isLender && lending.status === 'PENDING' && (
            <>
              <Button size="sm" onClick={() => openConfirmDialog(lending, 'approve')} disabled={isPending}>
                <Check className="mr-1 h-4 w-4" />
                {t('lendings.approve')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => openRejectDialog(lending)} disabled={isPending}>
                <X className="mr-1 h-4 w-4" />
                {t('lendings.reject')}
              </Button>
            </>
          )}

          {/* Lender can confirm pickup for APPROVED */}
          {isLender && lending.status === 'APPROVED' && (
            <Button size="sm" onClick={() => openConfirmDialog(lending, 'start')} disabled={isPending}>
              <Play className="mr-1 h-4 w-4" />
              {t('lendings.confirmPickup')}
            </Button>
          )}

          {/* Lender can confirm return for ACTIVE or OVERDUE */}
          {isLender && (lending.status === 'ACTIVE' || lending.status === 'OVERDUE') && (
            <Button size="sm" onClick={() => openConfirmDialog(lending, 'return')} disabled={isPending}>
              <RotateCcw className="mr-1 h-4 w-4" />
              {t('lendings.return')}
            </Button>
          )}

          {/* Borrower actions */}
          {isBorrower && (lending.status === 'PENDING' || lending.status === 'APPROVED') && (
            <Button size="sm" variant="outline" onClick={() => openConfirmDialog(lending, 'cancel')} disabled={isPending}>
              <Ban className="mr-1 h-4 w-4" />
              {t('lendings.cancel')}
            </Button>
          )}

          {/* Borrower can request extension for ACTIVE */}
          {isBorrower && lending.status === 'ACTIVE' && (
            <Button size="sm" variant="outline" onClick={() => openExtendDialog(lending)} disabled={isPending}>
              <Clock className="mr-1 h-4 w-4" />
              {t('lendings.extend')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const dialogContent = getConfirmDialogContent();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('lendings.title')}</h1>
        <p className="text-muted-foreground">
          {t('lendings.manageRequests')}
        </p>
      </div>

      <Tabs defaultValue="my-requests">
        <TabsList>
          <TabsTrigger value="my-requests">
            {t('lendings.myRequests')} ({myRequests.length})
          </TabsTrigger>
          <TabsTrigger value="incoming">
            {t('lendings.incomingRequests')} ({incomingRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-requests" className="mt-6">
          {loadingRequests ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : myRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">{t('lendings.noLendings')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {myRequests.map((lending) => (
                <LendingCard key={lending.id} lending={lending} isBorrower />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="incoming" className="mt-6">
          {loadingIncoming ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : incomingRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">{t('lendings.noLendings')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {incomingRequests.map((lending) => (
                <LendingCard key={lending.id} lending={lending} isLender />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirm Action Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogContent.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction} disabled={isPending}>
              {isPending ? t('common.loading') : t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('lendings.reject')}</DialogTitle>
            <DialogDescription>
              {t('lendings.rejectDesc')} "{selectedLending?.toolName}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">{t('lendings.rejectReason')}</Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
                placeholder={t('lendings.rejectReasonPlaceholder')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedLending && rejectMutation.mutate({ id: selectedLending.id, reason: rejectReason })}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? t('common.loading') : t('lendings.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('lendings.extend')}</DialogTitle>
            <DialogDescription>
              {t('lendings.extendDesc')} "{selectedLending?.toolName}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newEndDate">{t('lendings.newEndDate')}</Label>
              <Input
                id="newEndDate"
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                min={selectedLending?.endDate?.split('T')[0] || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => selectedLending && extendMutation.mutate({ id: selectedLending.id, newEndDate })}
              disabled={!newEndDate || extendMutation.isPending}
            >
              {extendMutation.isPending ? t('common.loading') : t('lendings.extend')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
