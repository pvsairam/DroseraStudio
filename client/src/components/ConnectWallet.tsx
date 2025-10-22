import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut, ChevronDown, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useWalletAuth } from '@/hooks/useWalletAuth';

function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ConnectWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const { user, isAuthenticated, isAuthenticating, logout } = useWalletAuth();

  const handleDisconnect = () => {
    logout();
    disconnect();
  };

  const handleForceReauth = () => {
    // Clear localStorage token and force re-authentication
    localStorage.removeItem('drosera_auth_token');
    logout();
    disconnect();
    window.location.reload();
  };

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="gap-2"
            data-testid="button-wallet-menu"
            disabled={isAuthenticating}
          >
            {isAuthenticating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wallet className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isAuthenticating ? 'Signing...' : (ensName || shortenAddress(address))}
            </span>
            {isAuthenticated && user && (
              <Badge variant="secondary" className="ml-1 hidden md:inline-flex text-xs">
                {user.role}
              </Badge>
            )}
            {chain && !isAuthenticating && (
              <Badge variant="secondary" className="ml-1 hidden lg:inline-flex">
                {chain.name}
              </Badge>
            )}
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">
              {isAuthenticated ? 'Authenticated' : 'Connected Wallet'}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {shortenAddress(address)}
            </p>
            {isAuthenticated && user && (
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                Role: {user.role}
              </p>
            )}
            {chain && (
              <p className="text-xs text-muted-foreground mt-1">
                Network: {chain.name}
              </p>
            )}
          </div>
          <DropdownMenuSeparator />
          {isAuthenticated && (
            <DropdownMenuItem
              onClick={handleForceReauth}
              data-testid="button-force-reauth"
              className="gap-2"
            >
              <Wallet className="w-4 h-4" />
              Re-authenticate
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={handleDisconnect}
            data-testid="button-disconnect-wallet"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="default" 
          className="gap-2"
          data-testid="button-connect-wallet"
        >
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">Connect Wallet</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">Select Wallet</p>
          <p className="text-xs text-muted-foreground">
            Connect your Web3 wallet
          </p>
        </div>
        <DropdownMenuSeparator />
        {connectors.map((connector) => (
          <DropdownMenuItem
            key={connector.id}
            onClick={() => connect({ connector })}
            data-testid={`button-connect-${connector.name.toLowerCase()}`}
            className="gap-2"
          >
            <Wallet className="w-4 h-4" />
            {connector.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
