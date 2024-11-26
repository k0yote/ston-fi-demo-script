import { NetworkProvider, UIProvider } from '@ton/blueprint';
import { promptAddress, promptAmount, waitForTransaction } from '../wrappers/ui-utils';
import { toNano, TonClient4 } from '@ton/ton';
import { DEX, pTON } from '@ston-fi/sdk';
import { InternalWallet } from './internalWallet';
import TonWeb from 'tonweb';

const depositJettonToJettonAction = async (provider: NetworkProvider, ui: UIProvider) => {
    const sender = provider.sender();

    const routerAddress = await promptAddress('Please enter STONFI router address:', ui);

    const router = provider.open(new DEX.v1.Router(routerAddress));
    const jettton0Address = await promptAddress('Please enter Jetton 0 address:', ui);
    const send0Amount = await promptAmount('Please provide Jetton 0 amount to send:', ui);

    const jettton1Address = await promptAddress('Please enter Jetton 0 address:', ui);
    const send1Amount = await promptAmount('Please provide Jetton 1 amount to send:', ui);

    await router.sendProvideLiquidityJetton(sender, {
        userWalletAddress: sender.address!,
        sendTokenAddress: jettton0Address,
        sendAmount: toNano(send0Amount),
        otherTokenAddress: jettton1Address,
        minLpOut: '1',
        queryId: 0n,
    });

    const client: TonClient4 = provider.api() as TonClient4;
    let lastBlock = await client.getLastBlock();
    let accountInfo = await client.getAccount(lastBlock.last.seqno, router.address);
    // console.log('accountInfo', accountInfo);
    if (accountInfo.account.last === null) throw "Last transaction can't be null on deployed contract";
    let gotTrans = await waitForTransaction(provider, router.address, accountInfo.account.last.lt, 100);
    if (gotTrans) {
        const poolAddress = await router.getPoolAddress({ token0: jettton0Address, token1: jettton1Address });
        console.log('poolAddress', poolAddress);
    }

    await router.sendProvideLiquidityJetton(sender, {
        userWalletAddress: sender.address!,
        sendTokenAddress: jettton1Address,
        sendAmount: toNano(send1Amount),
        otherTokenAddress: jettton0Address,
        minLpOut: '1',
        queryId: 0n,
    });
    lastBlock = await client.getLastBlock();
    accountInfo = await client.getAccount(lastBlock.last.seqno, router.address);
    // console.log('accountInfo', accountInfo);
    if (accountInfo.account.last === null) throw "Last transaction can't be null on deployed contract";
    gotTrans = await waitForTransaction(provider, router.address, accountInfo.account.last.lt, 100);
    if (gotTrans) {
        const poolAddress = await router.getPoolAddress({ token0: jettton1Address, token1: jettton0Address });
        console.log('poolAddress', poolAddress);
    }
};

const depositPTONToJettonAction = async (provider: NetworkProvider, ui: UIProvider) => {
    const sender = provider.sender();

    const routerAddress = await promptAddress('Please enter STONFI router address:', ui);

    const dex = provider.open(new DEX.v1.Router(routerAddress));
    const jetttonAddress = await promptAddress('Please enter Jetton address:', ui);
    const pTONAmount = await promptAmount('Please provide pTON amount to send:', ui);
    const jettonAmount = await promptAmount('Please provide Jetton 0 amount to send:', ui);

    const pTONTxParams = await dex.getProvideLiquidityTonTxParams({
        userWalletAddress: sender.address!,
        proxyTon: new pTON.v1(),
        sendAmount: toNano(pTONAmount),
        otherTokenAddress: jetttonAddress,
        minLpOut: '1',
        forwardGasAmount: toNano('0.05'),
        queryId: 0n,
    });

    const { keyPair, wallet } = await InternalWallet();
    ui.write(`TON/Jetton pool deposit pTON address: ${new pTON.v1().address}\n`);
    const toAddress = new TonWeb.utils.Address(pTONTxParams.to.toString()).toString(true, true, false);
    await wallet.methods
        .transfer({
            secretKey: keyPair.secretKey,
            toAddress: toAddress,
            amount: pTONTxParams.value.toString(),
            seqno: (await wallet.methods.seqno().call()) ?? 0,
            payload: TonWeb.boc.Cell.oneFromBoc(
                TonWeb.utils.base64ToBytes(pTONTxParams.body!.toBoc().toString('base64')),
            ),
            sendMode: 3,
        })
        .send();

    const client: TonClient4 = provider.api() as TonClient4;
    let lastBlock = await client.getLastBlock();
    let accountInfo = await client.getAccount(lastBlock.last.seqno, sender.address!);
    if (accountInfo.account.last === null) throw "Last transaction can't be null on deployed contract";
    await waitForTransaction(provider, sender.address!, accountInfo.account.last.lt, 100);

    ui.write(`TON/Jetton pool deposit Jetton address: ${jetttonAddress}\n`);
    await dex.sendProvideLiquidityJetton(sender, {
        userWalletAddress: sender.address!,
        sendTokenAddress: jetttonAddress,
        sendAmount: toNano(jettonAmount),
        otherTokenAddress: new pTON.v1().address,
        minLpOut: '1',
        queryId: 0n,
    });

    lastBlock = await client.getLastBlock();
    accountInfo = await client.getAccount(lastBlock.last.seqno, dex.address);
    if (accountInfo.account.last === null) throw "Last transaction can't be null on deployed contract";
    await waitForTransaction(provider, dex.address, accountInfo.account.last.lt, 100);
};

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    let done = false;
    let actionList: string[] = ['Deposit Jetton to Jetton', 'Deposit pTON to Jetton', 'test pTON', 'Quit'];
    do {
        const action = await ui.choose('Pick action:', actionList, (c) => c);
        switch (action) {
            case 'Deposit Jetton to Jetton':
                await depositJettonToJettonAction(provider, ui);
                break;
            case 'Deposit pTON to Jetton':
                await depositPTONToJettonAction(provider, ui);
                break;
            case 'Quit':
                done = true;
                break;
        }
    } while (!done);
}
