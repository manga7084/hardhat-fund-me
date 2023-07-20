// async function deployFunc(hre){
//     console.log("hi!");
//    hre.getNamedAccounts()
//    hre.deployments
// }
// module.exports.default=deployFunc

// we can write the above fuction other way as
// const {getNamedAccounts,deployments}=hre; and hre  is basically hardhat
// run time environment which is diffrent from ethers thats .address works
// fine with hre whether .getAddress() works with etherss

// const helperConfig=require("../helper-hardhat-config");
// const networkConfig=helperConfig.networkConfig;
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { network } = require("hardhat")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // if chainId is x use address y
    // if chainId is y use address x

    //const ethUsdPriceFeedAddress=networkConfig[chainId]["ethUsdPriceFeed"];
    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    // if the contract dosen't exist, we deploy a minimal version of it for our
    // local testing
    // well what happens when we want to change chains?
    // when going for localhost or hardhat network we want to use a mock
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress], //put price feed address
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args)
    }
    log("---------------------------------------")
}

module.exports.tags = ["all", "fundMe"]
