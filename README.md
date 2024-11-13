# ston-fi-demo-script

This is a sample project with ston.fi by using Blueprint SDK

## Prerequisite

1. ston-fi dex core, build and deploy

    ```shell
    git clone git@github.com:ston-fi/dex-core.git
    ```

2. If you create your own project

    ```shell
    npm create ton@latest
    ```

## Installation

1. Clone repository

    ```shell
    git clone git@github.com:k0yote/ston-fi-demo-script.git
    ```

2. Wallet Settings (Optional if you use 24 seed phrases)

    ```shell
    cd ston-fi-demo-script
    cp .env.sampe .env
    ### input your ton wallet 24 seed phrases
    WALLET_MNEMONIC=24 seed phrase
    ### You can see https://testnet.ton.cx/address/{ton wallet address}
    ### Check your wallet `Contract Type`
    WALLET_VERSION=
    ```

## Build

    ```shell
    npm install
    ```

## Features

1. Create Jetton
2. Mint Jetton
3. Deposite Jetton/Jetton Liquidity
4. Deposite pTON/Jetton Liquidity
5. Swap Jetton to Jetton
6. Swap Jetton to pTON
7. Swap pTON to Jetton
