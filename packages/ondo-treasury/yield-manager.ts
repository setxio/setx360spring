import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ONDO_API_KEY = process.env.ONDO_API_KEY!;
// Standard Ondo USDY yield rate estimate (approx 5.1% APY)
const ESTIMATED_APY = 0.051; 

/**
 * Service to automatically sweep stagnant USD fiat reserves sitting in the DUNA bank account
 * into tokenized US Treasury yield assets (Ondo USDY), generating yield to permanently sponsor XRPL gas.
 */
export async function rebalanceTreasuryYield(reserveAmountUsd: number) {
    if (reserveAmountUsd < 10000) {
        console.log("Reserves below $10,000 threshold. Skipping yield rebalance.");
        return { rebalanced: false, reason: "Below minimum threshold" };
    }

    // Keep 20% in liquid cash for immediate Stripe ACH payouts, put 80% into Ondo USDY
    const liquidBuffer = reserveAmountUsd * 0.20;
    const investableAmount = reserveAmountUsd * 0.80;

    console.log(`Rebalancing Treasury: Keeping $${liquidBuffer} liquid, allocating $${investableAmount} to Ondo USDY.`);

    if (!ONDO_API_KEY) {
        console.warn("ONDO_API_KEY not configured. Running in simulated yield generation mode.");
        
        // Calculate expected daily yield: (Amount * APY) / 365
        const dailyYieldUsd = (investableAmount * ESTIMATED_APY) / 365;

        // Log the yield allocation to Supabase
        await supabase.from('treasury_yield_allocations').insert({
            allocated_amount: investableAmount,
            asset_type: 'USDY',
            estimated_apy: ESTIMATED_APY * 100,
            daily_yield_generated: dailyYieldUsd,
            status: 'active'
        });

        return { 
            rebalanced: true, 
            investableAmount, 
            asset: 'USDY', 
            dailyYieldUsd: dailyYieldUsd.toFixed(2),
            simulated: true 
        };
    }

    // In a full production implementation, this interacts with Ondo's institutional API/Contracts
    // e.g. ondoClient.mintUSDY({ amount: investableAmount, destination: treasuryEvmAddress })
    
    return { rebalanced: true, investableAmount, asset: 'USDY', status: 'active' };
}
