import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Trash2, Calendar } from 'lucide-react';
import { toolsApi, lendingsApi } from '@/lib/api';
import { useAuthStore } from '@/context/auth-store';
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import type { Tool } from '@/types';

export function ToolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { navigate } = useLocalizedNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestData, setRequestData] = useState({
    startDate: '',
    endDate: '',
    message: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['tool', id],
    queryFn: async () => {
      const response = await toolsApi.getById(id!);
      return response.data;
    },
    enabled: !!id,
  });

  const tool: Tool | undefined = data?.data;
  const isOwner = user?.id === tool?.ownerId;

  const toggleAvailabilityMutation = useMutation({
    mutationFn: (isAvailable: boolean) => toolsApi.toggleAvailability(id!, isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool', id] });
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => toolsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      navigate('/tools');
    },
  });

  const requestMutation = useMutation({
    mutationFn: (data: {
      toolId: string;
      toolName: string;
      lenderId: string;
      neighborhoodId: string;
      startDate: string;
      endDate: string;
      message?: string;
    }) => lendingsApi.create(data),
    onSuccess: () => {
      setRequestDialogOpen(false);
      setRequestData({ startDate: '', endDate: '', message: '' });
      navigate('/lendings');
    },
  });

  const getCategoryDisplay = (tool: Tool) => {
    if (tool.categoryData) {
      return `${tool.categoryData.emoji || ''} ${tool.categoryData.name}`;
    }
    if (tool.category) {
      return tool.category.toLowerCase().replace('_', ' ');
    }
    return 'Other';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/tools')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">{t('tools.noTools')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleRequestSubmit = () => {
    if (requestData.startDate && requestData.endDate && tool) {
      requestMutation.mutate({
        toolId: id!,
        toolName: tool.name,
        lenderId: tool.ownerId,
        neighborhoodId: tool.neighborhoodId,
        startDate: requestData.startDate,
        endDate: requestData.endDate,
        message: requestData.message || undefined,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/tools')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>
        {isOwner && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/tools/${id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('common.edit')}
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t('common.delete')}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Tool Image */}
        <Card>
          <CardContent className="p-0">
            {tool.imageUrl ? (
              <img
                src={`/api${tool.imageUrl}`}
                alt={tool.name}
                className="w-full h-[400px] object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-[400px] bg-muted flex items-center justify-center rounded-lg">
                <span className="text-muted-foreground">{t('tools.noPhotos')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tool Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{tool.name}</CardTitle>
                  <CardDescription>
                    {getCategoryDisplay(tool)}
                  </CardDescription>
                </div>
                <Badge variant={tool.isAvailable ? 'success' : 'secondary'}>
                  {tool.isAvailable ? t('tools.available') : t('tools.borrowed')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{tool.description}</p>

              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {t(`tools.conditions.${tool.condition.toLowerCase()}`)}
                </Badge>
              </div>

              {isOwner && (
                <div className="flex items-center space-x-2 pt-4 border-t">
                  <Switch
                    id="availability"
                    checked={tool.isAvailable}
                    onCheckedChange={(checked: boolean) => toggleAvailabilityMutation.mutate(checked)}
                    disabled={toggleAvailabilityMutation.isPending}
                  />
                  <Label htmlFor="availability">
                    {tool.isAvailable ? t('tools.available') : t('tools.unavailable')}
                  </Label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Request Button for non-owners */}
          {!isOwner && tool.isAvailable && (
            <Button className="w-full" onClick={() => setRequestDialogOpen(true)}>
              <Calendar className="mr-2 h-4 w-4" />
              {t('lendings.requestTool')}
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tools.deleteTool')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('neighborhoods.confirmDelete', { name: tool.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? t('common.loading') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Request Tool Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('lendings.requestTool')}</DialogTitle>
            <DialogDescription>
              {t('lendings.requestTool')} - {tool.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t('lendings.startDate')}</Label>
              <Input
                id="startDate"
                type="date"
                value={requestData.startDate}
                onChange={(e) => setRequestData({ ...requestData, startDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">{t('lendings.endDate')}</Label>
              <Input
                id="endDate"
                type="date"
                value={requestData.endDate}
                onChange={(e) => setRequestData({ ...requestData, endDate: e.target.value })}
                min={requestData.startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">{t('lendings.message')}</Label>
              <Textarea
                id="message"
                value={requestData.message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRequestData({ ...requestData, message: e.target.value })}
                placeholder={t('lendings.message')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleRequestSubmit}
              disabled={!requestData.startDate || !requestData.endDate || requestMutation.isPending}
            >
              {requestMutation.isPending ? t('common.loading') : t('common.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
