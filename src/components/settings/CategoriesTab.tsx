import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, FolderOpen, Loader2, GripVertical, ChevronRight, FolderTree } from "lucide-react";
import { useProductCategories, type ProductCategory, type ProductCategoryInsert } from "@/hooks/useProductCategories";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const PRESET_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
];

interface SortableCategoryItemProps {
  category: ProductCategory;
  isChild?: boolean;
  onEdit: (category: ProductCategory) => void;
  onDelete: (category: ProductCategory) => void;
  children?: React.ReactNode;
}

function SortableCategoryItem({ category, isChild, onEdit, onDelete, children }: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-50")}>
      <div
        className={cn(
          "flex items-center justify-between p-3 rounded-lg border transition-colors",
          category.is_active ? "bg-card" : "bg-muted/50 opacity-60",
          isChild && "ml-8 border-l-4",
        )}
        style={isChild ? { borderLeftColor: category.color || "#3B82F6" } : undefined}
      >
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: category.color || "#3B82F6" }}
          />
          <div>
            <div className="flex items-center gap-2">
              {!isChild && <FolderTree className="h-4 w-4 text-muted-foreground" />}
              {isChild && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              <span className="font-medium">{category.name}</span>
              {category.warranty_months !== undefined && (
                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                  BH: {category.warranty_months} tháng
                </Badge>
              )}
              {!category.is_active && (
                <Badge variant="secondary" className="text-xs">Ẩn</Badge>
              )}
            </div>
            {category.description && (
              <p className="text-sm text-muted-foreground">{category.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(category)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}

export function CategoriesTab() {
  const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useProductCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<ProductCategory | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductCategoryInsert & { warranty_months: number }>({
    name: "",
    description: "",
    color: "#3B82F6",
    is_active: true,
    sort_order: 0,
    parent_id: null,
    warranty_months: 3,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Organize categories into parent-child structure
  const { parentCategories, childrenMap } = useMemo(() => {
    const parents = categories.filter(c => !c.parent_id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const children: Record<string, ProductCategory[]> = {};
    categories.filter(c => c.parent_id).forEach(c => {
      if (!children[c.parent_id!]) children[c.parent_id!] = [];
      children[c.parent_id!].push(c);
    });
    // Sort children
    Object.keys(children).forEach(key => {
      children[key].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    });
    return { parentCategories: parents, childrenMap: children };
  }, [categories]);

  const activeCategory = activeId ? categories.find(c => c.id === activeId) : null;

  const handleOpenDialog = (category?: ProductCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || "",
        color: category.color || "#3B82F6",
        is_active: category.is_active !== false,
        sort_order: category.sort_order || 0,
        parent_id: category.parent_id || null,
        warranty_months: category.warranty_months !== undefined ? category.warranty_months : 3,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        description: "",
        color: "#3B82F6",
        is_active: true,
        sort_order: categories.length,
        parent_id: null,
        warranty_months: 3,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, ...formData });
    } else {
      await createCategory.mutateAsync({ ...formData, name: formData.name! });
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (category: ProductCategory) => {
    setDeletingCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingCategory) {
      await deleteCategory.mutateAsync(deletingCategory.id);
      setDeleteDialogOpen(false);
      setDeletingCategory(null);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeCategory = categories.find(c => c.id === active.id);
    const overCategory = categories.find(c => c.id === over.id);
    if (!activeCategory || !overCategory) return;

    // Same level reordering
    if (activeCategory.parent_id === overCategory.parent_id) {
      const list = activeCategory.parent_id 
        ? childrenMap[activeCategory.parent_id] || []
        : parentCategories;
      
      const oldIndex = list.findIndex(c => c.id === active.id);
      const newIndex = list.findIndex(c => c.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(list, oldIndex, newIndex);
        // Update sort_order for all items
        for (let i = 0; i < reordered.length; i++) {
          if (reordered[i].sort_order !== i) {
            await updateCategory.mutateAsync({ id: reordered[i].id, sort_order: i });
          }
        }
      }
    } else {
      // Moving to different parent
      await updateCategory.mutateAsync({
        id: activeCategory.id,
        parent_id: overCategory.parent_id || overCategory.id,
        sort_order: 0,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const allCategoryIds = categories.map(c => c.id);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Danh mục sản phẩm
          </CardTitle>
          <CardDescription>Quản lý danh mục 2 cấp - kéo thả để sắp xếp</CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm danh mục
        </Button>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có danh mục nào</p>
            <Button className="mt-4" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm danh mục đầu tiên
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={allCategoryIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {parentCategories.map((parent) => (
                  <SortableCategoryItem
                    key={parent.id}
                    category={parent}
                    onEdit={handleOpenDialog}
                    onDelete={handleDeleteClick}
                  >
                    {childrenMap[parent.id] && childrenMap[parent.id].length > 0 && (
                      <div className="space-y-2 mt-2">
                        {childrenMap[parent.id].map((child) => (
                          <SortableCategoryItem
                            key={child.id}
                            category={child}
                            isChild
                            onEdit={handleOpenDialog}
                            onDelete={handleDeleteClick}
                          />
                        ))}
                      </div>
                    )}
                  </SortableCategoryItem>
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeCategory ? (
                <div className="p-3 rounded-lg border bg-card shadow-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: activeCategory.color || "#3B82F6" }}
                    />
                    <span className="font-medium">{activeCategory.name}</span>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </CardContent>

      {/* Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên danh mục *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Điện thoại, Phụ kiện..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Danh mục cha</Label>
              <Select
                value={formData.parent_id || "none"}
                onValueChange={(v) => setFormData({ ...formData, parent_id: v === "none" ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục cha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">-- Không có (Danh mục gốc) --</span>
                  </SelectItem>
                  {parentCategories
                    .filter(c => c.id !== editingCategory?.id)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || "#3B82F6" }} />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Input
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả ngắn về danh mục"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty_months">Thời gian bảo hành (tháng) *</Label>
              <Input
                id="warranty_months"
                type="number"
                min={0}
                max={120}
                value={formData.warranty_months}
                onChange={(e) => setFormData({ ...formData, warranty_months: parseInt(e.target.value) || 0 })}
                placeholder="VD: 12, 6, 3..."
              />
              <p className="text-xs text-muted-foreground">Thời gian bảo hành mặc định cho tất cả sản phẩm thuộc danh mục này.</p>
            </div>

            <div className="space-y-2">
              <Label>Màu sắc</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      formData.color === color ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="is_active">Hiển thị</Label>
                <p className="text-sm text-muted-foreground">Danh mục có hiển thị không</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active !== false}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={createCategory.isPending || updateCategory.isPending}
              >
                {(createCategory.isPending || updateCategory.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingCategory ? "Cập nhật" : "Thêm mới"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa danh mục?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa danh mục "{deletingCategory?.name}"? 
              {childrenMap[deletingCategory?.id || ""]?.length > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Lưu ý: Các danh mục con sẽ không còn thuộc danh mục này.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
