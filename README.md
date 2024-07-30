<h1>Blockchain</h1>
<p>A basic blockchain created to improve my understanding of blockchains and node.js</p>
<p>Expanded upon starter code from the following tutorials: </p>
<p><a>https://medium.com/@spenserhuang/learn-build-a-javascript-blockchain-part-1-ca61c285821e</a></p>
<p><a>https://www.smashingmagazine.com/2020/02/cryptocurrency-blockchain-node-js/</a></p>
<p>Deliverable: A blockchain along with a miner, and wallet. The chain is capable of being searched in log(n) efficiency for a wallet's contents. The blockchain is secure as long as 5+ miners are active. </p>

<h3>Porject Elements: </h3>
<ul>
  <li>
    <h3>Block</h3>
    <p><b>Description: </b> The basic peice of the chain. Each block contains a timestamp, the previous hash, a nonce, transactions and an award statement. The block uses SHA256 to calculate its own hash and a proof of work method to add difficulty to the mining procedure. </p>
    <p><b>Location: </b>main.js</p>
  </li>
  <li>
    <h3>Blockchain</h3>
    <p><b>Description: </b>A ledger that stores transactions in the form of blocks. Has functions to add new blocks, verify the chain, check the blocks, and find the contents of a wallet. Finding the contents of a wallet is done in log(n) efficiency. </p>
    <p><b>Location: </b>main.js</p>
  </li>
  <li>
    <h3>Wallet</h3>
    <p><b>Description: </b>A set of public and private keys that are used to hold value in the blockchain. The wallet is able to create transactions and sign them using a combo of it's key pair and SHA256. </p>
    <p><b>Location: </b>main.js</p>
  </li>
  <li>
    <h3>Miner</h3>
    <p><b>Description: </b>A wrapper class for the wallet that allows it to mint blocks. The miner collects transactions and creates blocks. When it makes blocks it awards itself with some crypto. </p>
    <p><b>Location: </b>main.js</p>
  </li>
</ul>
