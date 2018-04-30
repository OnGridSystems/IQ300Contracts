import ether from './helpers/ether';
import { advanceBlock } from './helpers/advanceToBlock';
import { increaseTimeTo, duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';
import EVMRevert from './helpers/EVMRevert';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const TempusCrowdsale = artifacts.require('TempusCrowdsale');
const TempusToken = artifacts.require('TempusToken');

contract('TempusCrowdsale', function (accounts) {
  const rate = new BigNumber(1);
  const value = ether(42);
  const tokenSupply = new BigNumber('1e22');

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  beforeEach(async function () {
    //this.openingTime = latestTime() + duration.weeks(1);
    //this.closingTime = this.openingTime + duration.weeks(1);
    //this.afterClosingTime = this.closingTime + duration.seconds(1);
    this.token = await TempusToken.new();
    this.crowdsale = await TempusCrowdsale.new(this.token.address);
    await this.token.addMinter(this.crowdsale.address);
  });

  it('check time schedule', async function () {
    let r0end = (await this.crowdsale.rounds(0))[1];
    let r1start = (await this.crowdsale.rounds(1))[0];
    let r1end = (await this.crowdsale.rounds(1))[1];
    let r2start = (await this.crowdsale.rounds(2))[0];
    let r2end = (await this.crowdsale.rounds(2))[1];
    let r3start = (await this.crowdsale.rounds(3))[0];
    let r3end = (await this.crowdsale.rounds(3))[1];
    let r4start = (await this.crowdsale.rounds(4))[0];
    r1start.minus(r0end).should.be.bignumber.equal(1);
    r1end.minus(r0end).should.be.bignumber.equal(duration.days(30));
    r2start.minus(r1end).should.be.bignumber.equal(1);
    r2end.minus(r1end).should.be.bignumber.equal(duration.days(30));
    r3start.minus(r2end).should.be.bignumber.equal(1);
    r3end.minus(r2end).should.be.bignumber.equal(duration.days(30));
    r4start.minus(r3end).should.be.bignumber.equal(1);
  });

  describe('initially unprivileged account', function () {

    it('unable to add wallet', async function () {
      await this.crowdsale.addWallet(accounts[9],{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
    });

    it('unable to add owner', async function () {
      await this.crowdsale.addOwner(accounts[9],{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
    });

    it('unable to del owner', async function () {
      await this.crowdsale.delOwner(accounts[0],{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
    });

    describe('after added to owners', function () {
      beforeEach(async function () {
        await this.crowdsale.addOwner(accounts[1]);
      });

      it('should allow to addWallet', async function () {
        await this.crowdsale.addWallet(accounts[9],{from:accounts[1]}).should.be.fulfilled;
      });

      it('should allow to addOwner', async function () {
        await this.crowdsale.addOwner(accounts[2],{from:accounts[1]}).should.be.fulfilled;
      });

      it('should allow to delOwner', async function () {
        await this.crowdsale.delOwner(accounts[2],{from:accounts[1]}).should.be.fulfilled;
      });

      describe('then removed from owners', function () {
        beforeEach(async function () {
          await this.crowdsale.delOwner(accounts[1]);
        });

        it('should reject to addOwner', async function () {
          await this.crowdsale.addOwner(accounts[1],{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
        });

        it('should reject to delOwner', async function () {
          await this.crowdsale.delOwner(accounts[1],{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
        });

        it('should reject to addWallet', async function () {
          await this.crowdsale.addWallet(accounts[5],{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
        });

        it('should reject to delWallet', async function () {
          await this.crowdsale.delWallet(0,{from:accounts[1]}).should.be.rejectedWith(EVMRevert);
        });
      });
    });

  });

  describe('accepting payments', function () {

    beforeEach(async function () {
      await this.crowdsale.addWallet(accounts[2]);
    });

    describe('check minDeposit', function () {

      it('should allow payments 0.1 ETH +', async function () {
        await this.crowdsale.send(ether(0.1)).should.be.fulfilled;
      });

      it('should reject payments less 0.1 ETH', async function () {
        await this.crowdsale.send(ether(0.1).minus(1)).should.be.rejectedWith(EVMRevert);
      });

    });

    describe('running round 0', function () {

      it('make purchase', async function () {
        const walletBalanceBefore = web3.eth.getBalance(accounts[2]);
        const weiRaisedBefore = await this.crowdsale.weiRaised();
        const roundWeiRaisedBefore = (await this.crowdsale.rounds(0))[2];
        const roundTokensIssuedBefore = (await this.crowdsale.rounds(0))[2];
        const tokenTotalSupplyBefore = await this.token.totalSupply();
        const tokenIssuedBefore = await this.crowdsale.tokensIssued();
        const investorTokensBefore = await this.token.balanceOf(accounts[0]);
        const result = await this.crowdsale.send(ether(1));
        assert.equal(result.logs[0].event, 'TokenPurchase');
        assert.equal(result.logs[0].args.beneficiary.valueOf(), accounts[0]);
        assert.equal(result.logs[0].args.value.valueOf(), ether(1));
        assert.equal(result.logs[0].args.amount.valueOf(), 20000000000);
        const walletBalanceAfter = web3.eth.getBalance(accounts[2]);
        const weiRaisedAfter = await this.crowdsale.weiRaised();
        const roundWeiRaisedAfter = (await this.crowdsale.rounds(0))[2];
        const roundTokensIssuedAfter = (await this.crowdsale.rounds(0))[2];
        const tokenTotalSupplyAfter = await this.token.totalSupply();
        const tokenIssuedAfter = await this.crowdsale.tokensIssued();
        const investorTokensAfter = await this.token.balanceOf(accounts[0]);
        assert(walletBalanceAfter - walletBalanceBefore, ether(1));
        assert(weiRaisedAfter - weiRaisedBefore, ether(1));
        assert(tokenTotalSupplyAfter - tokenTotalSupplyBefore, 20000000000);
        assert(investorTokensAfter - investorTokensBefore, 20000000000);
        assert(tokenIssuedAfter - tokenIssuedBefore, 20000000000);
        assert(roundTokensIssuedAfter - roundTokensIssuedBefore, 20000000000);
        assert(roundWeiRaisedAfter - roundWeiRaisedBefore, ether(1));
        const currentRoundId = await this.crowdsale.currentRoundId();
        currentRoundId.should.be.bignumber.equal(0);
      });

      it('send to exceed round cap to switch round', async function () {
        const walletBalanceBefore = web3.eth.getBalance(accounts[2]);
        const weiRaisedBefore = await this.crowdsale.weiRaised();
        const tokenTotalSupplyBefore = await this.token.totalSupply();
        const tokenIssuedBefore = await this.crowdsale.tokensIssued();
        const investorTokensBefore = await this.token.balanceOf(accounts[0]);
        const result = await this.crowdsale.send(ether(1000000));
        assert.equal(result.logs[0].event, 'TokenPurchase');
        assert.equal(result.logs[0].args.beneficiary.valueOf(), accounts[0]);
        assert.equal(result.logs[0].args.value.valueOf(), ether(1000000));
        assert.equal(result.logs[0].args.amount.valueOf(), 20000000000000000);
        assert.equal(result.logs[1].event, 'SwitchedToNextRound');
        assert.equal(result.logs[1].args.id.valueOf(), 1);
        const walletBalanceAfter = web3.eth.getBalance(accounts[2]);
        const weiRaisedAfter = await this.crowdsale.weiRaised();
        const tokenTotalSupplyAfter = await this.token.totalSupply();
        const tokenIssuedAfter = await this.crowdsale.tokensIssued();
        const investorTokensAfter = await this.token.balanceOf(accounts[0]);
        assert(walletBalanceAfter - walletBalanceBefore, ether(1000000));
        assert(weiRaisedAfter - weiRaisedBefore, ether(1000000));
        assert(tokenTotalSupplyAfter - tokenTotalSupplyBefore, 20000000000000000);
        assert(investorTokensAfter - investorTokensBefore, 20000000000000000);
        assert(tokenIssuedAfter - tokenIssuedBefore, 20000000000000000);
        const currentRoundId = await this.crowdsale.currentRoundId();
        currentRoundId.should.be.bignumber.equal(1);
        const tokensCap = await this.crowdsale.tokensCap();
        const tokensIssued = await this.crowdsale.tokensIssued();
        const expectedTokensCapForNextRound = (tokensCap - tokensIssued)/5;
        const actualTokensCapForNextRound = (await this.crowdsale.rounds(1))[4];
        actualTokensCapForNextRound.should.be.bignumber.equal(expectedTokensCapForNextRound)
      });

    });

    describe('switch to round 1 by cap exceed', function () {

      beforeEach(async function () {
        await this.crowdsale.send(ether(1000001));
      });

      it('check round parameters', async function () {
        const currentRoundId = await this.crowdsale.currentRoundId();
        currentRoundId.should.be.bignumber.equal(1);
        const tokensCap = await this.crowdsale.tokensCap();
        const tokensIssued = await this.crowdsale.tokensIssued();
        const expectedTokensCapForNextRound = (tokensCap - tokensIssued)/5;
        const actualTokensCapForNextRound = (await this.crowdsale.rounds(1))[4];
        actualTokensCapForNextRound.should.be.bignumber.equal(expectedTokensCapForNextRound)
      });

      it('make purchase', async function () {
        const walletBalanceBefore = web3.eth.getBalance(accounts[2]);
        const weiRaisedBefore = await this.crowdsale.weiRaised();
        const tokenTotalSupplyBefore = await this.token.totalSupply();
        const tokenIssuedBefore = await this.crowdsale.tokensIssued();
        const investorTokensBefore = await this.token.balanceOf(accounts[0]);
        const result = await this.crowdsale.send(ether(1));
        assert.equal(result.logs[0].event, 'TokenPurchase');
        assert.equal(result.logs[0].args.beneficiary.valueOf(), accounts[0]);
        assert.equal(result.logs[0].args.value.valueOf(), ether(1));
        assert.equal(result.logs[0].args.amount.valueOf(), 10000000000);
        const walletBalanceAfter = web3.eth.getBalance(accounts[2]);
        const weiRaisedAfter = await this.crowdsale.weiRaised();
        const tokenTotalSupplyAfter = await this.token.totalSupply();
        const tokenIssuedAfter = await this.crowdsale.tokensIssued();
        const investorTokensAfter = await this.token.balanceOf(accounts[0]);
        assert(walletBalanceAfter - walletBalanceBefore, ether(1));
        assert(weiRaisedAfter - weiRaisedBefore, ether(1));
        assert(tokenTotalSupplyAfter - tokenTotalSupplyBefore, 10000000000);
        assert(investorTokensAfter - investorTokensBefore, 10000000000);
        assert(tokenIssuedAfter - tokenIssuedBefore, 10000000000);
        const currentRoundId = await this.crowdsale.currentRoundId();
        currentRoundId.should.be.bignumber.equal(1);
      });

    });

    describe('switch to round 2 by date', function () {

      beforeEach(async function () {
        await this.crowdsale.send(ether(1000001));
        let r2start = (await this.crowdsale.rounds(2))[0];
        await increaseTimeTo(r2start);
      });

      it('make purchase', async function () {
        const tokensCap = await this.crowdsale.tokensCap();
        const tokensIssued = await this.crowdsale.tokensIssued();
        const expectedTokensCapForNextRound = (tokensCap - tokensIssued)/5;
        const walletBalanceBefore = web3.eth.getBalance(accounts[2]);
        const weiRaisedBefore = await this.crowdsale.weiRaised();
        const tokenTotalSupplyBefore = await this.token.totalSupply();
        const tokenIssuedBefore = await this.crowdsale.tokensIssued();
        const investorTokensBefore = await this.token.balanceOf(accounts[0]);
        const result = await this.crowdsale.send(ether(1));
        assert.equal(result.logs[1].event, 'TokenPurchase');
        assert.equal(result.logs[1].args.beneficiary.valueOf(), accounts[0]);
        assert.equal(result.logs[1].args.value.valueOf(), ether(1));
        assert.equal(result.logs[1].args.amount.valueOf(), 5000000000);
        assert.equal(result.logs[0].event, 'SwitchedToNextRound');
        assert.equal(result.logs[0].args.id.valueOf(), 2);
        const actualTokensCapForNextRound = (await this.crowdsale.rounds(2))[4];
        actualTokensCapForNextRound.should.be.bignumber.equal(expectedTokensCapForNextRound)
        const walletBalanceAfter = web3.eth.getBalance(accounts[2]);
        const weiRaisedAfter = await this.crowdsale.weiRaised();
        const tokenTotalSupplyAfter = await this.token.totalSupply();
        const tokenIssuedAfter = await this.crowdsale.tokensIssued();
        const investorTokensAfter = await this.token.balanceOf(accounts[0]);
        assert(walletBalanceAfter - walletBalanceBefore, ether(1));
        assert(weiRaisedAfter - weiRaisedBefore, ether(1));
        assert(tokenTotalSupplyAfter - tokenTotalSupplyBefore, 5000000000);
        assert(investorTokensAfter - investorTokensBefore, 5000000000);
        assert(tokenIssuedAfter - tokenIssuedBefore, 5000000000);
        const currentRoundId = await this.crowdsale.currentRoundId();
        currentRoundId.should.be.bignumber.equal(2);
      });

    });



    describe('switch to round 3 by date', function () {

      beforeEach(async function () {
        await this.crowdsale.send(ether(1));
        let r1start = (await this.crowdsale.rounds(1))[0];
        await increaseTimeTo(r1start);
        await this.crowdsale.send(ether(1));
        let r2start = (await this.crowdsale.rounds(2))[0];
        await increaseTimeTo(r2start);
        await this.crowdsale.send(ether(1));
        let r3start = (await this.crowdsale.rounds(3))[0];
        await increaseTimeTo(r3start);
      });

      it('make purchase', async function () {
        const tokensCap = await this.crowdsale.tokensCap();
        const tokensIssued = await this.crowdsale.tokensIssued();
        const expectedTokensCapForNextRound = (tokensCap - tokensIssued)/5;
        const walletBalanceBefore = web3.eth.getBalance(accounts[2]);
        const weiRaisedBefore = await this.crowdsale.weiRaised();
        const tokenTotalSupplyBefore = await this.token.totalSupply();
        const tokenIssuedBefore = await this.crowdsale.tokensIssued();
        const investorTokensBefore = await this.token.balanceOf(accounts[0]);
        const result = await this.crowdsale.send(ether(1));
        assert.equal(result.logs[1].event, 'TokenPurchase');
        assert.equal(result.logs[1].args.beneficiary.valueOf(), accounts[0]);
        assert.equal(result.logs[1].args.value.valueOf(), ether(1));
        assert.equal(result.logs[1].args.amount.valueOf(), 2500000000);
        assert.equal(result.logs[0].event, 'SwitchedToNextRound');
        assert.equal(result.logs[0].args.id.valueOf(), 3);
        const actualTokensCapForNextRound = (await this.crowdsale.rounds(3))[4];
        actualTokensCapForNextRound.should.be.bignumber.equal(expectedTokensCapForNextRound);
        const walletBalanceAfter = web3.eth.getBalance(accounts[2]);
        const weiRaisedAfter = await this.crowdsale.weiRaised();
        const tokenTotalSupplyAfter = await this.token.totalSupply();
        const tokenIssuedAfter = await this.crowdsale.tokensIssued();
        const investorTokensAfter = await this.token.balanceOf(accounts[0]);
        assert(walletBalanceAfter - walletBalanceBefore, ether(1));
        assert(weiRaisedAfter - weiRaisedBefore, ether(1));
        assert(tokenTotalSupplyAfter - tokenTotalSupplyBefore, 2500000000);
        assert(investorTokensAfter - investorTokensBefore, 2500000000);
        assert(tokenIssuedAfter - tokenIssuedBefore, 2500000000);
        const currentRoundId = await this.crowdsale.currentRoundId();
        currentRoundId.should.be.bignumber.equal(3);
      });

    });


    describe('switch to round 4 by cap exceed', function () {

      beforeEach(async function () {
        await this.crowdsale.send(ether(1));
        let r1start = (await this.crowdsale.rounds(1))[0];
        await increaseTimeTo(r1start);
        await this.crowdsale.send(ether(1));
        let r2start = (await this.crowdsale.rounds(2))[0];
        await increaseTimeTo(r2start);
        await this.crowdsale.send(ether(1));
        let r3start = (await this.crowdsale.rounds(3))[0];
        await increaseTimeTo(r3start);
        await this.crowdsale.send(ether(1));
      });

      it('send to exceed previous round cap and switch to phase 4', async function () {
        const walletBalanceBefore = web3.eth.getBalance(accounts[2]);
        const weiRaisedBefore = await this.crowdsale.weiRaised();
        const tokenTotalSupplyBefore = await this.token.totalSupply();
        const tokenIssuedBefore = await this.crowdsale.tokensIssued();
        const investorTokensBefore = await this.token.balanceOf(accounts[0]);
        const result = await this.crowdsale.send(ether(7999997));
        assert.equal(result.logs[0].event, 'TokenPurchase');
        assert.equal(result.logs[0].args.beneficiary.valueOf(), accounts[0]);
        assert.equal(result.logs[0].args.value.valueOf(), ether(7999997));
        assert.equal(result.logs[0].args.amount.valueOf(), 19999992500000000);
        assert.equal(result.logs[1].event, 'SwitchedToNextRound');
        assert.equal(result.logs[1].args.id.valueOf(), 4);
        const walletBalanceAfter = web3.eth.getBalance(accounts[2]);
        const weiRaisedAfter = await this.crowdsale.weiRaised();
        const tokenTotalSupplyAfter = await this.token.totalSupply();
        const tokenIssuedAfter = await this.crowdsale.tokensIssued();
        const investorTokensAfter = await this.token.balanceOf(accounts[0]);
        assert(walletBalanceAfter - walletBalanceBefore, ether(1));
        assert(weiRaisedAfter - weiRaisedBefore, ether(1));
        assert(tokenTotalSupplyAfter - tokenTotalSupplyBefore, 19999992500000000);
        assert(investorTokensAfter - investorTokensBefore, 19999992500000000);
        assert(tokenIssuedAfter - tokenIssuedBefore, 19999992500000000);
        const currentRoundId = await this.crowdsale.currentRoundId();
        currentRoundId.should.be.bignumber.equal(4);
      });

    });

    describe('on phase 4', function () {

      beforeEach(async function () {
        await this.crowdsale.send(ether(1));
        let r1start = (await this.crowdsale.rounds(1))[0];
        await increaseTimeTo(r1start);
        await this.crowdsale.send(ether(1));
        let r2start = (await this.crowdsale.rounds(2))[0];
        await increaseTimeTo(r2start);
        await this.crowdsale.send(ether(1));
        let r3start = (await this.crowdsale.rounds(3))[0];
        await increaseTimeTo(r3start);
        await this.crowdsale.send(ether(7999998));
      });

      it('make purchase', async function () {
        const tokensCap = await this.crowdsale.tokensCap();
        const tokensIssued = await this.crowdsale.tokensIssued();
        const walletBalanceBefore = web3.eth.getBalance(accounts[2]);
        const weiRaisedBefore = await this.crowdsale.weiRaised();
        const tokenTotalSupplyBefore = await this.token.totalSupply();
        const tokenIssuedBefore = await this.crowdsale.tokensIssued();
        const investorTokensBefore = await this.token.balanceOf(accounts[0]);
        const result = await this.crowdsale.send(ether(2));
        assert.equal(result.logs[0].event, 'TokenPurchase');
        assert.equal(result.logs[0].args.beneficiary.valueOf(), accounts[0]);
        assert.equal(result.logs[0].args.value.valueOf(), ether(2));
        assert.equal(result.logs[0].args.amount.valueOf(), 2500000000);
        const walletBalanceAfter = web3.eth.getBalance(accounts[2]);
        const weiRaisedAfter = await this.crowdsale.weiRaised();
        const tokenTotalSupplyAfter = await this.token.totalSupply();
        const tokenIssuedAfter = await this.crowdsale.tokensIssued();
        const investorTokensAfter = await this.token.balanceOf(accounts[0]);
        assert(walletBalanceAfter - walletBalanceBefore, ether(2));
        assert(weiRaisedAfter - weiRaisedBefore, ether(2));
        assert(tokenTotalSupplyAfter - tokenTotalSupplyBefore, 2500000000);
        assert(investorTokensAfter - investorTokensBefore, 2500000000);
        assert(tokenIssuedAfter - tokenIssuedBefore, 2500000000);
        const currentRoundId = await this.crowdsale.currentRoundId();
        currentRoundId.should.be.bignumber.equal(4);
      });

      it('able to buy less than cap', async function () {
        const tokensCap = await this.crowdsale.tokensCap();
        const tokensIssued = await this.crowdsale.tokensIssued();
        const tokensToIssue = tokensCap.minus(tokensIssued);
        const result = await this.crowdsale.send(ether(63999975.9999999));
        assert.equal(result.logs[0].event, 'TokenPurchase');
        assert.equal(result.logs[0].args.beneficiary.valueOf(), accounts[0]);
        assert.equal(result.logs[0].args.value.valueOf(), ether(63999975.9999999));
        assert.equal(result.logs[0].args.amount.valueOf(), 79999969999999875);
        const tokensIssuedAfter = await this.crowdsale.tokensIssued();
        const tokensToIssueAfter = tokensCap.minus(tokensIssuedAfter);
      });

    });


  });

  describe('2-wallets crowdsale', function () {

    beforeEach(async function () {
      await this.crowdsale.addWallet(accounts[2]);
      await this.crowdsale.addWallet(accounts[3]);
    });

    it('payment should split to 2 sink wallets', async function () {
      const wallet2BalanceBefore = web3.eth.getBalance(accounts[2]);
      const wallet3BalanceBefore = web3.eth.getBalance(accounts[3]);
      const weiRaisedBefore = await this.crowdsale.weiRaised();
      const result = await this.crowdsale.send(ether(1));
      assert.equal(result.logs[0].event, 'TokenPurchase');
      assert.equal(result.logs[0].args.value.valueOf(), ether(1));
      const wallet2BalanceAfter = web3.eth.getBalance(accounts[2]);
      const wallet3BalanceAfter = web3.eth.getBalance(accounts[3]);
      const weiRaisedAfter = await this.crowdsale.weiRaised();
      assert(wallet2BalanceAfter - wallet2BalanceBefore, ether(0.5));
      assert(wallet3BalanceAfter - wallet3BalanceBefore, ether(0.49));
      assert(weiRaisedAfter - weiRaisedBefore, ether(1));
    });

    describe('after third wallet added', function () {

      beforeEach(async function () {
        await this.crowdsale.addWallet(accounts[4]);
      });

      it('payment should be split between 3 wallets', async function () {
        const wallet2BalanceBefore = web3.eth.getBalance(accounts[2]);
        const wallet3BalanceBefore = web3.eth.getBalance(accounts[3]);
        const wallet4BalanceBefore = web3.eth.getBalance(accounts[4]);
        const weiRaisedBefore = await this.crowdsale.weiRaised();
        const result = await this.crowdsale.send(ether(3));
        assert.equal(result.logs[0].event, 'TokenPurchase');
        assert.equal(result.logs[0].args.value.valueOf(), ether(3));
        const wallet2BalanceAfter = web3.eth.getBalance(accounts[2]);
        const wallet3BalanceAfter = web3.eth.getBalance(accounts[3]);
        const wallet4BalanceAfter = web3.eth.getBalance(accounts[4]);
        const weiRaisedAfter = await this.crowdsale.weiRaised();
        wallet2BalanceAfter.minus(wallet2BalanceBefore).should.be.bignumber.equal(ether(1));
        wallet3BalanceAfter.minus(wallet3BalanceBefore).should.be.bignumber.equal(ether(1));
        wallet4BalanceAfter.minus(wallet4BalanceBefore).should.be.bignumber.equal(ether(1));
        weiRaisedAfter.minus(weiRaisedBefore).should.be.bignumber.equal(ether(3));
      });

      describe('after wallet #2 removed', function () {

        beforeEach(async function () {
          await this.crowdsale.delWallet(0);
        });

        it('payment should be split to 2 remaining wallets', async function () {
          const wallet3BalanceBefore = web3.eth.getBalance(accounts[3]);
          const wallet4BalanceBefore = web3.eth.getBalance(accounts[4]);
          const weiRaisedBefore = await this.crowdsale.weiRaised();
          const result = await this.crowdsale.send(ether(2));
          assert.equal(result.logs[0].event, 'TokenPurchase');
          assert.equal(result.logs[0].args.value.valueOf(), ether(2));
          const wallet3BalanceAfter = web3.eth.getBalance(accounts[3]);
          const wallet4BalanceAfter = web3.eth.getBalance(accounts[4]);
          const weiRaisedAfter = await this.crowdsale.weiRaised();
          wallet3BalanceAfter.minus(wallet3BalanceBefore).should.be.bignumber.equal(ether(1));
          wallet4BalanceAfter.minus(wallet4BalanceBefore).should.be.bignumber.equal(ether(1));
          weiRaisedAfter.minus(weiRaisedBefore).should.be.bignumber.equal(ether(2));
        });

      });

    });

  });

});
