
import expectThrow from '../test/helpers/expectThrow';
import ether from '../test/helpers/ether';

var CappedToken = artifacts.require('../TempusTokenMock.sol');

contract('Capped', function (accounts) {
  const cap = new web3.BigNumber(100000000000000000);

  let token;

  beforeEach(async function () {
    token = await CappedToken.new(accounts[0], new web3.BigNumber(99999999999999900));
    await token.addMinter(accounts[0]);
  });

  it('should start with the correct cap', async function () {
    let _cap = await token.cap();
    assert(cap.eq(_cap));
  });

  it('should mint when amount is less than cap', async function () {
    const result = await token.mint(accounts[0], 100);
    assert.equal(result.logs[0].event, 'Mint');
  });

  it('should fail to mint if the ammount exceeds the cap', async function () {
    await expectThrow(token.mint(accounts[0], 200));
  });

  it('should fail to mint after cap is reached', async function () {
    await token.mint(accounts[0], 100);
    await expectThrow(token.mint(accounts[0], 100));
  });
});
