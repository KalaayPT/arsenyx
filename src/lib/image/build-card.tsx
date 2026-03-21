import type { BuildState, PlacedMod, PlacedArcane } from "@/lib/warframe/types";

const WIDTH = 1200;
const HEIGHT = 630;

const COLORS = {
  bg: "#09090b",          // zinc-950
  cardBg: "#18181b",      // zinc-900
  border: "#27272a",      // zinc-800
  text: "#fafafa",        // zinc-50
  textMuted: "#a1a1aa",   // zinc-400
  accent: "#3b82f6",      // blue-500
  emptySlot: "#1c1c20",
};

const RARITY_COLORS: Record<string, string> = {
  Common: "#C79989",
  Uncommon: "#BEC0C2",
  Rare: "#FBECC4",
  Legendary: "#DFDFDF",
  Peculiar: "#DFDFDF",
  Riven: "#D9A8FF",
  Amalgam: "#98D9EB",
  Galvanized: "#7CB8E4",
};

function getRarityBorderColor(rarity?: string): string {
  if (!rarity) return COLORS.border;
  return RARITY_COLORS[rarity] ?? COLORS.border;
}

function ModCard({ mod }: { mod: PlacedMod }) {
  const borderColor = getRarityBorderColor(mod.rarity);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        backgroundColor: COLORS.cardBg,
        border: `1px solid ${borderColor}`,
        borderRadius: 6,
        width: 250,
        height: 44,
        overflow: "hidden",
      }}
    >
      <span
        style={{
          fontSize: 13,
          color: borderColor,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
        }}
      >
        {mod.name}
      </span>
      <span
        style={{
          fontSize: 11,
          color: COLORS.textMuted,
          flexShrink: 0,
        }}
      >
        R{mod.rank}
      </span>
    </div>
  );
}

function EmptySlot() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 250,
        height: 44,
        backgroundColor: COLORS.emptySlot,
        border: `1px dashed ${COLORS.border}`,
        borderRadius: 6,
      }}
    >
      <span style={{ fontSize: 12, color: COLORS.border }}>Empty</span>
    </div>
  );
}

function ArcaneCard({ arcane }: { arcane: PlacedArcane }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        backgroundColor: COLORS.cardBg,
        border: `1px solid ${COLORS.accent}`,
        borderRadius: 6,
        height: 40,
      }}
    >
      <span
        style={{
          fontSize: 13,
          color: COLORS.text,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {arcane.name}
      </span>
      <span style={{ fontSize: 11, color: COLORS.textMuted, flexShrink: 0 }}>
        R{arcane.rank}
      </span>
    </div>
  );
}

export interface BuildCardProps {
  buildState: BuildState;
  buildName: string;
  itemName: string;
  authorName: string;
  itemImageSrc?: string; // base64 data URI or undefined
}

export function BuildCardTemplate({
  buildState,
  buildName,
  itemName,
  authorName,
  itemImageSrc,
}: BuildCardProps) {
  const { normalSlots, auraSlot, exilusSlot, arcaneSlots, formaCount } =
    buildState;

  const arcanes = (arcaneSlots ?? []).filter(
    (a): a is PlacedArcane => a !== null
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: WIDTH,
        height: HEIGHT,
        backgroundColor: COLORS.bg,
        padding: 32,
        fontFamily: "Geist",
        color: COLORS.text,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Item image */}
        {itemImageSrc ? (
          <img
            src={itemImageSrc}
            width={64}
            height={64}
            style={{ borderRadius: 8 }}
          />
        ) : (
          <div
            style={{
              width: 64,
              height: 64,
              backgroundColor: COLORS.cardBg,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 24, color: COLORS.border }}>?</span>
          </div>
        )}

        {/* Build info */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {buildName}
          </span>
          <span style={{ fontSize: 14, color: COLORS.textMuted }}>
            {itemName} · by {authorName}
            {formaCount > 0 ? ` · ${formaCount} forma` : ""}
          </span>
        </div>

        {/* Branding */}
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: COLORS.textMuted,
            letterSpacing: 2,
          }}
        >
          ARSENYX
        </span>
      </div>

      {/* Aura + Exilus row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {auraSlot && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase" }}>
              Aura
            </span>
            {auraSlot.mod ? <ModCard mod={auraSlot.mod} /> : <EmptySlot />}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase" }}>
            Exilus
          </span>
          {exilusSlot?.mod ? <ModCard mod={exilusSlot.mod} /> : <EmptySlot />}
        </div>
      </div>

      {/* Normal mod grid (4x2) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {/* Row 1: slots 0-3 */}
        <div style={{ display: "flex", gap: 8 }}>
          {normalSlots.slice(0, 4).map((slot) =>
            slot.mod ? (
              <ModCard mod={slot.mod} />
            ) : (
              <EmptySlot />
            )
          )}
        </div>
        {/* Row 2: slots 4-7 */}
        <div style={{ display: "flex", gap: 8 }}>
          {normalSlots.slice(4, 8).map((slot) =>
            slot.mod ? (
              <ModCard mod={slot.mod} />
            ) : (
              <EmptySlot />
            )
          )}
        </div>
      </div>

      {/* Arcanes row */}
      {arcanes.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <span
            style={{
              fontSize: 10,
              color: COLORS.textMuted,
              textTransform: "uppercase",
              alignSelf: "center",
              marginRight: 4,
            }}
          >
            Arcanes
          </span>
          {arcanes.map((arcane) => (
            <ArcaneCard arcane={arcane} />
          ))}
        </div>
      )}
    </div>
  );
}
