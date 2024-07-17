// main.js
// By: Sam Schmitz

const SHA256 = require('crypto-js/sha256');
const SHA3 = require('crypto-js/sha3');
//var hash = SHA3("Message", {outputLength: 224});
const { generateKeyPair, createCipheriv } = require('crypto');

class Block {
	constructor(index, timestamp, data, previousHash) {
		this.index = index;
		this.timestamp = timestamp;
		this.data = data;
		this.previousHash = previousHash;
		this.nonce = 0;
		this.hash = this.calculateHash();
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

class Wallet {
	constructor(pk) {
		//generate asynchronous key pair
		/*generateKeyPair('rsa', {
			modulousLength: 530, // Options
			publicKeyEncoding: {
				type: 'pkcs1',
				format: 'der'
			},
			privateKeyEncoding: {
				type: 'pkcs1',
				format: 'der',
				//cipher: 'aes-192-cbc',
				//passphrase: 'Welcome'
			}
		}, (err, publicKey, privateKey) => { // Callback function
			if (!err) {
				// This will print the asymmetric key pair
				this.publicKey = publicKey
				this.privateKey = privateKey
			} else {
				// Prints error if any
				console.log("Errr is: ", err);
			}
		});
		*/
		this.publicKey = pk
	}

	createTransaction(amount, recipient) {
		//create a string with the transaction data
		let transaction = `${this.publicKey} pays ${recipient} ${amount}`;

		//generate a signature
		//let signature = this.generateSignature(transaction);

		//return a dictionary with the message and signature
		//return { data: transaction, signature: signature };
		return transaction
	}

	generateSignature(data) {
		//run the transaction data through a hash
		let hash = SHA256(data);

		//encrpyt the hash w/ private key -> signature
		return createCipheriv('rsa', this.privateKey, hash);
    }
}

let jsChain = new Blockchain();

console.log("creating wallets...");
let wallet1 = new Wallet("1");
let wallet2 = new Wallet("2");

console.log("creating transactions...");
let transaction1 = wallet1.createTransaction("5", wallet2.publicKey);
let transaction2 = wallet2.createTransaction("10", wallet1.publicKey);

console.log("mining in process");
jsChain.addBlock(
	new Block(1, "12/25/2024", transaction1, jsChain.latestBlock().hash)
);
jsChain.addBlock(
	new Block(2, "12/26/2024", transaction2, jsChain.latestBlock().hash)
);

console.log(JSON.stringify(jsChain, null, 4));
console.log("Is blockchain valid? " + jsChain.checkValid());