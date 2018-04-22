pragma solidity ^0.4.23;


import '../TempusToken.sol';


// mock class using BasicToken
contract TempusTokenMock is TempusToken {

    constructor(address initialAccount, uint256 initialBalance) public {
        balances[initialAccount] = initialBalance;
        totalSupply = initialBalance;
        owners[msg.sender] = true;
    }
}
