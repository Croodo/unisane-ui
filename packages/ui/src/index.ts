export {
  WindowSizeProvider,
  useWindowSize,
} from "./layout/window-size-provider";
export { ThemeProvider, useTheme, useColorScheme, useDensity, clearStoredTheme } from "./layout/theme-provider";
export type { Theme, Density, RadiusTheme, ColorScheme, ContrastLevel, ColorTheme, Elevation, ThemeConfig } from "./layout/theme-provider";
export { ThemeSwitcher } from "./components/theme-switcher";
export { Container } from "./layout/container";
export { AppLayout, AppLayout as Scaffold } from "./layout/app-layout";
export { Pane, PaneLayout, PaneDivider } from "./layout/pane";

export { Text } from "./primitives/text";
export { Surface } from "./primitives/surface";
export { StateLayer } from "./primitives/state-layer";
export { FocusRing } from "./primitives/focus-ring";
export {
  Icon,
  CheckIcon,
  ChevronRightIcon,
  CloseIcon,
  MenuIcon,
} from "./primitives/icon";

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./components/accordion";
export type { AccordionProps, AccordionItemProps } from "./components/accordion";
export { Avatar, AvatarGroup } from "./components/avatar";
export type { AvatarProps } from "./components/avatar";
export { BottomAppBar, BottomAppBarAction } from "./components/bottom-app-bar";
export type { BottomAppBarProps, BottomAppBarActionProps } from "./components/bottom-app-bar";
export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "./components/breadcrumb";
export { Calendar } from "./components/calendar";
export type { CalendarProps } from "./components/calendar";
export { Carousel, CarouselSlide } from "./components/carousel";
export type { CarouselProps, CarouselSlideProps } from "./components/carousel";
export { DateInput } from "./components/date-input";
export type { DateInputProps } from "./components/date-input";
export { DatePicker } from "./components/date-picker";
export type { DatePickerProps } from "./components/date-picker";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./components/dropdown-menu";
export {
  List,
  ListItem,
  ListItemContent,
  ListItemText,
  ListSubheader,
} from "./components/list";
export type { ListItemProps, ListItemContentProps, ListItemTextProps } from "./components/list";
export { Pagination } from "./components/pagination";
export type { PaginationProps } from "./components/pagination";
export { Progress } from "./components/progress";
export type { ProgressProps } from "./components/progress";
export { Rating } from "./components/rating";
export type { RatingProps } from "./components/rating";
export { Ripple } from "./components/ripple";
export {
  SegmentedButton,
  SegmentedButtonItem,
} from "./components/segmented-button";
export type { SegmentedButtonProps, SegmentedButtonItemProps } from "./components/segmented-button";
export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
} from "./components/skeleton";
export type { SkeletonProps } from "./components/skeleton";
export { Slider } from "./components/slider";
export type { SliderProps } from "./components/slider";
export {
  Stepper,
  Step,
  StepLabel,
  StepDescription,
} from "./components/stepper";
export type { StepperProps, StepProps, StepLabelProps } from "./components/stepper";
export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./components/table";
export { Button } from "./components/button";
export type { ButtonProps } from "./components/button";
export { IconButton } from "./components/icon-button";
export type { IconButtonProps } from "./components/icon-button";
export { TextField } from "./components/text-field";
export type { TextFieldProps } from "./components/text-field";
export { Checkbox } from "./components/checkbox";
export { Radio } from "./components/radio";
export { Switch } from "./components/switch";
export { Card } from "./components/card";
export type { CardProps } from "./components/card";
export { Select } from "./components/select";
export { Sheet } from "./components/sheet";
export { Chip } from "./components/chip";
export type { ChipProps } from "./components/chip";
export { Badge } from "./components/badge";
export type { BadgeProps } from "./components/badge";
export { Alert } from "./components/alert";
export type { AlertProps } from "./components/alert";
export { Banner } from "./components/banner";
export type { BannerProps } from "./components/banner";
export {
  toast,
  useToast,
  Toaster,
  ToastProvider,
} from "./components/toast";
export type {
  Toast,
  ToastOptions,
  ToastVariant,
  ToastPosition,
  ToastAction,
  ToasterProps,
  ToastProviderProps,
} from "./components/toast";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/tabs";
export type { TabsProps, TabsTriggerProps } from "./components/tabs";
export { Divider } from "./components/divider";
export type { DividerProps } from "./components/divider";
export { Typography } from "./components/typography";
export type { TypographyProps } from "./components/typography";

