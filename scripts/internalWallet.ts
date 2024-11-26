import { KeyPair, mnemonicToPrivateKey } from '@ton/crypto';
import TonWeb from 'tonweb';
import { WalletV3ContractR2 } from 'tonweb/dist/types/contract/wallet/v3/wallet-v3-contract-r2';

export const InternalWallet = async (): Promise<{ wallet: WalletV3ContractR2; keyPair: KeyPair }> => {
    const mnemonic = process.env.WALLET_MNEMONIC ?? '';
    if (mnemonic.length === 0) {
        throw new Error('WALLET_MNEMONIC is not set');
    }

    const url = process.env.TON_NODE_URL ?? 'https://testnet.toncenter.com/api/v2/jsonRPC';

    const client = new TonWeb.HttpProvider(url);

    const keyPair = await mnemonicToPrivateKey(mnemonic.split(' '));
    const wallet = new TonWeb.Wallets.all.v3R2(client, {
        publicKey: keyPair.publicKey,
    }) as WalletV3ContractR2;

    return { wallet, keyPair };
};
