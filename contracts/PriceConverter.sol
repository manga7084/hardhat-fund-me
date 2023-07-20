//SPDX-License-Identifier:MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getPrice(
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        //ABI
        //Address  0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43
        //AggregatorV3Interface pricefeed = AggregatorV3Interface(priceFeed);
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return uint256(price * 1e10);
    }

    function getVersion(
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        //AggregatorV3Interface pricefeed = AggregatorV3Interface(priceFeed);
        return priceFeed.version();
    }

    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed);
        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18;
        return ethAmountInUsd;
    }
}
