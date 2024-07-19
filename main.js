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
	constructor(previousHash) {
		//this.index = index;
		//this.timestamp = timestamp;
		this.timestamp = Date();
		const now = new Date();
		this.timestamp = now.toLocaleTimeString();
		this.data = [];	//empty array
		this.previousHash = previousHash;
		this.nonce = 0;
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

	addTransaction(data) {
		this.verifyTransaction(data);	//if data passes it will be added
		this.hash = this.calculateHash();
    }

	verifyTransaction(data) {

		//grab the public key from the data
		let publicKey = data.data
		const regex = /-----BEGIN PUBLIC KEY-----[\r\n]+([\s\S]*?)[\r\n]+-----END PUBLIC KEY-----/;
		const match = publicKey.match(regex);
		publicKey = match ? match[0] : null;
		//console.log("public key: ", publicKey);

		//decrypt the signature
		const decryptedHash = crypto.publicDecrypt(publicKey, Buffer.from(data.signature, 'base64'));
		//console.log("decrypted hash: ", decryptedHash);

		//hash the data
		const originalHash = crypto.createHash('sha256').update(data.data).digest();
		//console.log("remade hash", originalHash);

		//compare
		if (originalHash.equals(decryptedHash)) {
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
	}

	createGenesis() {
		let g = new Block(0, "01/01/2024", "0");
		g.data = "Genesis Block";
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
		console.log("correct current hash");

		//check newBlock's previous hash
		if (newBlock.previousHash !== cBlock.hash) {
			return false;
		}
		console.log("correct previous hash");

		//check proof of work for newBlock
		if (newBlock.hash.substring(0, this.difficulty) !== Array(this.difficulty + 1).join("0")) {
			return false;
		}

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

	createTransaction(amount, recipient) {
		//create a string with the transaction data
		let transaction = `${this.publicKey.toString()} pays ${recipient.toString()} ${amount}`;

		//generate a signature
		let signature = this.generateSignature(transaction);

		//return a dictionary with the message and signature
		return { data: transaction, signature: signature };
		//return transaction
	}

	generateSignature(data) {
		//verify that the private key has been created
		if (!this.privateKey) {
			throw new Error('Public key not generated yet');
		}

		//run the transaction data through a hash
		const hash = crypto.createHash('sha256').update(data).digest();
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
}

class Miner {
	constructor(wallet) {
		this.wallet = wallet;
		this.transactions = []
	}

	addTransaction(data) {
		//verify the transaction?

		//add a transaction to the array
		this.transactions.push(data);
	}

	generateBlock(blockchain) {
		//create a block
		let block = new Block(blockchain.latestBlock().hash);

		//add the transactions to it
		for (let i = 0; i < this.transactions.length; i++) {
			block.addTransaction(this.transactions[i]);
		}

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

	await new Promise(resolve => setTimeout(resolve, 1000));

	console.log("creating miner");
	const miner1 = new Miner(wallet2);

	console.log("creating transactions...");
	let transaction1 = wallet1.createTransaction("5", wallet2.publicKey);
	let transaction2 = wallet2.createTransaction("10", wallet1.publicKey);
	//let decrypetedHash = crypto.publicDecrypt(wallet1.publicKey, Buffer.from(transaction1.signature, 'base64'));
	//console.log(decrypetedHash);

	console.log("sending transactions to miner...");
	miner1.addTransaction(transaction1);
	miner1.addTransaction(transaction2);
	//let block1 = new Block(jsChain.latestBlock().hash);
	//block1.addTransaction(transaction1);
	//block1.addTransaction(transaction2);

	console.log("mining in progress...");
	let block = miner1.generateBlock(jsChain);
	//block1.proofOfWork(jsChain.difficulty);
	jsChain.addBlock(block);
	//jsChain.addBlock(new Block(2, "12/26/2024", transaction2, jsChain.latestBlock().hash));


	console.log(JSON.stringify(jsChain, null, 4));
	console.log("Is blockchain valid? " + jsChain.checkValid());
})();