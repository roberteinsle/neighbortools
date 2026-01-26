import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, X, Star, ChevronRight } from 'lucide-react';
import { toolsApi, neighborhoodsApi, categoriesApi } from '@/lib/api';
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Tool, ToolCondition, Neighborhood, Category } from '@/types';

const conditions: ToolCondition[] = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'];

export function ToolFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const { navigate } = useLocalizedNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!id;

  const preselectedCategoryId = searchParams.get('category');
  const language = (i18n.language?.toUpperCase() || 'EN') as 'EN' | 'DE' | 'ES' | 'FR';

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    condition: '' as ToolCondition | '',
    neighborhoodId: '',
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<{ id: string; filename: string; isPrimary: boolean }[]>([]);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [selectedParentCategory, setSelectedParentCategory] = useState<Category | null>(null);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'top-level', language],
    queryFn: async () => {
      const response = await categoriesApi.getTopLevel({ language });
      return response.data;
    },
  });

  const categories: Category[] = categoriesData?.data || [];

  // Fetch selected category details
  const { data: selectedCategoryData } = useQuery({
    queryKey: ['category', formData.categoryId, language],
    queryFn: async () => {
      if (!formData.categoryId) return null;
      const response = await categoriesApi.getWithChildren(formData.categoryId, { language });
      return response.data;
    },
    enabled: !!formData.categoryId,
  });

  const selectedCategory: Category | null = selectedCategoryData?.data || null;

  // Fetch tool data if editing
  const { data: toolData, isLoading: toolLoading } = useQuery({
    queryKey: ['tool', id],
    queryFn: async () => {
      const response = await toolsApi.getById(id!);
      return response.data;
    },
    enabled: isEditing,
  });

  // Fetch neighborhoods for selection
  const { data: neighborhoodsData } = useQuery({
    queryKey: ['neighborhoods', 'my'],
    queryFn: async () => {
      const response = await neighborhoodsApi.getMyNeighborhoods();
      return response.data;
    },
  });

  const neighborhoods: Neighborhood[] = neighborhoodsData?.data?.items || [];

  // Set preselected category from URL
  useEffect(() => {
    if (preselectedCategoryId && !isEditing && !formData.categoryId) {
      setFormData((prev) => ({ ...prev, categoryId: preselectedCategoryId }));
    }
  }, [preselectedCategoryId, isEditing, formData.categoryId]);

  // Populate form when tool data is loaded
  useEffect(() => {
    if (toolData?.data) {
      const tool = toolData.data as Tool;
      setFormData({
        name: tool.name,
        description: tool.description,
        categoryId: tool.categoryId || '',
        condition: tool.condition,
        neighborhoodId: tool.neighborhoodId,
      });
      if (tool.images) {
        setExistingImages(tool.images);
      }
    }
  }, [toolData]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await toolsApi.create({
        name: data.name,
        description: data.description,
        category: data.categoryId, // Backend will need to handle categoryId
        condition: data.condition as string,
        neighborhoodId: data.neighborhoodId,
      });
      return response.data;
    },
    onSuccess: async (data) => {
      const toolId = data.data.id;
      // Upload images if any
      if (selectedFiles.length > 0) {
        await toolsApi.uploadImages(toolId, selectedFiles);
      }
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      navigate(`/tools/${toolId}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await toolsApi.update(id!, {
        name: data.name,
        description: data.description,
        category: data.categoryId, // Backend will need to handle categoryId
        condition: data.condition as string,
      });
      return response.data;
    },
    onSuccess: async () => {
      // Upload new images if any
      if (selectedFiles.length > 0) {
        await toolsApi.uploadImages(id!, selectedFiles);
      }
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      queryClient.invalidateQueries({ queryKey: ['tool', id] });
      navigate(`/tools/${id}`);
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => toolsApi.deleteImage(id!, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool', id] });
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (imageId: string) => toolsApi.setPrimaryImage(id!, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool', id] });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files].slice(0, 5)); // Max 5 images
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCategorySelect = (category: Category, isSubcategory: boolean = false) => {
    if (isSubcategory || !category.children || category.children.length === 0) {
      // Select this category
      setFormData({ ...formData, categoryId: category.id });
      setShowCategorySelector(false);
      setSelectedParentCategory(null);
    } else {
      // Show subcategories
      setSelectedParentCategory(category);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.categoryId || !formData.condition) {
      return;
    }
    if (!isEditing && !formData.neighborhoodId) {
      return;
    }

    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && toolLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(isEditing ? `/tools/${id}` : '/tools')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditing ? t('tools.editTool') : t('tools.addTool')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('tools.category')}</CardTitle>
            <CardDescription>{t('tools.selectCategoryDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCategory ? (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedCategory.emoji}</span>
                  <div>
                    <p className="font-medium">{selectedCategory.name}</p>
                    {selectedCategory.parent && (
                      <p className="text-sm text-muted-foreground">
                        {selectedCategory.parent.emoji} {selectedCategory.parent.name}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCategorySelector(true)}
                >
                  {t('common.edit')}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full h-auto p-6"
                onClick={() => setShowCategorySelector(true)}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl">📂</span>
                  <span>{t('tools.selectCategory')}</span>
                </div>
              </Button>
            )}

            {/* Category Selector Modal-like Section */}
            {showCategorySelector && (
              <div className="mt-4 border rounded-lg p-4 bg-background">
                <div className="flex items-center justify-between mb-4">
                  {selectedParentCategory ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setSelectedParentCategory(null)}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t('common.back')}
                    </Button>
                  ) : (
                    <h3 className="font-semibold">{t('tools.selectCategory')}</h3>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCategorySelector(false);
                      setSelectedParentCategory(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {selectedParentCategory ? (
                  <div className="space-y-2">
                    {/* Option to select parent category itself */}
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                      onClick={() => handleCategorySelect(selectedParentCategory, true)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{selectedParentCategory.emoji}</span>
                        <span className="font-medium">
                          {selectedParentCategory.name} ({t('common.all')})
                        </span>
                      </div>
                    </button>
                    {/* Subcategories */}
                    {selectedParentCategory.children?.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                        onClick={() => handleCategorySelect(child, true)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{child.emoji}</span>
                          <span>{child.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                        onClick={() => handleCategorySelect(category)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category.emoji}</span>
                          <span>{category.name}</span>
                        </div>
                        {category.children && category.children.length > 0 && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tool Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('tools.name')}</CardTitle>
            <CardDescription>{t('tools.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('tools.name')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('tools.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="condition">{t('tools.condition')}</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value as ToolCondition })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('tools.condition')} />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map((cond) => (
                      <SelectItem key={cond} value={cond}>
                        {t(`tools.conditions.${cond.toLowerCase()}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">{t('neighborhoods.title')}</Label>
                  <Select
                    value={formData.neighborhoodId}
                    onValueChange={(value) => setFormData({ ...formData, neighborhoodId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('neighborhoods.title')} />
                    </SelectTrigger>
                    <SelectContent>
                      {neighborhoods.map((n) => (
                        <SelectItem key={n.id} value={n.id}>
                          {n.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Images Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('tools.photos')}</CardTitle>
            <CardDescription>{t('tools.uploadPhotos')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Images (only when editing) */}
            {isEditing && existingImages.length > 0 && (
              <div className="space-y-2">
                <Label>Current Images</Label>
                <div className="flex flex-wrap gap-4">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={`/api/uploads/${img.filename}`}
                        alt="Tool"
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                      {img.isPrimary && (
                        <Star className="absolute top-1 left-1 h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        {!img.isPrimary && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setPrimaryMutation.mutate(img.id)}
                          >
                            <Star className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => deleteImageMutation.mutate(img.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images to Upload */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>New Images</Label>
                <div className="flex flex-wrap gap-4">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => removeSelectedFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={selectedFiles.length + existingImages.length >= 5}
              >
                <Upload className="mr-2 h-4 w-4" />
                {t('tools.uploadPhotos')}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Max 5 images. First image will be the primary.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isPending || !formData.categoryId}
          >
            {isPending ? t('common.loading') : isEditing ? t('common.save') : t('common.create')}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(isEditing ? `/tools/${id}` : '/tools')}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
}
