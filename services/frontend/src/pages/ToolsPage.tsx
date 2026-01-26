import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, ArrowLeft, ChevronRight } from 'lucide-react';
import { categoriesApi, toolsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Tool, Category } from '@/types';

export function ToolsPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');

  const categoryId = searchParams.get('category');
  const language = (i18n.language?.toUpperCase() || 'EN') as 'EN' | 'DE' | 'ES' | 'FR';

  // Fetch top-level categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', 'top-level', language],
    queryFn: async () => {
      const response = await categoriesApi.getTopLevel({ language });
      return response.data;
    },
  });

  // Fetch selected category with children
  const { data: selectedCategoryData } = useQuery({
    queryKey: ['category', categoryId, language],
    queryFn: async () => {
      if (!categoryId) return null;
      const response = await categoriesApi.getWithChildren(categoryId, { language });
      return response.data;
    },
    enabled: !!categoryId,
  });

  // Fetch tools when category is selected
  const { data: toolsData, isLoading: toolsLoading } = useQuery({
    queryKey: ['tools', { categoryId, search }],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (categoryId) params.category = categoryId;
      const response = await toolsApi.getAll(params);
      return response.data;
    },
    enabled: !!categoryId || !!search,
  });

  const categories: Category[] = categoriesData?.data || [];
  const selectedCategory: Category | null = selectedCategoryData?.data || null;
  const tools: Tool[] = toolsData?.data?.items || [];

  const handleCategoryClick = (catId: string) => {
    setSearchParams({ category: catId });
    setSearch('');
  };

  const handleBackToCategories = () => {
    setSearchParams({});
    setSearch('');
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    if (value) {
      // When searching, clear category filter
      setSearchParams({});
    }
  };

  // Show search results
  if (search) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('tools.title')}</h1>
            <p className="text-muted-foreground">
              {t('tools.searchResults', { count: tools.length, query: search })}
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
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={() => setSearch('')}>
            {t('common.clear')}
          </Button>
        </div>

        {toolsLoading ? (
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
          <ToolGrid tools={tools} />
        )}
      </div>
    );
  }

  // Show tools in selected category
  if (categoryId && selectedCategory) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleBackToCategories}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {selectedCategory.emoji} {selectedCategory.name}
              </h1>
              {selectedCategory.parent && (
                <p className="text-muted-foreground">
                  {selectedCategory.parent.emoji} {selectedCategory.parent.name}
                </p>
              )}
            </div>
          </div>
          <Link to={`/tools/new?category=${categoryId}`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('tools.addTool')}
            </Button>
          </Link>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('tools.searchPlaceholder')}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Show subcategories if any */}
        {selectedCategory.children && selectedCategory.children.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">{t('tools.subcategories')}</h2>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {selectedCategory.children.map((child) => (
                <Card
                  key={child.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleCategoryClick(child.id)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{child.emoji}</span>
                      <span className="font-medium">{child.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{child.toolCount}</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tools in this category */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            {t('tools.toolsInCategory', { count: tools.length })}
          </h2>
          {toolsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : tools.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">{t('tools.noToolsInCategory')}</p>
                <Link to={`/tools/new?category=${categoryId}`} className="mt-4">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('tools.addFirstTool')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <ToolGrid tools={tools} />
          )}
        </div>
      </div>
    );
  }

  // Show category grid (default view)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('tools.title')}</h1>
          <p className="text-muted-foreground">{t('tools.browseCategories')}</p>
        </div>
        <Link to="/tools/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('tools.addTool')}
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('tools.searchPlaceholder')}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {categoriesLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">{t('tools.noCategories')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => handleCategoryClick(category.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-4xl">{category.emoji}</span>
                  <Badge variant="secondary">{category.toolCount}</Badge>
                </div>
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {category.children && category.children.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {category.children.slice(0, 3).map((child) => (
                      <Badge key={child.id} variant="outline" className="text-xs">
                        {child.emoji} {child.name}
                      </Badge>
                    ))}
                    {category.children.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{category.children.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" className="w-full justify-between">
                  {t('tools.viewCategory')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Tool grid component
function ToolGrid({ tools }: { tools: Tool[] }) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <Card key={tool.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{tool.name}</CardTitle>
                <CardDescription>
                  {tool.categoryData?.emoji} {tool.categoryData?.name || tool.category}
                </CardDescription>
              </div>
              <Badge variant={tool.isAvailable ? 'success' : 'secondary'}>
                {tool.isAvailable ? t('tools.available') : t('tools.borrowed')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">{tool.description}</p>
            <div className="mt-2">
              <Badge variant="outline">
                {t(`tools.conditions.${tool.condition.toLowerCase()}`)}
              </Badge>
            </div>
          </CardContent>
          <CardFooter>
            <Link to={`/tools/${tool.id}`} className="w-full">
              <Button variant="outline" className="w-full">
                {t('tools.viewDetails')}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
