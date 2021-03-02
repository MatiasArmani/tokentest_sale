const TokenTest = artifacts.require("TokenTest");

module.exports = function (deployer) {
  deployer.deploy(TokenTest, 1000000);
};