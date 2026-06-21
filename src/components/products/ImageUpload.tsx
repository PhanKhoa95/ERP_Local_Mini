import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

const LOCAL_IMAGE_MAX_DIMENSION = 900;
const LOCAL_IMAGE_QUALITY = 0.72;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Khong the doc file anh"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Khong the xu ly file anh"));
    image.src = src;
  });
}

async function createLocalImageDataUrl(file: File) {
  const dataUrl = await readFileAsDataUrl(file);
  if (file.type === "image/svg+xml") return dataUrl;

  const image = await loadImage(dataUrl);
  const scale = Math.min(
    1,
    LOCAL_IMAGE_MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight)
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return dataUrl;

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", LOCAL_IMAGE_QUALITY);
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng chọn file hình ảnh",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Kích thước file không được vượt quá 5MB",
      });
      return;
    }

    setIsUploading(true);

    try {
      if (isLocalDemoAuthEnabled()) {
        const dataUrl = await createLocalImageDataUrl(file);
        onChange(dataUrl);
        toast({ title: "Da chon hinh anh local" });
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      onChange(data.publicUrl);
      toast({ title: "Upload hình ảnh thành công" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Lỗi upload",
        description: error.message || "Không thể upload hình ảnh",
      });
    } finally {
      setIsUploading(false);
    }
  }, [onChange, toast]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        uploadFile(file);
      }
    },
    [uploadFile]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleRemove = async () => {
    if (value && !value.startsWith("data:")) {
      try {
        // Extract file path from URL
        const url = new URL(value);
        const pathParts = url.pathname.split("/");
        const filePath = pathParts.slice(-2).join("/");
        
        await supabase.storage.from("product-images").remove([filePath]);
      } catch (error) {
        console.error("Error removing file:", error);
      }
    }
    onChange(null);
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative group">
          <div className="aspect-square w-full max-w-[200px] rounded-lg overflow-hidden border border-border">
            <img
              src={value}
              alt="Product"
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
            disabled={disabled || isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={disabled || isUploading}
          />
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            {isUploading ? (
              <>
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Đang upload...</p>
              </>
            ) : (
              <>
                <div className="p-3 rounded-full bg-primary/10">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Kéo thả hình ảnh vào đây
                  </p>
                  <p className="text-xs text-muted-foreground">
                    hoặc click để chọn file (tối đa 5MB)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
