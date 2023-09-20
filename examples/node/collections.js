import { Inscriber, Ordit } from "@sadoprotocol/ordit-sdk";

const mnemonic = "<MNEMONIC PHRASE>";
const network = "testnet"

// User is the party who would mint the assets from a collection
const userWallet = new Ordit({
  bip39: mnemonic,
  network
});

// Publisher is the marketplace and any party owning the on-chain collection
const publisherWallet = new Ordit({
  bip39: mnemonic,
  network
});

// set default address types for both wallets
userWallet.setDefaultAddress("taproot");
publisherWallet.setDefaultAddress("taproot");

async function publish() {
  const getPublisherLegacyAddress = () => {
    publisherWallet.setDefaultAddress("legacy")
    const legacyAddress = publisherWallet.selectedAddress
    publisherWallet.setDefaultAddress("taproot") // switch back to default

    return legacyAddress
  }

  //publish
  const transaction = await Inscriber({
    network,
    feeRate: 2,
    title: "Collection Name",
    description: "Lorem ipsum something else",
    slug: "collection-name",
    creator: {
      address: wallet.selectedAddress,
      email: "your-email@example.com",
      name: "Your Name"
    },
    publishers: [getPublisherLegacyAddress()],
    inscriptions: [
      {
        iid: "el-01",
        lim: 10,
        sri: "sha256-Ujac9y464/qlFmtfLDxORaUtIDH8wrHgv8L9bpPeb28="
      },
      {
        iid: "el-02",
        lim: 2,
        sri: "sha256-zjQXDuk++5sICrObmfWqAM5EibidXd2emZoUcU2l5Pg="
      }
    ],
    url: "https://example.com",
    publicKey: wallet.publicKey,
    destination: wallet.selectedAddress,
    changeAddress: wallet.selectedAddress,
    postage: 1000,
    mediaContent: 'Collection Name', // this will be inscribed on-chain as primary content
    mediaType: "text/plain"
  });

  const depositDetails = await transaction.generateCommit();
  console.log(depositDetails);

  // confirm if deposit address has been funded
  const ready = await transaction.isReady(); //- true/false
  if (ready || transaction.ready) {
    // build transaction
    await transaction.build();

    // sign transaction
    const signedTx = wallet.signPsbt(transaction.toHex(), { isRevealTx: true });

    // Broadcast transaction
    const txId = await wallet.relayTx(signedTx, network);
    console.log({ txId });
  }
}

async function mint() {
  // replace this w/ the resulting txId:index of above publish() fn
  const collectionId = "94cd24aede3294ba0d6aac135a9b1701ae63ac12b1205567627246ea4091f553:0";
  const message = `${collectionId.split(":")[0]} el-01 1`; // COLLECTION_OUT INSCRIPTION_IID NONCE
  const signature = publisherWallet.signMessage(message);
  
  //publish
  const transaction = await Inscriber({
    network,
    collectionOutpoint: collectionId,
    inscriptionIid: "el-01",
    nonce: 1,
    publisherIndex: 0,
    signature,
    publicKey: userWallet.publicKey,
    destination: userWallet.selectedAddress,
    changeAddress: userWallet.selectedAddress,
    postage: 1000,
    feeRate: 2,
    mediaContent: 'Sample content',
    mediaType: "text/plain",
    outputs: [{
      address: 'tb1pk6yxhcwzzjg9gwsumnlrh3l9q3ajxk657e7kqwmwpd8mklmnmehsrn3hu2', 
      value: 1000
    }]
  });

  const depositDetails = await transaction.generateCommit();
  console.log(depositDetails);

  // confirm if deposit address has been funded
  const ready = await transaction.isReady(); //- true/false
  if (ready || transaction.ready) {
    // build transaction
    await transaction.build();

    // sign transaction
    const signedTx = userWallet.signPsbt(transaction.toHex(), { isRevealTx: true });

    // Broadcast transaction
    const txId = await userWallet.relayTx(signedTx, network);
    console.log({ txId });
  }
}

publish(); // comment this after collection is created
// mint(); // uncomment this after collection is created on chain using publish()
