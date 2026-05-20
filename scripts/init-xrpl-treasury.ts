import { Client, Wallet, AccountSet, TrustSet } from 'xrpl';
import fs from 'fs';
import path from 'path';

const TESTNET_URL = 'wss://s.altnet.rippletest.net:51233';

async function main() {
  console.log('====================================================');
  console.log('🚀 SETX Master Treasury XRPL Testnet Initializer');
  console.log('====================================================');

  const client = new Client(TESTNET_URL);
  await client.connect();
  console.log(`✅ Connected to XRPL Testnet: ${TESTNET_URL}\n`);

  try {
    // 1. Generate & Fund Issuer Wallet (Cold Treasury)
    console.log('⏳ Generating & Funding Issuer Wallet (Cold Treasury) via XRPL Faucet...');
    const { wallet: issuerWallet, balance: issuerBalance } = await client.fundWallet();
    console.log(`✅ Issuer Wallet Created!`);
    console.log(`   • Address: ${issuerWallet.address}`);
    console.log(`   • Seed: ${issuerWallet.seed}`);
    console.log(`   • Initial Balance: ${issuerBalance} XRP\n`);

    // 2. Generate & Fund Operational Treasury Wallet (Hot Wallet)
    console.log('⏳ Generating & Funding Operational Treasury Wallet (Hot Wallet) via XRPL Faucet...');
    const { wallet: treasuryWallet, balance: treasuryBalance } = await client.fundWallet();
    console.log(`✅ Operational Treasury Wallet Created!`);
    console.log(`   • Address: ${treasuryWallet.address}`);
    console.log(`   • Seed: ${treasuryWallet.seed}`);
    console.log(`   • Initial Balance: ${treasuryBalance} XRP\n`);

    // 3. Configure AccountSet on Issuer Wallet (Enable lsfDefaultRipple)
    console.log('⏳ Configuring AccountSet on Issuer Wallet (Setting lsfDefaultRipple)...');
    const accountSetTx: AccountSet = {
      TransactionType: 'AccountSet',
      Account: issuerWallet.address,
      SetFlag: 8, // lsfDefaultRipple: allows issued tokens to ripple between community trustlines
    };
    const preparedAccountSet = await client.autofill(accountSetTx);
    const signedAccountSet = issuerWallet.sign(preparedAccountSet);
    const accountSetResult = await client.submitAndWait(signedAccountSet.tx_blob);
    console.log(`✅ Issuer AccountSet Configured! (Tx: ${accountSetResult.result.hash})\n`);

    // 4. Establish TrustSet from Operational Treasury to Issuer for SETX Currency
    console.log('⏳ Establishing TrustSet for SETX Stablecoin ($1 SETX = $1 USD)...');
    const trustSetTx: TrustSet = {
      TransactionType: 'TrustSet',
      Account: treasuryWallet.address,
      LimitAmount: {
        currency: '5345545800000000000000000000000000000000', // SETX in 40-character hex format
        issuer: issuerWallet.address,
        value: '10000000000', // 10 Billion SETX Trust Limit
      },
    };
    const preparedTrustSet = await client.autofill(trustSetTx);
    const signedTrustSet = treasuryWallet.sign(preparedTrustSet);
    const trustSetResult = await client.submitAndWait(signedTrustSet.tx_blob);
    console.log(`✅ SETX Trustline Established! (Tx: ${trustSetResult.result.hash})\n`);

    // 5. Output Environment Variables
    console.log('====================================================');
    console.log('🎉 XRPL TREASURY INITIALIZATION COMPLETE!');
    console.log('====================================================');
    console.log('Copy and paste the following lines into your .env.local file:\n');
    
    const envOutput = `
# ====================================================================
# SETX 360 & SETX.io LLC • Live XRPL Testnet Treasury Configuration
# Generated on: ${new Date().toISOString()}
# ====================================================================
XRPL_NETWORK_WSS="${TESTNET_URL}"
XRPL_TREASURY_SEED="${treasuryWallet.seed}"
XRPL_TREASURY_ADDRESS="${treasuryWallet.address}"
XRPL_SETX_ISSUER="${issuerWallet.address}"
XRPL_ISSUER_SEED="${issuerWallet.seed}"
`;
    console.log(envOutput);

    // Optionally append to .env.local automatically
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      fs.appendFileSync(envPath, `\n${envOutput}\n`);
      console.log(`✅ Automatically appended XRPL configuration to ${envPath}`);
    } else {
      fs.writeFileSync(envPath, envOutput.trim() + '\n');
      console.log(`✅ Created new .env.local file at ${envPath}`);
    }

  } catch (error) {
    console.error('❌ XRPL Initialization Failed:', error);
  } finally {
    await client.disconnect();
    console.log('\n🔌 Disconnected from XRPL Testnet.');
  }
}

main();
