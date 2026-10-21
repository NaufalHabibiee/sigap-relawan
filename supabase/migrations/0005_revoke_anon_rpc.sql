-- RPCs are for signed-in users only; helper functions used by public RLS (is_admin, is_banned, user_stats) stay callable by anon.
revoke execute on function
  public.admin_moderate_call(uuid, text), public.admin_resolve_report(uuid, text, text),
  public.admin_review_verification(uuid, boolean, text), public.admin_set_banned(uuid, boolean, text),
  public.announce(uuid, text), public.apply_to_call(uuid, text, text[], text), public.cancel_application(uuid, text),
  public.chat_blocked(uuid), public.chat_locked(uuid), public.choose_role(public.user_role, public.seeker_type),
  public.close_call(uuid, boolean, text), public.decide_application(uuid, public.app_status), public.get_contacts(uuid),
  public.invite_volunteer(uuid, uuid, text), public.is_app_participant(uuid), public.mark_attendance(uuid, boolean),
  public.mark_thread_read(uuid), public.my_role(), public.own_call(uuid), public.publish_call(uuid),
  public.refresh_call_matches(uuid), public.refresh_volunteer(), public.reply_review(uuid, text),
  public.request_phone_otp(text), public.require_role(public.user_role), public.respond_invite(uuid, boolean),
  public.seeker_has_accepted_heavy(uuid), public.seeker_has_applicant(uuid), public.submit_review(uuid, int, jsonb, text),
  public.submit_verification(text[], text, text), public.touch_activity(), public.verify_phone_otp(text)
from public, anon;

grant execute on function
  public.admin_moderate_call(uuid, text), public.admin_resolve_report(uuid, text, text),
  public.admin_review_verification(uuid, boolean, text), public.admin_set_banned(uuid, boolean, text),
  public.announce(uuid, text), public.apply_to_call(uuid, text, text[], text), public.cancel_application(uuid, text),
  public.chat_blocked(uuid), public.chat_locked(uuid), public.choose_role(public.user_role, public.seeker_type),
  public.close_call(uuid, boolean, text), public.decide_application(uuid, public.app_status), public.get_contacts(uuid),
  public.invite_volunteer(uuid, uuid, text), public.is_app_participant(uuid), public.mark_attendance(uuid, boolean),
  public.mark_thread_read(uuid), public.my_role(), public.publish_call(uuid), public.refresh_call_matches(uuid),
  public.refresh_volunteer(), public.reply_review(uuid, text), public.request_phone_otp(text),
  public.respond_invite(uuid, boolean), public.seeker_has_accepted_heavy(uuid), public.seeker_has_applicant(uuid),
  public.submit_review(uuid, int, jsonb, text), public.submit_verification(text[], text, text),
  public.touch_activity(), public.verify_phone_otp(text)
to authenticated;

revoke execute on function public.own_call(uuid), public.require_role(public.user_role) from authenticated;
