// main.js
// By: Sam Schmitz

const SHA256 = require('crypto-js/sha256');
const SHA3 = require('crypto-js/sha3');
//var hash = SHA3("Message", {outputLength: 224});
const { generateKeyPair, createCipheriv, privateEncrypt, createSign } = require('crypto');
const util = require('util');
const { promisify } = require('util');
const generateKeyPairPromise = util.promisify(generateKeyPair);
const crypto = require('crypto');

class Block {
	constructor(previousHash, data) {
		//console.log("creating block");
		//this.index = index;
		const now = new Date();
		this.timestamp = now.toLocaleTimeString();
		this.previousHash = previousHash;
		this.nonce = 0;

		//add transactions
		if (data !== "Genesis Block") {
			//console.log("adding transactions: ", data);
			this.data = [data[0]];	//empty array
			//0th point should be the award and will be checked by the blockchain
			for (let i = 1; i < data.length; i++) {
				//console.log("transaction: ", data[i]);
				this.verifyTransaction(data[i]);	//if it passes it will be added
			}
		}

		this.hash = this.calculateHash();
	}

	calculateHash() {
		return SHA256(//this.index +
			this.previousHash +
			this.timestamp +
			JSON.stringify(this.data) +	//alter now that data is an array of obj
			this.nonce
		).toString();
	}

	verifyTransaction(data) {

		//grab the public key from the data
		let publicKey = data.data.data
		const regex = /-----BEGIN PUBLIC KEY-----[\r\n]+([\s\S]*?)[\r\n]+-----END PUBLIC KEY-----/;
		const match = publicKey.match(regex);
		publicKey = match ? match[0] : null;
		//console.log("public key: ", publicKey);

		//decrypt the signature
		const decryptedHash = crypto.publicDecrypt(publicKey, Buffer.from(data.signature, 'base64'));
		//console.log("decrypted hash: ", decryptedHash);

		//hash the data
		const originalHash = crypto.createHash('sha256').update(JSON.stringify(data.data)).digest();
		//console.log("remade hash", originalHash);

		//compare
		if (originalHash.equals(decryptedHash)) {
			//console.log('transaction passed verification');
			this.data.push(data)	//append the data
		} else {
			throw new Error('False signature');
        }
	}

	proofOfWork(difficulty) {
		while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
			this.nonce++;
			this.hash = this.calculateHash();
        }
	}
}

class Blockchain{
	constructor() {
		this.chain = [this.createGenesis()]
		this.difficulty = 4;
		this.award = 5
	}

	createGenesis() {
		let g = new Block("0", "Genesis Block");
		g.proofOfWork(4);
		return g
	}

	latestBlock() {
		return this.chain[this.chain.length - 1]
	}

	addBlock(newBlock) {
		// newBlock.previousHash = this.latestBlock().hash;
		// newBlock.hash = newBlock.calculateHash();
		//newBlock.proofOfWork(this.difficulty);

		if (!this.checkBlock(newBlock)) {
			throw new Error('New Block is invalid');
		};
		this.chain.push(newBlock);
	}

	checkBlock(newBlock) {
		//verifies that a new block is a valid block

		//grab current latest block
		let cBlock = this.latestBlock();

		//check the hash of the newBlock
		if (newBlock.hash !== newBlock.calculateHash()) {
			return false;
		};

		//check newBlock's previous hash
		if (newBlock.previousHash !== cBlock.hash) {
			return false;
		}

		//check proof of work for newBlock
		if (newBlock.hash.substring(0, this.difficulty) !== Array(this.difficulty + 1).join("0")) {
			return false;
		}

		//check that the first data row is the award and the proper amount
		/*if (newBlock.data[0] !== this.amount) {
			return false;
        }*/

		return true;
    }

	checkValid() {
		for(let i = 1; i < this.chain.length; i++) {
			const currentBlock = this.chain[i];
			const previousBlock = this.chain[i - 1];

			if (currentBlock.hash !== currentBlock.calculateHash()) {
				return false;
			}

			if (currentBlock.previousHash !== previousBlock.hash) {
				return false;
			}
		}

		return true;
	}

