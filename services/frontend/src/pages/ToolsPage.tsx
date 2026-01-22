import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Filter } from 'lucide-react';
import { toolsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Tool, ToolCategory } from '@/types';

const categories: ToolCategory[] = [
  'POWER_TOOLS', 'HAND_TOOLS', 'GARDEN', 'AUTOMOTIVE',
  'CLEANING', 'PAINTING', 'PLUMBING', 'ELECTRICAL', 'OTHER'
];

export function ToolsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['tools', { search, category }],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (category && category !== 'all') params.category = category;
      const response = await toolsApi.getAll(params);
      return response.data;
    },
  });

  const tools: Tool[] = data?.data || [];

  const getCategoryKey = (cat: string) => {
    return cat.toLowerCase() as keyof typeof t;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('tools.title')}</h1>
          <p className="text-muted-foreground">
            Browse and search for available tools
          </p>
        </div>
        <Link to="/tools/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('tools.addTool')}
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('tools.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder={t('tools.category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {t(`tools.categories.${getCategoryKey(cat)}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : tools.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">{t('tools.noTools')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Card key={tool.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                    <CardDescription>
                      {t(`tools.categories.${getCategoryKey(tool.category)}`)}
                    </CardDescription>
                  </div>
                  <Badge variant={tool.available ? 'success' : 'secondary'}>
                    {tool.available ? t('tools.available') : t('tools.borrowed')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {tool.description}
                </p>
                <div className="mt-2">
                  <Badge variant="outline">
                    {t(`tools.conditions.${tool.condition.toLowerCase()}`)}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Link to={`/tools/${tool.id}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
