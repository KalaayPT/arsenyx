"use client";

import { GuideEditor } from "./guide-editor";
import { GuideReader } from "@/components/guides/guide-reader";
import { PartnerBuildsSection } from "@/components/build/partner-builds-section";
import type { PartnerBuild } from "./partner-build-card";
import type { PartnerBuildOption } from "./partner-build-selector";

export interface BuildEditorGuideSectionProps {
  canEdit: boolean;
  savedBuildId?: string;
  isAuthenticated: boolean;
  guideSummary: string;
  setGuideSummary: (v: string) => void;
  guideDescription: string;
  setGuideDescription: (v: string) => void;
  partnerBuilds: PartnerBuild[];
  availableBuilds: PartnerBuildOption[];
}

export function BuildEditorGuideSection({
  canEdit,
  savedBuildId,
  isAuthenticated,
  guideSummary,
  setGuideSummary,
  guideDescription,
  setGuideDescription,
  partnerBuilds,
  availableBuilds,
}: BuildEditorGuideSectionProps) {
  return (
    <>
      {/* Build Guide - New builds */}
      {canEdit && !savedBuildId && (
        <div className="bg-card/50 border rounded-xl overflow-hidden">
          <div className="border-b bg-muted/30 px-6 py-4">
            <h2 className="text-lg font-semibold">Build Guide</h2>
          </div>
          <div className="p-6 flex flex-col gap-6">
            <GuideEditor
              buildId=""
              initialSummary={guideSummary}
              initialDescription={guideDescription}
              onSummaryChange={setGuideSummary}
              onDescriptionChange={setGuideDescription}
              initialPartnerBuilds={partnerBuilds as PartnerBuild[]}
              availableBuilds={availableBuilds}
              showPartnerBuilds={isAuthenticated}
              showSaveButtons={false}
            />
            <p className="text-xs text-muted-foreground">
              Your guide will be saved when you publish the build.
            </p>
          </div>
        </div>
      )}

      {/* Build Guide - Existing builds */}
      {savedBuildId && (
        <div className="bg-card/50 border rounded-xl overflow-hidden">
          <div className="border-b bg-muted/30 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Build Guide</h2>
          </div>
          <div className="p-6 flex flex-col gap-6">
            {canEdit ? (
              <GuideEditor
                buildId={savedBuildId}
                initialSummary={guideSummary}
                initialDescription={guideDescription}
                onSummaryChange={setGuideSummary}
                onDescriptionChange={setGuideDescription}
                initialPartnerBuilds={partnerBuilds as PartnerBuild[]}
                availableBuilds={availableBuilds}
                showPartnerBuilds={true}
                showSaveButtons={false}
              />
            ) : (
              <>
                {guideSummary || guideDescription || partnerBuilds.length > 0 ? (
                  <>
                    {guideSummary && (
                      <div className="text-muted-foreground">{guideSummary}</div>
                    )}
                    {guideDescription && (
                      <GuideReader content={guideDescription} />
                    )}
                    {partnerBuilds.length > 0 && (
                      <PartnerBuildsSection partnerBuilds={partnerBuilds} />
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No guide written yet.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
