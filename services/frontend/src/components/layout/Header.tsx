import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, Wrench, LogOut, User, Globe } from 'lucide-react';
import { useAuthStore } from '@/context/auth-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
];

export function Header() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { getLocalizedPath, changeLanguage, currentLang } = useLocalizedNavigate();

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link to={getLocalizedPath('/')} className="flex items-center space-x-2">
          <Wrench className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">{t('common.appName')}</span>
        </Link>

        <nav className="ml-auto flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Link to={getLocalizedPath('/tools')}>
                <Button variant="ghost">{t('nav.tools')}</Button>
              </Link>
              <Link to={getLocalizedPath('/lendings')}>
                <Button variant="ghost">{t('nav.lendings')}</Button>
              </Link>
              <Link to={getLocalizedPath('/neighborhoods')}>
                <Button variant="ghost">{t('nav.neighborhoods')}</Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {getInitials(user?.firstName, user?.lastName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={getLocalizedPath('/profile')} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      {t('nav.profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Globe className="mr-2 h-4 w-4" />
                      {t('profile.language')}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {languages.map((lang) => (
                        <DropdownMenuItem
                          key={lang.code}
                          onClick={() => changeLanguage(lang.code)}
                          className={currentLang === lang.code ? 'bg-accent' : ''}
                        >
                          {lang.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  {user?.role === 'ADMIN' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={getLocalizedPath('/admin')} className="cursor-pointer">
                          <Menu className="mr-2 h-4 w-4" />
                          {t('nav.admin')}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Globe className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={currentLang === lang.code ? 'bg-accent' : ''}
                    >
                      {lang.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Link to={getLocalizedPath('/login')}>
                <Button variant="ghost">{t('auth.login')}</Button>
              </Link>
              <Link to={getLocalizedPath('/register')}>
                <Button>{t('auth.register')}</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
