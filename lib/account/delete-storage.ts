import { createAdminClient } from "@/lib/supabase/admin";

const USER_STORAGE_BUCKETS = [
  "brand-logos",
  "expense-receipts",
  "lpo-documents",
  "tds-certificates",
] as const;

async function listAllObjects(
  admin: ReturnType<typeof createAdminClient>,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw new Error(`Failed to list ${bucket}: ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    for (const item of data) {
      if (!item.name) continue;
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        const nested = await listAllObjects(admin, bucket, fullPath);
        paths.push(...nested);
      } else {
        paths.push(fullPath);
      }
    }

    if (data.length < limit) {
      break;
    }
    offset += limit;
  }

  return paths;
}

export async function deleteUserStorageObjects(userId: string): Promise<void> {
  const admin = createAdminClient();

  for (const bucket of USER_STORAGE_BUCKETS) {
    const paths = await listAllObjects(admin, bucket, userId);
    if (paths.length === 0) continue;

    const { error } = await admin.storage.from(bucket).remove(paths);
    if (error) {
      throw new Error(`Failed to delete ${bucket} files: ${error.message}`);
    }
  }
}
