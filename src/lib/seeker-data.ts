import "server-only";
import { CARD_SELECT } from "./data";
import { createServerSupabase } from "./supabase/server";
import type { CallDetail } from "./types";

/** A call owned by the signed-in seeker, including drafts. */
export async function getOwnCall(id: string, seekerId: string): Promise<CallDetail | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("calls")
    .select(
      `${CARD_SELECT}, description, address, end_time, min_level, age_min, age_max, gender, gender_reason, min_followers, allowance, commission_pct, need_cv, questions, cover_url, category_id, city_id, seeker_id, cancel_reason, skills:call_skills(required, skill:skills(id, name)), involves:call_involves(limitation:limitations(id, task_label))`,
    )
    .eq("id", id)
    .eq("seeker_id", seekerId)
    .maybeSingle();
  if (!data) return null;
  const { data: counts } = await supabase.rpc("call_accepted_counts", { p_calls: [id] });
  return { ...(data as unknown as CallDetail), accepted_count: counts?.[0]?.accepted ?? 0 };
}
