import * as React from "react"
import {
  Bell,
  Link as LinkIcon,
  Lock,
  Paintbrush,
  Settings as SettingsIcon,
  User,
} from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"

type SectionId =
  | "appearance"
  | "profile"
  | "account"
  | "notifications"
  | "privacy"
  | "advanced"

type Section = {
  id: SectionId
  name: string
  icon: React.ComponentType<{ className?: string }>
}

const SECTIONS: Section[] = [
  { id: "appearance", name: "Appearance", icon: Paintbrush },
  { id: "profile", name: "Profile", icon: User },
  { id: "account", name: "Connected accounts", icon: LinkIcon },
  { id: "notifications", name: "Notifications", icon: Bell },
  { id: "privacy", name: "Privacy", icon: Lock },
  { id: "advanced", name: "Advanced", icon: SettingsIcon },
]

const THEMES = [
  { value: "light" as const, label: "Light" },
  { value: "dark" as const, label: "Dark" },
  { value: "system" as const, label: "System" },
]

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [active, setActive] = React.useState<SectionId>("appearance")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your Arsenyx experience.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar
            collapsible="none"
            className="bg-muted/40 hidden border-r md:flex"
          >
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {SECTIONS.map((item) => {
                      const Icon = item.icon
                      return (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            isActive={item.id === active}
                            onClick={() => setActive(item.id)}
                          >
                            <Icon />
                            <span>{item.name}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">Settings</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        {SECTIONS.find((s) => s.id === active)?.name}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
              <SectionPanel id={active} />
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}

function SectionPanel({ id }: { id: SectionId }) {
  switch (id) {
    case "appearance":
      return <AppearancePanel />
    case "profile":
      return <PlaceholderPanel title="Profile" />
    case "account":
      return <PlaceholderPanel title="Connected accounts" />
    case "notifications":
      return <PlaceholderPanel title="Notifications" />
    case "privacy":
      return <PlaceholderPanel title="Privacy" />
    case "advanced":
      return <PlaceholderPanel title="Advanced" />
  }
}

function AppearancePanel() {
  const { theme, setTheme } = useTheme()
  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Theme</FieldLabel>
        <FieldDescription>
          Choose how Arsenyx looks. System follows your OS preference.
        </FieldDescription>
        <div className="flex gap-2 pt-1">
          {THEMES.map((t) => (
            <Button
              key={t.value}
              variant={theme === t.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme(t.value)}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </Field>
    </FieldGroup>
  )
}

function PlaceholderPanel({ title }: { title: string }) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel>{title}</FieldLabel>
        <FieldDescription>
          Nothing here yet — coming soon.
        </FieldDescription>
        <div className="flex items-center justify-between rounded-md border p-3 opacity-60">
          <span className="text-sm">Placeholder setting</span>
          <Switch disabled />
        </div>
      </Field>
    </FieldGroup>
  )
}