export {
  Nav,
  NavItem,
  NavGroup,
  useNavigationState,
  useNavigationHover,
  useNavigationItems,
  useNavigationBreakpoint,
} from "./components/navigation";
export type {
  NavProps,
  NavItemProps,
  NavGroupProps,
  NavigationItem,
  NavigationGroup,
  NavigationState,
  NavigationHoverState,
  UseNavigationStateConfig,
  UseNavigationHoverConfig,
  ProcessedNavigationItems,
  NavigationBreakpoint,
  NavigationVariant,
  NavigationDensity,
  NavigationDrawerMode,
  NavigationDrawerSide,
  NavigationBarVariant,
  NavigationScrollBehavior,
} from "./components/navigation";

export { NavigationBar } from "./components/navigation-bar";
export type { NavigationBarProps, NavigationBarItemProps } from "./components/navigation-bar";
export {
  NavigationDrawer,
  NavigationDrawerItem,
  NavigationDrawerHeadline,
  NavigationDrawerDivider,
} from "./components/navigation-drawer";
export { NavigationRail, type RailItem } from "./components/navigation-rail";
export { TopAppBar } from "./components/top-app-bar";
export type { TopAppBarProps } from "./components/top-app-bar";
export { SearchBar } from "./components/search-bar";
export type { SearchBarProps } from "./components/search-bar";
export { Fab } from "./components/fab";
export type { FabProps } from "./components/fab";
export { FabMenu } from "./components/fab-menu";
export type { FabMenuProps } from "./components/fab-menu";
export { ScrollArea } from "./components/scroll-area";
export type { ScrollAreaProps } from "./components/scroll-area";
export { TimePicker } from "./components/time-picker";
export type { TimePickerProps } from "./components/time-picker";
export { Popover } from "./components/popover";
export type { PopoverProps } from "./components/popover";
export { Tooltip } from "./components/tooltip";
export type { TooltipProps } from "./components/tooltip";
export { Dialog } from "./components/dialog";
export type { DialogProps } from "./components/dialog";
export { ConfirmDialog } from "./components/confirm-dialog";
export type { ConfirmDialogProps } from "./components/confirm-dialog";
export { Combobox } from "./components/combobox";
export type { ComboboxProps } from "./components/combobox";
export {
  SupportingPaneLayout,
  ListDetailLayout,
  FeedLayout,
  PaneGroup,
} from "./components/canonical-layouts";

// Sidebar - Rail + Drawer navigation system
export {
  SidebarProvider,
  useSidebar,
  Sidebar,
  SidebarRail,
  SidebarRailItem,
  SidebarDrawer,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarBackdrop,
  SidebarInset,
  SidebarCollapsibleGroup,
} from "./components/sidebar";
export type {
  SidebarState,
  SidebarProviderProps,
  SidebarProps,
  SidebarRailProps,
  SidebarRailItemProps,
  SidebarDrawerProps,
  SidebarHeaderProps,
  SidebarFooterProps,
  SidebarContentProps,
  SidebarGroupProps,
  SidebarGroupLabelProps,
  SidebarMenuProps,
  SidebarMenuItemProps,
  SidebarTriggerProps,
  SidebarBackdropProps,
  SidebarInsetProps,
  SidebarCollapsibleGroupProps,
} from "./components/sidebar";

export { cn } from "./lib/utils";

// Hooks
export { useScrollLock } from "./hooks/use-scroll-lock";
