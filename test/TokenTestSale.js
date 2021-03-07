var TokenTest = artifacts.require("TokenTest");
var TokenTestSale = artifacts.require("TokenTestSale");

contract('TokenTestSale', function(accounts){
    var tokenInstance;  
    var tokenSaleInstance;
    var admin = accounts[0];
    var buyer = accounts[1];
    var tokenPrice = 1000000000000000; // In WEI = 0.001 ETH
    var tokensAvailable = 750000;
    var numberOfTokens;

    it('initializes the contract with the correct values', function() {
        return TokenTestSale.deployed().then(function(instance) {
          tokenSaleInstance = instance;
          return tokenSaleInstance.address
        }).then(function(address) {
          assert.notEqual(address, 0x0, 'has contract address');
          return tokenSaleInstance.tokenContract();
        }).then(function(address) {
          assert.notEqual(address, 0x0, 'has token contract address');
          return tokenSaleInstance.tokenPrice();
        }).then(function(price) {
          assert.equal(price, tokenPrice, 'token price is correct');
        });
      });

      it('facilitates token buying', function(){
        return TokenTest.deployed().then(function(instance) {
          tokenInstance = instance;
          return TokenTestSale.deployed();
        }).then(function(instance){
          tokenSaleInstance = instance;
          //Providing 75% of all token to token sale
          return tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, { from: admin });
        }).then(function(receipt){
          numberOfTokens = 10;
          return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: numberOfTokens * tokenPrice });
        }).then(function(receipt){
          assert.equal(receipt.logs.length, 1, 'triggers one event');
          assert.equal(receipt.logs[0].event, 'Sell', 'should be the "Sell" event');
          assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account the tokens are purchased from');
          assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the account the tokens are purchased to');
          return tokenSaleInstance.tokensSold();
        }).then(function(amount){
          assert.equal(amount.toNumber(), numberOfTokens, 'increments the number of tokens sold');
          return tokenInstance.balanceOf(buyer);
        }).then(function(balance){
          assert.equal(balance.toNumber(), numberOfTokens);
          return tokenInstance.balanceOf(tokenSaleInstance.address);
        }).then(function(balance){  
          assert.equal(balance.toNumber(), tokensAvailable - numberOfTokens);
          return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: 1 });
        }).then(assert.fail).catch(function(error){
          assert(error.message.toString().indexOf('revert') >= 0, 'msg.value must equal number of tokens in wei');
          return tokenSaleInstance.buyTokens(800000, { from: buyer, value: numberOfTokens * tokenPrice });
        }).then(assert.fail).catch(function(error){
          assert(error.message.toString().indexOf('revert') >= 0, 'cannot purchase more tokens than available');
        });
      });

      it('ends token sale', function(){
        return TokenTest.deployed().then(function(instance) {
          tokenInstance = instance;
          return TokenTestSale.deployed();
        }).then(function(instance){
          tokenSaleInstance = instance;
          return tokenSaleInstance.endSale({ from: buyer });
        }).then(assert.fail).catch(function(error){
          assert(error.message.toString().indexOf('revert') >= 0, 'must be admin to end sale');
          return tokenSaleInstance.endSale({ from: admin });
        }).then(function(receipt){
          return tokenInstance.balanceOf(admin);
        }).then(function(balance){
          assert.equal(balance.toNumber(), 999990, 'return all unsold TokenTest to admin');
          return tokenSaleInstance.tokenContract()
      }).then(assert.fail).catch(function(error){
          assert(error.message.toString().indexOf('Returned values aren\'t valid, did it run Out of Gas? You might also see this error if you are not using the correct ABI for the contract you are retrieving data from, requesting data from a block number that does not exist, or querying a node which is not fully synced.') >= 0, 'sale contract selfdestruct');
      });
    });
});