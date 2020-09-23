const InvoiceBasedEscrow = artifacts.require('./InvoiceBasedEscrow.sol');

// Deploys, set up the contracts
module.exports = async function(deployer) {
  try {
    await deployer.deploy(InvoiceBasedEscrow);
    console.log('InvoiceBasedEscrow Contract deployed: ' + InvoiceBasedEscrow.address);

    // ----------------------------------
    console.log('Contracts initialized');
    console.log(`
      InvoiceBasedEscrow:         ${InvoiceBasedEscrow.address}
    `);
  } catch (e) {
    console.error(e);
  }
};
