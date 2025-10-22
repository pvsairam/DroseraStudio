import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Globe } from "lucide-react";
import type { BlockchainNetwork, InsertBlockchainNetwork } from "@shared/schema";

export default function BlockchainNetworks() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<BlockchainNetwork | null>(null);

  const { data: networks, isLoading } = useQuery<BlockchainNetwork[]>({
    queryKey: ["/api/admin/blockchain-networks"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertBlockchainNetwork) => 
      apiRequest("POST", "/api/admin/blockchain-networks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blockchain-networks"] });
      setIsDialogOpen(false);
      toast({ title: "Network added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertBlockchainNetwork> }) =>
      apiRequest("PATCH", `/api/admin/blockchain-networks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blockchain-networks"] });
      setIsDialogOpen(false);
      setEditingNetwork(null);
      toast({ title: "Network updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest("DELETE", `/api/admin/blockchain-networks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blockchain-networks"] });
      toast({ title: "Network deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: InsertBlockchainNetwork = {
      name: formData.get("name") as string,
      chainId: parseInt(formData.get("chainId") as string),
      rpcUrl: formData.get("rpcUrl") as string,
      droseraContractAddress: formData.get("droseraContractAddress") as string,
      explorerUrl: formData.get("explorerUrl") as string || undefined,
      isEnabled: formData.get("isEnabled") === "on",
    };

    if (editingNetwork) {
      updateMutation.mutate({ id: editingNetwork.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (network: BlockchainNetwork) => {
    setEditingNetwork(network);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this network?")) {
      deleteMutation.mutate(id);
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingNetwork(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Blockchain Networks</h1>
            <p className="text-muted-foreground">Configure RPC endpoints for blockchain monitoring</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-32 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-4 w-3/4 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Blockchain Networks</h1>
          <p className="text-muted-foreground">Configure RPC endpoints and contract addresses for blockchain monitoring</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-network" onClick={() => setEditingNetwork(null)} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Add Network
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingNetwork ? "Edit Network" : "Add Network"}</DialogTitle>
                <DialogDescription>
                  Configure blockchain network settings for the Drosera indexer
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Network Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Hoodi Testnet"
                    defaultValue={editingNetwork?.name}
                    required
                    data-testid="input-network-name"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="chainId">Chain ID</Label>
                  <Input
                    id="chainId"
                    name="chainId"
                    type="number"
                    placeholder="17000"
                    defaultValue={editingNetwork?.chainId}
                    required
                    data-testid="input-chain-id"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="rpcUrl">RPC URL</Label>
                  <Input
                    id="rpcUrl"
                    name="rpcUrl"
                    type="url"
                    placeholder="https://hoodi.infura.io/v3/..."
                    defaultValue={editingNetwork?.rpcUrl}
                    required
                    data-testid="input-rpc-url"
                  />
                  <p className="text-xs text-muted-foreground">
                    The RPC endpoint used to connect to the blockchain
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="droseraContractAddress">Drosera Contract Address</Label>
                  <Input
                    id="droseraContractAddress"
                    name="droseraContractAddress"
                    placeholder="0x91cB447BaFc6e0EA0F4Fe056F5a9b1F14bb06e5D"
                    defaultValue={editingNetwork?.droseraContractAddress}
                    required
                    data-testid="input-contract-address"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="explorerUrl">Block Explorer URL (optional)</Label>
                  <Input
                    id="explorerUrl"
                    name="explorerUrl"
                    type="url"
                    placeholder="https://hoodi.etherscan.io"
                    defaultValue={editingNetwork?.explorerUrl || ""}
                    data-testid="input-explorer-url"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isEnabled"
                    name="isEnabled"
                    defaultChecked={editingNetwork?.isEnabled ?? true}
                    data-testid="switch-is-enabled"
                  />
                  <Label htmlFor="isEnabled">Enable this network</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {editingNetwork ? "Update" : "Add"} Network
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {networks?.map((network) => (
          <Card key={network.id} data-testid={`card-network-${network.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2" data-testid={`text-network-name-${network.id}`}>
                      {network.name}
                      {network.isEnabled && (
                        <span className="text-xs font-normal px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                          Active
                        </span>
                      )}
                      {!network.isEnabled && (
                        <span className="text-xs font-normal px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          Disabled
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>Chain ID: {network.chainId}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(network)}
                    data-testid={`button-edit-${network.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(network.id)}
                    data-testid={`button-delete-${network.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">RPC Endpoint:</span>
                  <p className="font-mono text-xs mt-1 break-all" data-testid={`text-rpc-url-${network.id}`}>
                    {network.rpcUrl}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Drosera Contract:</span>
                  <p className="font-mono text-xs mt-1 break-all" data-testid={`text-contract-${network.id}`}>
                    {network.droseraContractAddress}
                  </p>
                </div>
                {network.explorerUrl && (
                  <div>
                    <span className="text-muted-foreground">Block Explorer:</span>
                    <a 
                      href={network.explorerUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs ml-2"
                      data-testid={`link-explorer-${network.id}`}
                    >
                      {network.explorerUrl}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {networks?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Globe className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No blockchain networks configured yet.
                <br />
                Add one to start monitoring trap events.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
