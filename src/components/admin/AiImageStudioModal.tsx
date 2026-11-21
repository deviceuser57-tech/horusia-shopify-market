import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageIcon } from "lucide-react";

export const AiImageStudioModal = () => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const chooseFile = (selected: File | null) => {
    setFile(selected);
    if (!selected) {
      setPreview(null);
      return;
    }
    setPreview(URL.createObjectURL(selected));
  };

  const saveDraft = async () => {
    if (!file) {
      toast.error("Select a source image first.");
      return;
    }
    setWorking(true);
    const path = `ai-image-drafts/${crypto.randomUUID()}-${file.name}`;
    const upload = await supabase.storage.from("media-assets").upload(path, file, { upsert: false });
    if (upload.error) {
      setWorking(false);
      toast.error("The image could not be uploaded.");
      return;
    }
    const publicUrl = supabase.storage.from("media-assets").getPublicUrl(path).data.publicUrl;
    await supabase.from("agent_action_proposals").insert({
      agent_name: "CREATIVE_AI",
      action_type: "publish_product",
      target_type: "media_asset",
      proposed_value: { sourceUrl: publicUrl, prompt },
      evidence: [{ type: "uploaded_asset", source: "admin" }],
      confidence: "draft",
      status: "PENDING_APPROVAL",
    });
    setWorking(false);
    setOpen(false);
    toast.success("Image draft saved for approval.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline"><ImageIcon className="mr-2 h-4 w-4" />AI image studio</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Product image draft studio</DialogTitle></DialogHeader>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-3">
            <div><Label>Source image</Label><Input type="file" accept="image/*" onChange={(e) => chooseFile(e.target.files?.[0] ?? null)} /></div>
            <div><Label>Creative direction</Label><Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the approved style and background." /></div>
            <Button onClick={saveDraft} disabled={working} className="w-full">{working ? "Saving..." : "Save image draft"}</Button>
          </div>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {preview ? <img src={preview} alt="Draft preview" className="h-full w-full object-cover" /> : <ImageIcon className="h-12 w-12 text-muted-foreground" />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
