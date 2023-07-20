const { assert, expect } = require("chai")
const { toBigInt } = require("ethers")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { JSBI } = require("jsbi")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          let sendValue = "1000000000000000000" //1 ETH
          let fundMeAddress
          beforeEach(async function () {
              // deploy out fundMe contract
              // using Hardhat-deploy
              // const accounts=await ethers.getSigners()
              // const accountZero=accounts[0]
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
              fundMeAddress = fundMe.getAddress()
          })

          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  mockV3AggregatorAddress = await mockV3Aggregator.getAddress()
                  assert.equal(response, mockV3AggregatorAddress)
              })
          })

          describe("fund", async function () {
              it("Fails if you didn't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Didn't send enough!"
                  )
              })

              it("Update the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })

              it("Adds funder to array of getFunder", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })

          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              it("withdraw ETH from a single funder", async function () {
                  // Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMeAddress)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { fee } = transactionReceipt

                  const gasCost = fee
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMeAddress
                  )

                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  //gasCost

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )
              })

              it("Withdraw fund with multiple getFunder", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (i = 1; i < 6; i++) {
                      const fundMeConnectedContracts = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContracts.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMeAddress)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { fee } = transactionReceipt

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMeAddress
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + fee
                  )
                  // Make sure that getFunder are reset properly.
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })

              it("cheaperWithdraw testing...", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (i = 1; i < 6; i++) {
                      const fundMeConnectedContracts = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContracts.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMeAddress)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { fee } = transactionReceipt

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMeAddress
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + fee
                  )
                  // Make sure that getFunder are reset properly.
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("cheaperWithdraw ETH from a single funder", async function () {
                  // Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMeAddress)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { fee } = transactionReceipt

                  const gasCost = fee
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMeAddress
                  )

                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  //gasCost

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )
              })
          })
      })
