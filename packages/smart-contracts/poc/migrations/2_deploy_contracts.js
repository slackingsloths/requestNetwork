const BaseEscrow = artifacts.require('./BaseEscrow.sol');
const ConditionedEscrow = artifacts.require('./BaseEscrow.sol');

// Deploys, set up the contracts
module.exports = async function(deployer) {
  try {
    await deployer.deploy(BaseEscrow);
    console.log('BaseEscrow Contract deployed: ' + BaseEscrow.address);
    await deployer.deploy(ConditionedEscrow);
    console.log('BaseEscrow Contract deployed: ' + ConditionedEscrow.address);

    // ----------------------------------
    console.log('Contracts initialized');
    console.log(`
      BaseEscrow:                 ${BaseEscrow.address}
      ConditionedEscrow:          ${ConditionedEscrow.address}
    `);
  } catch (e) {
    console.error(e);
  }
};
