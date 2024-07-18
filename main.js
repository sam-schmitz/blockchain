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
	constructor(index, timestamp, data, previousHash) {
		this.index = index;
		this.timestamp = timestamp;
		if (data !== "Genesis block") {
			this.verifyTransaction(data);
        }
		this.data = data;
		this.previousHash = previousHash;
		this.nonce = 0;
		this.hash = this.calculateHash();
	}

	verifyTransaction(data) {

		//grab the public key from the data
		let publicKey = data.data
		const regex = /-----BEGIN PUBLIC KEY-----[\r\n]+([\s\S]*?)[\r\n]+-----END PUBLIC KEY-----/;
		const match = publicKey.match(regex);
		publicKey = match ? match[0] : null;
		//console.log("public key: ", publicKey);
		//get data between -----BEGIN PUBLIC KEY-----\n and -----END PUBLIC KEY-----\n

		//decrypt the signature
		//console.log("signature: ", data.signature);
		const decryptedHash = crypto.publicDecrypt(publicKey, Buffer.from(data.signature, 'base64'));
		//console.log("decrypted hash: ", decryptedHash);

		//hash the data
		const originalHash = crypto.createHash('sha256').update(data.data).digest();
		//console.log("remade hash", originalHash);

		//compare
		if (!originalHash.equals(decryptedHash)) {
			throw new Error('False signature');
        }
	}

	calculateHash() {
		return SHA256(this.index +
			this.previousHash +
			this.timestamp +
			JSON.stringify(this.data) +
			this.nonce
		).toString();
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
		return new Block(0, "01/01/2024", "Genesis block", "0")
	}

	latestBlock() {
		return this.chain[this.chain.length - 1]
	}

	addBlock(newBlock) {
		// newBlock.previousHash = this.latestBlock().hash;
		// newBlock.hash = newBlock.calculateHash();
		newBlock.proofOfWork(this.difficulty);
		this.chain.push(newBlock);
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

let jsChain = new Blockchain();

(async () => {
	console.log("creating wallets...");
	const wallet1 = new Wallet();
	const wallet2 = new Wallet();

	await new Promise(resolve => setTimeout(resolve, 1000));

	console.log("creating transactions...");
	let transaction1 = wallet1.createTransaction("5", wallet2.publicKey);
	let transaction2 = wallet2.createTransaction("10", wallet1.publicKey);
	//let decrypetedHash = crypto.publicDecrypt(wallet1.publicKey, Buffer.from(transaction1.signature, 'base64'));
	//console.log(decrypetedHash);

	console.log("mining in progress...");
	jsChain.addBlock(
		new Block(1, "12/25/2024", transaction1, jsChain.latestBlock().hash)
	);
	jsChain.addBlock(
		new Block(2, "12/26/2024", transaction2, jsChain.latestBlock().hash)
	);


	console.log(JSON.stringify(jsChain, null, 4));
	console.log("Is blockchain valid? " + jsChain.checkValid());
})();