import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getSignedUrl, uploadOwnFile } from "@/lib/storage";
import { queryKeys } from "@/lib/queries/keys";
import type { AppMode } from "@/lib/modes";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type DiscoverableProfile = Tables<"discoverable_profiles"> & {
  avatarUrl: string | null;
  coverUrl: string | null;
};

async function withSignedPhotos<
  T extends { avatar_path: string | null; cover_path: string | null },
>(row: T): Promise<T & { avatarUrl: string | null; coverUrl: string | null }> {
  const [avatarUrl, coverUrl] = await Promise.all([
    getSignedUrl("profile-photos", row.avatar_path),
    getSignedUrl("profile-photos", row.cover_path),
  ]);
  return { ...row, avatarUrl, coverUrl };
}

export function useOtherProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["discoverable-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discoverable_profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return withSignedPhotos(data);
    },
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const { user, refresh } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: TablesUpdate<"profiles">) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refresh();
      queryClient.invalidateQueries({ queryKey: queryKeys.discover("matrimonial") });
    },
  });
}

export function useCompleteOnboarding() {
  const { user, refresh } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      displayName: string;
      gender: "male" | "female";
      primaryMode: AppMode;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: input.displayName,
          verified_gender: input.gender,
          primary_mode: input.primaryMode,
        })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => refresh(),
  });
}

export function useUploadProfilePhoto() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  return useMutation({
    mutationFn: async ({ file, slot }: { file: File; slot: "avatar" | "cover" }) => {
      if (!user) throw new Error("Not authenticated");
      const path = await uploadOwnFile("profile-photos", user.id, file);
      await updateProfile.mutateAsync(
        slot === "avatar" ? { avatar_path: path } : { cover_path: path },
      );
      return path;
    },
  });
}