	checkWalletContents(publicKey) {
		/*
		let amount = 0;
		//regular expressions to find the publicKey in a transaction
		const escapedPublicKey = publicKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const startRegex = new RegExp(`^${escapedPublicKey}`);
		const publicKeyRegex = new RegExp(escapedPublicKey, 'g');

		for (let i = 1; i < this.chain.length; i++) {
			//each loop is a block
			let blockData = this.chain[i];

			//check if the publicKey is found in the award statement
			if (startRegex.test(blockData.data[0])) {
				//console.log("public key found in award");
				let split = blockData.data[0].split(" ");
				amount += +split[split.length - 1];

			} else {	//check the other transactions
				for (let j = 1; j < blockData.data.length; j++) {

					//check if the publicKey is the sender
					if (startRegex.test(blockData.data[j].data)) {
						//find the amount given
						let split = blockData.data[j].data.split(" ");
						amount -= +split[split.length - 1];

					} else {	//publicKey is not the sender
						//check if publicKey is in the transaction 
						//if it is publicKey is the recipient
						if (publicKeyRegex.test(blockData.data[j].data)) {
							//find the amount given
							let split = blockData.data[j].data.split(" ");
							amount += +split[split.length - 1];
						}
                    }
                }
            }
		}
		return amount;
		*/
		for (let i = this.chain.length - 1; i > 0; i--) {
			//each loop is a block starting with the latest block
			let blockData = this.chain[i];

			//check if the publicKey is found in the award statement
			if (blockData.data[0].wallet == publicKey) {
				return blockData.data.award, i;

			} else {
				for (let j = 1; j < blockData.data.length; j++) {
					if (blockData.data[j].data.sender == publicKey) {
						return blockData.data.senderContents, i;
					}
					if (blockData.data[j].data.recipient == publicKey) {
						return blockData.data.recipientContents, i;
                    }
                }
            }
		}
		return 0, null;
    }
}

const generateKeyPair2 = promisify(crypto.generateKeyPair);

class Wallet {
	constructor() {
		this.publicKey = null;
		this.privateKey = null;
		this.init();
	}

	async init() {
		try {
			//generate key pair
			const { publicKey, privateKey } = await generateKeyPair2('rsa', {
				modulusLength: 2048,
				publicKeyEncoding: {
					type: 'spki',
					format: 'pem',
				},
				privateKeyEncoding: {
					type: 'pkcs8',
					format: 'pem',
				},
			});

			this.publicKey = publicKey;
			this.privateKey = privateKey;
			//console.log(publicKey.toString('base64'));
		} catch (error) {
			console.error('Error generating keys:', error);
		}
	}

	createTransaction(amount, recipient, blockchain) {
		//create a string with the transaction data
		let transaction = `${this.publicKey.toString()} pays ${recipient.toString()} ${amount}`;

		//find the block with your contents
		let senderContents, lastBlockSender = blockchain.checkWalletContents(this.publicKey);
		senderContents = senderContents - amount;

		//find the block with the recipients contents
		let recipientContents, lastBlockRecipient = blockchain.checkWalletContents(recipient);
		recipientContents = recipientContents + amount

		//create the transaction obj
		transaction = {
			data: transaction,
			sender: this.publicKey,
			recipient: recipient,
			amount: amount,
			lastBlockSender: lastBlockSender,
			lastBlockRecipient: lastBlockRecipient,
			senderContents: senderContents,
			recipientContents: recipientContents
        }

		//generate a signature
		let signature = this.generateSignature(transaction);
		return {data: transaction, signature: signature};
	}

	generateSignature(data) {
		//verify that the private key has been created
		if (!this.privateKey) {
			throw new Error('Public key not generated yet');
		}

		//run the transaction data through a hash
		const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest();
		//console.log("pre encrypted hash", hash);

		//encrypt the hash using the private key
		const encryptedHash = crypto.privateEncrypt(this.privateKey, Buffer.from(hash));
		return encryptedHash.toString('base64');
	}

	encryptMessage(message) {
		if (!this.publicKey) {
			throw new Error('Public key not generated yet');
		}

		const encryptedMessage = crypto.publicEncrypt(this.publicKey, Buffer.from(message));
		return encryptedMessage.toString('base64')
	}

