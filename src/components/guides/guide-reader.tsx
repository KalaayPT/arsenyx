"use client";

import { useMemo } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { SerializedEditorState } from "lexical";
import {
    InitialConfigType,
    LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";

import { editorTheme } from "@/components/editor/themes/editor-theme";
import { nodes } from "@/components/blocks/editor-x/nodes";

import { CodeHighlightPlugin } from "@/components/editor/plugins/code-highlight-plugin";
import { ImagesPlugin } from "@/components/editor/plugins/images-plugin";
import { TwitterPlugin } from "@/components/editor/plugins/embeds/twitter-plugin";
import { YouTubePlugin } from "@/components/editor/plugins/embeds/youtube-plugin";
import { LayoutPlugin } from "@/components/editor/plugins/layout-plugin";

// Read-only config for rendering
const readOnlyConfig: InitialConfigType = {
    namespace: "GuideReader",
    theme: editorTheme,
    nodes,
    editable: false,
    onError: (error: Error) => {
        console.error("Guide renderer error:", error);
    },
};

interface GuideReaderProps {
    content: SerializedEditorState;
}

function ReadOnlySetup() {
    const [editor] = useLexicalComposerContext();

    useMemo(() => {
        editor.setEditable(false);
    }, [editor]);

    return null;
}

export function GuideReader({ content }: GuideReaderProps) {
    return (
        <div className="guide-content prose prose-neutral dark:prose-invert max-w-none">
            <LexicalComposer
                initialConfig={{
                    ...readOnlyConfig,
                    editorState: JSON.stringify(content),
                }}
            >
                <ReadOnlySetup />
                <RichTextPlugin
                    contentEditable={
                        <ContentEditable className="outline-none focus:outline-none [&_p]:my-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_hr]:my-8 [&_hr]:border-border" />
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <ListPlugin />
                <CheckListPlugin />
                <TablePlugin />
                <HorizontalRulePlugin />
                <ClickableLinkPlugin />
                <CodeHighlightPlugin />
                <ImagesPlugin />
                <TwitterPlugin />
                <YouTubePlugin />
                <LayoutPlugin />
            </LexicalComposer>
        </div>
    );
}
