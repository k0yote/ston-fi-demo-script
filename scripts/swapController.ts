import { NetworkProvider, UIProvider } from '@ton/blueprint';
import { promptAddress, promptAmount, waitForTransaction } from '../wrappers/ui-utils';
import { toNano, TonClient4 } from '@ton/ton';
import { DEX, pTON } from '@ston-fi/sdk';
import { InternalWallet } from './internalWallet';
import TonWeb from 'tonweb';

const swapPTONToJettonAction = async (provider: NetworkProvider, ui: UIProvider) => {
    const sender = provider.sender();

    const routerAddress = await promptAddress('Please enter STONFI router address:', ui);

    const dex = provider.open(new DEX.v1.Router(routerAddress));

    const offerAmount = await promptAmount('Please offer pTON amount to send:', ui);
    const askJettonAddress = await promptAddress('Please enter Jetton address:', ui);

    ui.write(`TON/Jetton pool swap pTON address to Jetton: ${new pTON.v1().address} : ${askJettonAddress}\n`);
    const { keyPair, wallet } = await InternalWallet();

    const txParams = await dex.getSwapTonToJettonTxParams({
        userWalletAddress: sender.address!,
        proxyTon: new pTON.v1(),
        offerAmount: toNano(offerAmount),
        askJettonAddress: askJettonAddress,
        minAskAmount: '1',
        forwardGasAmount: toNano('0.05'),
        queryId: 0n,
    });

    const toAddress = new TonWeb.utils.Address(txParams.to.toString()).toString(true, true, false);
    await wallet.methods
        .transfer({
            secretKey: keyPair.secretKey,
            toAddress: toAddress,
            amount: txParams.value.toString(),
            seqno: (await wallet.methods.seqno().call()) ?? 0,
            payload: TonWeb.boc.Cell.oneFromBoc(TonWeb.utils.base64ToBytes(txParams.body!.toBoc().toString('base64'))),
            sendMode: 3,
        })
        .send();

    const client: TonClient4 = provider.api() as TonClient4;
    const lastBlock = await client.getLastBlock();
    const accountInfo = await client.getAccount(lastBlock.last.seqno, sender.address!);
    // console.log('accountInfo', accountInfo);
    if (accountInfo.account.last === null) throw "Last transaction can't be null on deployed contract";
    await waitForTransaction(provider, sender.address!, accountInfo.account.last.lt, 100);
};

const swapJettonToJettonAction = async (provider: NetworkProvider, ui: UIProvider) => {
    const sender = provider.sender();

    const routerAddress = await promptAddress('Please enter STONFI router address:', ui);

    const router = provider.open(new DEX.v1.Router(routerAddress));

    const offerJettonAddress = await promptAddress('Please enter Jetton address:', ui);
    const offerAmount = await promptAmount('Please offer Jetton amount to send:', ui);
    const askJettonAddress = await promptAddress('Please enter Jetton address:', ui);

    ui.write(`Jetton/Jetton pool swap Jetton to Jetton: ${offerJettonAddress} : ${askJettonAddress}\n`);

    await router.sendSwapJettonToJetton(sender, {
        userWalletAddress: sender.address!, // ! replace with your address
        offerJettonAddress: offerJettonAddress,
        offerAmount: toNano(offerAmount),
        askJettonAddress: askJettonAddress,
        minAskAmount: '1',
        queryId: 0n,
    });

    const client: TonClient4 = provider.api() as TonClient4;
    const lastBlock = await client.getLastBlock();
    const accountInfo = await client.getAccount(lastBlock.last.seqno, router.address);
    // console.log('accountInfo', accountInfo);
    if (accountInfo.account.last === null) throw "Last transaction can't be null on deployed contract";
    await waitForTransaction(provider, router.address, accountInfo.account.last.lt, 100);
};

const swapJettonToPTONAction = async (provider: NetworkProvider, ui: UIProvider) => {
    const sender = provider.sender();

    const routerAddress = await promptAddress('Please enter STONFI router address:', ui);

    const router = provider.open(new DEX.v1.Router(routerAddress));

    const offerJettonAddress = await promptAddress('Please enter Jetton address:', ui);
    const offerAmount = await promptAmount('Please offer Jetton amount to send:', ui);

    ui.write(`Jetton/pTON pool swap Jetton to pTON: ${offerJettonAddress} : ${new pTON.v1().address}\n`);

    await router.sendSwapJettonToTon(sender, {
        userWalletAddress: sender.address!, // ! replace with your address
        offerJettonAddress: offerJettonAddress,
        offerAmount: toNano(offerAmount),
        proxyTon: new pTON.v1(),
        minAskAmount: '1',
        queryId: 0n,
    });

    const client: TonClient4 = provider.api() as TonClient4;
    const lastBlock = await client.getLastBlock();
    const accountInfo = await client.getAccount(lastBlock.last.seqno, router.address);
    // console.log('accountInfo', accountInfo);
    if (accountInfo.account.last === null) throw "Last transaction can't be null on deployed contract";
    await waitForTransaction(provider, router.address, accountInfo.account.last.lt, 100);
};

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    let done = false;
    let actionList: string[] = ['Swap pTON to Jetton', 'Swap Jetton to Jetton', 'Swap Jetton to pTON', 'Quit'];
    do {
        const action = await ui.choose('Pick action:', actionList, (c) => c);
        switch (action) {
            case 'Swap pTON to Jetton':
                await swapPTONToJettonAction(provider, ui);
                break;
            case 'Swap Jetton to Jetton':
                await swapJettonToJettonAction(provider, ui);
                break;
            case 'Swap Jetton to pTON':
                await swapJettonToPTONAction(provider, ui);
                break;
            case 'Quit':
                done = true;
                break;
        }
    } while (!done);
}
