// main.js
// By: Sam Schmitz

const SHA256 = require('crypto-js/sha256')

class Block {
	constructor(index, timestamp, data) {
		this.index = index;
		this.timestamp = timestamp;
		this.data = data;
		this.previousHash = "0";
		this.hash = this.calculateHash();
		this.nonce = 0;
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
		newBlock.previousHash = this.latestBlock().hash;
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

let jsChain = new Blockchain();

console.log("mining in process");
jsChain.addBlock(new Block(1, "12/25/2024",
	{
		sender: "Alice",
		recipient: "Bob",
		quantity: 5
	}));
jsChain.addBlock(new Block(2, "12/26/2024",
	{
		sender: "Bob",
		recipient: "Alice",
		quantity: 10
	}));

console.log(JSON.stringify(jsChain, null, 4));
console.log("Is blockchain valid? " + jsChain.checkValid());