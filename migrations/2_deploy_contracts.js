var TokenTest = artifacts.require("TokenTest");
var TokenTestSale = artifacts.require("TokenTestSale");

module.exports = function (deployer) {
  deployer.deploy(TokenTest, 1000000).then(function() {
    var tokenPrice = 1000000000000000; // In WEI = 0.001 ETH
    return deployer.deploy(TokenTestSale, TokenTest.address, tokenPrice);
  });
};