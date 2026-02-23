import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import client from "@/lib/api";

export interface Device {
  id: string;
  userId: string;
  name: string;
  type: "DEVICE_EXTENSION" | "DEVICE_WEB";
  lastIpAddress: string | null;
  lastUserAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
}

export interface DevicesResponse {
  devices: Device[];
  currentDeviceId: string | null;
}

const DEVICES_QUERY_KEY = ["devices"] as const;

/**
 * Fetches all devices for the current user.
 * Uses suspense query for automatic loading states.
 */
export function useDevices() {
  return useSuspenseQuery({
    queryKey: DEVICES_QUERY_KEY,
    queryFn: async (): Promise<DevicesResponse> => {
      const response = await client.api.v1.devices.$get();
      return response.json();
    },
    refetchInterval: 30000,
  });
}

/**
 * Mutation to delete a specific device and its sessions.
 * Automatically invalidates devices query on success.
 */
export function useDeleteDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await client.api.v1.devices[":deviceId"].$delete({
        param: { deviceId },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEVICES_QUERY_KEY });
    },
  });
}

/**
 * Mutation to delete all devices except the current one.
 * Critical security action with automatic query invalidation.
 */
export function useDeleteAllDevices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exceptDeviceId: string) => {
      const response = await client.api.v1.devices["revoke-all"].$post({
        json: { exceptDeviceId },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEVICES_QUERY_KEY });
    },
  });
}
