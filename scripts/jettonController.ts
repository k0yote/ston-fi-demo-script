import { NetworkProvider, UIProvider, compile } from '@ton/blueprint';
import { TonClient4 } from '@ton/ton';
import { JettonMinter } from '@ton-community/assets-sdk';
import { internalOnchainContentToCell } from '@ton-community/assets-sdk/dist/utils';
import { Address, toNano, fromNano } from '@ton/core';

import {
    promptAmount,
    promptAddress,
    waitForTransaction,
    promptUserFriendlyAddress,
    promptJettonMetadata,
} from '../wrappers/ui-utils';

let mintAddress: Address;
const JETTON_IMAGE_URL =
    'https://res.cloudinary.com/dezu3jzic/image/upload/v1730858434/token_img/mncawi9jxdoebxxwrsfc.png';
const JETTON_IMAGE_DATA =
    'data:image/png;base64,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';
const JETTON_DECIMALS = 9;
const VALID_UNTIL = 1000 * 60 * 5; // 5 minutes

const deployAction = async (provider: NetworkProvider, ui: UIProvider) => {
    const isTestnet = provider.network() !== 'mainnet';
    const adminAddress = await promptUserFriendlyAddress(
        'Enter the address of the jetton owner (admin):',
        ui,
        isTestnet,
    );

    const jettonMetaParams = await promptJettonMetadata(ui);

    // specify the time until the message is valid
    const validUntil = Math.round((Date.now() + VALID_UNTIL) / 1000);

    // amount of TON to send with the message
    const amount = toNano('0.06');
    // forward value for the message to the wallet
    const walletForwardValue = toNano('0.05');

    // create a jetton master
    const jettonMaster = JettonMinter.createFromConfig({
        admin: adminAddress.address,
        content: internalOnchainContentToCell({
            name: jettonMetaParams.name,
            description: jettonMetaParams.description,
            image: JETTON_IMAGE_URL,
            image_data: Buffer.from(JETTON_IMAGE_DATA, 'ascii').toString('base64'),
            symbol: jettonMetaParams.symbol,
            decimals: JETTON_DECIMALS,
        }),
    });
    if (!jettonMaster.init) {
        throw { error: 'Invalid jetton master' };
    }

    await provider.deploy(jettonMaster, amount);
    mintAddress = jettonMaster.address;
};

const mintAction = async (provider: NetworkProvider, ui: UIProvider) => {
    const jettonAddress = await promptAddress('Please enter jetton master address:', ui, mintAddress);
    const minterContract = provider.open(JettonMinter.createFromAddress(jettonAddress));
    const sender = provider.sender();

    const fallbackAddr = sender.address ?? (await minterContract.getData()).adminAddress!;
    mintAddress = await promptAddress(`Please specify address to mint to`, ui, fallbackAddr);

    const mintAmount = await promptAmount('Please provide mint amount in decimal form:', ui);
    ui.write(`Mint ${mintAmount} tokens to ${mintAddress}\n`);

    const supplyBefore = (await minterContract.getData()).totalSupply;
    const nanoMint = toNano(mintAmount);

    const client: TonClient4 = provider.api() as TonClient4;
    const lastBlock = await client.getLastBlock();
    const accountInfo = await client.getAccount(lastBlock.last.seqno, minterContract.address);
    console.log('accountInfo', accountInfo);

    if (accountInfo.account.last === null) throw "Last transaction can't be null on deployed contract";

    const res = await minterContract.sendMint(sender, mintAddress, nanoMint);

    const gotTrans = await waitForTransaction(provider, minterContract.address, accountInfo.account.last.lt, 100);
    if (gotTrans) {
        const supplyAfter = (await minterContract.getData()).totalSupply;

        if (supplyAfter == supplyBefore + nanoMint) {
            ui.write('Mint successfull!\nCurrent supply:' + fromNano(supplyAfter));
        } else {
            ui.write('Mint failed!');
        }
    }
};

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    let done = false;
    let actionList: string[] = ['Deploy', 'Mint', 'Quit'];
    do {
        const action = await ui.choose('Pick action:', actionList, (c) => c);
        switch (action) {
            case 'Deploy':
                await deployAction(provider, ui);
                break;
            case 'Mint':
                await mintAction(provider, ui);
                break;
            case 'Quit':
                done = true;
                break;
        }
    } while (!done);
}
