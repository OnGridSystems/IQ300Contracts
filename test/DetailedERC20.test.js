const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const LTYToken = artifacts.require('../TempusToken.sol');

contract('DetailedERC20', accounts => {
  let detailedERC20 = null;

  const _name = 'Tempus';
  const _symbol = 'TPS';
  const _decimals = 8;
  const _cap = 100000000000000000;

  beforeEach(async function () {
    detailedERC20 = await LTYToken.new();
  });

  it('has a name', async function () {
    const name = await detailedERC20.name();
    name.should.be.equal(_name);
  });

  it('has a symbol', async function () {
    const symbol = await detailedERC20.symbol();
    symbol.should.be.equal(_symbol);
  });

  it('has an amount of decimals', async function () {
    const decimals = await detailedERC20.decimals();
    decimals.should.be.bignumber.equal(_decimals);
  });

  it('has correct cap', async function () {
    const cap = await detailedERC20.cap();
    cap.should.be.bignumber.equal(_cap);
  });
});
