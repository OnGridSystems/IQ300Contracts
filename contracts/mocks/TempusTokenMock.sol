pragma solidity ^0.4.18;


import '../TempusToken.sol';


// mock class using BasicToken
contract TempusTokenMock is TempusToken {

    function TempusTokenMock(address initialAccount, uint256 initialBalance) public {
        balances[initialAccount] = initialBalance;
        totalSupply = initialBalance;
        owners[msg.sender] = true;
    }
}
