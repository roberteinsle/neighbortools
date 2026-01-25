import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wrench, Users, Heart, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/context/auth-store';
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();
  const { getLocalizedPath } = useLocalizedNavigate();

  if (isAuthenticated) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('home.welcome')}, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('common.appName')} - {t('home.tagline')}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('nav.myTools')}
              </CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                {t('home.manageInventory')}
              </p>
              <Link to={getLocalizedPath('/tools/my')}>
                <Button variant="outline" size="sm">
                  {t('tools.myTools')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('nav.lendings')}
              </CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                {t('home.viewLendings')}
              </p>
              <Link to={getLocalizedPath('/lendings')}>
                <Button variant="outline" size="sm">
                  {t('lendings.title')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('nav.neighborhoods')}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                {t('home.manageNeighborhoods')}
              </p>
              <Link to={getLocalizedPath('/neighborhoods')}>
                <Button variant="outline" size="sm">
                  {t('neighborhoods.title')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('tools.title')}</CardTitle>
            <CardDescription>
              {t('home.browseTools')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to={getLocalizedPath('/tools')}>
              <Button>
                {t('tools.searchPlaceholder')} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8">
      <div className="space-y-4">
        <Wrench className="h-20 w-20 text-primary mx-auto" />
        <h1 className="text-4xl font-bold tracking-tight">
          {t('common.appName')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-lg">
          {t('home.tagline')}
        </p>
      </div>

      <div className="flex gap-4">
        <Link to={getLocalizedPath('/register')}>
          <Button size="lg">
            {t('auth.register')}
          </Button>
        </Link>
        <Link to={getLocalizedPath('/login')}>
          <Button variant="outline" size="lg">
            {t('auth.login')}
          </Button>
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-3 mt-16 max-w-4xl">
        <div className="space-y-2">
          <Wrench className="h-10 w-10 text-primary mx-auto" />
          <h3 className="font-semibold">{t('home.shareTools')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('home.shareToolsDesc')}
          </p>
        </div>
        <div className="space-y-2">
          <Users className="h-10 w-10 text-primary mx-auto" />
          <h3 className="font-semibold">{t('home.joinNeighborhoods')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('home.joinNeighborhoodsDesc')}
          </p>
        </div>
        <div className="space-y-2">
          <Heart className="h-10 w-10 text-primary mx-auto" />
          <h3 className="font-semibold">{t('home.borrowLend')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('home.borrowLendDesc')}
          </p>
        </div>
      </div>
    </div>
  );
}
