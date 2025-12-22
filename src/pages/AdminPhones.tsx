import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { useAllPhones, useBrands, useCreatePhone, useUpdatePhone, useDeletePhone } from "@/hooks/usePhones";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2, Upload, Loader2 } from "lucide-react";
import type { Phone, PhoneWithBrand } from "@/types/database";

interface PhoneFormData {
  brand_id: string;
  model: string;
  price: number;
  sale_price: number | null;
  storage_options: string[];
  display_size: string;
  processor: string;
  ram: string;
  camera: string;
  battery: string;
  release_year: number | null;
  description: string;
  images: string[];
  is_featured: boolean;
  is_published: boolean;
}

const initialFormData: PhoneFormData = {
  brand_id: "",
  model: "",
  price: 0,
  sale_price: null,
  storage_options: [],
  display_size: "",
  processor: "",
  ram: "",
  camera: "",
  battery: "",
  release_year: new Date().getFullYear(),
  description: "",
  images: [],
  is_featured: false,
  is_published: true,
};

export default function AdminPhones() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: phones, isLoading: phonesLoading } = useAllPhones();
  const { data: brands } = useBrands();
  const createPhone = useCreatePhone();
  const updatePhone = useUpdatePhone();
  const deletePhone = useDeletePhone();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState<PhoneWithBrand | null>(null);
  const [formData, setFormData] = useState<PhoneFormData>(initialFormData);
  const [storageInput, setStorageInput] = useState("");
  const [uploading, setUploading] = useState(false);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    navigate("/admin");
    return null;
  }

  const handleOpenDialog = (phone?: PhoneWithBrand) => {
    if (phone) {
      setEditingPhone(phone);
      setFormData({
        brand_id: phone.brand_id,
        model: phone.model,
        price: phone.price,
        sale_price: phone.sale_price,
        storage_options: phone.storage_options || [],
        display_size: phone.display_size || "",
        processor: phone.processor || "",
        ram: phone.ram || "",
        camera: phone.camera || "",
        battery: phone.battery || "",
        release_year: phone.release_year,
        description: phone.description || "",
        images: phone.images || [],
        is_featured: phone.is_featured,
        is_published: phone.is_published,
      });
    } else {
      setEditingPhone(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("phone-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("phone-images")
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));

      toast({ title: "Images uploaded successfully" });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleAddStorage = () => {
    if (storageInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        storage_options: [...prev.storage_options, storageInput.trim()],
      }));
      setStorageInput("");
    }
  };

  const handleRemoveStorage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      storage_options: prev.storage_options.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPhone) {
        await updatePhone.mutateAsync({
          id: editingPhone.id,
          ...formData,
        });
        toast({ title: "Phone updated successfully" });
      } else {
        await createPhone.mutateAsync(formData);
        toast({ title: "Phone created successfully" });
      }
      setDialogOpen(false);
      setEditingPhone(null);
      setFormData(initialFormData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (phone: PhoneWithBrand) => {
    if (!confirm(`Are you sure you want to delete ${phone.model}?`)) return;

    try {
      await deletePhone.mutateAsync(phone.id);
      toast({ title: "Phone deleted successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-display text-2xl font-bold">Manage Phones</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Phone
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPhone ? "Edit Phone" : "Add New Phone"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Brand</Label>
                    <Select
                      value={formData.brand_id}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, brand_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands?.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input
                      value={formData.model}
                      onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Price ($)</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, price: parseFloat(e.target.value) }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sale Price ($)</Label>
                    <Input
                      type="number"
                      value={formData.sale_price || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          sale_price: e.target.value ? parseFloat(e.target.value) : null,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Release Year</Label>
                    <Input
                      type="number"
                      value={formData.release_year || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          release_year: e.target.value ? parseInt(e.target.value) : null,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Storage Options</Label>
                  <div className="flex gap-2">
                    <Input
                      value={storageInput}
                      onChange={(e) => setStorageInput(e.target.value)}
                      placeholder="e.g., 128GB"
                    />
                    <Button type="button" variant="outline" onClick={handleAddStorage}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.storage_options.map((option, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-secondary rounded text-sm flex items-center gap-1"
                      >
                        {option}
                        <button type="button" onClick={() => handleRemoveStorage(i)} className="text-muted-foreground hover:text-foreground">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Display Size</Label>
                    <Input
                      value={formData.display_size}
                      onChange={(e) => setFormData((prev) => ({ ...prev, display_size: e.target.value }))}
                      placeholder="6.7 inches"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Processor</Label>
                    <Input
                      value={formData.processor}
                      onChange={(e) => setFormData((prev) => ({ ...prev, processor: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>RAM</Label>
                    <Input
                      value={formData.ram}
                      onChange={(e) => setFormData((prev) => ({ ...prev, ram: e.target.value }))}
                      placeholder="8GB"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Camera</Label>
                    <Input
                      value={formData.camera}
                      onChange={(e) => setFormData((prev) => ({ ...prev, camera: e.target.value }))}
                      placeholder="48MP"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Battery</Label>
                    <Input
                      value={formData.battery}
                      onChange={(e) => setFormData((prev) => ({ ...prev, battery: e.target.value }))}
                      placeholder="5000mAh"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Images</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.images.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt="" className="w-20 h-20 object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_featured: checked }))}
                    />
                    <Label>Featured</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_published: checked }))}
                    />
                    <Label>Published</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="gradient-primary" disabled={createPhone.isPending || updatePhone.isPending}>
                    {(createPhone.isPending || updatePhone.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingPhone ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {phonesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4">
            {phones?.map((phone) => (
              <Card key={phone.id} className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                      {phone.images?.[0] ? (
                        <img src={phone.images[0]} alt={phone.model} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{phone.brand?.name} {phone.model}</h3>
                      <p className="text-sm text-muted-foreground">
                        ${phone.price} {phone.sale_price && <span className="text-primary">• Sale: ${phone.sale_price}</span>}
                      </p>
                      <div className="flex gap-2 mt-1">
                        {phone.is_featured && (
                          <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">Featured</span>
                        )}
                        {!phone.is_published && (
                          <span className="text-xs px-2 py-0.5 rounded bg-destructive/20 text-destructive">Draft</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleOpenDialog(phone)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(phone)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
