"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { SerializedEditorState } from "lexical";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Editor } from "@/components/blocks/editor-x/editor";
import { GuideReader } from "@/components/guides/guide-reader";
import {
    GUIDE_CATEGORIES,
    GUIDE_CATEGORY_INFO,
    type GuideCategory,
    createGuide,
} from "@/lib/guides";

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

export default function NewGuidePage() {
    const router = useRouter();
    const [isPreview, setIsPreview] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [summary, setSummary] = useState("");
    const [category, setCategory] = useState<GuideCategory>("systems");
    const [tagsInput, setTagsInput] = useState("");
    const [content, setContent] = useState<SerializedEditorState>(
        createEmptyEditorState()
    );

    // Parse tags from comma-separated input
    const tags = tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

    const isValid = title.trim() && category && summary.trim();

    const handleSave = useCallback(
        async (publish: boolean) => {
            if (!isValid) return;

            setIsSaving(true);
            try {
                const guide = createGuide({
                    title: title.trim(),
                    summary: summary.trim(),
                    category,
                    tags,
                    content,
                    status: publish ? "published" : "draft",
                });

                // Navigate to the new guide
                router.push(`/guides/${guide.slug}`);
            } catch (error) {
                console.error("Failed to save guide:", error);
            } finally {
                setIsSaving(false);
            }
        },
        [title, summary, category, tags, content, isValid, router]
    );

    return (
        <div className="relative min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                <div className="container py-8">
                    {/* Top Actions Bar */}
                    <div className="flex items-center justify-between mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => router.push("/guides")}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Guides
                        </Button>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsPreview(!isPreview)}
                                className="gap-2"
                            >
                                {isPreview ? (
                                    <>
                                        <EyeOff className="h-4 w-4" />
                                        Edit
                                    </>
                                ) : (
                                    <>
                                        <Eye className="h-4 w-4" />
                                        Preview
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleSave(false)}
                                disabled={!isValid || isSaving}
                            >
                                Save Draft
                            </Button>
                            <Button
                                onClick={() => handleSave(true)}
                                disabled={!isValid || isSaving}
                                className="gap-2"
                            >
                                <Save className="h-4 w-4" />
                                Publish
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
                        {/* Main Editor Area */}
                        <div className="space-y-6">
                            {/* Title */}
                            <div className="space-y-2">
                                <Input
                                    placeholder="Guide title..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="text-2xl font-bold h-14 border-none shadow-none focus-visible:ring-0 px-0"
                                />
                            </div>

                            {/* Content Editor/Preview */}
                            {isPreview ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Preview</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {title && (
                                            <h1 className="text-3xl font-bold mb-4">{title}</h1>
                                        )}
                                        {summary && (
                                            <p className="text-lg text-muted-foreground mb-6">
                                                {summary}
                                            </p>
                                        )}
                                        <GuideReader content={content} />
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="min-h-[500px]">
                                    <Editor
                                        editorSerializedState={content}
                                        onSerializedChange={setContent}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Sidebar - Metadata */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Guide Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Category */}
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Select
                                            value={category}
                                            onValueChange={(v) => setCategory(v as GuideCategory)}
                                        >
                                            <SelectTrigger id="category">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {GUIDE_CATEGORIES.map((cat) => (
                                                    <SelectItem key={cat} value={cat}>
                                                        {GUIDE_CATEGORY_INFO[cat].label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Summary */}
                                    <div className="space-y-2">
                                        <Label htmlFor="summary">Summary</Label>
                                        <Textarea
                                            id="summary"
                                            placeholder="Brief description of the guide..."
                                            value={summary}
                                            onChange={(e) => setSummary(e.target.value)}
                                            rows={3}
                                        />
                                    </div>

                                    {/* Tags */}
                                    <div className="space-y-2">
                                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                                        <Input
                                            id="tags"
                                            placeholder="railjack, beginner, farming"
                                            value={tagsInput}
                                            onChange={(e) => setTagsInput(e.target.value)}
                                        />
                                        {tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {tags.map((tag) => (
                                                    <Badge key={tag} variant="secondary">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Validation Status */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Checklist</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-sm">
                                        <li
                                            className={
                                                title.trim()
                                                    ? "text-green-600 dark:text-green-400"
                                                    : "text-muted-foreground"
                                            }
                                        >
                                            {title.trim() ? "✓" : "○"} Title added
                                        </li>
                                        <li
                                            className={
                                                summary.trim()
                                                    ? "text-green-600 dark:text-green-400"
                                                    : "text-muted-foreground"
                                            }
                                        >
                                            {summary.trim() ? "✓" : "○"} Summary added
                                        </li>
                                        <li
                                            className={
                                                category
                                                    ? "text-green-600 dark:text-green-400"
                                                    : "text-muted-foreground"
                                            }
                                        >
                                            {category ? "✓" : "○"} Category selected
                                        </li>
                                        <li
                                            className={
                                                tags.length > 0
                                                    ? "text-green-600 dark:text-green-400"
                                                    : "text-muted-foreground"
                                            }
                                        >
                                            {tags.length > 0 ? "✓" : "○"} Tags added (optional)
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
