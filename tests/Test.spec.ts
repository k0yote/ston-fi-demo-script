import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Test } from '../wrappers/Test';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Test', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Test');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let test: SandboxContract<Test>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        test = blockchain.openContract(Test.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await test.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: test.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and test are ready to use
    });
});