	checkContents(blockchain) {
		let amount = 0;
		const escapedPublicKey = this.publicKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const startRegex = new RegExp(`^${escapedPublicKey}`);
		const publicKeyRegex = new RegExp(escapedPublicKey, 'g');

		//console.log("checking blockchain: ");
		//console.log("blockchain.chain:", blockchain.chain);

		for (let i = 1; i < blockchain.chain.length; i++) {
			//console.log("checking block", i);
			//check the data of the block
			let blockData = blockchain.chain[i]
			//console.log(blockData);

			//console.log(blockData.data[0]);
			//the first data point is the wallet paying itself
			if (startRegex.test(blockData.data[0])) {
				//console.log("public key found in award");
				let split = blockData.data[0].split(" ");
				amount += +split[split.length - 1];
			} else {
				//console.log("wallet was not found as the miner");
				//check the transactions
				for (let j = 1; j < blockData.data.length; j++) {
					//blockData.data[j].data
					//console.log("transaction data: ", blockData.data[j].data);
					//find the 1st key
					if (startRegex.test(blockData.data[j].data)) {
						//console.log("key found as sender");
						let split = blockData.data[j].data.split(" ");
						amount -= +split[split.length - 1];
					} else {
						//the key is not 1st check so it is either 2nd or not in the transaction
						if (publicKeyRegex.test(blockData.data[j].data)) {
							//console.log("key found as recipient");
							let split = blockData.data[j].data.split(" ");
							amount += +split[split.length - 1];
						} else {
							//console.log("key not found in this transaction")
                        }
					}
				}
            }
		}

		return amount
}
}

class Miner {
	constructor(wallet) {
		this.wallet = wallet;
		this.transactions = []
	}

	addTransaction(data) {
		//add a transaction to the array
		this.transactions.push(data);
	}

	generateBlock(blockchain) {
		//create an array of transactions
		let data = [];

		let walletContents, walletLastBlock = blockchain.checkWalletContents(this.wallet.publicKey);
		let award = {
			data: `${this.wallet.publicKey} gains ${blockchain.award}`,
			miner: this.wallet.publicKey,
			amount: blockchain.award + walletContents,
			lastBlock = walletLastBlock
		}
		data.push(award);
		//add the transactions
		data = [...data, ...this.transactions];
		//console.log("data: ", data);

		//create a block
		let block = new Block(blockchain.latestBlock().hash, data);

		//proof of work
		block.proofOfWork(blockchain.difficulty);

		//return the block
		return block;
    }
}

let jsChain = new Blockchain();

(async () => {
	console.log("creating wallets...");
	const wallet1 = new Wallet();
	const wallet2 = new Wallet();
	const wallet3 = new Wallet();

	await new Promise(resolve => setTimeout(resolve, 1000));

	console.log("creating miner");
	const miner1 = new Miner(wallet2);
	const miner2 = new Miner(wallet3);
	console.log("wallet2 amount: ", wallet2.checkContents(jsChain));

	console.log("minting first block...");
	let block1 = miner1.generateBlock(jsChain);
	//console.log("block 1:", block1);
	jsChain.addBlock(block1);

	console.log("wallet2 amount: ", wallet2.checkContents(jsChain));

	console.log("creating transactions...");
	//let transaction1 = wallet1.createTransaction("5", wallet2.publicKey);
	let transaction2 = wallet2.createTransaction("10", wallet1.publicKey);
	//let decrypetedHash = crypto.publicDecrypt(wallet1.publicKey, Buffer.from(transaction1.signature, 'base64'));
	//console.log(decrypetedHash);

	console.log("sending transactions to miner...");
	//miner1.addTransaction(transaction1);
	miner2.addTransaction(transaction2);
	//let block1 = new Block(jsChain.latestBlock().hash);
	//block1.addTransaction(transaction1);
	//block1.addTransaction(transaction2);

	console.log("mining in progress...");
	let block = miner2.generateBlock(jsChain);
	//block1.proofOfWork(jsChain.difficulty);
	jsChain.addBlock(block);
	//jsChain.addBlock(new Block(2, "12/26/2024", transaction2, jsChain.latestBlock().hash));
	console.log("wallet2 amount: ", wallet2.checkContents(jsChain));

	console.log(JSON.stringify(jsChain, null, 4));
	console.log("Is blockchain valid? " + jsChain.checkValid());
})();