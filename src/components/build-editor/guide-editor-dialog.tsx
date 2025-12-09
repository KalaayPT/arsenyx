"use client";

import { useState, useEffect, useCallback } from "react";
import { SerializedEditorState } from "lexical";
import { BookOpen, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Editor } from "@/components/blocks/editor-00/editor";

// Empty initial state for the editor
const createEmptyEditorState = (): SerializedEditorState =>
    ({
        root: {
            children: [
                {
                    children: [],
                    direction: null,
                    format: "",
                    indent: 0,
                    type: "paragraph",
                    version: 1,
                },
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "root",
            version: 1,
        },
    }) as unknown as SerializedEditorState;

// Parse stored content (JSON string) to SerializedEditorState
const parseEditorState = (content: string | null | undefined): SerializedEditorState => {
    if (!content) return createEmptyEditorState();
    try {
        return JSON.parse(content) as SerializedEditorState;
    } catch {
        return createEmptyEditorState();
    }
};

// Stringify editor state for storage
const stringifyEditorState = (state: SerializedEditorState): string => {
    return JSON.stringify(state);
};

interface GuideEditorDialogProps {
    buildId: string;
    initialGuide?: string | null;
    initialDescription?: string | null;
    onSaved?: (payload: { guide: string; description: string }) => void;
}

export function GuideEditorDialog({
    buildId,
    initialGuide,
    initialDescription,
    onSaved,
}: GuideEditorDialogProps) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"guide" | "description">("guide");
    const [guideValue, setGuideValue] = useState<SerializedEditorState>(() =>
        parseEditorState(initialGuide)
    );
    const [descriptionValue, setDescriptionValue] = useState<SerializedEditorState>(() =>
        parseEditorState(initialDescription)
    );
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

    // Reset editor state when dialog opens or initial values change
    useEffect(() => {
        if (open) {
            setGuideValue(parseEditorState(initialGuide));
            setDescriptionValue(parseEditorState(initialDescription));
            setSaveStatus("idle");
        }
    }, [open, initialGuide, initialDescription]);

    // Handle save
    const handleSave = useCallback(async () => {
        setIsSaving(true);
        setSaveStatus("idle");

        try {
            const guideString = stringifyEditorState(guideValue);
            const descriptionString = stringifyEditorState(descriptionValue);

            // For now, we'll save to localStorage since we don't have a backend yet
            // In a real implementation, this would call an API endpoint
            const storageKey = `arsenix_build_guide_${buildId}`;
            localStorage.setItem(
                storageKey,
                JSON.stringify({
                    guide: guideString,
                    description: descriptionString,
                })
            );

            // Call the onSaved callback if provided
            onSaved?.({ guide: guideString, description: descriptionString });

            setSaveStatus("saved");

            // Close dialog after short delay to show success state
            setTimeout(() => {
                setOpen(false);
            }, 500);
        } catch (error) {
            console.error("Failed to save guide:", error);
            setSaveStatus("error");
        } finally {
            setIsSaving(false);
        }
    }, [buildId, guideValue, descriptionValue, onSaved]);

    // Handle editor change based on active tab
    const handleEditorChange = useCallback(
        (state: SerializedEditorState) => {
            if (activeTab === "guide") {
                setGuideValue(state);
            } else {
                setDescriptionValue(state);
            }
        },
        [activeTab]
    );

    // Get current editor value based on active tab
    const currentEditorValue = activeTab === "guide" ? guideValue : descriptionValue;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <BookOpen className="w-4 h-4" />
                    Open Guide
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Edit Build Guide</DialogTitle>
                    <DialogDescription>
                        Add a detailed guide and description for your build. Use the Guide tab
                        for step-by-step instructions and the Description tab for a brief overview.
                    </DialogDescription>
                </DialogHeader>

                <Tabs
                    value={activeTab}
                    onValueChange={(value) => setActiveTab(value as "guide" | "description")}
                    className="flex-1 flex flex-col min-h-0"
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="guide">Guide</TabsTrigger>
                        <TabsTrigger value="description">Description</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 min-h-0 mt-4 overflow-hidden">
                        <TabsContent value="guide" className="h-full m-0 data-[state=inactive]:hidden">
                            <div className="h-[400px] overflow-auto">
                                <Editor
                                    key={`guide-${open}`}
                                    editorSerializedState={currentEditorValue}
                                    onSerializedChange={handleEditorChange}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="description" className="h-full m-0 data-[state=inactive]:hidden">
                            <div className="h-[400px] overflow-auto">
                                <Editor
                                    key={`description-${open}`}
                                    editorSerializedState={currentEditorValue}
                                    onSerializedChange={handleEditorChange}
                                />
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                    {saveStatus === "saved" && (
                        <span className="text-sm text-green-600 dark:text-green-400 mr-auto">
                            ✓ Saved successfully
                        </span>
                    )}
                    {saveStatus === "error" && (
                        <span className="text-sm text-destructive mr-auto">
                            Failed to save. Please try again.
                        </span>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isSaving}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
