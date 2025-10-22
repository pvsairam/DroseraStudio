import { useAccount, useSignMessage } from 'wagmi';
import { useEffect, useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AuthUser {
  id: string;
  walletAddress: string;
  name?: string;
  role: string;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
  expiresAt: string;
}

// CRITICAL: Global ref to track auth attempts across ALL hook instances
// This prevents multiple components from triggering duplicate auth flows
let globalAuthAttempt: string | null = null;
let globalAuthInProgress = false;

export function useWalletAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { toast } = useToast();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Get current auth status
  const { data: currentUser, refetch: refetchUser } = useQuery<AuthUser>({
    queryKey: ['/api/auth/me'],
    enabled: !!getAuthToken(),
    retry: false,
  });

  // Get nonce for signature
  const getNonceMutation = useMutation({
    mutationFn: async (walletAddress: string) => {
      const response = await apiRequest('POST', '/api/auth/wallet/nonce', { walletAddress });
      return response.json();
    },
  });

  // Login with signature
  const loginMutation = useMutation({
    mutationFn: async ({ walletAddress, signature }: { walletAddress: string; signature: string }) => {
      const response = await apiRequest('POST', '/api/auth/wallet/login', { walletAddress, signature });
      const data: AuthResponse = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: 'Authentication Successful',
        description: `Connected as ${shortenAddress(data.user.walletAddress)}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Authentication Failed',
        description: error.message || 'Failed to authenticate wallet',
        variant: 'destructive',
      });
    },
  });

  // Logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/logout');
    },
    onSuccess: () => {
      removeAuthToken();
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: 'Logged Out',
        description: 'You have been logged out successfully',
      });
    },
  });

  // Auto-authenticate when wallet connects (only if not already authenticated)
  useEffect(() => {
    const authenticate = async () => {
      if (!address || !isConnected) return;

      // CRITICAL: Check global state first - prevents multiple hook instances from duplicating
      if (globalAuthAttempt === address) {
        return;
      }

      // Check if authentication is already in progress globally
      if (globalAuthInProgress) {
        return;
      }

      // Check if we have a valid token
      const token = getAuthToken();
      
      // If we have a token, check if it's for the current address
      if (token) {
        // If currentUser is already loaded and matches current address, skip
        if (currentUser?.walletAddress?.toLowerCase() === address.toLowerCase()) {
          globalAuthAttempt = address;
          return;
        }
        
        // If currentUser is loaded but doesn't match, we need to re-auth with new address
        if (currentUser && currentUser.walletAddress?.toLowerCase() !== address.toLowerCase()) {
          removeAuthToken();
          globalAuthAttempt = null;
          queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
          return;
        }
        
        // Token exists but currentUser hasn't loaded yet - wait for it
        return;
      }

      // No token - need to authenticate
      // Mark as attempted and in-progress GLOBALLY before starting
      globalAuthAttempt = address;
      globalAuthInProgress = true;
      setIsAuthenticating(true);
      
      try {
        // Get nonce
        const { nonce } = await getNonceMutation.mutateAsync(address);

        // Create message to sign
        const message = `Sign this message to authenticate with Drosera Studio.\n\nNonce: ${nonce}`;

        // Request signature
        const signature = await signMessageAsync({ message });

        // Login with signature
        await loginMutation.mutateAsync({ walletAddress: address, signature });
      } catch (error: any) {
        console.error('Authentication error:', error);
        globalAuthAttempt = null; // Reset on error so user can retry
        if (!error.message?.includes('User rejected')) {
          toast({
            title: 'Authentication Error',
            description: 'Please try connecting your wallet again',
            variant: 'destructive',
          });
        }
      } finally {
        globalAuthInProgress = false;
        setIsAuthenticating(false);
      }
    };

    authenticate();
  }, [address, isConnected]);

  return {
    user: currentUser,
    isAuthenticated: !!currentUser,
    isAuthenticating: isAuthenticating || getNonceMutation.isPending || loginMutation.isPending,
    logout: () => logoutMutation.mutate(),
  };
}

// Token management helpers
function getAuthToken(): string | null {
  return localStorage.getItem('drosera_auth_token');
}

function setAuthToken(token: string): void {
  localStorage.setItem('drosera_auth_token', token);
}

function removeAuthToken(): void {
  localStorage.removeItem('drosera_auth_token');
}

function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Export for use in queryClient
export { getAuthToken };
