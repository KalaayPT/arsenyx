import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORIES, type BrowseCategory } from "@/lib/warframe";

interface CategoryTabsProps {
  activeCategory: BrowseCategory;
  onChange: (category: BrowseCategory) => void;
}

export function CategoryTabs({ activeCategory, onChange }: CategoryTabsProps) {
  return (
    <Tabs value={activeCategory} onValueChange={(v) => onChange(v as BrowseCategory)}>
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
        {CATEGORIES.map((c) => (
          <TabsTrigger
            key={c.id}
            value={c.id}
            className="data-[state=active]:bg-muted data-[state=active]:text-foreground"
          >
            {c.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
