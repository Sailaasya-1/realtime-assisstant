"use client";

// The SettingsButton component provides a user interface for viewing and editing application settings.
import { useState, useEffect } from "react";
import { loadSettings, saveSettings, DEFAULT_SETTINGS, type Settings } from "@/lib/SettingsStore";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";


// The SettingsButton component provides a user interface for viewing and editing application settings.
export default function SettingsButton() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  

  // Load settings from storage whenever the dialog is opened
  useEffect(() => {
    setSettings(loadSettings());
  }, [open]);
  
  // Handle saving settings and closing the dialog
  function handleSave() {
    saveSettings(settings);
    setOpen(false);
  }
  
  // Helper function to update individual settings values
  function set(key: keyof Settings, value: string | number) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-slate-700 text-slate-400">
          ⚙ Settings
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">

          {}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Suggestion context (lines)</Label>
              <Input type="number" value={settings.suggestionContextLines}
                onChange={(e) => set("suggestionContextLines", Number(e.target.value))}
                className="bg-slate-800 border-slate-600" />
            </div>
            <div className="space-y-1">
              <Label>Detail context (lines)</Label>
              <Input type="number" value={settings.detailContextLines}
                onChange={(e) => set("detailContextLines", Number(e.target.value))}
                className="bg-slate-800 border-slate-600" />
            </div>
          </div>

          {}
          {(["suggestionPrompt", "detailPrompt", "chatPrompt"] as const).map((key) => (
            <div key={key} className="space-y-1">
              <Label className="capitalize">{key.replace("Prompt", " Prompt")}</Label>
              <Textarea rows={6} value={settings[key] as string}
                onChange={(e) => set(key, e.target.value)}
                className="bg-slate-800 border-slate-600 font-mono text-xs" />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-indigo-600">
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}