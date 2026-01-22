import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { lendingsApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDateShort } from '@/lib/utils';
import type { Lending, LendingStatus } from '@/types';

export function LendingsPage() {
  const { t, i18n } = useTranslation();

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

  const myRequests: Lending[] = myRequestsData?.data || [];
  const incomingRequests: Lending[] = incomingData?.data || [];

  const getStatusVariant = (status: LendingStatus) => {
    switch (status) {
      case 'PENDING':
        return 'secondary';
      case 'APPROVED':
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

  const LendingCard = ({ lending, showActions = false }: { lending: Lending; showActions?: boolean }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{lending.tool?.name || 'Tool'}</CardTitle>
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
        {showActions && lending.status === 'PENDING' && (
          <div className="flex gap-2">
            <Button size="sm" variant="default">
              {t('lendings.approve')}
            </Button>
            <Button size="sm" variant="outline">
              {t('lendings.reject')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('lendings.title')}</h1>
        <p className="text-muted-foreground">
          Manage your lending requests
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
                <LendingCard key={lending.id} lending={lending} />
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
                <LendingCard key={lending.id} lending={lending} showActions />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
