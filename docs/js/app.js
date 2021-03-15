window.addEventListener("load", function(event) {
    App.init();
  });

App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    loading: false,
    tokenPrice: 1000000000000000,
    tokensSold: 0,
    tokensAvailable: 750000,

    init: function(){
        //console.log("App initialized...");
        return App.initWeb3();
    },

    initWeb3: function(){
        if (typeof web3 !== 'undefined') {
            // If a web3 instance is already provided by Meta Mask.
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
          } else {
            // Specify default instance if no web3 instance provided
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            web3 = new Web3(App.web3Provider);
          }
          
        return App.initMetamask();
    },

    initMetamask: function(){
        ethereum.request({ method: 'eth_requestAccounts' });
        return App.initContracts();
    },

    initContracts: function(){
        $.getJSON("TokenTestSale.json", function(tokenTestSale){
            App.contracts.TokenTestSale = TruffleContract(tokenTestSale);
            App.contracts.TokenTestSale.setProvider(App.web3Provider);
            App.contracts.TokenTestSale.deployed().then(function(tokenTestSale){
            //console.log("TokenTest Sale Address:", tokenTestSale.address);
            });
        }).done(function(){
            $.getJSON("TokenTest.json", function(tokenTest){
                App.contracts.TokenTest = TruffleContract(tokenTest);
                App.contracts.TokenTest.setProvider(App.web3Provider);
                App.contracts.TokenTest.deployed().then(function(tokenTest){
                //console.log("TokenTest Address:", tokenTest.address);
                });

                App.listenForEvents();
                return App.render();
            });
        });
    },

    render: async function(){
        if(App.loading) {
            return;
        } 
        App.loading = true;
        var loader = $('#loader');
        var content = $('#content');

        loader.show();
        content.hide();

        App.account = await ethereum.request({ method: 'eth_accounts' });
        $('#accountAddress').html("Your Account: " + App.account);

        App.contracts.TokenTestSale.deployed().then(function(instance){
            tokenTestSaleInstance = instance;
            return tokenTestSaleInstance.tokenPrice();
        }).then(function(tokenPrice){
            App.tokenPrice = tokenPrice;
            $('.token-price').html(web3.fromWei(App.tokenPrice, "ether").toNumber());
            return tokenTestSaleInstance.tokensSold();
        }).then(function(tokensSold){
            App.tokensSold = tokensSold.toNumber();
            $('.tokens-sold').html(App.tokensSold);
            $('.tokens-available').html(App.tokensAvailable);

            var progressPercent = (App.tokensSold / App.tokensAvailable) * 100;
            $('#progress').css('width', progressPercent + '%');
            
            App.contracts.TokenTest.deployed().then(function(instance){
                tokenTestInstance = instance;
                return tokenTestInstance.balanceOf(App.account);
            }).then(function(balance){
                $('.token-balance').html(balance.toNumber());

                App.loading = false;
                loader.hide();
                content.show();
            });
        });
    },

    buyTokens: function(){
        if(App.loading) {
            return;
        } 
        App.loading = true;
        var loader = $('#loader');
        var content = $('#content');

        content.hide();
        loader.show();
        var numberOfTokens = $('#numberOfTokens').val();
        App.contracts.TokenTestSale.deployed().then(function(instance){
            return instance.buyTokens(numberOfTokens, {
                from: App.account.toString(),
                value: numberOfTokens * App.tokenPrice,
                gas: 500000 //Gas limit
            });
        });
        App.loading = false;
        loader.hide();
        content.show();
    },

    listenForEvents: function(){
        App.contracts.TokenTestSale.deployed().then(function(instance){
            instance.Sell({}, {
                fromBlock: 0,
                toBlock: 'latest'
            }).watch(function(error, event){
                App.render();
            });
        });
    }
}