import { NetworkProvider, compile } from '@ton/blueprint';
import { address, toNano } from '@ton/ton';
import { Router } from '../wrappers/Router';

export async function run(provider: NetworkProvider) {
    const isLocked = process.env.IS_LOCK ? Number(process.env.IS_LOCK).valueOf() : 0;
    const admin = address(process.env.DEX_ADMIN ? process.env.DEX_ADMIN : '');
    const pool_code = await compile('Pool');
    const lpAccount_code = await compile('lp_account');
    const lpWallet_code = await compile('lp_wallet');

    const router = provider.open(
        Router.createFromConfig(
            {
                isLocked: isLocked,
                admin: admin,
                poolCode: pool_code,
                lpAccountCode: lpAccount_code,
                lpWalletCode: lpWallet_code,
            },
            await compile('Router'),
        ),
    );

    const deployed = await provider.isContractDeployed(router.address);
    if (deployed) {
        console.log(`Router already deployed at ${router.address}`);
        return;
    }

    await router.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(router.address);
}
