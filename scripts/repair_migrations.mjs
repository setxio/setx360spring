// repair_migrations.mjs
// Marks all already-applied migrations as applied in supabase_migrations tracking
// so that db push only runs the NEW ones.
// Run: node repair_migrations.mjs

import { execSync } from 'child_process';

// All migrations that were applied via SQL editor BEFORE CLI tracking was set up
// These should NOT be pushed again — just marked as applied
const alreadyApplied = [
  '20260424_civic_metadata',
  '20260424_driver_system',
  '20260424_engagement_infra',
  '20260424_setxio3_super_migration',
  '20260424_staff_clearance',
  '20260425_civic_staff_payments',
  '20260426_age_columns',
  '20260426_custom_user_fees',
  '20260426_fintech_core',
  '20260426_fintech_rpc',
  '20260426_fix_store_rls',
  '20260426_kill_automated_alerts',
  '20260426_legal_tracking',
  '20260426_order_system',
  '20260426_platform_settings',
  '20260426_product_variants',
  '20260426_store_customization',
  '20260426_store_integrations',
  '20260426_store_refund_policy',
  '20260426_store_visibility',
  '20260426_stores_public_rls',
  '20260428_ai_infra',
  '20260428_church_infra',
  '20260430_comment_engagement',
  '20260501180000_vector_search_infra',
  '20260501_bot_cron_schedule',
  '20260501_comment_delete_policy',
  '20260501_fix_group_members_recursion',
  '20260501_fix_group_members_rls',
  '20260501_guardian_logic',
  '20260501_moderation_and_tags',
  '20260501_tevis_bot_trigger',
  '20260501_tevis_search_rpc',
  '20260501_upgrade_comments',
  '20260501_video_detection_infra',
  '20260502184540_add_ai_conversations_table',
  '20260502_admin_authority_weight',
  '20260502_bot_engagement_trigger',
  '20260502_civic_directory_city_managers',
  '20260502_civic_directory_historical',
  '20260502_civic_directory_seed',
  '20260502_civic_services_seed',
  '20260502_faith_daily_manna',
  '20260502_tevis_community_pulse',
  '20260502_update_post_categories',
  '20260503_fix_comment_counts',
  '20260503_social_enhancements',
  '20260504_ad_economy',
  '20260504_blocking_system',
  '20260504_chat_features',
  '20260504_dynamic_affinity',
  '20260504_follow_system',
  '20260504_legacy_access',
  '20260504_merchant_and_boost',
  '20260505_crm_infrastructure',
  '20260505_jobs_store_association',
  '20260505_market_schema_fix',
  '20260505_seed_premium_market',
  '20260505_store_domains',
  '20260510_bridge_items',
  '20260510_bridge_moderation_trigger',
  '20260510_csm_key_provisioning',
  '20260510_dead_letter_queue',
  '20260510_multivendor_orders',
  '20260510_partner_csm_tenants',
];

console.log(`Marking ${alreadyApplied.length} migrations as applied...`);

for (const migration of alreadyApplied) {
  try {
    const result = execSync(
      `npx supabase migration repair --status applied ${migration}`,
      { cwd: process.cwd(), stdio: 'pipe', encoding: 'utf-8' }
    );
    console.log(`✅ ${migration}`);
  } catch (err) {
    const output = err.stdout?.toString() || err.stderr?.toString() || String(err);
    if (output.includes('already') || output.includes('not found')) {
      console.log(`⚠️  ${migration} — skipped (${output.trim().slice(0, 60)})`);
    } else {
      console.log(`❌ ${migration} — ${output.trim().slice(0, 100)}`);
    }
  }
}

console.log('\nDone! Now run: npx supabase db push');
console.log('This will only push the NEW migrations:');
console.log('  - 20260510_appointments_setxio.sql');
console.log('  - 20260510_bookings.sql');
console.log('  - 20260510_bridge_items_stock.sql');
console.log('  - 20260510_merchant_subscriptions.sql');
console.log('  - 20260510_site_provisioning_trigger.sql');
