//get fund from users
//Withdraw funds
//Set a minimum funding value in USD

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

error FundMe__NotOwner();

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

contract FundMe {
    modifier onlyOwner() {
        //require(msg.sender==i_owner,"sender is not the owner");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        } //uses less gas fee.
        _; //this means that now go to the rest of the code if it was above
        //require statement then it means go through the code of original
        //function first then to the require statement.
    }

    using PriceConverter for uint256;

    uint256 public constant MINIMUM_USD = 50 * 1e18;

    address[] private s_funders;

    mapping(address => uint256) private s_addressToAmountFunded;

    address private immutable i_owner;

    AggregatorV3Interface public s_priceFeed;

    constructor(address s_priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(s_priceFeedAddress);
    }

    function fund() public payable {
        //want to be able to set a minimun fund amount in USD
        //1. How do we send ETH to this contract?
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Didn't send enough!"
        );
        //if the require statement isn't met then the transaction is cancelled and revert
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
    }

    function withdraw() public onlyOwner {
        //instead this we use modifier as we can use that to add to multiple
        //function without writing require keyword in every function.
        // require(msg.sender==owner,"you are not allowed to do that");

        for (
            uint256 fundersIndex = 0;
            fundersIndex < s_funders.length;
            fundersIndex++
        ) {
            address funder = s_funders[fundersIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        //reset
        s_funders = new address[](0);
        // //transfer
        // payable(msg.sender).transfer(address(this).balance);
        // //send
        // bool sendSuccess=payable(msg.sender).send(address(this).balance);
        // require(sendSuccess,"send failed");
        //call    most recomended way to transfer.
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");

        require(callSuccess, "call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        // mapping can't be used in memory , sorry!
        for (
            uint256 fundersIndex = 0;
            fundersIndex < funders.length;
            fundersIndex++
        ) {
            address funder = funders[fundersIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0);

        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
    // receive() external payable {
    //     fund();
    // }

    // fallback() external payable {
    //     fund();
    // }  we skip writing test fot them thats why we commented them
}
