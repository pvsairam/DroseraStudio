import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Settings,
  Menu as MenuIcon,
  Layout,
  Database,
  Shield,
  Bell,
  Users,
  Plug,
  Palette,
  Download,
  Plus,
  Trash2,
  Edit,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import EmptyState from "@/components/EmptyState";
import type { TrapType, DataSource, MenuConfig, Integration } from "@shared/schema";
import { useTheme, type ThemeSettings } from "@/contexts/ThemeContext";

const configSections = [
  { id: "menus", label: "Menus", icon: MenuIcon },
  { id: "traps", label: "Trap Types", icon: Shield },
  { id: "datasources", label: "Data Sources", icon: Database },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "theme", label: "Theme", icon: Palette },
];

function TrapTypesManager() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTrap, setEditingTrap] = useState<TrapType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "security",
    description: "",
    severity: "medium",
  });

  const { data: trapTypes = [], isLoading } = useQuery<TrapType[]>({
    queryKey: ["/api/trap-types"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/trap-types", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trap-types"] });
      setIsAddDialogOpen(false);
      setFormData({ name: "", category: "security", description: "", severity: "medium" });
      toast({ title: "Trap type created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating trap type", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/trap-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trap-types"] });
      toast({ title: "Trap type deleted successfully" });
    },
  });

  const handleSubmit = () => {
    createMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Trap Types</h3>
          <p className="text-sm text-muted-foreground">Define the types of traps to monitor</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-trap-type">
          <Plus className="w-4 h-4 mr-2" />
          Add Trap Type
        </Button>
      </div>

      {trapTypes.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={Shield}
              title="No trap types configured"
              description="Create your first trap type to start monitoring blockchain events"
              actionLabel="Add Trap Type"
              onAction={() => setIsAddDialogOpen(true)}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trapTypes.map((trap) => (
                <TableRow key={trap.id} data-testid={`row-trap-${trap.id}`}>
                  <TableCell className="font-medium">{trap.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{trap.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        trap.severity === "critical"
                          ? "destructive"
                          : trap.severity === "high"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {trap.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                    {trap.description}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(trap.id)}
                        data-testid={`button-delete-trap-${trap.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Trap Type</DialogTitle>
            <DialogDescription>Create a new trap type to monitor blockchain events</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Liquidity Pool Monitor"
                data-testid="input-trap-name"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger data-testid="select-trap-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="liquidity">Liquidity</SelectItem>
                  <SelectItem value="governance">Governance</SelectItem>
                  <SelectItem value="oracle">Oracle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v })}>
                <SelectTrigger data-testid="select-trap-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this trap monitors..."
                data-testid="textarea-trap-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-save-trap">
              {createMutation.isPending ? "Creating..." : "Create Trap Type"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MenusManager() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuConfig | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    path: "",
    icon: "",
    order: 0,
    allowedRoles: ["master_admin", "admin", "viewer"] as string[],
    isVisible: true,
  });

  const { data: menus = [], isLoading } = useQuery<MenuConfig[]>({
    queryKey: ["/api/config/menus"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/config/menus", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config/menus"] });
      setIsAddDialogOpen(false);
      setFormData({ name: "", path: "", icon: "", order: 0 });
      toast({ title: "Menu item created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating menu", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest("PATCH", `/api/config/menus/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config/menus"] });
      setIsAddDialogOpen(false);
      setEditingMenu(null);
      setFormData({ name: "", path: "", icon: "", order: 0 });
      toast({ title: "Menu item updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating menu", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/config/menus/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config/menus"] });
      toast({ title: "Menu item deleted successfully" });
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Navigation Menus</h3>
          <p className="text-sm text-muted-foreground">Configure navigation menu items</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-menu">
          <Plus className="w-4 h-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      {menus.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={MenuIcon}
              title="No menu items configured"
              description="Add menu items to customize navigation"
              actionLabel="Add Menu Item"
              onAction={() => setIsAddDialogOpen(true)}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Allowed Roles</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menus.sort((a, b) => a.order - b.order).map((menu) => (
                <TableRow key={menu.id} data-testid={`row-menu-${menu.id}`}>
                  <TableCell className="font-medium">{menu.order}</TableCell>
                  <TableCell>{menu.name}</TableCell>
                  <TableCell className="font-mono text-xs">{menu.route}</TableCell>
                  <TableCell><Badge variant="secondary">{menu.icon || "N/A"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {(menu.allowedRoles as string[] || []).map((role) => (
                        <Badge key={role} variant="outline" className="text-xs">
                          {role === 'master_admin' ? 'Master' : role === 'admin' ? 'Admin' : 'Viewer'}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingMenu(menu);
                          setFormData({
                            name: menu.name,
                            path: menu.route,
                            icon: menu.icon,
                            order: menu.order,
                            allowedRoles: (menu.allowedRoles as string[]) || ["master_admin", "admin", "viewer"],
                            isVisible: menu.isVisible,
                          });
                          setIsAddDialogOpen(true);
                        }}
                        data-testid={`button-edit-menu-${menu.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(menu.id)}
                        data-testid={`button-delete-menu-${menu.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          setEditingMenu(null);
          setFormData({ name: "", path: "", icon: "", order: 0, allowedRoles: ["master_admin", "admin", "viewer"], isVisible: true });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMenu ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
            <DialogDescription>
              {editingMenu ? "Update navigation menu item" : "Create a new navigation menu item"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Dashboard"
                data-testid="input-menu-name"
              />
            </div>
            <div>
              <Label htmlFor="path">Path</Label>
              <Input
                id="path"
                value={formData.path}
                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                placeholder="e.g., /dashboard"
                data-testid="input-menu-path"
              />
            </div>
            <div>
              <Label htmlFor="icon">Icon (optional)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="e.g., dashboard"
                data-testid="input-menu-icon"
              />
            </div>
            <div>
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                placeholder="0"
                data-testid="input-menu-order"
              />
            </div>
            <div>
              <Label>Allowed Roles</Label>
              <div className="space-y-2 mt-2">
                {['master_admin', 'admin', 'viewer'].map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={formData.allowedRoles.includes(role)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, allowedRoles: [...formData.allowedRoles, role] });
                        } else {
                          setFormData({ ...formData, allowedRoles: formData.allowedRoles.filter(r => r !== role) });
                        }
                      }}
                      data-testid={`checkbox-role-${role}`}
                    />
                    <Label htmlFor={`role-${role}`} className="font-normal cursor-pointer">
                      {role === 'master_admin' ? 'Master Admin' : role === 'admin' ? 'Admin' : 'Viewer'}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isVisible"
                checked={formData.isVisible}
                onCheckedChange={(checked) => setFormData({ ...formData, isVisible: !!checked })}
                data-testid="checkbox-visible"
              />
              <Label htmlFor="isVisible" className="font-normal cursor-pointer">
                Visible in sidebar
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              setEditingMenu(null);
              setFormData({ name: "", path: "", icon: "", order: 0, allowedRoles: ["master_admin", "admin", "viewer"], isVisible: true });
            }}>Cancel</Button>
            <Button 
              onClick={() => {
                if (editingMenu) {
                  updateMutation.mutate({ id: editingMenu.id, data: formData });
                } else {
                  createMutation.mutate(formData);
                }
              }} 
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-menu"
            >
              {editingMenu
                ? (updateMutation.isPending ? "Updating..." : "Update Menu Item")
                : (createMutation.isPending ? "Creating..." : "Create Menu Item")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AlertsManager() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    condition: "",
    severity: "medium",
    actions: "",
  });

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["/api/alerts"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/alerts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      setIsAddDialogOpen(false);
      setFormData({ name: "", condition: "", severity: "medium", actions: "" });
      toast({ title: "Alert rule created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating alert", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/alerts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({ title: "Alert rule deleted successfully" });
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Alert Rules</h3>
          <p className="text-sm text-muted-foreground">Configure alert rules and notifications</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-alert">
          <Plus className="w-4 h-4 mr-2" />
          Add Alert Rule
        </Button>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={Bell}
              title="No alert rules configured"
              description="Create alert rules to get notified of important events"
              actionLabel="Add Alert Rule"
              onAction={() => setIsAddDialogOpen(true)}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert: any) => (
                <TableRow key={alert.id} data-testid={`row-alert-${alert.id}`}>
                  <TableCell className="font-medium">{alert.name}</TableCell>
                  <TableCell>
                    <Badge variant={alert.severity === "critical" ? "destructive" : "default"}>
                      {alert.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs max-w-xs truncate">{alert.condition}</TableCell>
                  <TableCell>
                    <Badge variant={alert.isActive ? "default" : "secondary"}>
                      {alert.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(alert.id)}
                      data-testid={`button-delete-alert-${alert.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Alert Rule</DialogTitle>
            <DialogDescription>Create a new alert rule for monitoring</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., High Value Transfer Alert"
                data-testid="input-alert-name"
              />
            </div>
            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v })}>
                <SelectTrigger data-testid="select-alert-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Input
                id="condition"
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                placeholder="e.g., amount > 1000"
                data-testid="input-alert-condition"
              />
            </div>
            <div>
              <Label htmlFor="actions">Actions (comma-separated)</Label>
              <Input
                id="actions"
                value={formData.actions}
                onChange={(e) => setFormData({ ...formData, actions: e.target.value })}
                placeholder="e.g., email,slack,telegram"
                data-testid="input-alert-actions"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => createMutation.mutate(formData)} 
              disabled={createMutation.isPending}
              data-testid="button-save-alert"
            >
              {createMutation.isPending ? "Creating..." : "Create Alert Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IntegrationsManager() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "webhook",
    config: "",
  });

  const { data: integrations = [], isLoading } = useQuery<Integration[]>({
    queryKey: ["/api/integrations"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/integrations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      setIsAddDialogOpen(false);
      setFormData({ name: "", type: "webhook", config: "" });
      toast({ title: "Integration created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating integration", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/integrations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({ title: "Integration deleted successfully" });
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Integrations</h3>
          <p className="text-sm text-muted-foreground">Connect third-party services</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-integration">
          <Plus className="w-4 h-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {integrations.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={Plug}
              title="No integrations configured"
              description="Connect services like Discord, Telegram, or Slack"
              actionLabel="Add Integration"
              onAction={() => setIsAddDialogOpen(true)}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {integrations.map((integration) => (
                <TableRow key={integration.id} data-testid={`row-integration-${integration.id}`}>
                  <TableCell className="font-medium">{integration.name}</TableCell>
                  <TableCell><Badge variant="secondary">{integration.type}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={integration.isActive ? "default" : "secondary"}>
                      {integration.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(integration.id)}
                      data-testid={`button-delete-integration-${integration.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Integration</DialogTitle>
            <DialogDescription>Connect a new third-party service</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Discord Webhook"
                data-testid="input-integration-name"
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger data-testid="select-integration-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="discord">Discord</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="config">Configuration (JSON)</Label>
              <Textarea
                id="config"
                value={formData.config}
                onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                placeholder='{"webhookUrl": "https://..."}'
                data-testid="textarea-integration-config"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => createMutation.mutate(formData)} 
              disabled={createMutation.isPending}
              data-testid="button-save-integration"
            >
              {createMutation.isPending ? "Creating..." : "Create Integration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DataSourcesManager() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "rest",
    endpoint: "",
    description: "",
  });

  const { data: dataSources = [], isLoading } = useQuery<DataSource[]>({
    queryKey: ["/api/data-sources"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/data-sources", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/data-sources"] });
      setIsAddDialogOpen(false);
      setFormData({ name: "", type: "rest", endpoint: "", description: "" });
      toast({ title: "Data source created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating data source", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/data-sources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/data-sources"] });
      toast({ title: "Data source deleted successfully" });
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Data Sources</h3>
          <p className="text-sm text-muted-foreground">Configure data sources for your dashboard</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-data-source">
          <Plus className="w-4 h-4 mr-2" />
          Add Data Source
        </Button>
      </div>

      {dataSources.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={Database}
              title="No data sources configured"
              description="Add data sources to power your dashboard components"
              actionLabel="Add Data Source"
              onAction={() => setIsAddDialogOpen(true)}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataSources.map((source) => (
                <TableRow key={source.id} data-testid={`row-datasource-${source.id}`}>
                  <TableCell className="font-medium">{source.name}</TableCell>
                  <TableCell><Badge variant="secondary">{source.type}</Badge></TableCell>
                  <TableCell className="font-mono text-xs max-w-md truncate">{source.endpoint}</TableCell>
                  <TableCell>
                    <Badge variant={source.isActive ? "default" : "secondary"}>
                      {source.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(source.id)}
                      data-testid={`button-delete-datasource-${source.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Data Source</DialogTitle>
            <DialogDescription>Connect a new data source to your dashboard</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Ethereum Mainnet"
                data-testid="input-datasource-name"
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger data-testid="select-datasource-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rest">REST API</SelectItem>
                  <SelectItem value="graphql">GraphQL</SelectItem>
                  <SelectItem value="websocket">WebSocket</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="endpoint">Endpoint URL</Label>
              <Input
                id="endpoint"
                value={formData.endpoint}
                onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                placeholder="https://api.example.com"
                data-testid="input-datasource-endpoint"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this data source..."
                data-testid="textarea-datasource-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => createMutation.mutate(formData)} 
              disabled={createMutation.isPending}
              data-testid="button-save-datasource"
            >
              {createMutation.isPending ? "Creating..." : "Create Data Source"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminConfig() {
  const [activeTab, setActiveTab] = useState("traps");
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      const response = await apiRequest("POST", "/api/config/export");
      const data = await response.json();
      
      if (!data || Object.keys(data).length === 0) {
        throw new Error("Received empty configuration data");
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `drosera-config-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Configuration exported successfully" });
    } catch (error: any) {
      toast({ title: "Export failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6"
      data-testid="page-admin-config"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Configuration</h1>
          <p className="text-sm text-muted-foreground">
            Manage all aspects of your dashboard without touching code
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Export Config
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-2 mb-6 bg-transparent h-auto p-0">
          {configSections.map((section) => {
            const Icon = section.icon;
            return (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-card data-[state=active]:border-card-border border border-transparent rounded-lg hover-elevate"
                data-testid={`tab-${section.id}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{section.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="traps" className="mt-6">
          <TrapTypesManager />
        </TabsContent>

        <TabsContent value="datasources" className="mt-6">
          <DataSourcesManager />
        </TabsContent>

        <TabsContent value="menus" className="mt-6">
          <MenusManager />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <AlertsManager />
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <IntegrationsManager />
        </TabsContent>

        <TabsContent value="theme" className="mt-6">
          <ThemeManager />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function ThemeManager() {
  const { toast } = useToast();
  const { theme: currentTheme, setTheme, isLoading: themeLoading } = useTheme();
  const [selectedPreset, setSelectedPreset] = useState<string>("blue");
  const [originalTheme, setOriginalTheme] = useState<ThemeSettings | null>(null);
  
  const { data: themeSetting, isLoading } = useQuery({
    queryKey: ["/api/config/theme"],
  });

  const saveMutation = useMutation({
    mutationFn: (data: ThemeSettings) => apiRequest("PUT", "/api/config/theme", { key: "theme", value: data }),
    onSuccess: (_, variables) => {
      queryClient.setQueryData(["/api/config/theme"], { key: "theme", value: variables });
      toast({ title: "Theme saved successfully" });
      setOriginalTheme(null);
    },
    onError: (error: any) => {
      toast({ title: "Error saving theme", description: error.message, variant: "destructive" });
    },
  });

  const presets = [
    {
      id: "blue",
      name: "Ocean Blue",
      description: "Current default theme",
      colors: {
        primaryHue: 217,
        primarySaturation: 91,
        primaryLightness: 60,
      },
    },
    {
      id: "orange",
      name: "Drosera Orange",
      description: "Official Drosera brand color",
      colors: {
        primaryHue: 16,
        primarySaturation: 100,
        primaryLightness: 58,
      },
    },
    {
      id: "purple",
      name: "Royal Purple",
      description: "Rich and professional",
      colors: {
        primaryHue: 262,
        primarySaturation: 83,
        primaryLightness: 58,
      },
    },
    {
      id: "green",
      name: "Forest Green",
      description: "Natural and trustworthy",
      colors: {
        primaryHue: 142,
        primarySaturation: 76,
        primaryLightness: 36,
      },
    },
  ];

  const applyPreview = (preset: any) => {
    if (!originalTheme) {
      setOriginalTheme(currentTheme);
    }
    setSelectedPreset(preset.id);
    setTheme(preset.colors);
  };

  const resetPreview = () => {
    if (originalTheme) {
      setTheme(originalTheme, true);
      setOriginalTheme(null);
    }
  };

  const handleSave = () => {
    setTheme(currentTheme, true);
    saveMutation.mutate(currentTheme);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  const currentPreset = themeSetting?.value?.preset || "blue";
  const isPreviewing = originalTheme !== null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Theme Customization</h3>
        <p className="text-sm text-muted-foreground">Preview and select a color scheme for your dashboard</p>
      </div>

      {isPreviewing && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Palette className="w-4 h-4 text-primary" />
              <span className="font-medium">Preview Mode Active</span>
              <span className="text-muted-foreground">Changes not saved yet</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetPreview} data-testid="button-cancel-preview">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-theme">
                {saveMutation.isPending ? "Saving..." : "Save Theme"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {presets.map((preset) => (
          <Card
            key={preset.id}
            className={`cursor-pointer transition-all hover-elevate ${
              currentPreset === preset.id && !isPreviewing ? "border-primary ring-2 ring-primary/20" : ""
            } ${selectedPreset === preset.id && isPreviewing ? "border-primary ring-2 ring-primary/50" : ""}`}
            onClick={() => applyPreview(preset)}
            data-testid={`card-theme-${preset.id}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-base">{preset.name}</CardTitle>
                {currentPreset === preset.id && !isPreviewing && (
                  <Badge variant="secondary" data-testid={`badge-current-${preset.id}`}>Current</Badge>
                )}
              </div>
              <CardDescription className="text-xs">{preset.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div
                  className="w-12 h-12 rounded-md border border-border"
                  style={{
                    backgroundColor: `hsl(${preset.colors.primaryHue}, ${preset.colors.primarySaturation}%, ${preset.colors.primaryLightness}%)`,
                  }}
                  data-testid={`color-preview-${preset.id}`}
                />
                <div
                  className="w-12 h-12 rounded-md border border-border"
                  style={{
                    backgroundColor: `hsl(${preset.colors.primaryHue}, ${preset.colors.primarySaturation}%, ${Math.min(preset.colors.primaryLightness + 10, 70)}%)`,
                  }}
                />
                <div
                  className="w-12 h-12 rounded-md border border-border"
                  style={{
                    backgroundColor: `hsl(${preset.colors.primaryHue}, ${preset.colors.primarySaturation}%, ${Math.max(preset.colors.primaryLightness - 10, 40)}%)`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Click any theme card to preview it instantly</p>
          <p>• Navigate to other pages to see how the theme looks across the dashboard</p>
          <p>• Click "Save Theme" to make your selection permanent</p>
          <p>• Only master admins can change the theme</p>
        </CardContent>
      </Card>
    </div>
  );
}
